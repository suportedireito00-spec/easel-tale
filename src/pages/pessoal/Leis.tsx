import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, ChevronRight, Heart } from "lucide-react";
import { motion } from "framer-motion";
import PessoalListLayout from "./PessoalListLayout";
import { getFavoritos, LEIS_FAVORITOS_EVENT, LeiFavorita } from "@/lib/leisFavoritos";
import { LEIS_CATALOG } from "@/data/leisCatalog";
import LeiFavoritaArtigosSheet from "@/components/pessoal/LeiFavoritaArtigosSheet";

const TIPO_LABEL: Record<string, string> = {
  constituicao: "Constituição",
  codigo: "Códigos",
  estatuto: "Estatutos",
  lei: "Leis Especiais",
  sumula: "Súmulas",
  decreto: "Decretos",
};

export default function MinhasLeisPage() {
  const [favs, setFavs] = useState<LeiFavorita[]>(() => getFavoritos());
  const [openLei, setOpenLei] = useState<LeiFavorita | null>(null);

  useEffect(() => {
    const refresh = () => setFavs(getFavoritos());
    window.addEventListener(LEIS_FAVORITOS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LEIS_FAVORITOS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const grupos = useMemo(() => {
    const map: Record<string, Array<LeiFavorita & { tipo: string; sigla?: string; iconColor?: string }>> = {};
    for (const f of favs) {
      const cat = LEIS_CATALOG.find((l) => l.id === f.leiId || l.tabela_nome === f.tabela_nome);
      const tipo = cat?.tipo || f.tipo || "lei";
      (map[tipo] ||= []).push({ ...f, tipo, sigla: cat?.sigla, iconColor: cat?.iconColor });
    }
    return map;
  }, [favs]);

  const abrir = (f: LeiFavorita) => setOpenLei(f);

  const isEmpty = favs.length === 0;

  return (
    <PessoalListLayout
      title="Minhas leis"
      count={favs.length}
      icon={Scale}
      accentClass="bg-primary/15 text-primary"
      emptyState={
        isEmpty ? (
          <div className="text-center py-20 space-y-3">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Você ainda não favoritou nenhuma lei.</p>
            <p className="text-xs text-muted-foreground">Toque no coração em qualquer lei para salvá-la aqui.</p>
          </div>
        ) : null
      }
    >
      {!isEmpty && (
        <div className="space-y-6">
          {Object.entries(grupos).map(([tipo, itens]) => (
            <section key={tipo}>
              <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/85 backdrop-blur">
                <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  {TIPO_LABEL[tipo] ?? tipo} · {itens.length}
                </h2>
              </div>
              <div className="space-y-2 mt-2">
                {itens.map((f, i) => (
                  <motion.button
                    key={f.leiId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => abrir(f)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-left min-h-[64px]"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-display font-black text-[13px]"
                      style={{ background: f.iconColor || "hsl(var(--primary))" }}
                    >
                      {f.sigla ? f.sigla.slice(0, 4) : <Scale className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground leading-tight truncate">{f.nome}</p>
                      {f.descricao && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{f.descricao}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </motion.button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <LeiFavoritaArtigosSheet lei={openLei} onClose={() => setOpenLei(null)} />
    </PessoalListLayout>
  );
}
