## Objetivo
Melhorar a página **Dicionário Jurídico** com: (1) barra de busca no estilo da home + botão de voz, (2) navegação por **categorias** (Todas, Em alta, Latins, Direito Penal, Civil, Constitucional, Processual, Trabalhista, Tributário, Administrativo, Empresarial, Consumidor etc.), (3) layout mais organizado, (4) **bottom sheet** que expande até 90% ao clicar em um termo, mostrando definição, exemplo, aplicação no direito, termos relacionados e mais.

## Escopo (apenas frontend + 1 tabela leve para "Em alta")

### 1. Nova barra de busca (mobile e desktop)
- Substituir o `Input` atual por um bloco no estilo da `HomeHeaderHero`: pill grande, ícone de busca à esquerda, botão de **microfone** à direita (com animação de "listening").
- Reutilizar o hook `useVoiceInput` (mesmo padrão do `SearchOverlay`).
- Estado `partial` mostra a fala em tempo real; ao finalizar, filtra a lista.

### 2. Categorias horizontais (chips roláveis)
- Chips fixos abaixo da barra: `Todas`, `Em alta`, `Latins`, `Penal`, `Civil`, `Constitucional`, `Processual`, `Trabalhista`, `Tributário`, `Administrativo`, `Empresarial`, `Consumidor`, `Ambiental`.
- Classificação **heurística no cliente** (sem alterar o schema de 3.614 termos):
  - `Latins`: detectar termo em latim via regex (palavras terminadas em `-us`, `-um`, `-ae`, `-io`, contém "Loc. lat.", "(Lat.)", "In ", "Ex ", "Ad ", etc.) e lista de sufixos/marcadores comuns já presentes nos significados.
  - Categorias por área: match em palavras-chave dentro de `significado` (`penal`, `crime`, `réu`; `civil`, `contrato`, `obrigação`; `constitucional`, `CF`; `processo`, `processual`; `trabalho`, `CLT`; `tributo`, `fiscal`; `administra`; `empresa`, `comercial`; `consumidor`, `CDC`; `ambient`).
  - Um termo pode entrar em mais de uma categoria; `Todas` mostra tudo.
- Memoização (`useMemo`) para não reprocessar a cada tecla.

### 3. "Em alta" (nova tabela leve)
- `dicionario_termo_stats(palavra text primary key, clicks bigint default 0, updated_at timestamptz)` com RLS: `select` público para authenticated + anon, `insert/update` via RPC `increment_dicionario_click(palavra)`.
- Grants padrão: `GRANT SELECT ON ... TO anon, authenticated; GRANT ALL ... TO service_role;` e grant execute na função.
- Ao abrir um termo, o front chama a RPC. A categoria "Em alta" ordena por `clicks` desc (top 50).

### 4. Card de termo (grade)
- Layout mais denso e legível: cartão com letra inicial em destaque (chip circular), palavra em negrito, primeiras ~2 linhas do significado com fade, e badge da categoria detectada.
- Grid responsiva: 1 coluna mobile, 2 md, 3 lg.

### 5. Bottom sheet de detalhes (90vh)
Novo componente `DicionarioTermoSheet.tsx` usando `Sheet` `side="bottom"`, animando de baixo para cima até `h-[90vh]`, com scroll interno. Conteúdo:
- **Cabeçalho**: palavra grande, chips das categorias detectadas, botão fechar.
- **Definição**: `significado` formatado.
- **Exemplo prático**: `exemplo_pratico` (quando existe) em bloco destacado.
- **Aplicação no Direito**: parágrafo gerado a partir das áreas detectadas (ex.: "Termo utilizado em Direito Civil e Processual, aparece frequentemente em contextos de ..."). Baseado nas mesmas heurísticas — sem chamada de IA.
- **Termos relacionados**: até 6 termos com a mesma letra inicial ou que compartilham palavras-chave do significado (busca simples no array já carregado).
- **Ações**: copiar definição, compartilhar (Web Share API quando disponível), favoritar (localStorage por enquanto).
- Ao abrir, dispara `increment_dicionario_click` e evento de analytics `dictionary_term_open`.

### 6. Estados vazios / carregamento
- Skeletons durante o carregamento inicial.
- Empty state por categoria ("Nenhum termo em Penal para essa busca").

## Arquivos a criar
- `src/components/ferramentas/DicionarioTermoSheet.tsx`
- `src/components/ferramentas/DicionarioCategoryChips.tsx`
- `src/lib/dicionarioCategorias.ts` (heurísticas de classificação e "aplicação no direito")
- Migração: tabela `dicionario_termo_stats` + RPC + grants + RLS

## Arquivos a modificar
- `src/pages/DicionarioJuridicoPage.tsx`: nova barra com voz, chips de categorias, grade, integração do sheet.
- `src/components/ferramentas/DicionarioJuridico.tsx` (versão em bottom-sheet acionada pelo `SearchOverlay`): aplicar o mesmo layout e sheet de detalhes, mantendo a UX equivalente.
- `src/lib/analyticsEvents.ts`: adicionar `dictionary_category_change` e `dictionary_term_open`.

## Fora de escopo
- Não vou reclassificar os 3.614 termos via IA nem adicionar coluna `categoria` no banco (heurística no cliente é rápida e suficiente).
- Não altero o schema de `dicionario_juridico`.
- Sem tela de admin para editar categorias nesta rodada.

## Confirmação
Se preferir, posso: (a) usar IA (Gemini) para pré-classificar e persistir `categoria`/`tags` no banco em vez da heurística; (b) manter favoritos no Supabase em vez de localStorage. Diga se quer alguma dessas variações — senão, sigo com o plano acima.