import { useEffect, useState } from 'react';
import {
  Loader2, Clock, Activity, Flame, Star, Calendar, Crown, Phone, Mail,
  GraduationCap, LayoutGrid, MessageCircle,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { rotaParaFuncao, FEATURE_LABELS, formatarDuracao } from '@/lib/rotaFuncoes';

interface Props {
  userId: string | null;
  nome?: string | null;
  email?: string | null;
  provider?: string | null;
  onClose: () => void;
}

interface FuncaoStat {
  label: string;
  grupo: string;
  hits: number;
  segundos: number;
  ultimaVez: string;
}

interface Dossie {
  perfil: any;
  funcoes: FuncaoStat[];
  totalSegundos: number;
  segundosHoje: number;
  hitsHoje: number;
  sessoesHoje: number;
  sessoesTotal: number;
  primeiraHoje?: string | null;
  ultimaHoje?: string | null;
  features: { label: string; count: number }[];
  eventos: { label: string; count: number }[];
  contadores: { favoritos: number; grifos: number; anotacoes: number };
  assinatura: any;
  horus: any;
  horusStats: any;
}

const GAP_MAX = 10 * 60 * 1000; // 10min entre pings = mesma sessão de tela

const hora = (v?: string | null) =>
  v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
const dia = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');

export function UserDossieSheet({ userId, nome, email, provider, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [d, setD] = useState<Dossie | null>(null);

  useEffect(() => {
    if (!userId) {
      setD(null);
      return;
    }
    let cancel = false;
    (async () => {
      setLoading(true);
      setD(null);
      const desde30 = new Date(Date.now() - 30 * 86400_000).toISOString();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const desdeHoje = hoje.toISOString();

      const [perfilR, logR, sessR, featR, evR, favR, grifR, anotR, assR, horusR, horusStatsR] = await Promise.all([
        supabase.from('profiles' as any).select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_activity_log' as any)
          .select('current_route, last_seen_at')
          .eq('user_id', userId).gte('last_seen_at', desde30)
          .order('last_seen_at', { ascending: true }).limit(2000),
        supabase.from('user_sessions' as any)
          .select('started_at, platform, initial_route')
          .eq('user_id', userId).gte('started_at', desde30)
          .order('started_at', { ascending: false }).limit(500),
        supabase.from('feature_usage' as any)
          .select('feature_key, used_at').eq('user_id', userId).gte('used_at', desde30).limit(2000),
        supabase.from('app_events' as any)
          .select('event_name').eq('user_id', userId).gte('created_at', desde30).limit(2000),
        supabase.from('artigos_favoritos' as any).select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('artigos_grifos' as any).select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('artigos_anotacoes' as any).select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('play_subscriptions' as any)
          .select('product_id, base_plan_id, status, expires_at, auto_renewing')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('horus_whatsapp_users' as any)
          .select('phone_e164, verified_at, msg_count, last_seen_at, first_seen_at, blocked, onboarding_state, nome_preferido, linked_at')
          .or(`user_id.eq.${userId},linked_user_id.eq.${userId}`)
          .order('verified_at', { ascending: false, nullsFirst: false })
          .limit(1).maybeSingle(),
        supabase.from('horus_user_stats' as any)
          .select('telefone, ultima_atividade_em, dias_streak_estudo')
          .eq('user_id', userId).maybeSingle(),
      ]);
      if (cancel) return;

      const logs = ((logR.data as any[]) || []);
      const byFunc = new Map<string, FuncaoStat>();
      let totalSegundos = 0;
      let segundosHoje = 0;
      let hitsHoje = 0;
      let primeiraHoje: string | null = null;
      let ultimaHoje: string | null = null;

      logs.forEach((row, i) => {
        const { label, grupo } = rotaParaFuncao(row.current_route);
        const t = new Date(row.last_seen_at).getTime();
        const next = logs[i + 1] ? new Date(logs[i + 1].last_seen_at).getTime() : t;
        const delta = Math.min(Math.max(next - t, 0), GAP_MAX) / 1000;
        const cur = byFunc.get(label) || { label, grupo, hits: 0, segundos: 0, ultimaVez: row.last_seen_at };
        cur.hits += 1;
        cur.segundos += delta;
        cur.ultimaVez = row.last_seen_at;
        byFunc.set(label, cur);
        totalSegundos += delta;
        if (row.last_seen_at >= desdeHoje) {
          hitsHoje += 1;
          segundosHoje += delta;
          if (!primeiraHoje) primeiraHoje = row.last_seen_at;
          ultimaHoje = row.last_seen_at;
        }
      });

      const sessoes = ((sessR.data as any[]) || []);
      const countBy = (arr: any[], key: string) => {
        const m = new Map<string, number>();
        arr.forEach((r) => m.set(r[key], (m.get(r[key]) || 0) + 1));
        return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
      };

      setD({
        perfil: perfilR.data,
        funcoes: Array.from(byFunc.values()).sort((a, b) => b.hits - a.hits),
        totalSegundos,
        segundosHoje,
        hitsHoje,
        sessoesHoje: sessoes.filter((s) => s.started_at >= desdeHoje).length,
        sessoesTotal: sessoes.length,
        primeiraHoje,
        ultimaHoje,
        features: countBy((featR.data as any[]) || [], 'feature_key')
          .map(([k, count]) => ({ label: FEATURE_LABELS[k] || k, count })),
        eventos: countBy((evR.data as any[]) || [], 'event_name')
          .map(([k, count]) => ({ label: k, count })).slice(0, 12),
        contadores: { favoritos: favR.count || 0, grifos: grifR.count || 0, anotacoes: anotR.count || 0 },
        assinatura: assR.data,
        horus: (horusR as any)?.data || null,
        horusStats: (horusStatsR as any)?.data || null,
      });
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [userId]);

  const maisAcessada = d?.funcoes[0];
  const maisEngajada = d ? [...d.funcoes].sort((a, b) => b.segundos - a.segundos)[0] : undefined;
  const perfilTipos: string[] = d?.perfil?.perfil_tipos || [];
  const maxHits = Math.max(1, ...(d?.funcoes || []).map((f) => f.hits));
  const telefone =
    d?.horus?.phone_e164 ||
    d?.perfil?.whatsapp_number ||
    d?.perfil?.telefone ||
    d?.horusStats?.telefone ||
    null;

  const Stat = ({ icon: Icon, label, value }: any) => (
    <div className="rounded-2xl border border-border/60 bg-secondary/30 px-3 py-2.5">
      <Icon className="w-3.5 h-3.5 text-primary mb-1" />
      <div className="font-display text-base font-bold text-foreground leading-none">{value}</div>
      <div className="font-body text-[10px] text-muted-foreground mt-1 leading-tight">{label}</div>
    </div>
  );

  return (
    <Sheet open={!!userId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl h-[90vh] max-h-[90vh] overflow-y-auto p-0 bg-background border-border"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50 text-left sticky top-0 bg-background z-10">
          <SheetTitle className="font-display text-base font-bold text-foreground truncate">
            {nome || email || 'Usuário'}
          </SheetTitle>
          <p className="font-body text-[11.5px] text-muted-foreground mt-0.5 truncate">
            {email || '—'} {provider ? `· ${provider}` : ''}
          </p>
        </SheetHeader>

        {loading || !d ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="p-3 space-y-3 pb-10">
            <div className="grid grid-cols-3 gap-2">
              <Stat icon={Clock} label="Tempo de tela hoje" value={formatarDuracao(d.segundosHoje)} />
              <Stat icon={Activity} label="Entradas hoje" value={d.sessoesHoje || d.hitsHoje} />
              <Stat icon={Calendar} label="Tempo em 30 dias" value={formatarDuracao(d.totalSegundos)} />
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-2">
              <div className="flex items-center gap-2 font-body text-[11px] text-muted-foreground">
                <Flame className="w-3.5 h-3.5 text-primary" /> Destaques
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="font-body text-[10px] text-muted-foreground">Função mais acessada</div>
                  <div className="font-body text-sm font-semibold text-foreground">
                    {maisAcessada?.label || '—'}
                  </div>
                  <div className="font-body text-[10px] text-muted-foreground">
                    {maisAcessada ? `${maisAcessada.hits} acessos` : ''}
                  </div>
                </div>
                <div>
                  <div className="font-body text-[10px] text-muted-foreground">Maior engajamento</div>
                  <div className="font-body text-sm font-semibold text-foreground">
                    {maisEngajada?.label || '—'}
                  </div>
                  <div className="font-body text-[10px] text-muted-foreground">
                    {maisEngajada ? formatarDuracao(maisEngajada.segundos) : ''}
                  </div>
                </div>
                <div>
                  <div className="font-body text-[10px] text-muted-foreground">Primeiro acesso hoje</div>
                  <div className="font-body text-sm font-semibold text-foreground">{hora(d.primeiraHoje)}</div>
                </div>
                <div>
                  <div className="font-body text-[10px] text-muted-foreground">Último acesso hoje</div>
                  <div className="font-body text-sm font-semibold text-foreground">{hora(d.ultimaHoje)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-2">
              <div className="flex items-center gap-2 font-body text-[11px] text-muted-foreground">
                <GraduationCap className="w-3.5 h-3.5 text-primary" /> Perfil
              </div>
              <div className="flex flex-wrap gap-1.5">
                {perfilTipos.length ? (
                  perfilTipos.map((t) => (
                    <span key={t} className="rounded-full border border-border/60 bg-background/60 px-2 py-[2px] font-body text-[10px] text-foreground">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="font-body text-[11px] text-muted-foreground">Não informado</span>
                )}
                {d.perfil?.faixa_etaria && (
                  <span className="rounded-full border border-border/60 bg-background/60 px-2 py-[2px] font-body text-[10px] text-foreground">
                    {d.perfil.faixa_etaria}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-1.5 font-body text-[11px] text-muted-foreground">
                  <Crown className="w-3 h-3" /> {d.perfil?.is_premium ? 'Premium' : 'Gratuito'}
                </div>
                <div className="flex items-center gap-1.5 font-body text-[11px] text-muted-foreground">
                  <Calendar className="w-3 h-3" /> Desde {dia(d.perfil?.created_at)}
                </div>
                <div className="flex items-center gap-1.5 font-body text-[11px] text-muted-foreground truncate">
                  <Phone className="w-3 h-3" /> {telefone || 'Sem número'}
                </div>
                <div className="flex items-center gap-1.5 font-body text-[11px] text-muted-foreground truncate">
                  <Mail className="w-3 h-3" /> {email || '—'}
                </div>
              </div>
              {d.assinatura && (
                <div className="font-body text-[11px] text-muted-foreground pt-1">
                  Assinatura: {d.assinatura.base_plan_id || d.assinatura.product_id} ·{' '}
                  {String(d.assinatura.status || '').replace('SUBSCRIPTION_STATE_', '')}
                  {d.assinatura.expires_at ? ` · expira ${dia(d.assinatura.expires_at)}` : ''}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-2">
              <div className="flex items-center gap-2 font-body text-[11px] text-muted-foreground">
                <MessageCircle className="w-3.5 h-3.5 text-primary" /> Horus (WhatsApp)
              </div>
              {d.horus ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-border/60 bg-background/60 px-2 py-[2px] font-body text-[10px] text-foreground">
                      {d.horus.phone_e164 || telefone || '—'}
                    </span>
                    <span className={`rounded-full px-2 py-[2px] font-body text-[10px] ${d.horus.verified_at ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                      {d.horus.verified_at ? `Verificado ${dia(d.horus.verified_at)}` : 'Não verificado'}
                    </span>
                    {d.horus.blocked && (
                      <span className="rounded-full bg-destructive/15 px-2 py-[2px] font-body text-[10px] text-destructive">Bloqueado</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="font-body text-[10px] text-muted-foreground">Mensagens trocadas</div>
                      <div className="font-body text-sm font-semibold text-foreground">{d.horus.msg_count ?? 0}</div>
                    </div>
                    <div>
                      <div className="font-body text-[10px] text-muted-foreground">Última interação</div>
                      <div className="font-body text-sm font-semibold text-foreground">
                        {d.horus.last_seen_at ? `${dia(d.horus.last_seen_at)} ${hora(d.horus.last_seen_at)}` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="font-body text-[10px] text-muted-foreground">Primeiro contato</div>
                      <div className="font-body text-sm font-semibold text-foreground">{dia(d.horus.first_seen_at)}</div>
                    </div>
                    <div>
                      <div className="font-body text-[10px] text-muted-foreground">Vinculado em</div>
                      <div className="font-body text-sm font-semibold text-foreground">{dia(d.horus.linked_at)}</div>
                    </div>
                  </div>
                  <div className="font-body text-[10px] text-muted-foreground">
                    {(d.horus.msg_count ?? 0) > 0 ? 'Interage com o Horus' : 'Ainda não conversou com o Horus'}
                  </div>
                </>
              ) : (
                <p className="font-body text-[11px] text-muted-foreground">
                  {telefone ? `Número ${telefone} sem vínculo verificado no Horus.` : 'Não vinculou número ao Horus.'}
                </p>
              )}
            </div>


            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-2.5">
              <div className="flex items-center gap-2 font-body text-[11px] text-muted-foreground">
                <LayoutGrid className="w-3.5 h-3.5 text-primary" /> Funções percorridas (30 dias)
              </div>
              {d.funcoes.length === 0 ? (
                <p className="font-body text-[11px] text-muted-foreground">Sem registros.</p>
              ) : (
                d.funcoes.map((f) => (
                  <div key={f.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-body text-[12.5px] font-semibold text-foreground truncate">{f.label}</div>
                        <div className="font-body text-[10px] text-muted-foreground">{f.grupo}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-body text-[11px] text-foreground">{f.hits}x</div>
                        <div className="font-body text-[10px] text-muted-foreground">{formatarDuracao(f.segundos)}</div>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-background/70 overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${(f.hits / maxHits) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {d.features.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-1.5">
                <div className="flex items-center gap-2 font-body text-[11px] text-muted-foreground">
                  <Activity className="w-3.5 h-3.5 text-primary" /> Recursos usados
                </div>
                {d.features.map((f) => (
                  <div key={f.label} className="flex items-center justify-between">
                    <span className="font-body text-[12px] text-foreground truncate">{f.label}</span>
                    <span className="font-body text-[11px] text-muted-foreground">{f.count}x</span>
                  </div>
                ))}
              </div>
            )}

            {d.eventos.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-1.5">
                <div className="font-body text-[11px] text-muted-foreground">Eventos registrados</div>
                {d.eventos.map((e) => (
                  <div key={e.label} className="flex items-center justify-between">
                    <span className="font-body text-[12px] text-foreground truncate">{e.label}</span>
                    <span className="font-body text-[11px] text-muted-foreground">{e.count}x</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Stat icon={Star} label="Favoritos" value={d.contadores.favoritos} />
              <Stat icon={Star} label="Grifos" value={d.contadores.grifos} />
              <Stat icon={Star} label="Anotações" value={d.contadores.anotacoes} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
