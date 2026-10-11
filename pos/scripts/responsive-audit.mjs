/* Responsive overflow audit for the Nextora POS website build in dist/.
   Checks horizontal overflow + oversized elements on every public page
   at the widths required by the brief. Run: node pos/scripts/responsive-audit.mjs */
import { chromium } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

const pages = readdirSync(dist).filter((f) => f.endsWith('.html')).map((f) => '/' + f);

const VIEWPORTS = [
  [320, 640],
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
];

const browser = await chromium.launch();
let failures = 0;

for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const bad = [];
  for (const p of pages) {
    await page.goto('http://localhost:4173' + p, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(250);
    const res = await page.evaluate(() => {
      const vw = window.innerWidth;
      const overflow = document.documentElement.scrollWidth - vw;
      const offenders = [];
      if (overflow > 1) {
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width && (r.right > vw + 1 || r.left < -1)) {
            offenders.push(
              `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')}` +
                ` (right=${Math.round(r.right)}, left=${Math.round(r.left)})`
            );
          }
        });
      }
      const badImgs = [];
      document.querySelectorAll('img').forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.width && (r.right > vw + 1 || r.left < -1)) badImgs.push(img.currentSrc || img.src);
      });
      return { overflow, offenders: offenders.slice(0, 4), badImgs: badImgs.slice(0, 3) };
    });
    if (res.overflow > 1 || res.badImgs.length || errors.length) {
      bad.push({ page: p, ...res });
    }
  }
  if (bad.length) {
    failures++;
    console.log(`✗ ${w}×${h}`);
    for (const b of bad) console.log(`   ${b.page}: overflow=${b.overflow}px offenders=${JSON.stringify(b.offenders)} badImgs=${JSON.stringify(b.badImgs)} pageErrors=${errors.length ? errors.slice(0, 2) : ''}`);
  } else {
    console.log(`✓ ${w}×${h} — all ${pages.length} pages clean`);
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? `AUDIT FINISHED: ${failures} viewport(s) with issues` : 'AUDIT FINISHED: all viewports clean');
process.exit(failures ? 1 : 0);
