
# Compartilhar → abrir no app (ou instalar e abrir na página certa)

Objetivo: quando o usuário compartilhar qualquer conteúdo (artigo, lei, notícia, PL, livro, etc.), o link:

1. Se a pessoa **tem o app** → abre direto na tela do conteúdo (deep link "quente").
2. Se **não tem** → vai pra Play Store / App Store, ela instala, e na **primeira abertura** o app já pula pra tela do conteúdo (deferred deep link).

Muita coisa já existe (esquema `vacatio://`, `initDeepLinkRouter`, `buildArtigoShareUrl`, `assetlinks.json` template). Faltam três peças: (a) verificação oficial dos App Links / Universal Links, (b) uma página web "smart" que decide entre abrir o app ou mandar pra loja e memoriza o destino, (c) leitura desse destino memorizado na primeira execução.

## O que muda pro usuário

- Todo botão "compartilhar" do app manda um link único no formato `https://vacatio.com.br/ir/<tipo>/<id>` (ex: `.../ir/lei/cf88/art-5`).
- Se tem app instalado: Android e iPhone abrem direto no leitor de artigo.
- Sem app: a página `/ir/...` mostra um preview bonito ("Artigo 5º da CF/88 — abra no Vacatio") e um botão "Instalar" que já leva pra loja carregando um identificador do link.
- Depois de instalar e abrir, o app recupera esse identificador e navega automaticamente pro artigo.

## Etapas de implementação

### 1. Verificar App Links (Android)
- Preencher `public/.well-known/assetlinks.json` com o **SHA-256 real** da chave de release (hoje está `REPLACE_WITH_RELEASE_SHA256_FINGERPRINT`).
- Publicar o arquivo em `https://vacatio.com.br/.well-known/assetlinks.json` (domínio já apontado).
- Adicionar no workflow `build-android.yml` um `intent-filter` novo com `android:autoVerify="true"` e `<data android:scheme="https" android:host="vacatio.com.br" />` (hoje só existe pro esquema `vacatio://` e `br.com.vacatio.app://`).

### 2. Universal Links (iOS)
- Adicionar capability **Associated Domains** no `ios/App/App/App.entitlements` com `applinks:vacatio.com.br`.
- Publicar `public/.well-known/apple-app-site-association` (JSON sem extensão, servido como `application/json`) com o Team ID + Bundle ID `br.com.vacatio.app` e paths `/ir/*` e `/lei/*`.
- Sem código extra: o `appUrlOpen` do Capacitor já entrega essas URLs no `initDeepLinkRouter`.

### 3. Página web "smart link" `/ir/*`
- Nova rota React `src/pages/SmartLink.tsx` casada com `/ir/*` no `src/App.tsx`.
- Faz três coisas em ordem:
  1. Tenta abrir `vacatio://<mesmo path>` num iframe invisível — se o app estiver instalado, o SO intercepta antes da página web carregar completamente.
  2. Se `navigator.userAgent` é Android, redireciona pra Play Store com o parâmetro `referrer=vacatio_link%3D<path>` (Play Install Referrer API).
  3. Se é iOS, redireciona pra App Store; como iOS não tem Install Referrer, gravamos o path num endpoint edge `smart-link-claim` associado a um fingerprint leve (IP + user-agent + timezone). Ao primeiro `appUrlOpen` sem path o app consulta esse endpoint com o mesmo fingerprint pra recuperar o destino (janela curta, 10 min).
- Mostra card de preview com título/descrição do conteúdo (busca no banco via edge function pública `smart-link-meta`) e OG tags corretas pro WhatsApp/Twitter renderizarem bem.

### 4. Recuperar destino pós-instalação (Android)
- Adicionar plugin `@capacitor-community/play-install-referrer` no `capacitor.config.ts` (não precisa código nativo custom).
- No boot do app (dentro de `initDeepLinkRouter`), se `Capacitor.getPlatform() === 'android'` e ainda não houve `appUrlOpen`, ler o referrer, extrair `vacatio_link=<path>` e navegar.
- Marcar num `localStorage` que já consumimos, pra não repetir no próximo abrir.

