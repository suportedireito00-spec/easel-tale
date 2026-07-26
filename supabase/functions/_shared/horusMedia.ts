// Helpers para o Horus entender áudio, imagem e PDF recebidos via WhatsApp.
//
// - transcribeAudio: usa Lovable AI Gateway (openai/gpt-4o-mini-transcribe)
// - describeImage / extractPdfText: usa Gemini nativo (inline_data) para
//   extrair descrição/OCR do conteúdo, retornando um bloco de texto que é
//   concatenado à mensagem original antes de ir ao askGemini principal.
//
// Todos falham silenciosamente (retornam string vazia) — o webhook segue com
// a mensagem original ou uma nota informando o usuário.

import { geminiFetch } from "./geminiFetch.ts";
import { logAiCall } from "./ai-log.ts";
import { MODELS } from "./ai-models.ts";

const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "";
// Política: sempre gemini-2.5-flash-lite (multimodal, mais barato).
// Ver docs/gemini-2.5-flash-lite.md.
const VISION_MODEL = MODELS.text;
const STT_MODEL = "gpt-4o-mini-transcribe";

function base64ToBlob(base64: string, mime: string): Blob {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || "application/octet-stream" });
}

function extFromMime(mime: string): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("wav")) return "wav";
  if (m.includes("webm")) return "webm";
  return "ogg";
}

/** Transcreve áudio via Lovable AI Gateway. Retorna string vazia em falha. */
export async function transcribeAudio(base64: string, mimetype: string): Promise<string> {
  if (!LOVABLE_KEY || !base64) return "";
  const startedAt = Date.now();
  let success = true;
  let errMsg: string | undefined;
  let text = "";
  try {
    const blob = base64ToBlob(base64, mimetype || "audio/ogg");
    const form = new FormData();
    form.append("model", `openai/${STT_MODEL}`);
    form.append("file", blob, `audio.${extFromMime(mimetype)}`);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_KEY}` },
      body: form,
    });
    if (!res.ok) {
      success = false;
      errMsg = `${res.status}: ${(await res.text()).slice(0, 200)}`;
      console.warn("horusMedia transcribe failed", errMsg);
      return "";
    }
    const data = await res.json().catch(() => ({}));
    text = String(data?.text || "").trim();
    return text;
  } catch (e) {
    success = false;
    errMsg = (e as Error).message;
    console.warn("horusMedia transcribe error", errMsg);
    return "";
  } finally {
    await logAiCall({
      functionName: "horus-webhook",
      kind: "stt",
      model: STT_MODEL,
      triggerType: "manual",
      inputUnits: Math.round((base64.length * 3) / 4 / 16000), // estimativa grosseira em segundos (16kbps)
      outputUnits: text.length,
      durationMs: Date.now() - startedAt,
      success,
      error: errMsg,
    });
  }
}

async function callGeminiInline(
  base64: string,
  mimetype: string,
  instruction: string,
  kind: "vision" | "ocr",
): Promise<string> {
  if (!GEMINI_KEY || !base64) return "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{
      role: "user",
      parts: [
        { inline_data: { mime_type: mimetype, data: base64.replace(/^data:[^;]+;base64,/, "") } },
        { text: instruction },
      ],
    }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
  };
  const startedAt = Date.now();
  let success = true;
  let errMsg: string | undefined;
  let inputUnits = 0;
  let outputUnits = 0;
  try {
    const res = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      success = false;
      errMsg = `${res.status}: ${(await res.text()).slice(0, 200)}`;
      console.warn("horusMedia gemini failed", errMsg);
      return "";
    }
    const data = await res.json();
    inputUnits  = Number(data?.usageMetadata?.promptTokenCount ?? 0) || 0;
    outputUnits = Number(data?.usageMetadata?.candidatesTokenCount ?? 0) || 0;
    return String(
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n") || "",
    ).trim();
  } catch (e) {
    success = false;
    errMsg = (e as Error).message;
    console.warn("horusMedia gemini error", errMsg);
    return "";
  } finally {
    await logAiCall({
      functionName: "horus-webhook",
      kind,
      model: VISION_MODEL,
      triggerType: "manual",
      inputUnits, outputUnits,
      durationMs: Date.now() - startedAt,
      success, error: errMsg,
    });
  }
}

/** Descreve imagem + extrai texto visível (OCR leve). */
export function describeImage(base64: string, mimetype: string): Promise<string> {
  return callGeminiInline(
    base64,
    mimetype || "image/jpeg",
    "Descreva de forma objetiva o que aparece na imagem em português e transcreva LITERALMENTE todo o texto visível (OCR). Comece com a descrição, depois liste o texto extraído sob o título 'Texto:'. Seja conciso.",
    "vision",
  );
}

/** Extrai o texto de um PDF (OCR quando necessário). */
export function extractPdfText(base64: string, mimetype: string): Promise<string> {
  return callGeminiInline(
    base64,
    mimetype || "application/pdf",
    "Extraia o texto principal deste PDF em português, mantendo a ordem lógica. Ignore cabeçalhos/rodapés repetidos. Se houver muitas páginas, resuma cada uma em 1–2 frases mantendo os pontos jurídicos importantes.",
    "ocr",
  );
}
