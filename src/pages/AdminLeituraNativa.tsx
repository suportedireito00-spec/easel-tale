import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, FileText, Sparkles, RefreshCcw, Play, Loader2,
  CheckCircle2, AlertCircle, Clock, Filter, ListChecks,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBibliotecaLeituraStatus, type LivroLeituraItem } from '@/hooks/useBibliotecaLeituraStatus';

type Filtro = 'todos' | 'pendente' | 'processando' | 'pronto' | 'erro' | 'refino-pendente';

const badgeFor = (it: LivroLeituraItem) => {
  const s = it.leitura?.status;
  const r = it.leitura?.refino_status;
  if (s === 'processando') return { label: 'OCR rodando', tone: 'bg-amber-500/20 text-amber-200 border-amber-500/30', Icon: Loader2, spin: true };
  if (s === 'erro') return { label: 'Erro OCR', tone: 'bg-red-500/20 text-red-200 border-red-500/30', Icon: AlertCircle };
  if (r === 'processando') return { label: 'Refino rodando', tone: 'bg-blue-500/20 text-blue-200 border-blue-500/30', Icon: Loader2, spin: true };
  if (r === 'erro') return { label: 'Erro refino', tone: 'bg-red-500/20 text-red-200 border-red-500/30', Icon: AlertCircle };
  if (s === 'pronto' && r === 'pronto') return { label: 'Pronto (com capítulos)', tone: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30', Icon: CheckCircle2 };
  if (s === 'pronto') return { label: 'OCR ok', tone: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30', Icon: CheckCircle2 };
  return { label: 'Pendente', tone: 'bg-white/5 text-white/60 border-white/10', Icon: Clock };
};

const AdminLeituraNativa = () => {
  const navigate = useNavigate();
  const { items, loading, reload } = useBibliotecaLeituraStatus();
  const [busca, setBusca] = useState('');
  const [colecaoId, setColecaoId] = useState<string>('todas');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState(false);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return items.filter((it) => {
      if (!it.download && !it.link) return false; // só livros com PDF
      if (colecaoId !== 'todas' && it.colecao.id !== colecaoId) return false;
      const s = it.leitura?.status; const r = it.leitura?.refino_status;
      if (filtro === 'pendente' && s) return false;
      if (filtro === 'processando' && s !== 'processando' && r !== 'processando') return false;
      if (filtro === 'pronto' && !(s === 'pronto' && r === 'pronto')) return false;
      if (filtro === 'erro' && s !== 'erro' && r !== 'erro') return false;
      if (filtro === 'refino-pendente' && !(s === 'pronto' && r !== 'pronto')) return false;
      if (q) {
        const hay = `${it.titulo} ${it.autor ?? ''} ${it.colecao.label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, busca, colecaoId, filtro]);

  const keyOf = (it: LivroLeituraItem) => `${it.colecao.table}::${it.id}`;

  const toggle = (it: LivroLeituraItem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(it);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };
  const toggleAllFiltered = () => {
    setSelected((prev) => {
      const allK = filtered.map(keyOf);
      const allSelected = allK.every((k) => prev.has(k));
      const next = new Set(prev);
      if (allSelected) allK.forEach((k) => next.delete(k));
      else allK.forEach((k) => next.add(k));
      return next;
    });
  };

  async function invokeFn(name: string, body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return data;
  }

  async function processar(it: LivroLeituraItem, tipo: 'ocr' | 'refino' | 'completo') {
    const pdf_url = it.download || it.link || '';
    if ((tipo === 'ocr' || tipo === 'completo') && !pdf_url) {
      toast.error('Livro sem PDF'); return;
    }
    try {
      if (tipo === 'ocr' || tipo === 'completo') {
        await invokeFn('biblioteca-ocr-mistral', {
          livro_id: String(it.id), livro_tabela: it.colecao.table,
          pdf_url, titulo: it.titulo, force: true,
        });
      }
      if (tipo === 'refino' || tipo === 'completo') {
        await invokeFn('biblioteca-ocr-mistral', {
          action: 'refino',
          livro_id: String(it.id), livro_tabela: it.colecao.table, force: true,
        });
      }
      toast.success('Processamento disparado');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao disparar');
    }
  }

  async function enfileirar(tipo: 'ocr' | 'refino' | 'completo') {
    const alvos = filtered.filter((it) => selected.has(keyOf(it)));
    if (!alvos.length) { toast.error('Selecione ao menos um livro'); return; }
    const rows = alvos.map((it, idx) => ({
      livro_tabela: it.colecao.table,
      livro_id: String(it.id),
      pdf_url: it.download || it.link || null,
      titulo: it.titulo,
      tipo,
      scheduled_for: new Date(Date.now() + idx * 1000).toISOString(),
    }));
    const { error } = await supabase.from('biblioteca_leitura_jobs' as any).insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} livro(s) enfileirados`);
    setSelected(new Set());
  }

  async function dispararWorker() {
    setBatchRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('biblioteca-ocr-mistral', { body: { action: 'worker' } });
      if (error) throw error;
      toast.success(`Worker: ${data?.processed ?? 0} job(s) processados`);
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha no worker');
    } finally {
      setBatchRunning(false);
    }
  }

  const stats = useMemo(() => {
    const total = filtered.length;
    const pronto = filtered.filter((i) => i.leitura?.status === 'pronto' && i.leitura?.refino_status === 'pronto').length;
    const proc = filtered.filter((i) => i.leitura?.status === 'processando' || i.leitura?.refino_status === 'processando').length;
    const erro = filtered.filter((i) => i.leitura?.status === 'erro' || i.leitura?.refino_status === 'erro').length;
    return { total, pronto, proc, erro };
  }, [filtered]);

  return (
    <div className="min-h-dvh bg-black text-white">
      <PageHeader title="Leitura Nativa (OCR + Gemini)" onBack={() => navigate('/admin-funcoes')} />

      <div className="px-4 py-4 space-y-4 pb-32">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Total" value={stats.total} tone="text-white" />
          <StatCard label="Prontos" value={stats.pronto} tone="text-emerald-300" />
          <StatCard label="Rodando" value={stats.proc} tone="text-amber-300" />
          <StatCard label="Erros" value={stats.erro} tone="text-red-300" />
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Buscar título ou autor…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
          <Button variant="outline" size="icon" onClick={reload} className="shrink-0">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-white/60 text-xs">
            <Filter className="h-3 w-3" /> Coleção:
          </div>
          <Chip active={colecaoId === 'todas'} onClick={() => setColecaoId('todas')}>Todas</Chip>
          {[...new Set(items.map((i) => i.colecao.id))].map((cid) => {
            const c = items.find((i) => i.colecao.id === cid)?.colecao;
            if (!c) return null;
            return (
              <Chip key={cid} active={colecaoId === cid} onClick={() => setColecaoId(cid)}>
                {c.label}
              </Chip>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-white/60 text-xs">Status:</div>
          {(['todos','pendente','processando','pronto','erro','refino-pendente'] as Filtro[]).map((f) => (
            <Chip key={f} active={filtro === f} onClick={() => setFiltro(f)}>{f}</Chip>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border border-white/10 rounded-2xl p-3 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-white/70">{selected.size} selecionado(s)</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => enfileirar('ocr')}>Enfileirar OCR</Button>
              <Button size="sm" variant="outline" onClick={() => enfileirar('refino')}>Enfileirar Refino</Button>
              <Button size="sm" className="bg-yellow-400 text-black hover:bg-yellow-300" onClick={() => enfileirar('completo')}>
                Enfileirar Completo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-white/50">
          <button className="flex items-center gap-1 hover:text-white" onClick={toggleAllFiltered}>
            <ListChecks className="h-3 w-3" />
            {filtered.every((it) => selected.has(keyOf(it))) && filtered.length > 0 ? 'Desmarcar todos' : 'Selecionar todos filtrados'}
          </button>
          <Button size="sm" variant="outline" onClick={dispararWorker} disabled={batchRunning}>
            {batchRunning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            Rodar fila agora
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-white/60 py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => {
              const k = keyOf(it);
              const b = badgeFor(it);
              const B = b.Icon;
              const upd = it.leitura?.refino_updated_at ?? it.leitura?.updated_at;
              return (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex gap-3 items-start">
                  <input type="checkbox" className="mt-1 accent-yellow-400"
                    checked={selected.has(k)} onChange={() => toggle(it)} />
                  <div className="w-10 h-14 rounded-md overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                    {it.capa ? (
                      <img src={it.capa} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : <BookOpen className="h-4 w-4 text-white/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{it.titulo}</div>
                    <div className="text-xs text-white/50 truncate">
                      {it.colecao.label}{it.autor ? ` · ${it.autor}` : ''}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${b.tone}`}>
                        <B className={`h-3 w-3 ${b.spin ? 'animate-spin' : ''}`} />
                        {b.label}
                      </span>
                      {it.leitura?.total_paginas ? (
                        <span className="text-[10px] text-white/40">{it.leitura.total_paginas} pág.</span>
                      ) : null}
                      {upd ? (
                        <span className="text-[10px] text-white/40">{new Date(upd).toLocaleString('pt-BR')}</span>
                      ) : null}
                    </div>
                    {it.leitura?.etapa && (it.leitura.status === 'processando' || it.leitura.refino_status === 'processando') && (
                      <div className="text-[10px] text-white/50 mt-1 truncate">{it.leitura.etapa}</div>
                    )}
                    {(it.leitura?.erro_detalhe || it.leitura?.refino_erro) && (
                      <div className="text-[10px] text-red-300 mt-1 truncate">{it.leitura.erro_detalhe || it.leitura.refino_erro}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" className="h-7 bg-yellow-400 text-black hover:bg-yellow-300"
                      onClick={() => processar(it, 'completo')}>
                      <Sparkles className="h-3 w-3 mr-1" /> Extrair
                    </Button>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] px-2"
                        onClick={() => processar(it, 'ocr')} title="Só OCR">
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] px-2"
                        onClick={() => processar(it, 'refino')} title="Só refino Gemini">
                        <Sparkles className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-white/50 py-10">Nenhum livro nos filtros atuais.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-xs border transition ${
      active ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
    <div className="text-xs text-white/50">{label}</div>
    <div className={`text-2xl font-bold ${tone}`}>{value}</div>
  </div>
);

export default AdminLeituraNativa;
