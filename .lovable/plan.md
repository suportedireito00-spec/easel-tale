# Três ajustes no app nativo Android

## 1. Faixa amarela em dialogs do sistema (copiar/colar, biometria)

**Causa confirmada:** o tema base `AppTheme.NoActionBar` (aplicado à MainActivity após o splash) está com `android:windowBackground = @color/splash_bg` (#FFD500). Dialogs flutuantes do sistema — toolbar de copiar/colar, prompt do Credential Manager (o tal "Ativar login por biometria") — puxam o `windowBackground` da activity host como fundo, então aparecem com essa mancha amarela sobre o app escuro.

**Correção em `.github/workflows/build-android.yml`:**
- Adicionar `<color name="app_bg">#0a0f1a</color>` em `values/colors.xml` (fundo escuro do app).
- Em **todas** as reescritas do `AppTheme.NoActionBar` (linhas ~391‑398 e ~432‑441): trocar `android:windowBackground` de `@color/splash_bg` para `@color/app_bg`.
- Manter `AppTheme.NoActionBarLaunch` com `splash_bg` (é o tema só do splash — Android 12 usa `windowSplashScreenBackground`, versões anteriores usam `windowBackground`).
- Confirmar que `AppTheme.NoActionBarLaunch` tem `postSplashScreenTheme = AppTheme.NoActionBar` (já é o caso implícito ao herdar).

Resultado: splash inicial continua amarelo, mas a MainActivity passa a viver sobre fundo escuro e os dialogs do sistema deixam de ficar amarelos.

## 2. Remover o prompt "Ativar login por biometria"

**Diagnóstico:** não existe plugin de biometria no projeto (nenhum `capacitor-native-biometric`/`BiometricAuth` em `package.json` nem em `src/`). O popup amarelo da segunda screenshot é o **Credential Manager do Android** oferecendo salvar a credencial do Google com biometria — vem embutido no fluxo do `@capacitor-community/social-login` (`SocialLogin.google`) via Credential Manager, não é código nosso.

**Correção:** no `capacitor.config.ts`, dentro do bloco `plugins.SocialLogin.google`, adicionar a opção que desliga o auto-select/prompt do Credential Manager após o login, para que ele não peça pra salvar/ativar biometria em seguida. Concretamente, remover o uso do Credential Manager modernizado e manter só o fallback do `@codetrix-studio/capacitor-google-auth` (que já está configurado em `plugins.GoogleAuth` e não dispara esse prompt).
- Remover o bloco `SocialLogin` inteiro do `capacitor.config.ts`.
- Remover o pacote `@capacitor-community/social-login` do `package.json` e qualquer import/uso em `src/` (checar `useAuth`, telas de login).
- Trocar as chamadas de login social para usar apenas `GoogleAuth.signIn()` (do plugin `@codetrix-studio/capacitor-google-auth`) e o Apple Sign-In nativo.

Efeito: sem Credential Manager, o Android não vai mais oferecer salvar credencial com biometria depois do login.

> Se você preferir manter o Credential Manager mas apenas suprimir o prompt de "salvar com biometria", me diz — nesse caso a alternativa é passar `autoSelectEnabled: false` e trocar o fluxo para `signInWithGoogleId` sem `savePassword`. O caminho recomendado acima é remover o plugin, que é o que atende ao seu pedido literal de "não deve ter mais o capacitor de biometria".

## 3. Ícone do app maior e usando o logo enviado

Hoje o ícone adaptativo é gerado com `iconBackgroundColor #EFE039` + `icon-foreground.png` renderizado a 66% dentro do círculo (Android encolhe ainda mais em launchers com máscara circular) — por isso o "V" fica pequeno como na screenshot da direita.

**Correção:**
1. Substituir `resources/icon.png` e `resources/icon-foreground.png` pela imagem enviada (`Yellow_color_EFE039_202607222220.jpeg`), padronizada para 1024×1024 PNG. Como o brasão preto já ocupa quase todo o quadro do arquivo enviado, o "V" vai aparecer bem maior no launcher.
2. Ajustar `resources/icon-background.png` para o mesmo amarelo sólido `#EFE039` (fundo do adaptive icon).
3. No workflow, na chamada `bunx capacitor-assets generate` (linha 299), manter `--iconBackgroundColor '#EFE039'` (já correto).
4. Regenerar `icon-monochrome.png` (usado no themed icon do Android 13+) a partir do mesmo brasão em preto sobre transparente.

Depois do próximo build, o ícone na home vai ficar como o "Vacatio" da imagem `image-8.png` (à esquerda) — brasão grande preenchendo o badge amarelo.

---

## Como aplicar / testar

Os três ajustes só aparecem no APK/AAB gerado pelo workflow `build-android.yml` do GitHub Actions. Depois do merge:
1. Rodar o workflow `build-android.yml`.
2. Instalar o APK gerado.
3. Verificar: (a) toolbar de copiar/colar sem fundo amarelo, (b) fluxo de login Google sem prompt de biometria, (c) ícone na home com o brasão grande.

## Detalhes técnicos (para referência)

- Arquivos tocados: `.github/workflows/build-android.yml`, `capacitor.config.ts`, `package.json`, `resources/icon.png`, `resources/icon-foreground.png`, `resources/icon-background.png`, `resources/icon-monochrome.png`, e call sites de `SocialLogin` em `src/` (a mapear no build).
- Nada no runtime da PWA/web muda — o `SocialLogin` só é usado em Capacitor nativo.
- O upload da imagem vira `resources/icon.png` via `cp` + normalização com `sharp`/`convert` para garantir 1024×1024 RGBA.
