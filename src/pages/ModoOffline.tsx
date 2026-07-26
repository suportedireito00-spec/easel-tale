import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CloudDownload, HardDrive, ChevronRight, Info, CloudOff, Library, BookOpen, Trash2,
} from 'lucide-react';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { toast } from 'sonner';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { estimateAudiosSize, removeAllAudios } from '@/services/audioDownloadService';
import { formatBytes } from '@/data/offlineCatalog';
import { listCachedPdfs } from '@/services/bibliotecaPdfCache';
import { RECURSOS_ONLINE } from '@/lib/offlineFeatures';

export default function ModoOffline() {
  const navigate = useNavigate();
  const [audioStats, setAudioStats] = useState({ count: 0, bytes: 0 });
  const [pdfs, setPdfs] = useState<{ name: string; uri: string; size: number }[]>([]);
  const [estimate, setEstimate] = useState({ usage: 0, quota: 0, percent: 0 });

  const refresh = async () => {
    const [audio, storage] = await Promise.all([
      estimateAudiosSize(),
      navigator.storage?.estimate ? navigator.storage.estimate() : Promise.resolve({ usage: 0, quota: 0 } as any),
    ]);
    setAudioStats(audio);
    const usage = (storage as any).usage || 0;
    const quota = (storage as any).quota || 0;
    setEstimate({ usage, quota, percent: quota ? Math.round((usage / quota) * 100) : 0 });
    listCachedPdfs().then(setPdfs).catch(() => setPdfs([]));
  };

  useEffect(() => { refresh(); }, []);

  const pdfBytes = pdfs.reduce((s, p) => s + (p.size || 0), 0);

  const categorias = [
    {
      id: 'leis',
      icon: Library,
      color: '#22c55e',
      title: 'Leis',
      desc: 'Textos já offline · escolha as narrações para baixar',
      meta: `${LEIS_CATALOG.length} leis · ${audioStats.count} áudio${audioStats.count !== 1 ? 's' : ''} baixado${audioStats.count !== 1 ? 's' : ''}`,
      to: '/modo-offline/leis',
    },
    {
      id: 'livros',
      icon: BookOpen,
      color: '#3b82f6',
      title: 'Livros',
      desc: 'Escolha os livros da biblioteca para ler sem internet',
      meta: pdfs.length > 0 ? `${pdfs.length} baixado${pdfs.length !== 1 ? 's' : ''} · ${formatBytes(pdfBytes)}` : 'Nenhum livro baixado ainda',
      to: '/modo-offline/livros',
    },
  ];

  const handleClearAudios = async () => {
    if (!confirm('Remover todos os áudios baixados?')) return;
    await removeAllAudios();
    toast.success('Áudios removidos');
    refresh();
  };

  const mobileHeader = (
    <PageHeader
      title="Modo Offline"
      subtitle="Escolha o que baixar"
      onBack={() => navigate('/')}
      leading={
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <CloudDownload className="w-5 h-5 text-primary" />
        </div>
      }
    />
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Modo Offline"
      subtitle="Escolha o que baixar"
      mobileHeader={mobileHeader}
    >
      <div className="px-4 sm:px-6 py-4 lg:max-w-none lg:px-0 lg:py-0 space-y-5">

        {/* Categorias */}
        <section className="space-y-2.5">
          {categorias.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(c.to)}
              className="w-full flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 hover:bg-muted/40 active:scale-[0.99] transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c.color + '1f' }}>
                <c.icon className="w-6 h-6" style={{ color: c.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[15px] text-foreground">{c.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{c.desc}</p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: c.color }}>{c.meta}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </section>

        {/* Armazenamento */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <span className="font-display text-sm font-bold">Armazenamento</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatBytes(estimate.usage)}{estimate.quota > 0 && ` / ${formatBytes(estimate.quota)}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(estimate.percent, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-primary/70"
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-muted-foreground">
              {audioStats.count} áudios · {formatBytes(audioStats.bytes)}
              {pdfs.length > 0 && ` · ${pdfs.length} livros · ${formatBytes(pdfBytes)}`}
            </p>
            {audioStats.count > 0 && (
              <button
                onClick={handleClearAudios}
                className="text-[11px] text-destructive hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Limpar áudios
              </button>
            )}
          </div>
        </motion.section>

        {/* O que não funciona offline */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-bold text-sm text-foreground">O que não funciona sem internet</h3>
          </div>
          <ul className="space-y-2">
            {RECURSOS_ONLINE.map(r => (
              <li key={r.label} className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{r.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-3 flex gap-2.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/80 leading-relaxed">
              Ao tentar abrir uma dessas funções sem conexão, o app avisa na hora — nada trava nem fica carregando à toa.
            </p>
          </div>
        </motion.section>
      </div>
    </DesktopPageLayout>
  );
}
