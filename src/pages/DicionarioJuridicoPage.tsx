import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpenText, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useDicionarioJuridico } from '@/hooks/useDicionarioJuridico';

const DicionarioJuridicoPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: termos = [], isLoading } = useDicionarioJuridico();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return termos.slice(0, 300);
    return termos.filter(t =>
      t.palavra.toLowerCase().includes(q) ||
      t.significado.toLowerCase().includes(q)
    ).slice(0, 500);
  }, [query, termos]);

  const mobileHeader = (
    <PageHeader
      title="Dicionário Jurídico"
      subtitle={termos.length ? `${termos.length.toLocaleString('pt-BR')} termos` : 'Consulte termos e definições jurídicas'}
      onBack={() => navigate(-1)}
    />
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Dicionário Jurídico"
      subtitle={termos.length ? `${termos.length.toLocaleString('pt-BR')} termos jurídicos` : 'Consulte termos e definições jurídicas'}
      mobileHeader={mobileHeader}
    >
      <div className="px-4 sm:px-6 lg:px-0 py-4 lg:py-0">
        <div className="relative mb-4 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar termo jurídico..."
            className="pl-9 pr-9 h-11 rounded-xl bg-secondary/60 border-border/60"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Limpar"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {isLoading && termos.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Carregando termos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpenText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum termo encontrado para "{query}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-24">
            {filtered.map((t, i) => (
              <motion.div
                key={`${t.letra}-${t.palavra}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="p-4 rounded-xl bg-card border border-border/60"
              >
                <h3 className="font-display text-base font-bold text-primary mb-1">
                  {t.palavra}
                </h3>
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                  {t.significado}
                </p>
                {t.exemplo_pratico && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    Ex.: {t.exemplo_pratico}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
};

export default DicionarioJuridicoPage;
