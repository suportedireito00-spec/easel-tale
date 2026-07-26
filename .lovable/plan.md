# Corrigir safe areas em Meu Espaço

## Problema

Em Android nativo (edge-to-edge), a tela `/meu-espaco` deixa dois elementos por baixo das barras do sistema:

1. **Topo** — botão "Voltar" e botão "Trocar capa" estão em `absolute top-3` (12px fixo). No Android o WebView é edge-to-edge, então a status bar (relógio/bateria) fica por cima desses botões.
2. **Rodapé** — o container do feed usa `pb-[calc(4rem+env(safe-area-inset-bottom,0px))]`. No Android WebView, `env(safe-area-inset-*)` **não é propagado** — só a CSS var `--sai-bottom` (injetada pela `MainActivity` nativa via `androidx.activity.EdgeToEdge`) contém o valor real. Resultado: o padding vira `4rem + 0`, e o último card fica atrás da barra de navegação (três-tracinhos / círculo / seta).

O `index.css` já documenta essa regra explicitamente: componentes fixos/sticky devem ler `var(--sai-*, env(safe-area-inset-*, 0px))`, não `env()` puro.

## Mudança

Editar apenas `src/pages/MeuEspaco.tsx`:

- **Botões do topo (linhas 332-345)**: trocar `top-3` por
  `top-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]`
  nos dois botões (Voltar e Trocar capa), para descolarem da status bar.
- **Wrapper do feed (linha 458)**: trocar
  `pb-[calc(4rem+env(safe-area-inset-bottom,0px))]`
  por
  `pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]`
  para que a barra de navegação inferior deixe de encobrir o último item.

Nenhuma outra tela é tocada — o usuário só reportou o problema em Meu Espaço, e as demais páginas já usam o padrão `var(--sai-*)`.

## Validação

Não dá pra reproduzir o edge-to-edge do Android no preview web (o WebView é que gera os insets reais). A conferência será visual no próximo build nativo: back button abaixo do relógio e último card acima da barra de gestos.
