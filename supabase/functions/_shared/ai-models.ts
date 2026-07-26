/**
 * Modelos Gemini permitidos no app — FONTE ÚNICA DE VERDADE.
 *
 * Política oficial: TODA chamada de texto/multimodal usa
 * `gemini-2.5-flash-lite` (modelo estável, mais econômico e multimodal).
 *
 * Documentação canônica (também salva em `docs/gemini-2.5-flash-lite.md`):
 * https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite?hl=pt-br
 *
 * PROIBIDO no app (denylist explícita):
 *  - `gemini-2.5-flash` (mais caro)
 *  - `gemini-2.5-pro`, `gemini-3-*`, `gemini-3.1-*` (mais caros)
 *  - `gemini-flash-latest`, `gemini-flash-lite-latest` e qualquer alias `-latest`
 *    (aliases resolvem para a versão mais nova, hoje 3.1 Flash Lite, mais cara)
 *
 * Exceções (não são texto, mantêm modelos próprios):
 *  - Imagem: `gemini-2.5-flash-image`
 *  - TTS:    `gemini-2.5-flash-preview-tts`
 */

export const MODELS = {
  text: "gemini-2.5-flash-lite",
  textGateway: "google/gemini-2.5-flash-lite",
  image: "gemini-2.5-flash-image",
  imageGateway: "google/gemini-2.5-flash-image",
  tts: "gemini-2.5-flash-preview-tts",
} as const;

// Único modelo de texto permitido — sem fallback silencioso para outros.
export const TEXT_MODEL_FALLBACKS = [
  "gemini-2.5-flash-lite",
] as const;

export const ALLOWED_TEXT_MODELS = new Set<string>([
  "gemini-2.5-flash-lite",
  "google/gemini-2.5-flash-lite",
]);

// Aliases/modelos proibidos — se algum bater aqui, forçamos o modelo permitido.
const DENY_PATTERNS: RegExp[] = [
  /-latest$/i,               // qualquer alias -latest (resolve p/ 3.1)
  /gemini-3(\.|-)/i,          // gemini-3.x ou gemini-3-*
  /gemini-2\.5-pro/i,        // 2.5 Pro
  /gemini-2\.5-flash(?!-lite)(?!-image)(?!-preview-tts)/i, // 2.5 Flash "puro"
];

/**
 * Força qualquer id de modelo de texto para `gemini-2.5-flash-lite`.
 * Se o id vier na forma `google/...` (Lovable Gateway), preserva o prefixo.
 * Loga warning para qualquer tentativa fora da política.
 */
export function assertTextModel(id: string): string {
  const raw = String(id || "").trim();
  const isGateway = raw.startsWith("google/");
  const bare = isGateway ? raw.replace(/^google\//i, "") : raw;

  if (ALLOWED_TEXT_MODELS.has(raw)) return raw;

  const denied = DENY_PATTERNS.some((re) => re.test(bare));
  if (denied || !bare) {
    console.warn(
      `[ai-models] Modelo de texto "${raw}" bloqueado pela política. ` +
      `Forçando "${MODELS.text}". Ver docs/gemini-2.5-flash-lite.md`,
    );
  } else {
    console.warn(
      `[ai-models] Modelo de texto "${raw}" fora da allowlist. ` +
      `Forçando "${MODELS.text}".`,
    );
  }
  return isGateway ? MODELS.textGateway : MODELS.text;
}

/**
 * Helper: URL pronta para chamada REST direta ao Gemini
 * (`generativelanguage.googleapis.com`). Sempre injeta o modelo permitido.
 */
export function buildGeminiTextUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.text}:generateContent?key=${apiKey}`;
}

export type ModelKind = keyof typeof MODELS;
