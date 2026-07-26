#!/usr/bin/env node
/**
 * Prebuild helper:
 *   1. Copia os workflows do GitHub Actions (.github/workflows/*.yml) para
 *      src/generated/workflows/ para que possam ser importados com `?raw`
 *      pelo Vite/Rollup (o Rollup não resolve caminhos fora de `src/` em
 *      builds fora do preview da Lovable, como Vercel).
 *   2. Copia o binário sql-wasm.wasm do pacote `sql.js` para public/assets/
 *      onde o web component `jeep-sqlite` procura por padrão. Sem isso, o
 *      SPA fallback devolve index.html no lugar do .wasm e o navegador
 *      lança "expected magic word 00 61 73 6d, found 3c 21 64 6f".
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function copyIfExists(from, to, label) {
  try {
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
    console.log(`[prebuild] ${label}: ${path.relative(root, from)} -> ${path.relative(root, to)}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[prebuild] ${label}: origem não encontrada (${from}); ignorado`);
    } else {
      throw err;
    }
  }
}

async function copyWorkflows() {
  const files = ['build-android.yml', 'build-ios.yml'];
  for (const f of files) {
    await copyIfExists(
      path.join(root, '.github/workflows', f),
      path.join(root, 'src/generated/workflows', f),
      'workflow',
    );
  }
  // Placeholder para o caso de o build rodar sem .github (workspace enxuto).
  const dir = path.join(root, 'src/generated/workflows');
  await fs.mkdir(dir, { recursive: true });
  for (const f of ['build-android.yml', 'build-ios.yml']) {
    const p = path.join(dir, f);
    try {
      await fs.access(p);
    } catch {
      await fs.writeFile(p, `# ${f} indisponível neste build.\n`, 'utf8');
      console.warn(`[prebuild] workflow: placeholder criado em src/generated/workflows/${f}`);
    }
  }
}

async function copySqlWasm() {
  await copyIfExists(
    path.join(root, 'node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(root, 'public/assets/sql-wasm.wasm'),
    'sql-wasm',
  );
  // jeep-sqlite também procura o loader em /assets/sql-wasm.js em algumas
  // versões — copia se existir, ignora silenciosamente caso não exista.
  await copyIfExists(
    path.join(root, 'node_modules/sql.js/dist/sql-wasm.js'),
    path.join(root, 'public/assets/sql-wasm.js'),
    'sql-wasm-loader',
  );
}

await copyWorkflows();
await copySqlWasm();
