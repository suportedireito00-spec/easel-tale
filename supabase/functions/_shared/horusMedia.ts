// Helpers para o Horus entender áudio, imagem e PDF recebidos via WhatsApp.
//
// Usa a API do Gemini diretamente (GEMINI_API_KEY / GEMINI_API_KEY_RESERVA),
// via geminiFetch — mesma chave usada no chat jurídico. Modelo:
// gemini-2.5-flash-lite (multimodal: aceita image, audio e PDF inline).
//
// Endpoint: generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// Payload multimodal: parts[].inlineData = { mimeType, data (base64 puro) }.
//
// Todos falham "graciosamente": retornam string vazia e registram o motivo
// em ai_usage_log + console.warn — o webhook decide como avisar o usuário.

import { logAiCall } from "./ai-log.ts";
import { geminiFetch } from "./geminiFetch.ts";
import { MODELS } from "./ai-models.ts";

const MODEL = MODELS.text; // "gemini-2.5-flash-lite"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function cleanB64(base64: string): string {
  return base64.replace(/^data:[^;]+;base64,/, "");
}

async function callGemini(
  base64: string,
  mimetype: string,
  instruction: string,
  kind: "stt" | "vision" | "ocr",
): Promise<string> {
  if (!base64) return "";
  const primary = Deno.env.get("GEMINI_API_KEY") ?? "";
  const reserva = Deno.env.get("GEMINI_API_KEY_RESERVA") ?? "";
  if (!primary && !reserva) {
    console.warn(`horusMedia ${kind}: GEMINI_API_KEY ausente`);
    return "";
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mimetype, data: cleanB64(base64) } },
          { text: instruction },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  };

  const startedAt = Date.now();
  let success = true;
  let errMsg: string | undefined;
  let inputUnits = 0;
  let outputUnits = 0;
  let text = "";
  try {
    const url = `${ENDPOINT}?key=${encodeURIComponent(primary || reserva)}`;
    const res = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      success = false;
      errMsg = `${res.status}: ${(await res.text()).slice(0, 240)}`;
      console.warn(`horusMedia ${kind} failed`, errMsg);
      return "";
    }
    const data = await res.json();
    inputUnits = Number(data?.usageMetadata?.promptTokenCount ?? 0) || 0;
    outputUnits = Number(data?.usageMetadata?.candidatesTokenCount ?? 0) || 0;
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    text = parts.map((p: any) => p?.text || "").join("").trim();
    return text;
  } catch (e) {
    success = false;
    errMsg = (e as Error).message;
    console.warn(`horusMedia ${kind} error`, errMsg);
    return "";
  } finally {
    await logAiCall({
      functionName: "horus-webhook",
      kind,
      model: MODEL,
      triggerType: "manual",
      inputUnits, outputUnits,
      durationMs: Date.now() - startedAt,
      success, error: errMsg,
    });
  }
}

/** Transcreve áudio (Gemini nativo aceita ogg/opus, mp3, m4a, wav, webm). */
export function transcribeAudio(base64: string, mimetype: string): Promise<string> {
  return callGemini(
    base64,
    mimetype || "audio/ogg",
    "Transcreva LITERALMENTE em português o áudio anexado. Retorne apenas o texto transcrito, sem comentários ou formatação adicional.",
    "stt",
  );
}

/** Descreve imagem + extrai texto visível (OCR leve). */
export function describeImage(base64: string, mimetype: string): Promise<string> {
  return callGemini(
    base64,
    mimetype || "image/jpeg",
    "Descreva de forma objetiva o que aparece na imagem em português e transcreva LITERALMENTE todo o texto visível (OCR). Comece com a descrição, depois liste o texto extraído sob o título 'Texto:'. Seja conciso.",
    "vision",
  );
}

/** Extrai o texto de um PDF (OCR quando necessário). */
export function extractPdfText(base64: string, mimetype: string): Promise<string> {
  return callGemini(
    base64,
    mimetype || "application/pdf",
    "Extraia o texto principal deste PDF em português, mantendo a ordem lógica. Ignore cabeçalhos/rodapés repetidos. Se houver muitas páginas, resuma cada uma em 1–2 frases mantendo os pontos jurídicos importantes.",
    "ocr",
  );
}
