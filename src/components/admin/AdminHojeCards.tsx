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
    const since = startOfToday();
    const [online, cadastros, trial] = await Promise.all([
      supabase.from('user_activity_log' as any).select('user_id', { count: 'exact', head: false }).gte('last_seen_at', since),
      supabase.from('profiles' as any).select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('play_subscriptions' as any).select('id', { count: 'exact', head: true }).gte('created_at', since),
    ]);
    const uniques = new Set(((online.data as any[]) || []).map((r) => r.user_id)).size;
    setCounts({
      online: uniques || online.count || 0,
      cadastros: cadastros.count || 0,
      trial: trial.count || 0,
    });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const fetchRows = useCallback(async (id: CardId, date: Date) => {
    setLoading(true);
    setRows([]);
    const { start, end } = dayRange(date);
    const pendingIds: string[] = [];
    try {
      if (id === 'online') {
        const { data } = await supabase
          .from('user_activity_log' as any)
          .select('user_id, email, display_name, current_route, last_seen_at')
          .gte('last_seen_at', start)
          .lt('last_seen_at', end)
          .order('last_seen_at', { ascending: false })
          .limit(300);
        const seen = new Set<string>();
        setRows(
          ((data as any[]) || [])
            .filter((r) => (seen.has(r.user_id) ? false : (seen.add(r.user_id), true)))
            .map((r) => (pendingIds.push(r.user_id), {
              key: r.user_id,
              userId: r.user_id,
              title: r.display_name || r.email || 'Usuário',
              email: r.email || null,
              subtitle: rotaParaFuncao(r.current_route).label,
              meta: hora(r.last_seen_at),
            })),
        );
      } else if (id === 'cadastros') {
        const { data } = await supabase
          .from('profiles' as any)
          .select('id, full_name, email, created_at')
          .gte('created_at', start)
          .lt('created_at', end)
          .order('created_at', { ascending: false })
          .limit(300);
        setRows(
          ((data as any[]) || []).map((r) => (pendingIds.push(r.id), {
            key: r.id,
            userId: r.id,
            title: r.full_name || r.email || 'Usuário',
            email: r.email || null,
            subtitle: r.email || null,
            meta: hora(r.created_at),
          })),
        );
      } else {
        const { data } = await supabase
          .from('play_subscriptions' as any)
          .select('id, user_id, product_id, base_plan_id, status, created_at')
          .gte('created_at', start)
          .lt('created_at', end)
          .order('created_at', { ascending: false })
          .limit(300);
        setRows(
          ((data as any[]) || []).map((r) => ({
            key: r.id,
            userId: r.user_id,
            title: r.product_id || 'Assinatura',
            subtitle: `${r.base_plan_id || '—'} · ${String(r.status || '').replace('SUBSCRIPTION_STATE_', '')}`,
            meta: hora(r.created_at),
          })),
        );
      }
      const ids = Array.from(new Set(pendingIds)).filter(Boolean);
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
    online: 'Online hoje',
    cadastros: 'Cadastrados hoje',
    trial: 'Iniciaram assinatura teste hoje',
  };

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
              {open ? titles[open] : ''}
            </SheetTitle>
            <p className="font-body text-[11.5px] text-muted-foreground mt-0.5">
              {loading ? 'Carregando…' : `${rows.length} registro${rows.length === 1 ? '' : 's'}`}
            </p>
          </SheetHeader>
          <div className="p-3">
            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-10">Nenhum registro hoje.</p>
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
