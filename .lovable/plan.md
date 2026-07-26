## Objetivo

Fazer o Horus (via WhatsApp) realmente ler **áudio, imagem e PDF** enviados pelo usuário, com **aviso imediato** ("estou escutando…", "estou vendo…", "estou lendo…") antes de processar, e **manter o bloqueio Premium** para usuários gratuitos.

## Diagnóstico atual (o que já existe e o que está falhando)

- `supabase/functions/horus-webhook/index.ts` **já detecta** áudio/imagem/documento nos payloads do Evolution (linhas 244-260).
- **Já existe** um "premium gate" (linhas 305-330) que responde amigavelmente quando um usuário gratuito manda mídia — não precisa ser recriado, só ajustar copy/consistência.
- `supabase/functions/_shared/horusMedia.ts` já tem `transcribeAudio` (Lovable AI Gateway, `openai/gpt-4o-mini-transcribe`), `describeImage` e `extractPdfText` (Gemini nativo, `gemini-2.5-flash-lite`).
- **Sinais de que a mídia não está funcionando na prática:**
  - `ai_usage_log` não tem **nenhuma** chamada `stt`/`vision`/`ocr` do `horus-webhook` — ou seja, o `enrichWithMedia` nunca rodou com sucesso, ou nem chegou a rodar.
  - Nenhum registro em `horus_conversations` com marcação `[audio]`/`[image]`/`[document]`.
- **Ausência de ack imediato**: hoje o webhook só manda "digitando…" (presence) e só responde quando a IA termina. Como transcrição/OCR de PDF grande pode levar 8-20s, o usuário fica sem feedback.

## Mudanças

### 1. Ack imediato ao receber mídia (usuário Premium)

Em `supabase/functions/horus-webhook/index.ts`, **antes** de chamar `enrichWithMedia` (linha 334), enviar uma mensagem curta pelo Evolution:

- áudio → `"Recebi seu áudio 🦉 Estou escutando, um instante…"`
- imagem → `"Recebi sua imagem 🦉 Estou analisando, um instante…"`
- PDF → `"Recebi seu PDF 🦉 Estou lendo, um instante…"`
- outro documento → mesma mensagem informando que só PDF é suportado no momento (mantém o comportamento atual do `enrichWithMedia`).

Registrar esse ack em `horus_outbound_log` com `agent: "media_ack"` e **não** persistir em `horus_conversations` (evita poluir o histórico usado como contexto na resposta final).

### 2. Reforçar o gate Premium

Manter o bloco atual (linhas 305-330), com dois ajustes:

- **Também bloquear quando `linked_user_id` for nulo mas o número estiver verificado** (`isPhoneVerified` = true e sem conta vinculada não deveria acontecer, mas se acontecer garantimos que não vazamos processamento pago).
- Copy revisada, deixando explícito o CTA de 7 dias grátis (já existe, apenas polir o texto para bater com o que o usuário pediu: "está na assinatura gratuita e precisa assinar um plano para poder usufruir disso").

### 3. Deixar o processamento de mídia realmente rodar

- **Verificar `GEMINI_API_KEY`** no ambiente da função (via `fetch_secrets`). Se estiver ausente, `describeImage`/`extractPdfText` retornam string vazia silenciosamente — que é exatamente o comportamento observado. Se faltar, pedir para o usuário adicionar.
- Adicionar `console.log` estruturado em `enrichWithMedia`: entrada com `{type, mimetype, hasBase64, size}`, saída com `{ok, chars}` — assim conseguimos ver nos logs do edge function por que uma mídia específica falhou.
- Em `horusMedia.ts`, quando a chamada Gemini/STT falhar, gravar a razão no `ai_usage_log` (já grava — só garantir que `errMsg` chega curto e legível) e devolver uma mensagem específica no `parsed.text` (ex.: "não consegui transcrever agora, tenta reenviar").

### 4. Fallback de download

Hoje `enrichWithMedia` tenta `m.base64` embutido e depois `evolution.downloadMedia`. Alguns eventos do Evolution só trazem `mediaKey`/`url` sem base64. Adicionar um terceiro fallback: se `downloadMedia` falhar, logar o erro completo (path, status) para diagnóstico e responder ao usuário com pedido para reenviar. Sem inventar um provedor novo — só instrumentação.

## Fora de escopo

- Não mexer no `AssistenteHorus.tsx` (UI in-app) — a interação de mídia acontece no WhatsApp via Evolution, não na tela do app.
- Não trocar modelo de visão nem STT.
- Não criar nova tabela/migration.

## Arquivos afetados

- `supabase/functions/horus-webhook/index.ts` — ack imediato, gate premium reforçado, logs.
- `supabase/functions/_shared/horusMedia.ts` — logs de erro mais claros, mensagens de fallback.
- (verificação) segredo `GEMINI_API_KEY` presente no ambiente das edge functions.

## Como validar

1. Enviar um áudio pelo WhatsApp de um número **gratuito** → recebe direto a mensagem de gate Premium, sem consumir tokens.
2. Enviar áudio de um número **Premium** → recebe imediatamente "Recebi seu áudio 🦉 Estou escutando…" e, alguns segundos depois, a resposta da IA usando a transcrição.
3. Mesma coisa para imagem e PDF.
4. Conferir no `ai_usage_log` que apareceram registros `kind='stt'`, `'vision'`, `'ocr'` com `success=true`.
