// Estilo oficial das capas do blog (espelha src/data/blogCoverStyle.json).
// Fundo PRETO puro + personagem cartoon vetorial + vestígios da cor da categoria.

export const BASE_PALETTE = {
  background: "#000000",
  skin: "#EFE0C4",
  beigeLight: "#F5E9CE",
  neutralWarm: "#C9A26A",
  brownDark: "#6B3F1D",
  outline: "#1A1004",
};

type Accent = { hex: string; name: string; hint: string };

export const THEME_ACCENTS: Record<string, Accent> = {
  "Iniciantes": { hex: "#F5C76A", name: "âmbar quente", hint: "estudante jovem, expressão curiosa, livro didático" },
  "Filosofia": { hex: "#A78BFA", name: "violeta/roxo", hint: "pensador clássico, pergaminho ou tocha" },
  "Clássicos": { hex: "#FCA5A5", name: "vermelho terroso", hint: "figura togada, coroa de louros" },
  "Classicos": { hex: "#FCA5A5", name: "vermelho terroso", hint: "figura togada, coroa de louros" },
  "STF": { hex: "#60A5FA", name: "azul institucional", hint: "ministro togado, martelo, colunata austera" },
  "STJ": { hex: "#38BDF8", name: "azul ciano", hint: "ministro do STJ, autos empilhados" },
  "Curiosidades": { hex: "#5EEAD4", name: "verde-água", hint: "figura intrigada, lupa, ponto de interrogação" },
  "Leis": { hex: "#A3B18A", name: "verde-oliva", hint: "legislador, código de leis fechado" },
  "Jurisprudência": { hex: "#F0ABFC", name: "magenta suave", hint: "juiz analisando acórdão" },
  "Direito Constitucional": { hex: "#93C5FD", name: "azul-royal", hint: "figura séria segurando a Constituição" },
  "Direito Penal": { hex: "#EF4444", name: "vermelho sangue", hint: "promotor severo, algemas ou martelo" },
  "Direito Civil": { hex: "#93C5FD", name: "azul frio", hint: "advogado civilista, contrato assinado" },
  "Direito Administrativo": { hex: "#D4D4D8", name: "cinza-aço", hint: "servidor público, carimbo" },
  "Direito do Trabalho": { hex: "#FBBF24", name: "amarelo trabalho", hint: "operário em traje formal, engrenagem" },
  "Direito Processual": { hex: "#C4B5FD", name: "violeta suave", hint: "escrivão, pilha de autos" },
  "Direito Tributário": { hex: "#6EE7B7", name: "verde-cofre", hint: "contador de terno, cofre" },
  "Carreiras Jurídicas": { hex: "#FCD34D", name: "ouro", hint: "concurseiro focado, medalha" },
  "Atualidades Jurídicas": { hex: "#7DD3FC", name: "azul jornal", hint: "jornalista jurídica, microfone" },
};

const FALLBACK: Accent = { hex: "#F5C76A", name: "âmbar quente", hint: "cena editorial vintage com objetos jurídicos" };

// Vocabulário de objetos da "cena vazada" (estilo gravura editorial vintage).
const PROP_POOL = [
  "pilha de livros antigos", "pergaminho enrolado", "colunas gregas", "vela acesa",
  "tinteiro", "pena de escrever", "balança da justiça", "relógio de bolso",
  "lupa", "cartola", "martelo de juiz", "carimbo e almofada de tinta",
  "diário oficial dobrado", "chave antiga", "globo terrestre", "ampulheta",
  "correntes e algemas", "urna de votação", "cofre metálico", "engrenagens",
  "mapa antigo", "coroa de louros", "tocha", "escrivaninha com papéis",
  "estante embutida", "candelabro", "pasta de autos amarrada com barbante",
];

export function getAccent(categoria?: string | null): Accent {
  if (!categoria) return FALLBACK;
  const direct = THEME_ACCENTS[categoria];
  if (direct) return direct;
  const norm = categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const [k, v] of Object.entries(THEME_ACCENTS)) {
    if (k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === norm) return v;
  }
  return FALLBACK;
}

