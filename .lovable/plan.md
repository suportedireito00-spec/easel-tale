## Objetivo

Aplicar o limite gratuito de **3 usos por mês** nas funções do artigo (Vade Mecum) e **3 favoritos ativos** por conta. Ao estourar, abre o card de assinatura (PremiumGate) com "Começar 7 dias grátis".

## Regras finais

| Função | Limite free |
|---|---|
| Grifar (manual, IA, voz, foto — contador único compartilhado) | 3 / mês |
| Narrar artigo | 3 / mês |
| Anotações | 3 / mês |
| Praticar | 3 / mês |
| Jurisprudência | 3 / mês |
| Videoaulas | 3 / mês |
| Termos jurídicos | 3 / mês |
| Perguntar (IA) | 3 / mês |
| Grafo de conexões | 3 / mês |
| Lembretes | 3 / mês |
| Explicação | 3 / mês |
| Exemplo | 3 / mês |
| Copiar artigo | ilimitado |
| Baixar artigo | ilimitado |
| Compartilhar | ilimitado |
| Histórico | ilimitado |
| Favoritar artigo | teto de 3 favoritos ativos (desfavoritar libera vaga) |

Premium e admin continuam sem qualquer limite.

## Banco (`feature_limits`)

Atualizar/criar linhas (categoria `leis`), todas `period = 'monthly'`, `limit_value = 3`, `enabled = true`:

- `grifo` (nova chave única substituindo os 4 contadores separados de grifo)
- `narracao`, `lei_anotacao`, `praticar`, `jurisprudencia`, `videoaula`, `termos`, `perguntar`, `grafo`, `lembretes`, `explicacao`, `exemplo`
- `lei_favorito` → limite 3 (teto de ativos)
- Desativar (`enabled = false`) o que deve ficar livre: `share_card`, download/histórico

Nada de esquema novo — `feature_usage` já suporta tudo (`feature_key`, `scope_value`, `ref_key`).

## Frontend

**`ArtigoBottomSheet.tsx`** — hoje o gate é inconsistente (narração usa `canUseRef`, anotações/perguntar bloqueiam com `isPremium` puro, grifos usam 4 chaves distintas com limite vitalício 1). Padronizar:

- Um helper local `gateFeature(key, label, action)` que: se premium/admin → executa; senão consulta o limite, e se atingido abre `PremiumGate` com a mensagem "Você usou seus 3 usos gratuitos deste mês"; caso contrário registra o uso e executa.
- Aplicar em: abas Explicação/Exemplo, botões Narrar/Grifar/Anotações/Praticar, e nos itens do menu Funções (Jurisprudência, Videoaulas, Termos, Perguntar, Grafo, Lembretes).
- Grifar: trocar as 4 chaves (`grifo_manual/magico/voz/foto`) por uma só (`grifo`), contando por artigo (`ref_key`) para não consumir 2 usos ao grifar dois trechos do mesmo artigo. Regrifar um artigo já grifado não consome nova cota.
- Remover os bloqueios de gate em Copiar, Baixar, Compartilhar e Histórico.

**Favoritos de artigo** (`src/lib/artigosFavoritos.ts` + botões de coração no sheet e no header da lei): antes de favoritar, contar os favoritos ativos do usuário; se já houver 3 e não for premium, abrir o PremiumGate ("Você já tem 3 artigos favoritos"). Desfavoritar sempre permitido e libera vaga.

**Paywall**: reaproveitar o `PremiumGate` existente (já tem preço, "Começar 7 dias grátis" e "Ver outros planos"), ajustando a animação para entrar deslizando de baixo para cima como card flutuante.

## Detalhes técnicos

- `usePremiumUsage`/`useFeatureLimit` já leem `feature_limits` com cache; após a migração de dados o cache é invalidado no próximo carregamento (TTL 5 min).
- O painel admin `AdminFuncoesAssinantes` continua servindo para ajustar qualquer limite depois, sem alterar código.
