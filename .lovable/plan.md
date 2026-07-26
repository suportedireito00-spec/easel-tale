## Plano

Vou corrigir o pipeline de OCR/refino da leitura nativa para impedir que capa, índice e subtítulos soltos virem capítulos no sumário.

### Diagnóstico confirmado

- O livro **Orçamento Público** está salvo em `biblioteca_leitura_nativa` como `livro_tabela='biblioteca_estudos'` e `livro_id='1169'`.
- O registro atual tem `capitulos_json` com um primeiro “capítulo” **ORÇAMENTO PÚBLICO** nas páginas `[1,2]`, mas com `conteudo_md` vazio.
- O `sumario_json` atual inclui itens como **ÍNDICE**, subtítulos internos e artigos como se fossem capítulos.
- No código atual, o OCR coleta headings diretamente do Markdown do Mistral; depois o refino usa essa lista como pista forte. Isso permite que headings de capa/índice e subtítulos internos contaminem o sumário final.
- O leitor (`LeitorNativo`) apenas renderiza `capitulos_json`; então o erro precisa ser corrigido principalmente no backend/refino.

### O que vou implementar

1. **Etapa 1 — Classificador determinístico de páginas**
   - Antes do refino por IA, classificar cada página como:
     - `capa`
     - `indice`
     - `preliminar`
     - `conteudo`
   - Páginas de capa/índice não poderão virar capítulo nem aparecer no sumário do leitor.

2. **Etapa 2 — Filtro forte de candidatos a capítulo**
   - Aceitar como capítulo apenas headings que tenham conteúdo real logo abaixo ou que sejam claramente início de seção principal.
   - Rejeitar automaticamente:
     - título igual ao nome do livro em página inicial
     - `ÍNDICE`, `SUMÁRIO`, `APRESENTAÇÃO`, etc.
     - headings de artigos legais isolados, ex.: `Art. 165`, `Art. 1º (...)`
     - subtítulos curtos internos, ex.: `Exclusividade`, `Transparência`, `Unidade`, quando aparecerem dentro de uma seção maior
     - capítulos com `conteudo_md` vazio ou quase vazio

3. **Etapa 3 — Refino em “agentes”/passos separados**
   - Reorganizar o refino em etapas explícitas:
     - agente de limpeza de OCR por página
     - agente de identificação de estrutura do livro
     - agente de validação do sumário
     - agente de montagem final dos capítulos
   - Cada etapa terá validação determinística antes de seguir para a próxima.

4. **Etapa 4 — Validador final do `capitulos_json`**
   - Antes de salvar no banco, validar:
     - nenhum capítulo vazio
     - nenhum capítulo iniciando em página classificada como índice/capa
     - páginas em ordem crescente
     - títulos limpos e sem numeração duplicada indevida
     - quantidade mínima de texto útil por capítulo
   - Se o sumário gerado pela IA falhar, usar fallback seguro: agrupar por páginas de conteúdo reais em vez de salvar capítulos quebrados.

5. **Etapa 5 — Defesa no leitor**
   - Ajustar o `LeitorNativo` para não renderizar capa de capítulo quando o capítulo não tiver páginas/conteúdo real.
   - Isso evita que registros antigos ainda mostrem “capítulo fantasma” enquanto o livro não for reextraído.

6. **Etapa 6 — Reprocessar e validar o livro afetado**
   - Forçar nova extração/refino do livro **Orçamento Público** (`1169`).
   - Conferir no banco se:
     - o primeiro capítulo real não é mais capa/índice
     - `ÍNDICE` não aparece como capítulo
     - os capítulos têm `conteudo_md` preenchido
     - o sumário do leitor ficou limpo.

### Arquivos principais

- `supabase/functions/biblioteca-ocr-mistral/index.ts`
  - OCR, limpeza, identificação de sumário e montagem de capítulos.
- `src/components/biblioteca/LeitorNativo.tsx`
  - Renderização final do sumário/capítulos no app.

### Resultado esperado

O OCR pode continuar usando o Mistral para extrair texto, mas o refino não vai mais confiar cegamente nos headings extraídos. O livro passará por validação em camadas antes de salvar, reduzindo os erros de sumário, capítulos vazios e páginas puladas.