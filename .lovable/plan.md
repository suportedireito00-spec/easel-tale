# Plano: Tracking unificado GA4 + Meta Ads em todas as plataformas

## Contexto confirmado
- **Web**: já usa GA4 (`src/lib/analytics.ts`) e Meta Pixel (`src/lib/fbPixel.ts`) sob consentimento LGPD. Só dispara `page_view` hoje; eventos customizados praticamente não existem.
- **iOS/Android**: já usa Firebase Analytics via `@capacitor-firebase/analytics` (`src/lib/nativeAnalytics.ts`) e espelha `page_view`/`screen_view`. Não há Meta App Events nativo instalado ainda.
- **Consentimento**: já centralizado no banner de cookies; web e nativo respeitam o mesmo estado.

## Objetivo
Ter o **mesmo catálogo de eventos** (nomes e parâmetros-chave) chegando ao GA4 e ao Meta Ads, tanto no navegador quanto nos apps iOS/Android. Isso permite:
- Criar conversões iguais no GA4 e no Meta Events Manager.
- Construir públicos de remarketing (ex: "abriu Biblioteca mas não assinou").
- Comparar custo por conversão entre Google Ads e Facebook Ads com eventos equivalentes.

## Fase 1 — Fundação web (entrega imediata)
**Arquivos principais**: `src/lib/analytics.ts`, `src/lib/analyticsEvents.ts` (novo), `src/lib/screenTracking.ts` (novo), `src/App.tsx`.

1. **Catálogo tipado de eventos** (`analyticsEvents.ts`)
   - Define eventos em snake_case para GA4 e mapeamento automático para Meta (ex: `sign_up` → `CompleteRegistration`, `purchase` → `Purchase`, `upgrade_click` → `InitiateCheckout`).
   - Define `ROUTE_NAMES`: mapeia rotas para nomes amigáveis de tela (`/biblioteca` → "Biblioteca Jurídica").

2. **Camada central `track()`**
   - `track(name, params)` dispara GA4 + Meta Pixel simultaneamente no web.
   - Valida limites GA4 (25 parâmetros, chaves ≤40 chars, valores string ≤100 chars).
   - Buffer offline: se consentimento ainda não foi concedido, enfileira até 50 eventos e descarrega ao aceitar.
   - Modo debug `?ga_debug=1` loga no console.

3. **Screen tracking automático**
   - Hook `useScreenTracking()`:
     - Dispara `screen_view` (GA4) e `PageView`/`ViewContent` (Meta) a cada mudança de rota.
     - Envia `screen_name` amigável, `screen_class` (componente), `engagement_time_msec`.
     - Dispara `screen_exit` ao desmontar a tela com tempo de permanência calculado.
   - Scroll depth: `scroll_25`, `scroll_50`, `scroll_75`, `scroll_100`.

4. **User properties**
   - `user_id`, `is_premium`, `platform` (web/pwa), `app_version`.

5. **Listener global de cliques**
   - Captura `data-track="..."` em qualquer elemento clicável e dispara `track()` com os `data-*` atributos como parâmetros.
   - Exemplo: `<button data-track="biblioteca_abrir_livro" data-livro-id={id}>`.

## Fase 2 — Instrumentação de ações (web)
Adicionar `data-track` e chamadas `track()` nos pontos-chave. Não altera lógica de negócio.

**Telas/componentes a instrumentar**:
- **Navegação**: menu lateral, cards da home, botões "Voltar".
- **Vade Mecum**: busca, abertura de lei/artigo, favoritar, anotar, narração, explicação.
- **Jurisprudência**: busca, filtro, abrir resultado, pesquisas prontas, súmulas.
- **Biblioteca**: abrir, download.
- **Horus**: iniciar chat, enviar mensagem, mídia bloqueada (free).
- **Chat Jurídico**: iniciar, enviar mensagem.
- **Aprender/Praticar**: iniciar aula, concluir aula, flashcard, quiz finalizar.
- **Ferramentas**: petição inicial, dicionário, locais jurídicos.
- **Radar**: abrir deputado, PL, votação.
- **Premium/Monetização**: cliques em planos, checkout, purchase.
- **Auth**: login, sign_up, logout (com método).
- **Onboarding**: passos, conclusão.
- **Erros**: ErrorBoundary dispara `app_error`.

