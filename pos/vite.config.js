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

const SITE_URL = process.env.VITE_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://pos.nextoracreations.co.in';
const GOOGLE_PLAY_URL = process.env.VITE_GOOGLE_PLAY_URL || process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL || '';
const WINDOWS_DOWNLOAD_URL = process.env.VITE_WINDOWS_DOWNLOAD_URL || process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || '';
const SUPPORT_EMAIL = process.env.VITE_SUPPORT_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@nextoracreations.co.in';
const SUPPORT_PHONE = process.env.VITE_SUPPORT_PHONE || process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 7674981970';
const WHATSAPP_URL = process.env.VITE_WHATSAPP_URL || process.env.NEXT_PUBLIC_WHATSAPP_URL || '';
const GA_MEASUREMENT_ID = process.env.VITE_GA_MEASUREMENT_ID || '';

export default defineConfig({
  plugins,
  define: {
    __SITE_URL__: JSON.stringify(SITE_URL),
    __GOOGLE_PLAY_URL__: JSON.stringify(GOOGLE_PLAY_URL),
    __WINDOWS_DOWNLOAD_URL__: JSON.stringify(WINDOWS_DOWNLOAD_URL),
    __SUPPORT_EMAIL__: JSON.stringify(SUPPORT_EMAIL),
    __SUPPORT_PHONE__: JSON.stringify(SUPPORT_PHONE),
    __WHATSAPP_URL__: JSON.stringify(WHATSAPP_URL),
    __GA_MEASUREMENT_ID__: JSON.stringify(GA_MEASUREMENT_ID),
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
