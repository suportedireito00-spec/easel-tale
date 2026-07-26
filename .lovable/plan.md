
## O que descobri (evidência)

- Na tentativa do usuário `wesleyanalise2@gmail.com` de verificar o número do admin (`wn7corporation@gmail.com`, `5511991897603`):
  - `horus_verification_codes` mostra o código **consumido** às 2026-07-26 04:24:34 (confirm passou).
  - Mas `horus_whatsapp_users` continua com o número no `wn7corporation` (verified_at antigo de 2026-07-18) e o `wesleyanalise2` **não tem linha**.
  - `horus_phone_transfers` não registrou a transferência.
  - Conclusão: a RPC `horus_transferir_numero` foi chamada mas **não moveu** o vínculo — provavelmente por causa de formato de telefone divergente entre tabelas (`horus_verification_codes` guarda `+5511991897603` com `+`, enquanto `horus_whatsapp_users` guarda `5511991897603` sem `+`). Quando o edge function passa `phoneDb` (sem `+`) pra RPC, o `WHERE phone_e164 = _phone` acha na `horus_whatsapp_users`, mas outras comparações e chaves podem estar caindo em `_phone` diferente do que foi gravado. Preciso confirmar isso rastreando os logs do `horus-verify` daquele momento antes de fechar a causa.
- Nenhum mecanismo hoje avisa o dono antigo — nem em tempo real nem em push. A UI antiga só descobriria se recarregasse status manualmente.

## O que vou fazer

### 1. Corrigir a transferência (server)
- Normalizar telefone **antes** de qualquer query/insert em toda a função `horus-verify`: gravar SEMPRE sem `+` (matching o resto do sistema). Backfill: `UPDATE horus_verification_codes SET phone_e164 = regexp_replace(phone_e164,'^\+','')`.
- Reforçar a RPC `horus_transferir_numero` pra:
  - Retornar erro explícito (não silencioso) se nenhuma linha foi movida quando deveria.
  - Registrar sempre em `horus_phone_transfers` (já faz — garantir que roda).
  - Gravar `from_user_email` e `to_user_email` (nova coluna) pra facilitar a notificação amigável.
- Ler `supabase--edge_function_logs` de `horus-verify` no timestamp 04:24:34 pra confirmar a causa real antes de considerar a correção fechada.

### 2. Notificação instantânea pro dono antigo
- Nova tabela `horus_phone_takeover_notices`:
  ```
  id, user_id (dono antigo), phone_e164, new_owner_email,
  created_at, acknowledged_at
  ```
  RLS: dono lê/atualiza só as próprias linhas. Realtime habilitado.
- A RPC `horus_transferir_numero`, quando `v_old_user_id IS NOT NULL`, insere uma linha aqui pro `v_old_user_id` com o email do novo dono.
- No `wn7corporation` (dono antigo), assim que ele abrir o app (ou já estiver com o app aberto), aparece um modal bloqueante:
  > "🔒 Seu WhatsApp foi desvinculado — o número `+55 11 9****-7603` foi verificado por outra conta (`wes***@gmail.com`) em 26/07 às 01:24. Se não foi você, entre em contato com o suporte."
  Com botão "Entendi" que marca `acknowledged_at` e some.
- Frontend:
  - Novo hook `useHorusTakeoverNotice()` que consulta a tabela + assina `postgres_changes` INSERT filtrado por `user_id=eq.<meu id>`.
  - Novo componente `<HorusTakeoverNoticeDialog/>` montado no shell autenticado (`AppShell` ou equivalente) pra aparecer em qualquer tela.
  - Email de quem tomou é mascarado (`wes***@gmail.com`) por privacidade.

### 3. Refresh instantâneo do lado novo (bug da tela do print)
- Em `AssistenteHorus.tsx`:
  - Após `onVerified()` do sheet, além de `loadStatus()`, **invalidar o cache** `HORUS_CACHE_KEY` no localStorage (hoje ele hidrata `linked=null` mesmo quando já verificou, causando o "Vincular WhatsApp" no reopen).
  - Assinar `postgres_changes` em `horus_whatsapp_users` filtrado por `user_id=eq.<meu id>` pra refletir mudanças sem depender de `loadStatus()` manual.
- No `HorusVerifyPhoneSheet`, se o servidor devolver `transferred: true`, exibir um subtexto "O vínculo com a conta anterior foi encerrado." na tela de sucesso.

### 4. Revogar caso concreto agora
- Executar manualmente: mover o número do `wn7corporation` pro `wesleyanalise2` (chamando a RPC via SQL após a correção), OU — se o usuário preferir — apenas limpar o vínculo do `wesleyanalise2` e devolver o número ao admin. Vou perguntar antes de rodar.

## Arquivos afetados

```text
supabase/migrations/<novo>.sql              # normaliza codes, ajusta RPC, cria tabela + realtime
supabase/functions/horus-verify/index.ts    # normalização de telefone consistente + logs mais claros
src/hooks/useHorusTakeoverNotice.ts         # novo
src/components/horus/HorusTakeoverNoticeDialog.tsx  # novo
src/App.tsx (ou AppShell)                   # monta o dialog global
src/pages/AssistenteHorus.tsx               # invalida cache + realtime subscription
src/components/horus/HorusVerifyPhoneSheet.tsx  # exibe aviso "conta anterior desvinculada"
```

## Antes de rodar

- Confirma pra mim: no caso do teste, o número `+55 11 99189-7603` deve **ficar com o admin (`wn7corporation`)** ou **transferir pro `wesleyanalise2`**? Vou aplicar o cenário que você escolher depois que a correção estiver no ar.