/**
 * Monta o prompt final da capa. `evitar` recebe títulos/adereços de capas
 * recentes para forçar variação de sujeito e adereço.
 */
export function buildCoverPrompt(
  titulo: string,
  categoria: string,
  evitar: string[] = [],
): string {
  const a = getAccent(categoria);
  const avoid = evitar.filter(Boolean).slice(0, 8);
  // Sorteia um subconjunto de objetos para forçar cenas diferentes a cada capa.
  const seed = Math.abs(
    [...`${titulo}|${categoria}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7),
  );
  const picked: string[] = [];
  for (let i = 0; picked.length < 9 && i < PROP_POOL.length * 2; i++) {
    const p = PROP_POOL[(seed + i * 7) % PROP_POOL.length];
    if (!picked.includes(p)) picked.push(p);
  }

  return `Vintage editorial vector illustration — cutout ("vazada") scene floating on pure black, for a Brazilian legal-education blog cover. 16:9 horizontal.

THEME OF THIS COVER: "${titulo}" — category: ${categoria}. Interpretation direction: ${a.hint}.

SCENE (this is the most important part): build a RICH, DETAILED still-life scene with MANY overlapping objects, in the spirit of a classic engraving-inspired editorial illustration. NOT a single sticker, NOT a lone portrait, NOT a generic bust. Use 7 to 11 distinct objects arranged in depth layers:
- foreground: the main symbol of the theme, large and readable;
- middle: supporting props overlapping each other (stacked old books, candle, inkwell, quill, pocket watch, scales of justice, rolled parchment, gavel, stamp, keys, hourglass, files tied with string);
- background: architectural touches such as ionic/greek columns, shelves or an unfurled scroll, partially cropped by the frame.
Suggested props for THIS cover (adapt freely to the theme, drop what doesn't fit): ${picked.join(", ")}.

HUMAN FIGURE: optional. Include a single period character (19th-century scholar, jurist, magistrate, clerk) ONLY when the theme naturally calls for it, placed off-center (left or right third) and integrated into the scene. For abstract/normative themes (decrees, ordinances, hierarchy of norms, validity, procedure) prefer an OBJECT-LED scene with no person at all.

BACKGROUND: pure solid black #000000, absolute. The illustration is a cutout floating on black — no backdrop, no gradient, no vignette, no texture, no frame. Generous black negative space around the artwork.

STYLE: vintage illustration meets editorial vector art, engraving-inspired linework, flat shading with minimal soft shadows, clean medium-thickness dark outlines (${BASE_PALETTE.outline}), cartoon realism. Highly detailed, crisp, print-quality.

PALETTE: warm sepia monochrome — #C9B58A, #A18B63, #735346, #EFE1BD, #8D775D, #F6E9C5, #D3C19B, #3A2A22, skin ${BASE_PALETTE.skin}, highlight ${BASE_PALETTE.beigeLight}.

CATEGORY ACCENT: ${a.hex} (${a.name}). Use it sparingly but unmistakably — as traces on ribbons, book spines, cloth, glass, flame glow, wax seals, small internal line accents. Roughly 10-15% of the artwork. Never a second accent hue, never a colored background.

LIGHTING: soft, frontal, medium contrast, ambient, few and gentle shadows.

COMPOSITION: horizontal and asymmetric, clear visual hierarchy (primary symbol → secondary stack of objects → tertiary small legal props), objects overlapping naturally, nothing floating randomly.

TEXT: allowed ONLY as a short serif title engraved on a book spine, banner or scroll (1-3 uppercase Latin words). No captions, no paragraphs, no watermark, no logo.

UNIQUENESS: this scene must NOT repeat the composition or props of previous covers.${avoid.length ? ` Avoid repeating the subject/props of: ${avoid.join("; ")}.` : ""}

NEGATIVES: photorealistic, 3D render, blurry, neon colors, watercolor, gradients, heavy shadows, modern devices (laptops, smartphones), colored background, empty minimal sticker with a single object, generic corporate flat design, distorted hands, extra limbs, low quality.`;
}
