## Problemas identificados

1. **Código do QR expira em menos de 1 segundo** — hoje o `expires_at` padrão da tabela é 3 minutos, mas o desktop está mostrando "CÓDIGO EXPIRADO" quase instantâneo. Isso acontece porque o `poll` em `desktop-link` deleta o registro e devolve `expired` sem re-checar corretamente o clock (e o cliente também dispara `expired` via countdown se `expiresAt = 0`). Além disso, o requisito é **1 minuto de duração**.
2. **Depois de "Confirmar login" no celular, o desktop não entra** — o `poll` devolve `token_hash` e o desktop chama `supabase.auth.verifyOtp({ type: 'magiclink', token_hash })`. Esse fluxo funciona só se o token gerado por `admin.generateLink({type:'magiclink'})` for verificado com `type:'email'` (o hashed_token do magiclink é da família OTP de email). Provavelmente é isso que está silenciando o login — o `verifyOtp` retorna erro, mas o toast some rápido.
3. **Sessão de 24h no desktop** — hoje não há limite, é a sessão padrão do Supabase. Precisamos revogar automaticamente depois de 24h e exigir novo QR.
4. **Um celular por conta** — hoje qualquer sessão desktop coexiste; precisamos que ao gerar/scannear um novo QR, a sessão desktop anterior seja invalidada e o desktop antigo seja deslogado automaticamente.

## O que vou fazer

### 1. Ajustar a expiração do QR para 60s
- Migration: alterar default de `desktop_link_tokens.expires_at` para `now() + interval '1 minute'`.
- `desktop-link/create`: definir explicitamente `expires_at` em `+60s` (não confiar só no default) e devolver ISO ao cliente.
- `DesktopQrLogin.tsx`: inicializar `remaining = 60`, e **não** disparar `expired` até `expiresAt` estar preenchido (guard contra o estado inicial).

### 2. Corrigir a entrada no desktop após confirmar no celular
- Trocar a verificação no `DesktopQrLogin.tsx` para `supabase.auth.verifyOtp({ type: 'email', token_hash })` (formato correto para o `hashed_token` devolvido pelo `admin.generateLink('magiclink')`).
- Fallback: se der erro, cair para o `action_link` (usar `setSession` a partir dos tokens contidos no link) — o `desktop-link` já persiste `action_link`; vou expô-lo no `poll` como segundo caminho.
- Mostrar o erro real na tela em vez de só um toast rápido, para não perder o feedback.

### 3. Sessão desktop de 24h + apenas 1 desktop por conta
Criar uma tabela nova `desktop_sessions`:

```text
desktop_sessions
  id              uuid pk
  user_id         uuid  (fk auth.users, on delete cascade)
  desktop_id      uuid  (gerado no browser e salvo em localStorage)
  created_at      timestamptz default now()
  expires_at      timestamptz  (created_at + 24h)
  revoked_at      timestamptz null
  user_agent      text
```

Fluxo:
- Ao carregar o `DesktopQrLogin`, o desktop gera/lê um `desktop_id` em `localStorage`.
- No `action: 'create'` do QR passamos `desktop_id`; ele é salvo no `desktop_link_tokens`.
- No `action: 'claim'` (celular confirma), o edge function:
  1. **Revoga todas as sessões desktop anteriores desse `user_id`** (`update ... set revoked_at = now()` onde `revoked_at is null`).
  2. Insere nova linha em `desktop_sessions` para `(user_id, desktop_id)` com `expires_at = now() + 24h`.
- Depois que o desktop faz `verifyOtp` com sucesso, guarda o `desktop_session_id` em localStorage.
- **Watchdog no desktop** (novo hook `useDesktopSessionGuard`, montado no layout autenticado do desktop): a cada 30s faz `select` da própria linha (`desktop_session_id`); se `revoked_at is not null` ou `expires_at < now()` → `supabase.auth.signOut()` local e volta pra `/auth` com toast "Sessão encerrada — este computador foi desconectado porque outro dispositivo escaneou o QR" ou "Sessão de 24h expirada, escaneie novamente".
- RLS: `select` liberado para o próprio `user_id`; inserção/update só via service_role (edge function).

### 4. Limpeza
- Cron/edge existente ou trigger: nada novo — o watchdog cobre o 24h, mas incluo um `delete from desktop_sessions where expires_at < now() - interval '7 days'` no `create` para não acumular lixo.

## Arquivos afetados

- `supabase/migrations/<novo>.sql` — altera default do TTL, cria `desktop_sessions` + RLS + grants.
- `supabase/functions/desktop-link/index.ts` — TTL 60s explícito, aceita `desktop_id` no `create`, revoga sessões anteriores e cria nova no `claim`, expõe `action_link` no `poll` como fallback.
- `src/components/auth/DesktopQrLogin.tsx` — `remaining=60`, guarda `desktop_id` em localStorage, `verifyOtp` com `type:'email'` + fallback via `action_link`, salva `desktop_session_id`, mostra erro visível.
- `src/hooks/useDesktopSessionGuard.tsx` — novo, faz polling e força signOut.
- `src/App.tsx` (ou o layout desktop autenticado) — monta o guard só em desktop autenticado.

## Fora de escopo

- Não mexo em login mobile, Google/Apple, biometria, nem no fluxo `/desktop-link/:token` além do que for necessário pra passar o `desktop_id` (aliás, o `desktop_id` é salvo no `create`, então o celular não precisa saber dele).
