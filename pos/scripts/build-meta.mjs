/* Post-build: stamp the deploy origin into sitemap/robots and summarize output.
   The origin comes from VITE_SITE_URL (set in Netlify UI) or the default. */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const siteUrl = (process.env.VITE_SITE_URL || 'https://pos.nextoracreations.co.in').replace(/\/$/, '');
const dist = resolve(root, 'dist');

if (!existsSync(dist)) {
  console.error('dist/ not found — run vite build first.');
  process.exit(1);
}

/* Flatten: dist/pages/**.html -> dist/**.html (Vite keeps input tree shape;
   clean URLs need files at dist root). Asset references are absolute, so a
   plain move is safe. */
const pagesDir = resolve(dist, 'pages');
if (existsSync(pagesDir)) {
  (function flatten(from, to) {
    for (const f of readdirSync(from)) {
      const src = join(from, f);
      const dst = join(to, f);
      if (statSync(src).isDirectory()) {
        mkdirSync(dst, { recursive: true });
        flatten(src, dst);
      } else {
        renameSync(src, dst);
      }
    }
  })(pagesDir, dist);
  rmSync(pagesDir, { recursive: true, force: true });
}

/* Sitemap */
const smPath = resolve(dist, 'sitemap.xml');
if (existsSync(smPath)) {
  const sm = readFileSync(smPath, 'utf8').replaceAll('https://pos.nextoracreations.co.in', siteUrl);
  writeFileSync(smPath, sm);
}

/* robots */
const rbPath = resolve(dist, 'robots.txt');
if (existsSync(rbPath)) {
  const rb = readFileSync(rbPath, 'utf8').replaceAll('https://pos.nextoracreations.co.in', siteUrl);
  writeFileSync(rbPath, rb);
}

/* Canonical + OG URLs in HTML files */
const htmlFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) htmlFiles.push(p);
  }
})(dist);

let stamped = 0;
for (const f of htmlFiles) {
  let html = readFileSync(f, 'utf8');
  const before = html;
  html = html.replaceAll('https://pos.nextoracreations.co.in', siteUrl);
  if (html !== before) {
    writeFileSync(f, html);
    stamped++;
  }
}

/* Summary */
const pages = htmlFiles.length;
const jsAssets = readdirSync(resolve(dist, 'assets')).filter((f) => f.endsWith('.js')).length;
console.log(`\n  Nextora POS website built ✓`);
console.log(`  Origin:      ${siteUrl}`);
console.log(`  Pages:       ${pages}`);
console.log(`  JS chunks:   ${jsAssets}`);
console.log(`  URL-stamped: ${stamped} files\n`);
