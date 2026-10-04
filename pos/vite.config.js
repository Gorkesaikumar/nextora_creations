import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PAGES_DIR = resolve(__dirname, 'pages');
const pageInputs = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pageInputs.push(p);
  }
})(PAGES_DIR);

// Reuse the monorepo's installed plugins without a nested package install.
const repoRoot = resolve(__dirname, '..');
let plugins = [];
try {
  const { ViteImageOptimizer } = await import(
    /* @vite-ignore */ new URL('file://' + repoRoot.split('\\').join('/') + '/node_modules/vite-plugin-image-optimizer/dist/index.js').href
  );
  plugins.push(
    ViteImageOptimizer({
      png: { quality: 85 },
      jpeg: { quality: 85 },
      jpg: { quality: 85 },
      webp: { quality: 85 },
      avif: { quality: 70 },
    })
  );
} catch {
  // Plugin unavailable (fresh checkout without repo install) — build without image optimization.
}

const SITE_URL = process.env.VITE_SITE_URL || 'https://pos.nextoracreations.co.in';

export default defineConfig({
  plugins,
  define: {
    __SITE_URL__: JSON.stringify(SITE_URL),
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      input: pageInputs,
      output: {
        manualChunks: undefined,
      },
    },
  },
});