## Fase 3 — Nativo iOS/Android (Firebase Analytics)
**Arquivos principais**: `src/lib/nativeAnalytics.ts`, `src/lib/analyticsEvents.ts` (reutilizado), `src/App.tsx`.

1. **Reutilizar o mesmo catálogo**
   - `track()` detecta `Capacitor.isNativePlatform()` e chama `nativeLogEvent()` com os mesmos nomes/parâmetros.
   - `screen_view` chama `nativeLogScreen()`.

2. **Mapeamento de parâmetros nativos**
   - Firebase Analytics tem restrições diferentes do GA4 web (nomes ≤40 chars, tipos limitados). Criar normalizador que trunca/limpa parâmetros.

3. **User properties nativos**
   - `nativeSetUserId`, `nativeSetUserProperty` para `is_premium`, `platform=ios/android`.

4. **Teste em builds nativos**
   - Validar no Firebase DebugView (Android) e Xcode console (iOS) que `screen_view` e eventos chegam.

## Fase 4 — Meta App Events nativo (iOS/Android)
**Novo plugin**: adicionar `@capacitor-community/facebook-login` ou `capacitor-meta-events` (a definir conforme compatibilidade) para enviar eventos Meta diretamente dos apps.

1. **Configuração**
   - Adicionar `FACEBOOK_APP_ID` e `FACEBOOK_CLIENT_TOKEN` como secrets.
   - Atualizar `capacitor.config.ts` com o ID do app.
   - Atualizar workflows de build (`build-ios.yml`, `build-android.yml`) para injetar tokens no `Info.plist` e `AndroidManifest.xml`.

2. **Camada `metaNative.ts`**
   - `metaLogEvent(event, params)` mapeia eventos do catálogo para eventos padrão Meta (`fb_mobile_complete_registration`, `fb_mobile_purchase`, `fb_mobile_search`, etc.).
   - `metaSetUserData()` para advanced matching (email/phone hash).

3. **Integrar no `track()`**
   - No nativo, `track()` passa a disparar **Firebase Analytics + Meta App Events**.

## Fase 5 — Google Ads / Facebook Ads prontos para uso
Depois das fases 1–4, você configura na UI das plataformas (não é código):

1. **GA4 → Google Ads**
   - Vincular propriedade GA4 à conta Google Ads.
   - Marcar `sign_up`, `purchase`, `upgrade_click` como **Conversões principais**.
   - Importar públicos GA4 (ex: "usuários que viram Biblioteca nos últimos 7 dias") para campanhas.

2. **Meta Events Manager**
   - Conectar Pixel web + App Events nativo ao mesmo Business Manager.
   - Marcar `CompleteRegistration`, `Purchase`, `InitiateCheckout` como conversões.
   - Criar públicos personalizados a partir dos eventos customizados (`biblioteca_abrir_livro`, `horus_iniciar_chat`).

## Entregáveis por fase
| Fase | Entrega | Tempo estimado |
|------|---------|----------------|
| 1 | Web: catálogo, screen tracking, user properties, listener data-track | ~1h |
| 2 | Web: instrumentação das ações principais | ~2h |
| 3 | iOS/Android: eventos Firebase Analytics unificados | ~1h30 |
| 4 | iOS/Android: Meta App Events nativo | ~2h |
| 5 | Documentação de configuração GA4/Meta Ads | ~30min |

## Riscos e observações
- **LGPD/Consentimento**: eventos Meta nativos também precisam respeitar o consentimento. A camada `track()` só dispara se consentimento = granted.
- **Performance**: listener global é O(1) por clique; buffer offline limitado a 50 eventos.
- **Compatibilidade nativa**: Meta App Events no Capacitor pode exigir configuração manual no Xcode/Android Studio; incluímos isso nos workflows.
- **Não quebra funcionalidade**: todos os eventos são fire-and-forget com try/catch.

## Próxima ação
Se aprovar, começo pela **Fase 1** (fundação web) e entrego em seguida a **Fase 2** (instrumentação das ações). As fases 3 e 4 ficam para depois, assim você já consegue validar no GA4 DebugView e no Meta Pixel Helper antes de tocar nos builds nativos.