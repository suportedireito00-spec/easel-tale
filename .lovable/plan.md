## Diagnóstico

Verifiquei o banco e a Edge Function `play-billing-webhook`:

- `play_subscriptions` tem **10 linhas, 0 delas com `latest_notification_at`** — ou seja, **nenhuma RTDN do Google já chegou ao webhook**, nem de compra, nem de renovação, nem de reembolso.
- A função `play-billing-webhook` **não tem nenhum log de invocação**. Ela está publicada, mas o Pub/Sub do Google nunca postou nela.
- Mesmo se a RTDN chegasse, o código atual só trata `subscriptionNotification`. Reembolso/estorno vem como `voidedPurchaseNotification` e hoje cai no `return 'ignored'` — seria ignorado silenciosamente.
- `useSubscription` decide "premium" lendo `play_subscriptions` (status ACTIVE + `expires_at` no futuro). Como a linha do usuário reembolsado continua ACTIVE, ele segue premium.

Ou seja, dois problemas somados: (1) o canal RTDN nunca foi de fato ligado ao endpoint, e (2) o handler não sabe lidar com reembolso.

## O que vou fazer

### 1) Tratar reembolso/estorno no webhook (`play-billing-webhook`)
- Adicionar branch para `voidedPurchaseNotification` (é o evento que o Google dispara em reembolso do admin, chargeback e refund do usuário):
  - Localizar a linha em `play_subscriptions` pelo `purchaseToken` (ou `orderId` no caso de compras únicas).
  - Marcar `status = 'SUBSCRIPTION_STATE_CANCELED'`, `cancel_reason = 'REFUND'` (ou o `refundType` recebido), `auto_renewing = false` e **`expires_at = now()`** — isso derruba o premium imediatamente, porque `is_premium_user()` e `useSubscription` olham `expires_at`.
  - Gravar `latest_notification_type = 'VOIDED_PURCHASE'` e `raw_payload`.
- Manter o branch atual de `subscriptionNotification`, mas: quando `notificationType ∈ {SUBSCRIPTION_REVOKED (12), SUBSCRIPTION_EXPIRED (13), SUBSCRIPTION_CANCELED (3)}` e o Google devolver `expiryTimeMillis` no passado (ou o revoke), forçar `expires_at` para agora para não depender do relógio do cliente.
- Como o front já tem `postgres_changes` em `play_subscriptions` filtrado por `user_id`, assim que a linha for atualizada o app rebaixa para gratuito **em tempo real, sem precisar reabrir**.

### 2) Reconciliação automática (rede de segurança se o Pub/Sub falhar de novo)
- Novo cron diário chamando a **Voided Purchases API** (`purchases.voidedpurchases.list`) das últimas 72h e aplicando o mesmo update do item 1 em qualquer `purchase_token` encontrado. Assim, mesmo se o Pub/Sub estiver desconfigurado, o acesso cai em até 24h automaticamente.
- Complementar: para cada linha em `play_subscriptions` com `status = ACTIVE` e `expires_at < now()`, marcar como `EXPIRED` (job já pode ser o mesmo cron).

### 3) Ação manual imediata para o usuário atual
Adicionar uma função admin `play-revoke-access` (invocável pelo painel) que recebe `user_id` (ou email) e:
- Marca todas as linhas dele em `play_subscriptions` como CANCELED + `expires_at = now()`.
- Isso resolve **este** caso agora, sem esperar o cron.
- Me passe o email do usuário reembolsado que eu já rodo essa revogação no fim da implementação.

### 4) Conferir o canal RTDN (config no Google Cloud / Play Console — fora do código)
O motivo raiz de nenhuma notificação ter chegado é configuração. Vou te entregar as instruções exatas para revisar:
- **Play Console → Monetização → Configurações → Notificações em tempo real do desenvolvedor**: precisa apontar para um tópico Pub/Sub (ex.: `projects/<gcp>/topics/play-rtdn`) e o botão "Enviar notificação de teste" precisa retornar OK.
- **Google Cloud Console → Pub/Sub → Assinaturas**: criar/verificar uma assinatura do tipo **Push** apontando para
  `https://<PROJECT_REF>.functions.supabase.co/play-billing-webhook?token=<GOOGLE_PLAY_PUBSUB_VERIFICATION_TOKEN>`
  (o segredo `GOOGLE_PLAY_PUBSUB_VERIFICATION_TOKEN` já existe no projeto — o webhook rejeita 401 se o token não bater, então isso também explica silêncio).
- Conta de serviço da Play Console precisa ter permissão de publicar no tópico (`roles/pubsub.publisher`).
- Rodar de novo o "Enviar notificação de teste" — precisa aparecer log em `play-billing-webhook`.

Não consigo executar essa parte por você (é config no Google), mas depois de ajustar, o item 1 já garante que o próximo reembolso derruba acesso automaticamente, e o item 2 garante que mesmo sem RTDN funcionando o acesso cai em até 24h.

## Detalhes técnicos

**Mudanças em `supabase/functions/play-billing-webhook/index.ts`:**
- Após decodificar o envelope, ramificar em `decoded.subscriptionNotification`, `decoded.voidedPurchaseNotification`, `decoded.oneTimeProductNotification` (esse último pode ser só logado por ora).
- `voidedPurchaseNotification` = `{ purchaseToken, orderId, productType, refundType }`. Update direto por `purchase_token` — não precisa chamar Google API.
- Extrair `mapStatus` para reconhecer `notificationType` (números 1..13) explicitamente em vez de só olhar `expiryTimeMillis`.

**Novo cron `play-reconcile-voided`:**
- Roda a cada 24h.
- Chama `GET /androidpublisher/v3/applications/{package}/purchases/voidedpurchases?startTime=<now-72h>`.
- Faz upsert nas linhas afetadas exatamente como o webhook faria.

**Nova função `play-revoke-access` (admin-only):**
- Verifica `has_role(auth.uid(), 'admin')`.
- Recebe `{ userId }` ou `{ email }`, resolve para user_id via `profiles`, e faz o update em `play_subscriptions`.

**Sem mudanças no front** — `useSubscription` já reage a UPDATE em `play_subscriptions` via `postgres_changes`, então o usuário perde o premium na hora.

## O que preciso de você depois de aprovar

1. Email (ou user_id) do usuário reembolsado, pra eu rodar a revogação manual assim que a função `play-revoke-access` estiver no ar.
2. Confirmar depois se o "Enviar notificação de teste" no Play Console gera log em `play-billing-webhook` — se não gerar, o problema está 100% na config do Pub/Sub e eu te ajudo a debugar passo a passo.
