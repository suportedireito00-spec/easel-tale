import { useCallback, useEffect, useState } from 'react';
import { Radio, UserPlus, Sparkles, Loader2, Mail } from 'lucide-react';
import { SiGoogle, SiApple } from 'react-icons/si';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { UserDossieSheet } from './UserDossieSheet';
import { rotaParaFuncao } from '@/lib/rotaFuncoes';

type CardId = 'online' | 'cadastros' | 'trial';

interface Row {
  key: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  userId?: string | null;
  email?: string | null;
  provider?: string | null;
}

const ProviderTag = ({ provider }: { provider?: string | null }) => {
  if (!provider) return null;
  const p = provider.toLowerCase();
  const cfg = p.includes('google')
    ? {
        label: 'Google',
        node: <SiGoogle className="w-3 h-3" />,
        bg: 'bg-[hsl(var(--provider-google))]',
        fg: 'text-[hsl(var(--provider-google-foreground))]',
        border: 'border-[hsl(var(--provider-google))]/30',
      }
    : p.includes('apple')
      ? {
          label: 'Apple',
          node: <SiApple className="w-3 h-3" />,
          bg: 'bg-[hsl(var(--provider-apple))]',
          fg: 'text-[hsl(var(--provider-apple-foreground))]',
          border: 'border-[hsl(var(--provider-apple))]/30',
        }
      : {
          label: 'E-mail',
          node: <Mail className="w-3 h-3" />,
          bg: 'bg-[hsl(var(--provider-email))]',
          fg: 'text-[hsl(var(--provider-email-foreground))]',
          border: 'border-[hsl(var(--provider-email))]/30',
        };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] font-body text-[10px] shrink-0',
        cfg.bg,
        cfg.fg,
        cfg.border,
      )}
    >
      {cfg.node}
      {cfg.label}
    </span>
  );
};

const dayRange = (d: Date) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

const startOfToday = () => dayRange(new Date()).start;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const hora = (v?: string | null) =>
  v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function AdminHojeCards() {
  const [counts, setCounts] = useState<Record<CardId, number>>({ online: 0, cadastros: 0, trial: 0 });
  const [open, setOpen] = useState<CardId | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [dossie, setDossie] = useState<Row | null>(null);
  const [dia, setDia] = useState<Date>(() => new Date());

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_metricas_dia' as any, { _dia: isoDate(new Date()) });
    const m = (data as any) || {};
    setCounts({ online: m.online || 0, cadastros: m.cadastros || 0, trial: m.trial || 0 });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const fetchRows = useCallback(async (id: CardId, date: Date) => {
    setLoading(true);
    setRows([]);
    try {
      const { data } = await supabase.rpc('admin_lista_dia' as any, { _tipo: id, _dia: isoDate(date) });
      const list = ((data as any[]) || []).map((r) => ({
        key: r.key,
        userId: r.user_id,
        title: r.title || 'Usuário',
        email: r.email || null,
        subtitle: id === 'online' ? rotaParaFuncao(r.subtitle).label : r.subtitle,
        meta: hora(r.at),
      }));
      setRows(list);
      const ids = Array.from(new Set(list.map((r) => r.userId).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: provs } = await supabase.rpc('admin_user_auth_providers' as any, { _ids: ids });
        const map = new Map<string, string>(((provs as any[]) || []).map((p) => [p.user_id, p.provider]));
        setRows((current) => current.map((r) => ({ ...r, provider: map.get(r.userId || r.key) || r.provider })));
      }
    } finally {
      setLoading(false);
    }
  }, []);


  const openCard = (id: CardId) => {
    const hoje = new Date();
    setOpen(id);
    setDia(hoje);
    fetchRows(id, hoje);
  };

  const selecionarDia = (d: Date) => {
    setDia(d);
    if (open) fetchRows(open, d);
  };

  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return d;
  });


  const CARDS: { id: CardId; label: string; icon: any }[] = [
    { id: 'online', label: 'Online hoje', icon: Radio },
    { id: 'cadastros', label: 'Cadastrados hoje', icon: UserPlus },
    { id: 'trial', label: 'Iniciou teste', icon: Sparkles },
  ];

  const titles: Record<CardId, string> = {
    online: 'Online',
    cadastros: 'Cadastrados',
    trial: 'Iniciaram assinatura teste',
  };

  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const rotuloDia = sameDay(dia, hoje)
    ? 'Hoje'
    : sameDay(dia, ontem)
      ? 'Ontem'
      : dia.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {CARDS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => openCard(id)}
            className="rounded-2xl border border-border/60 bg-secondary/30 px-2.5 py-3 text-left hover:bg-secondary/60 active:bg-secondary transition-colors"
          >
            <Icon className="w-4 h-4 text-primary mb-1.5" />
            <div className="font-display text-xl font-bold text-foreground leading-none">{counts[id]}</div>
            <div className="font-body text-[10.5px] text-muted-foreground mt-1 leading-tight">{label}</div>
          </button>
        ))}
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[90vh] max-h-[90vh] overflow-y-auto p-0 bg-background border-border">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left">
            <SheetTitle className="font-display text-base font-bold text-foreground">
              {open ? `${titles[open]} · ${rotuloDia}` : ''}
            </SheetTitle>
            <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">
              {loading ? 'Carregando…' : `${rows.length} registro${rows.length === 1 ? '' : 's'}`}
            </p>
          </SheetHeader>

          <div className="border-b border-border/50 bg-background/95 sticky top-0 z-10">
            <div className="flex gap-2 overflow-x-auto px-3 py-3 scrollbar-none">
              {dias.map((d) => {
                const ativo = sameDay(d, dia);
                const ehHoje = sameDay(d, hoje);
                const ehOntem = sameDay(d, ontem);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => selecionarDia(d)}
                    className={cn(
                      'shrink-0 min-w-[64px] rounded-2xl border px-3 py-2.5 text-center transition-colors',
                      ativo
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/30 border-border/60 text-muted-foreground hover:bg-secondary/60',
                    )}
                  >
                    <div className="font-body text-[10.5px] uppercase tracking-wide opacity-80">
                      {ehHoje ? 'Hoje' : ehOntem ? 'Ontem' : DIAS[d.getDay()]}
                    </div>
                    <div className={cn('font-display text-lg font-bold leading-none mt-1', ativo ? '' : 'text-foreground')}>
                      {String(d.getDate()).padStart(2, '0')}
                    </div>
                    <div className="font-body text-[10px] opacity-70 mt-0.5">
                      {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3">
            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-10">
                Nenhum registro em {rotuloDia.toLowerCase()}.
              </p>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                {rows.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => r.userId && setDossie(r)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 active:bg-secondary transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm font-semibold text-foreground truncate">{r.title}</div>
                      {r.subtitle && (
                        <div className="font-body text-[11px] text-muted-foreground truncate">{r.subtitle}</div>
                      )}
                    </div>
                    <ProviderTag provider={r.provider} />
                    <div className="font-body text-[11px] text-muted-foreground shrink-0">{r.meta}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <UserDossieSheet
        userId={dossie?.userId || null}
        nome={dossie?.title}
        email={dossie?.email}
        provider={dossie?.provider}
        onClose={() => setDossie(null)}
      />
    </>
  );
}
