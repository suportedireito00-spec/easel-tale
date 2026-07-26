import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, BookOpenText, X, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useDicionarioJuridico as useDicionarioData } from '@/hooks/useDicionarioJuridico';

interface DicionarioJuridicoProps {
  open: boolean;
  onClose: () => void;
}

const DicionarioJuridico = ({ open, onClose }: DicionarioJuridicoProps) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: termos = [], isLoading } = useDicionarioData();

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return termos.slice(0, 300);
    return termos.filter(t =>
      t.palavra.toLowerCase().includes(q) ||
      t.significado.toLowerCase().includes(q)
    ).slice(0, 500);
  }, [query, termos]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <BookOpenText className="w-5 h-5 text-primary" />
            Dicionário Jurídico
            {termos.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({termos.length.toLocaleString('pt-BR')} termos)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar termo jurídico..."
              className="pl-9 pr-9 h-10 rounded-xl bg-secondary/60 border-border/60"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8" style={{ maxHeight: 'calc(85vh - 130px)' }}>
          {isLoading && termos.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Carregando termos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <BookOpenText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum termo encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <div key={`${t.letra}-${t.palavra}`} className="p-3 rounded-xl bg-card border border-border/60">
                  <h3 className="font-display text-sm font-bold text-primary mb-1">{t.palavra}</h3>
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{t.significado}</p>
                  {t.exemplo_pratico && (
                    <p className="mt-2 text-[11px] text-muted-foreground italic">
                      Ex.: {t.exemplo_pratico}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DicionarioJuridico;