### 5. Recuperar destino pós-instalação (iOS)
- Nova edge function `smart-link-claim`:
  - `POST /claim` → grava `{ fingerprint_hash, target_path, created_at }` (TTL 10 min).
  - `POST /consume` → devolve o `target_path` mais recente pro mesmo fingerprint e apaga.
- No boot iOS, se não houve `appUrlOpen`, chamamos `consume` com o fingerprint atual. Se voltar um path, navegamos.

### 6. Unificar botões de compartilhar
- Trocar todos os `navigator.share({ url: ... })` espalhados (`ShareSheet.tsx`, `ShareButtons.tsx`, `LivroDetailSheet.tsx`, `Noticias.tsx`, `LocaisJuridicos.tsx`, `ObraDetailSheet.tsx`, `CompartilharFrase.tsx`, `ChatArtifacts.tsx`, `ResumoJuridicoReaderSheet.tsx`) pra usarem um novo helper `buildSmartLink(tipo, params)` em `src/lib/nativeDeepLinks.ts`.
- O helper devolve sempre `https://vacatio.com.br/ir/<tipo>/...` — mesmo formato pro Android, iOS e web.

### 7. Ajustar o `parseDeepLink`
- Adicionar suporte a paths que começam com `/ir/` (basta remover o prefixo antes do switch atual).
- Suportar `livro/<id>`, `noticia/<id>`, `radar/pl/<id>`, `resumo/<id>`, `frase/<id>` pra cobrir todos os shares que já existem.

## Detalhes técnicos

- **Domínio**: `vacatio.com.br` (já usado no `assetlinks.json` e no `parseDeepLink`).
- **Formato de link canônico**:
  - Artigo: `/ir/lei/{slug}/art-{numero}`
  - Lei inteira: `/ir/lei/{slug}`
  - Notícia: `/ir/noticia/{id}`
  - Livro: `/ir/livro/{id}`
  - PL: `/ir/radar/pl/{id}`
  - Frase da biblioteca: `/ir/frase/{id}`
- **assetlinks.json**: precisa do SHA-256 da chave de release usada no `build-android.yml` (pego com `keytool -list -v -keystore release.keystore`).
- **AASA (iOS)**:
  ```json
  { "applinks": { "details": [{ "appIDs": ["TEAMID.br.com.vacatio.app"], "components": [{ "/": "/ir/*" }, { "/": "/lei/*" }] }] } }
  ```
- **Fingerprint iOS** (deferred): hash SHA-256 de `ip + user_agent_family + tz + accept_language`, guardado no Supabase por 10 min. Não é 100% preciso (Apple limita) — taxa de acerto típica ~85%. Sem esse fallback iOS não tem jeito melhor sem SDK pago (Branch/Adjust/Firebase Dynamic Links foi descontinuado).
- **OG tags**: renderizar server-side na função edge `smart-link-meta` (Deno) que devolve HTML mínimo com `<meta property="og:title">` etc., pra WhatsApp mostrar preview antes de baixar o app.
- **Sem regressão**: os deep links atuais (`vacatio://lei/...`, `https://vacatio.com.br/lei/...` diretos) continuam funcionando; `/ir/*` é uma camada nova por cima.

## Fora do escopo

- Não vou trocar Firebase Dynamic Links (descontinuado) por Branch/Adjust — custo e complexidade fora do pedido.
- Não vou fazer share de imagem/vídeo renderizado — só do link.
- Não vou mexer no fluxo OAuth (`auth-callback`), que continua isolado.

## Passo-a-passo que você (usuário) precisa fazer

1. **SHA-256 da release**: rodar `keytool` na sua chave e me mandar — coloco no `assetlinks.json`.
2. **Team ID Apple**: pego no Apple Developer → Membership. Preciso pra montar o AASA.
3. **Publicar o domínio** `vacatio.com.br` apontando pro app publicado (se ainda não está).
4. Depois de eu implementar, rodar `npx cap sync` e gerar novo build Android/iOS.
