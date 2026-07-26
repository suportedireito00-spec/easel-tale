## O que já verifiquei

- A página `/admin-assinantes` chama a edge function `play-reporting`, que devolve dois blocos: `reporting` (Google Play Developer Reporting API) e `local` (nosso banco).
- O bloco **local funciona**: no banco existem 10 linhas em `play_subscriptions` (9 `ACTIVE`, 1 `CANCELED`) — bate com o "Total registradas 10" da sua tela.
- O bloco **reporting está zerado** em todos os cards ("Ativos hoje", "Novos 7d", "Cancelados 7d", "Renovações 30d") e o gráfico de evolução nem aparece (só renderiza se houver linhas).
- Os logs recentes da função não mostram erro: a chamada ao Google é feita dentro de um `.catch()` que engole a falha e devolve `{ error: ... }`, e a tela **só exibe aviso quando o erro é 403**. Qualquer outro erro (API não habilitada, nome de métrica inválido, package name errado, 400/404) fica invisível e vira zero.

Ou seja: a causa exata ainda não está confirmada — o erro real do Google está sendo escondido. O primeiro passo do plano é justamente revelá-lo.

## Plano

**1. Expor o erro real (diagnóstico)**
- Em `play-reporting`, logar `status` + corpo da resposta do Google para cada consulta (`subscriptionMetricSet`, `installsMetricSet`) e devolver esse detalhe no payload.
- Na página, trocar o aviso "só 403" por um painel de diagnóstico que mostra qualquer erro do Google (status, mensagem, package name e e-mail da service account), com o texto de ajuda específico para 403 (permissões) e para 403/404 de API desabilitada.

**2. Corrigir a consulta ao Reporting API**
Com o erro em mãos, ajustar o que estiver quebrado, entre as causas prováveis:
- Nomes de métricas/dimensões inválidos no `subscriptionMetricSet` (retorna 400 e some tudo) — validar contra a documentação atual da Play Developer Reporting API e corrigir.
- `ANDROID_PACKAGE_NAME` ausente ou diferente do pacote publicado.
- Play Developer Reporting API não habilitada no projeto Google Cloud da service account.
- Permissões faltando no Play Console para a service account.
- Janela de dados: o Reporting API tem atraso de alguns dias e não devolve "hoje"; ajustar o cálculo de "Ativos hoje" para usar o último dia disponível e mostrar a data de referência.

**3. Fallback confiável quando o Reporting API não tiver dados**
- O Reporting API só cobre apps com volume/histórico. Adicionar um fallback que calcula "ativos / novos / cancelados / renovações" a partir de `play_subscriptions` (dados que já recebemos por webhook RTDN + validate-purchase), marcando visualmente a origem ("Play Reporting" vs "nosso banco").
- Com isso os cards deixam de ficar zerados mesmo enquanto o Google não devolve nada.

**4. Ajustar a leitura de "assinaturas de teste"**
- Hoje toda assinatura com duração < 1h é classificada como teste — por isso "Premium agora 0" e "Testes 9". Confirmar essa heurística contra as linhas reais e, se necessário, passar a usar o flag de compra de teste/licença em vez da duração, para não zerar a receita indevidamente.

**5. Validar**
- Recarregar `/admin-assinantes` e conferir: ou os números do Play aparecem, ou o painel mostra exatamente qual configuração falta (com link e passo a passo no Play Console / Google Cloud).

## Detalhes técnicos

Arquivos envolvidos: `supabase/functions/play-reporting/index.ts` (logging, correção da query, fallback local) e `src/pages/AdminAssinantes.tsx` (painel de diagnóstico, badge de origem dos dados, data de referência). Nenhuma mudança de schema é necessária.
