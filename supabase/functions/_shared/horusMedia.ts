// Helpers para o Horus entender áudio, imagem e PDF recebidos via WhatsApp.
//
// Todas as chamadas passam pelo Lovable AI Gateway (uma única chave
// LOVABLE_API_KEY resolve STT + visão + OCR de PDF), evitando a dependência
// do secret GEMINI_API_KEY que não existe neste projeto.
//
// - transcribeAudio: /v1/audio/transcriptions com openai/gpt-4o-mini-transcribe
// - describeImage / extractPdfText: /v1/chat/completions com google/gemini-2.5-flash-lite
//   usando o formato multimodal do OpenRouter (content blocks image_url / file).
//
// Todos falham "graciosamente": retornam string vazia e registram o motivo
// em ai_usage_log + console.warn — o webhook decide como avisar o usuário.

import { logAiCall } from "./ai-log.ts";
import { MODELS } from "./ai-models.ts";

const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
// Política do projeto: sempre gemini-2.5-flash-lite (multimodal, mais barato).
const VISION_MODEL = MODELS.textGateway; // "google/gemini-2.5-flash-lite"
const STT_MODEL = "openai/gpt-4o-mini-transcribe";

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

function cleanB64(base64: string): string {
  return base64.replace(/^data:[^;]+;base64,/, "");
}

/** Transcreve áudio via Lovable AI Gateway. Retorna string vazia em falha. */
export async function transcribeAudio(base64: string, mimetype: string): Promise<string> {
  if (!LOVABLE_KEY) { console.warn("horusMedia STT: LOVABLE_API_KEY ausente"); return ""; }
  if (!base64) return "";
  const startedAt = Date.now();
  let success = true;
  let errMsg: string | undefined;
  let text = "";
  try {
    const blob = base64ToBlob(base64, mimetype || "audio/ogg");
    const form = new FormData();
    form.append("model", STT_MODEL);
    form.append("file", blob, `audio.${extFromMime(mimetype)}`);
    const res = await fetch(`${GATEWAY_URL}/audio/transcriptions`, {
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
      inputUnits: Math.round((base64.length * 3) / 4 / 16000),
      outputUnits: text.length,
      durationMs: Date.now() - startedAt,
      success,
      error: errMsg,
    });
  }
}

/**
 * Chama o gateway com um bloco multimodal (imagem OU arquivo) + instrução em texto.
 * Segue o formato OpenRouter (image_url / file) documentado em ai-multimodal-input.
 */
async function callGatewayMultimodal(
  base64: string,
  mimetype: string,
  instruction: string,
  kind: "vision" | "ocr",
  block: "image" | "file",
  filename?: string,
): Promise<string> {
  if (!LOVABLE_KEY) { console.warn(`horusMedia ${kind}: LOVABLE_API_KEY ausente`); return ""; }
  if (!base64) return "";
  const dataUrl = `data:${mimetype};base64,${cleanB64(base64)}`;
  const contentBlock = block === "image"
    ? { type: "image_url", image_url: { url: dataUrl } }
    : { type: "file", file: { filename: filename || "arquivo.pdf", file_data: dataUrl } };

  const body = {
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          contentBlock,
          { type: "text", text: instruction },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  };

  const startedAt = Date.now();
  let success = true;
  let errMsg: string | undefined;
  let inputUnits = 0;
  let outputUnits = 0;
  let text = "";
  try {
    const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Lovable-API-Key": LOVABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      success = false;
      errMsg = `${res.status}: ${(await res.text()).slice(0, 240)}`;
      console.warn(`horusMedia ${kind} failed`, errMsg);
      return "";
    }
    const data = await res.json();
    inputUnits = Number(data?.usage?.prompt_tokens ?? 0) || 0;
    outputUnits = Number(data?.usage?.completion_tokens ?? 0) || 0;
    text = String(data?.choices?.[0]?.message?.content || "").trim();
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
  return callGatewayMultimodal(
    base64,
    mimetype || "image/jpeg",
    "Descreva de forma objetiva o que aparece na imagem em português e transcreva LITERALMENTE todo o texto visível (OCR). Comece com a descrição, depois liste o texto extraído sob o título 'Texto:'. Seja conciso.",
    "vision",
    "image",
  );
}

/** Extrai o texto de um PDF (OCR quando necessário). */
export function extractPdfText(base64: string, mimetype: string): Promise<string> {
  return callGatewayMultimodal(
    base64,
    mimetype || "application/pdf",
    "Extraia o texto principal deste PDF em português, mantendo a ordem lógica. Ignore cabeçalhos/rodapés repetidos. Se houver muitas páginas, resuma cada uma em 1–2 frases mantendo os pontos jurídicos importantes.",
    "ocr",
    "file",
    "documento.pdf",
  );
}
