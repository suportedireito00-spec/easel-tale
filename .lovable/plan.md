## Diagnóstico

### Erro fatal do build (bloqueia deploy)
```
Could not resolve "../../.github/workflows/build-android.yml?raw"
from "src/pages/AdminSecretsDownload.tsx"
```
`src/pages/AdminSecretsDownload.tsx` importa dois arquivos `.yml` que ficam **fora** de `src/` (em `.github/workflows/`). Rollup, no build da Vercel, não resolve caminhos fora do root do Vite de forma confiável (no preview da Lovable funciona porque o dev server é mais permissivo). Precisa de uma cópia dentro de `src/` ou `public/`.

### Erro em runtime (aparece nos logs, não bloqueia deploy)
```
WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 64 6f
```
`3c 21 64 6f` = `<!do…` → o `.wasm` do `jeep-sqlite` está sendo servido como HTML (o rewrite `"/(.*)" → /index.html` engoliu o arquivo porque o asset nunca foi copiado para `public/assets/`). O `jeep-sqlite` precisa ter seus assets (`sql-wasm.wasm` + loaders) copiados para o site estático.

### Sobre "plugins do Vercel"
A Vercel **não** precisa de plugin para SPA em Vite — o `vercel.json` atual já cobre rewrites e cache. Não há pacote npm oficial que "melhore desempenho" mágico; o que traz ganho real já está no `vite.config.ts` (compressão gzip/brotli, manualChunks). Vou só adicionar 2 ajustes pontuais no `vercel.json` (content-type de `.wasm` e exclusão do rewrite para arquivos com extensão).

---

## Plano de correção

### 1. Import dos workflows (.yml)
- Criar script `scripts/copy-workflows.mjs` que copia `.github/workflows/build-android.yml` e `build-ios.yml` para `src/generated/workflows/*.yml` antes do build.
- Adicionar ao `package.json`: `"prebuild": "node scripts/copy-workflows.mjs"` (roda tanto local quanto na Vercel).
- Adicionar `src/generated/` ao `.gitignore` (arquivos gerados).
- Alterar em `src/pages/AdminSecretsDownload.tsx`:
  ```ts
  import workflowSource from '@/generated/workflows/build-android.yml?raw';
  import workflowSourceIos from '@/generated/workflows/build-ios.yml?raw';
  ```
- Garantir que Vite entenda `?raw` para `.yml` (já suporta nativamente).

### 2. WASM do jeep-sqlite (evitar erro em produção)
- Adicionar cópia dos assets no mesmo script `scripts/copy-workflows.mjs` (renomear para `scripts/prebuild.mjs`):
  ```js
  // copia node_modules/jeep-sqlite/dist/jeep-sqlite/assets/* → public/assets/
  ```
- Assim os `.wasm` ficam servidos como estáticos reais em `/assets/…`.

### 3. Ajustes no `vercel.json`
- Adicionar header explícito para `.wasm`:
  ```json
  { "source": "/(.*).wasm", "headers": [
      { "key": "Content-Type", "value": "application/wasm" },
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]}
  ```
- Ajustar o rewrite para **não** capturar arquivos com extensão (evita SPA fallback engolir `.wasm`, `.js`, `.png`):
  ```json
  { "source": "/((?!.*\\.).*)", "destination": "/index.html" }
  ```

### 4. Verificação
- Rodar `npm run build` localmente para confirmar que o erro sumiu.
- Confirmar que `dist/assets/sql-wasm.wasm` (ou equivalente do jeep-sqlite) existe.
- Após deploy, checar no navegador que `GET /assets/sql-wasm.wasm` retorna 200 com `content-type: application/wasm`.

---

## Arquivos a alterar/criar
- **Criar:** `scripts/prebuild.mjs`
- **Criar (via script):** `src/generated/workflows/build-android.yml`, `build-ios.yml`
- **Editar:** `package.json` (script `prebuild`), `.gitignore`, `vercel.json`, `src/pages/AdminSecretsDownload.tsx`

Nenhum pacote novo precisa ser instalado.