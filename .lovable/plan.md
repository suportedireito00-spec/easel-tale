## Objetivo

Sempre que alguém se cadastrar ou iniciar a assinatura teste (mensal/anual), o admin recebe:
1. Uma mensagem no WhatsApp pelo Horus (uma única vez por evento);
2. Uma notificação push personalizada que, ao ser tocada, abre direto o painel correspondente ("Cadastrados hoje" ou "Iniciou teste").

## Como vai funcionar

### 1. Fila de alertas no banco
Nova tabela `admin_alertas` com: tipo (`cadastro` | `trial`), usuário, status (`pendente`/`enviado`/`falhou`), payload e data de envio. Índice único por (tipo, user_id) garante **uma mensagem só** por evento, mesmo com reprocessamentos.

Gatilhos (triggers) que inserem na fila:
- `profiles` → novo registro = alerta `cadastro`;
- `play_subscriptions` e `apple_subscriptions` → novo registro = alerta `trial`.

### 2. Processamento a cada minuto
A rotina já existente que roda de minuto em minuto (`reminders-tick`) ganha um passo extra que consome a fila. Isso evita criar uma nova função de borda (o projeto já está no limite).

Para cada alerta pendente ela monta o conteúdo e envia.

**Mensagem de cadastro** (WhatsApp para +55 11 99189-7603):
- Nome da pessoa
- Origem da conta: Google, Apple ou E-mail
- E-mail e telefone informados
- Perfil (estudante, advogado, concurseiro etc.) e faixa etária
- Cidade/UF/País, quando disponível
- Horário do cadastro e total de cadastros do dia

**Mensagem de teste iniciado**:
- Nome, e-mail e origem da conta
- Plano assinado (mensal/anual) e loja (Google Play / Apple)
- Tempo entre o cadastro e a conversão (ex.: "converteu 3 dias após o cadastro")
- Quantidade de acessos ao app e tempo total de tela
- Top 3 funções mais acessadas (mesma classificação usada no dossiê do usuário)
- Resumo curto do que ela mais usou antes de assinar

### 3. Push para o admin
Após a mensagem, o mesmo passo dispara o envio de push (função `send-push` já existente) apenas para os dispositivos do admin, com:
- Cadastro: título "Novo cadastro" + nome/origem, link `/admin-funcoes?card=cadastros`
- Teste: título "Novo teste iniciado" + nome/plano, link `/admin-funcoes?card=trial`

### 4. Abrir o painel certo ao tocar
No painel de admin, ao abrir com `?card=cadastros` ou `?card=trial`, o cartão correspondente abre automaticamente a folha de detalhes do dia (com o marcador verde "NOVO" já existente), e o parâmetro é limpo da URL em seguida.

## Detalhes técnicos

- Migração: tabela `admin_alertas` (RLS: leitura só para admin, escrita via service role), índice único `(tipo, user_id)`, funções de trigger `SECURITY DEFINER`.
- Envio WhatsApp: helper `_shared/evolution.ts` (`evolution.sendText`), com registro em `horus_outbound_log` (tipo `admin_alerta`) e status gravado na fila.
- Push: chamada interna à função `send-push` com `audience.user_ids` = ids de admin (resolvidos por `is_admin_user`/e-mails admin) e `data.url` para o deep link.
- Número do admin e e-mails admin ficam configuráveis via `horus_config` (chave `admin_alertas`), com fallback para os valores atuais.
- Frontend: leitura de `useSearchParams` em `AdminFuncoes`/`AdminHojeCards` para abrir o cartão indicado.
- Caso o passo dentro de `reminders-tick` fique pesado, alternativa é um cron dedicado apontando para a mesma função com um parâmetro `only=admin_alertas`.
