## Diagnóstico

Encontrei a causa raiz do problema em "Meus Artigos":

- O botão de coração dentro do `ArtigoBottomSheet` (a folha que abre quando você toca em um artigo) **só dispara analytics** (`appEvents.favoritarArtigo` → GA/Meta) e chama `onToggleFavorito` da tela pai (`CategoriaLegislacao`), que **só grava um Set em `localStorage`** (`vademecum-favoritos`).
- A página `/pessoal/artigos` (Meus Artigos) lê da tabela do banco `artigos_favoritos`, que **nunca recebe insert/delete**. Por isso ela mostra "0" e a mensagem de vazio.
- Existem duas "verdades" para favorito de artigo hoje: o coração dentro do bottom sheet e o coração no card da lista. Nenhum dos dois persiste no Supabase.
- "Minhas Leis" também é 100% localStorage (`leis_favoritas_v1`). Vou manter localStorage como espelho para funcionar offline, mas passar a persistir também no Supabase quando o usuário estiver logado.

Também vou tornar todo o "Meu Espaço" plenamente funcional (rotas, métricas e prefetch já existem — falta o botão de coração na página da lei e a bottom sheet dos artigos favoritos por lei).

## O que vou construir

### 1) Persistência real de favorito de artigo (Supabase)
- Criar helper único `src/lib/artigosFavoritos.ts` com `toggleArtigoFavorito({ tabela, numero, conteudo })`, `isArtigoFavorito(tabela, numero)`, `subscribe(...)`.
- Escreve na tabela `artigos_favoritos` (já existe, com RLS por `user_id`), atualiza cache do React Query e emite evento `artigos:favoritos:changed` para as telas reagirem.
- Se o usuário não estiver logado, cai no localStorage (`artigos_favoritos_v1`) e sincroniza para o Supabase no próximo login.
- Ligar esse helper no `ArtigoBottomSheet` (coração topo esquerdo) e no card de artigo (`CategoriaLegislacao.toggleFavorito`) — as duas superfícies passam a chamar o mesmo helper.

### 2) Coração para favoritar a Lei (topo direito) — mesma linha do voltar
- Adicionar botão coração no header da página de lei aberta, alinhado à direita, com estado `isFavorito(lei.leiId)`.
- Clique → `toggleFavorito` de `@/lib/leisFavoritos` (já existe).
- Também garantir que o mesmo botão dentro do `SearchOverlay` (já implementado) permanece funcional.

### 3) Bottom sheet em "Minhas Leis" com artigos favoritos por lei
- Na página `/pessoal/leis`, ao tocar num cartão de lei favorita: abrir **bottom sheet 90dvh** listando os artigos daquela lei que o usuário favoritou (query filtrada por `tabela_codigo`).
- Cabeçalho com sigla + nome da lei, botão para "abrir a lei" e cards de cada artigo (número + preview) que navegam para o artigo específico.
- Se não houver nenhum artigo favorito daquela lei, mostrar estado vazio ("Você ainda não favoritou artigos desta lei").

### 4) Meu Espaço — funcionalidade e métricas
- Auditar cada tile do "Acesso rápido" (Minhas anotações, Meus grifos, Livros, Filmes, Jurisprudências, Temáticas) e garantir que a rota abre e que `PESSOAL_KEYS` está prefetchado.
- Contadores no perfil (MINHAS LEIS / MEUS ARTIGOS / MINHAS LEITURAS) passam a ler os counts corretos (agora que artigos_favoritos é populado de verdade).
- Feed "MINHA ATIVIDADE" (`meuEspacoFeed`) já lê `artigos_favoritos` — vai começar a mostrar entradas naturalmente após (1).
- Analytics: emitir `track('pessoal_open', { area })` no clique de cada tile (já parcialmente instrumentado — vou completar).

## Detalhes técnicos

- Tabela usada: `public.artigos_favoritos(user_id, tabela_codigo, numero_artigo, conteudo_preview, artigo_id?)` — já existente, com RLS. **Não precisa migration.**
- Invalidação: após toggle, `queryClient.invalidateQueries({ queryKey: PESSOAL_KEYS.artigos(uid) })` + evento window para telas não-Query.
- Bottom sheet: reutilizar `Sheet` do shadcn `side="bottom"` com `h-[90dvh]`, mesmo padrão do `ArtigoBottomSheet`.
- Backfill: no primeiro carregamento após deploy, se houver dados no localStorage antigo (`vademecum-favoritos`) e o usuário estiver logado, upsert em massa no Supabase e limpar a chave antiga.

## Fora de escopo

- Não vou mexer no design system, cores ou tipografia.
- Não vou alterar o fluxo do bottom sheet do artigo em si (só o handler do coração).
- Não vou criar tabelas novas nem migrations.
