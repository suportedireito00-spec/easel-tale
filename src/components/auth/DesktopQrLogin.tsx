import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Smartphone, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://iftdrbxvekrhzstayjwp.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdGRyYnh2ZWtyaHpzdGF5andwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mzc5OTksImV4cCI6MjA5OTQxMzk5OX0.7nyvQlO5IDI6E4dLYHl6yrqqaNd53RxJcDOTQ7yNh40';

// QR encoda uma URL universal — se o celular tiver o app Vacatio instalado,
// abre a rota /desktop-link/:token via deep link (Android App Links + intent
// filter para vacatio://). Sem o app, abre a mesma rota no navegador e a
// versão web mostra o mesmo botão "Confirmar login".
const APP_LINK_BASE = 'https://simply-awesome-calc-80.lovable.app';

type Status = 'loading' | 'pending' | 'claimed' | 'expired' | 'error';

const QR_TTL_SECONDS = 60;

async function callFn(path: string, body?: unknown, auth?: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: auth ?? `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const DESKTOP_ID_KEY = 'vacatio.desktop_id';
const DESKTOP_SESSION_KEY = 'vacatio.desktop_session_id';

function getDesktopId(): string {
  try {
    let id = window.localStorage.getItem(DESKTOP_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      window.localStorage.setItem(DESKTOP_ID_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const DesktopQrLogin = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(60);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const pollRef = useRef<number | null>(null);
  const claimingRef = useRef(false);

  const generate = async () => {
    setStatus('loading');
    setQrDataUrl('');
    setErrorMsg('');
    setExpiresAt(0);
    setRemaining(60);
    try {
      const r = await callFn('desktop-link', { action: 'create', desktop_id: getDesktopId() });
      if (!r?.token) throw new Error(r?.error || 'sem_token');
      const ttlSeconds = Number.isFinite(Number(r.expires_in_seconds))
        ? Math.max(1, Number(r.expires_in_seconds))
        : QR_TTL_SECONDS;
      const url = `${APP_LINK_BASE}/desktop-link/${r.token}`;
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 320,
        color: { dark: '#0b0b0f', light: '#FFD500' },
        errorCorrectionLevel: 'H',
      });
      setToken(r.token);
      setQrDataUrl(dataUrl);
      // Usa TTL contado a partir do recebimento no navegador. Comparar com
      // expires_at absoluto fazia o QR expirar instantaneamente quando o
      // relógio do desktop estava adiantado em relação ao servidor.
      setExpiresAt(Date.now() + ttlSeconds * 1000);
      setRemaining(Math.ceil(ttlSeconds));
      setStatus('pending');
    } catch (e) {
      console.error('[DesktopQrLogin] generate failed', e);
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  useEffect(() => {
    generate();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown — só depois de ter `expiresAt` real do servidor.
  useEffect(() => {
    if (status !== 'pending' || !expiresAt) return;
    const id = window.setInterval(() => {
      const secs = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        setStatus('expired');
        window.clearInterval(id);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [status, expiresAt]);

  // Poll status
  useEffect(() => {
    if (status !== 'pending' || !token) return;
    pollRef.current = window.setInterval(async () => {
      if (claimingRef.current) return;
      try {
        const r = await callFn('desktop-link', { action: 'poll', token });
        if (r?.status === 'claimed' && r?.token_hash) {
          claimingRef.current = true;
          if (pollRef.current) window.clearInterval(pollRef.current);
          setStatus('claimed');
          // O hashed_token do generateLink('magiclink') se verifica como type:'email'.
          let { error } = await supabase.auth.verifyOtp({
            type: 'email',
            token_hash: r.token_hash,
          });
          // Fallback: 'magiclink' caso o Supabase mude o comportamento.
          if (error) {
            const retry = await supabase.auth.verifyOtp({
              type: 'magiclink',
              token_hash: r.token_hash,
            });
            error = retry.error;
          }
          if (error) {
            console.error('[DesktopQrLogin] verifyOtp failed', error);
            setErrorMsg(error.message);
            toast.error('Não foi possível finalizar o login: ' + error.message);
            setStatus('error');
          } else {
            if (r?.session_id) {
              try {
                window.localStorage.setItem(DESKTOP_SESSION_KEY, r.session_id);
              } catch {
                /* ignore */
              }
            }
            toast.success('Login liberado!');
          }
        } else if (r?.status === 'expired' || r?.status === 'not_found') {
          setStatus('expired');
          if (pollRef.current) window.clearInterval(pollRef.current);
        }
      } catch {
        /* ignora falha transitória */
      }
    }, 2000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [status, token]);

  const mins = Math.floor(remaining / 60);
  const secs = (remaining % 60).toString().padStart(2, '0');

  return (
    <div className="w-full max-w-md flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-6">
        <Smartphone className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-body font-semibold text-primary tracking-wide uppercase">
          Login pelo celular
        </span>
      </div>

      <h2 className="font-display text-2xl xl:text-3xl font-black text-white leading-tight">
        Escaneie o QR-code com seu celular
      </h2>
      <p className="mt-3 font-body text-sm text-white/70 leading-relaxed max-w-sm">
        Abra o app <span className="text-primary font-semibold">Vacatio</span> no celular
        (já logado) e aponte a câmera do scanner para o código abaixo.
      </p>

      {/* QR frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative mt-8 p-5 rounded-3xl bg-neutral-900/80 border border-primary/25 shadow-[0_25px_80px_-20px_rgba(250,204,21,0.35)]"
      >
        <div className="relative w-[280px] h-[280px] flex items-center justify-center rounded-2xl bg-primary/95 overflow-hidden">
          {status === 'loading' && (
            <Loader2 className="w-10 h-10 text-black animate-spin" />
          )}
          {qrDataUrl && (status === 'pending' || status === 'claimed') && (
            <img src={qrDataUrl} alt="QR-code de login" className="w-full h-full object-contain" />
          )}
          {status === 'expired' && (
            <div className="flex flex-col items-center gap-2 text-black">
              <AlertTriangle className="w-10 h-10" />
              <p className="font-display text-sm font-bold">Código expirado</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-2 text-black px-4">
              <AlertTriangle className="w-10 h-10" />
              <p className="font-display text-sm font-bold">Falha ao gerar</p>
              {errorMsg && (
                <p className="font-mono text-[10px] opacity-70 text-center break-all">{errorMsg}</p>
              )}
            </div>
          )}

          {status === 'claimed' && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-primary backdrop-blur-sm">
              <CheckCircle2 className="w-12 h-12" />
              <p className="font-display text-base font-bold">Entrando…</p>
            </div>
          )}
        </div>

        {status === 'pending' && (
          <p className="mt-4 font-body text-xs text-white/55">
            O código expira em{' '}
            <span className="font-mono font-semibold text-primary">
              {mins}:{secs}
            </span>
          </p>
        )}
      </motion.div>

      {(status === 'expired' || status === 'error') && (
        <button
          onClick={generate}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-black font-display font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Gerar novo QR-code
        </button>
      )}

      {/* Rodapé — quem não tem o app */}
      <div className="mt-10 pt-6 border-t border-white/10 w-full">
        <p className="font-body text-xs text-white/50 mb-2">
          Ainda não tem o app Vacatio no celular?
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=br.com.vacatio.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-white/85 font-body text-xs font-semibold hover:bg-white/10 transition-colors"
        >
          Baixar app para celular
        </a>
      </div>
    </div>
  );
};

export default DesktopQrLogin;
