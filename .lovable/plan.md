## Objetivo

Na Biblioteca, o usuário gratuito pode ler **1 livro por mês**. Escolhido o livro (ex.: *Do Espírito das Leis*), ele libera **todos os modos daquele livro**: leitura nativa, PDF, versão folheada, baixar para offline e versão desktop. Ao tentar abrir **outro** livro no mesmo mês, sobe o card de assinatura personalizado da Biblioteca, com botão "Ver mais benefícios" que abre a lista completa de vantagens.

## Regra de limite

Hoje `feature_limits.biblioteca_ler` está com `limit_value = 1`, `period = monthly`, `scope_key = 'colecao'` — ou seja, 1 livro **por coleção**. Ajustar para escopo por **livro**:

- `scope_key = 'livro'` (limite global de 1 leitura/mês, contando livros distintos)
- No `LivroDetailSheet`, passar `scope: String(livro.id)` em vez de `livro.colecaoId`

Com isso o hook `useFeatureLimit` já faz o bypass automático: se o livro atual já foi registrado no mês, ele continua abrindo livremente em qualquer modo, quantas vezes quiser; qualquer livro diferente é bloqueado.

## Ajustes no `LivroDetailSheet.tsx`

- Aplicar o gate também em **baixar para offline** (`modo === 'download'`) e **versão desktop** (`modo === 'desktop'`), que hoje passam direto. Se o livro é o "livro do mês" (ou premium/admin), libera; senão abre o card.
- Registrar o uso **antes** de abrir o leitor (hoje o `register` roda depois), para não haver janela em que dois livros contem como um.
- Botão "Ler agora" no desktop: passar o `refKey` do livro no `register` (hoje chama `register()` sem argumento).
- No card, usar `feature="biblioteca"` com mensagem de uso: "Você já leu seu livro gratuito deste mês".

## Card premium flutuante com benefícios

Em `src/components/PremiumGate.tsx` (já sobe de baixo para cima e já é personalizado por função):

- Texto da chave `biblioteca` ajustado para a regra nova (1 livro grátis por mês; premium libera o acervo inteiro).
- Adicionar botão **"Ver mais benefícios"** abaixo do CTA. Ao tocar, sobe uma segunda camada (também deslizando de baixo para cima) com a **lista padrão de benefícios** — a mesma para qualquer função que abrir o card:
  - Biblioteca completa (leitura nativa, PDF, folheada, offline e desktop)
  - Vade Mecum sem limites: grifos, anotações, narração, explicações e exemplos
  - Funções de IA no artigo: jurisprudência, videoaulas, termos, perguntar e grafo
  - Praticar: questões e flashcards ilimitados
  - Favoritos e lembretes ilimitados
  - Radar Legislativo e Blogger Jurídico completos
  - Trilha Aprender ilimitada
  - Horus 24h no WhatsApp
  - Modo offline e leitura no desktop
- Nessa camada só existem os botões "Começar 7 dias grátis", "Ver outros planos" e voltar/fechar — nenhuma função é liberada por ali.
- A lista fica em um único arquivo de constantes reaproveitável, para que todos os cards flutuantes do app mostrem o mesmo conjunto.

## Detalhes técnicos

- Escopo/limite continuam editáveis pelo painel `AdminFuncoesAssinantes` sem mexer em código.
- Premium e admin seguem sem qualquer limite.
- Nenhuma mudança de esquema: `feature_usage` já guarda `scope_value` e `ref_key`.
