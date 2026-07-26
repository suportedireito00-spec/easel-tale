## Objetivo

1. Cadastro → triagem instantâneo (sem os ~5s de tela branca).
2. Triagem mais completa: depois de coletar nome/WhatsApp, entrar cenas Remotion elegantes com o **nome da pessoa** e depois explicando as **funções do app** (Horus, Biblioteca, Radar, Notificações), no estilo do onboarding do Horus.
3. Layout mais respirado (margens topo/base), responsivo e sem travar.
4. Ajustar o Horus onboarding: subir a faixa dos efeitos Remotion na parte de baixo, e otimizar performance.

---

## 1) Instantâneo pós-cadastro

Hoje, ao criar conta, o `ProtectedRoute` mostra um `Loader2` até `initialCheckDone`; e a `/onboarding` só monta depois. Ajustes:

- `src/App.tsx` `ProtectedRoute`: se `user` existe e ainda **não** há cache local nem resposta do Supabase, tratar como `needsOnboarding = true` **otimista** (assume novo usuário) e liberar render imediatamente em vez de mostrar o spinner. A confirmação vem em background e só corrige se já estiver completo.
- `src/hooks/useAuth.tsx`: após `signUp` bem-sucedido, gravar flag `just_signed_up=1` em `sessionStorage` para o `ProtectedRoute` pular direto para `/onboarding` sem nenhum round-trip.
- `src/pages/Auth.tsx`: no submit de `signup`, após sucesso chamar `navigate('/onboarding', { replace: true })` imediatamente (não esperar redirect via `Navigate`).
- Pré-carregar o chunk da triagem (`import('@/components/onboarding/CadastroOnboardingOverlay')`) assim que o usuário focar o campo de e-mail no modo signup, para o overlay abrir sem esperar bundle.

## 2) Triagem expandida com cenas Remotion (nome + funções)

A versão ativa é a `TriagemVersaoC`. Vou estender o fluxo:

Passos atuais: `abertura → persona → interesses → dores → nome → whatsapp → finish`.

Novo fluxo:

```text
abertura → persona → interesses → dores → nome → whatsapp
        → cena Remotion "Prazer, {nome}"   (2.5s)
        → cena Remotion "Biblioteca"       (3s)
        → cena Remotion "Radar de Leis"    (3s)
        → cena Remotion "Horus WhatsApp"   (3s)
        → cena Remotion "Notificações"     (3s)
        → cena final "Bora estudar, {nome}" (2s) → onFinished
```

Implementação (sem bundlar Remotion no app — usar Framer Motion já presente, no mesmo estilo cinematográfico do `HorusIntroVideo`):

- Novo arquivo `src/components/onboarding/CadastroFeaturesReel.tsx`:
  - Full-screen, gradiente por cena (cores já usadas em `CARD_BG`), tipografia grande serifada + sans, ícones lucide-react animados (BookOpen, Radar, MessageCircle, Bell).
  - Cada cena com entrada/saída (blur+scale+stagger de palavras), motion coreografada por `useReducedMotion` e `AnimatePresence mode="wait"`.
  - Auto-avanço por timers com barra de progresso segmentada no topo (mesma do TriagemVersaoC).
  - Botão "Pular" discreto (canto superior direito) para quem quer ir direto.
  - Áudio: reutiliza `useTriagemAudio` (whoosh entre cenas, ding no final).
- `TriagemVersaoC.tsx`:
  - Adicionar step `features` após `whatsapp`. Ao entrar em `features`, renderizar `<CadastroFeaturesReel nome={data.nome} onDone={() => onFinished(next)} />`.
  - Ajustar `advance()` para não chamar `onFinished` direto no último passo — passar por `features` primeiro.
- Layout dos cartões: aumentar `padding` top/bottom (`pt-[calc(env(safe-area-inset-top)+16px)]` e `pb-[calc(env(safe-area-inset-bottom)+16px)]`), garantir `max-h-dvh` com scroll interno em telas curtas; textos e botões com `clamp()` para responsivo.

## 3) Performance da triagem

- Remover re-renders desnecessários: mover `PERSONAS/DORES/INTERESSES` para fora do componente (já estão), mas envolver handlers em `useCallback` e cards em `memo`.
- Trocar `AnimatePresence` de página inteira por transições mais leves (`initial=false` na primeira montagem, `layout` só onde necessário).
- Pré-carregar ícones e fontes: `<link rel="preload">` das duas fontes usadas.
- Lazy import de `framer-motion` já está no bundle; garantir que `CadastroFeaturesReel` seja `React.lazy` para não engordar a tela inicial.
- Corrigir warnings de console que apareçam durante execução da triagem (checar `code--read_console_logs` após build).

## 4) Horus onboarding — subir a faixa e otimizar

- `src/components/horus/onboarding/HorusIntroVideo.tsx`: a faixa inferior de efeitos hoje fica em `bottom: 0`. Ajustar para `bottom: calc(env(safe-area-inset-bottom, 0px) + 12%)` (respiro do gesture bar e mais protagonismo visual), com fallback responsivo por altura.
- Reduzir custo de render: 
  - `will-change: transform, opacity` só nos elementos animados ativos.
  - Remover `filter: blur()` em elementos que se movem — trocar por gradiente radial estático + opacidade animada.
  - Cortar partículas em `< 380px` de largura (dispositivos pequenos) para 40% do total.
  - Usar `AnimatePresence` com `mode="popLayout"` em vez de `wait` onde possível.

---

## Detalhes técnicos

Arquivos criados:
- `src/components/onboarding/CadastroFeaturesReel.tsx` — reel de 5 cenas + saudação com nome.

Arquivos editados:
- `src/App.tsx` — ProtectedRoute otimista para novo usuário.
- `src/hooks/useAuth.tsx` — flag `just_signed_up` no sessionStorage.
- `src/pages/Auth.tsx` — navigate imediato + preload do chunk.
- `src/components/onboarding/versoes/TriagemVersaoC.tsx` — passo `features`, margens safe-area, memo/callback.
- `src/components/horus/onboarding/HorusIntroVideo.tsx` — subir faixa inferior, cortar custo de blur/partículas.

Não altera schema, edge functions ou lógica de negócio.

## Fora de escopo

- Triagens A e B (usuário está usando C como ativa).
- Fluxo de Google/Apple sign-in (já vai para `/onboarding` normalmente).
- Rebuild com Remotion CLI (o "estilo Remotion" será feito com Framer Motion já instalado — mesma abordagem do `HorusIntroVideo` atual).
