import { useCallback, useEffect, useState } from 'react';
import { Radio, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

type CardId = 'online' | 'cadastros' | 'trial';

interface Row {
  key: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const hora = (v?: string | null) =>
  v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

export function AdminHojeCards() {
  const [counts, setCounts] = useState<Record<CardId, number>>({ online: 0, cadastros: 0, trial: 0 });
  const [open, setOpen] = useState<CardId | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

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

  const openCard = async (id: CardId) => {
    setOpen(id);
    setLoading(true);
    setRows([]);
    const since = startOfToday();
    try {
      if (id === 'online') {
        const { data } = await supabase
          .from('user_activity_log' as any)
          .select('user_id, email, display_name, current_route, last_seen_at')
          .gte('last_seen_at', since)
          .order('last_seen_at', { ascending: false })
          .limit(300);
        const seen = new Set<string>();
        setRows(
          ((data as any[]) || [])
            .filter((r) => (seen.has(r.user_id) ? false : (seen.add(r.user_id), true)))
            .map((r) => ({
              key: r.user_id,
              title: r.display_name || r.email || 'Usuário',
              subtitle: r.current_route || null,
              meta: hora(r.last_seen_at),
            })),
        );
      } else if (id === 'cadastros') {
        const { data } = await supabase
          .from('profiles' as any)
          .select('id, full_name, email, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(300);
        setRows(
          ((data as any[]) || []).map((r) => ({
            key: r.id,
            title: r.full_name || r.email || 'Usuário',
            subtitle: r.email || null,
            meta: hora(r.created_at),
          })),
        );
      } else {
        const { data } = await supabase
          .from('play_subscriptions' as any)
          .select('id, user_id, product_id, base_plan_id, status, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(300);
        setRows(
          ((data as any[]) || []).map((r) => ({
            key: r.id,
            title: r.product_id || 'Assinatura',
            subtitle: `${r.base_plan_id || '—'} · ${String(r.status || '').replace('SUBSCRIPTION_STATE_', '')}`,
            meta: hora(r.created_at),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  };

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
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-0 bg-background border-border">
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
                  <div key={r.key} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-sm font-semibold text-foreground truncate">{r.title}</div>
                      {r.subtitle && (
                        <div className="font-body text-[11px] text-muted-foreground truncate">{r.subtitle}</div>
                      )}
                    </div>
                    <div className="font-body text-[11px] text-muted-foreground shrink-0">{r.meta}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
