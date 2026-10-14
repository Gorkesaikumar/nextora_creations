/* test-seo.mjs — SEO validation over the BUILD OUTPUT (pos/dist).
   Run after `npm run build` (it is part of `npm test`):
     node scripts/test-seo.mjs
   Validates, without any external dependencies:
     - Titles & meta descriptions exist and are unique across indexable pages
     - Canonical tags are present, absolute, and self-referencing the real path
     - Sitemap coverage: every indexable canonical page is listed; noindex/404
       pages are excluded; URLs are absolute HTTPS; XML well-formed
     - robots.txt allows crawlers and references the live sitemap URL
     - JSON-LD blocks parse as JSON and carry expected node types
     - Internal links resolve to built pages (no broken internal links)
   Exit code 0 = all checks passed; 1 = failures (printed with details). */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const dist = resolve(root, 'dist');

const failures = [];
const checks = { passed: 0, failed: 0 };
function ok(cond, label, detail = '') {
  if (cond) {
    checks.passed++;
  } else {
    checks.failed++;
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
  }
}

if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const SITE_URL = (process.env.VITE_SITE_URL || 'https://pos.nextoracreations.co.in').replace(/\/$/, '');

/* ---------- collect built HTML pages ---------- */
const pages = new Map(); // relPath ('index.html', 'support/billing.html') -> html string
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.set(relative(dist, p).replace(/\\/g, '/'), readFileSync(p, 'utf8'));
  }
})(dist);

const siteUrlOf = (rel) => (rel === 'index.html' ? `${SITE_URL}/` : `${SITE_URL}/${rel.replace(/\.html$/, '')}`);
const titleOf = (html) => html.match(/<title>([\s\S]*?)<\/title>/)?.[1].replace(/&amp;/g, '&');
const descOf = (html) => html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1]?.replace(/&amp;/g, '&');
const canonicalOf = (html) => html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)?.[1];

const NOINDEX_PAGES = new Set(['404.html', 'reviewer.html']);
const LEGAL_PAGES = new Set(['privacy.html', 'terms.html', 'license.html']);
const INDEXABLE = [...pages.keys()].filter((p) => !NOINDEX_PAGES.has(p));

/* HTML unescape for title comparison only (basic entities used in titles) */
const unesc = (s) => (s || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/* ---------- metadata per page ---------- */
const titles = new Map();
for (const rel of INDEXABLE) {
  const html = pages.get(rel);
  const title = titleOf(html);
  const desc = descOf(html);
  const canonical = canonicalOf(html);
  const want = siteUrlOf(rel);

  ok(title, `title present on /${rel.replace(/\.html$/, '')}`);
  ok(desc, `meta description present on /${rel.replace(/\.html$/, '')}`);
  ok((desc || '').length >= 40 && (desc || '').length <= 200, `meta description length sane on /${rel.replace(/\.html$/, '')}`, `len=${(desc || '').length}`);
  ok(canonical === want, `canonical matches route on /${rel.replace(/\.html$/, '')}`, `got=${canonical} want=${want}`);
  ok(canonical?.startsWith('https://'), `canonical is https on /${rel.replace(/\.html$/, '')}`);
  titles.set(rel, unesc(title));

  ok(!/noindex/i.test(html.match(/<meta\s+name="robots"[^>]*>/)?.[0] || ''), `indexable page not noindex on /${rel.replace(/\.html$/, '')}`);

  /* JSON-LD: baked at build time for all indexable pages except legal
     pages (mirrors seo.js policy); every block present must parse. */
  const ldBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!LEGAL_PAGES.has(rel)) {
    ok(ldBlocks.length >= 1, `JSON-LD baked on /${rel.replace(/\.html$/, '')}`);
  }
  for (const m of ldBlocks) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      ok(false, `JSON-LD parses on /${rel.replace(/\.html$/, '')}`, e.message);
      continue;
    }
    ok(true, `JSON-LD parses on /${rel.replace(/\.html$/, '')}`);
    const types = (Array.isArray(parsed) ? parsed : [parsed]).map((n) => n['@type']);
    ok(types.includes('Organization'), `Organization schema on /${rel.replace(/\.html$/, '')}`);
    ok(types.includes('WebSite'), `WebSite schema on /${rel.replace(/\.html$/, '')}`);
    ok(types.includes('SoftwareApplication'), `SoftwareApplication schema on /${rel.replace(/\.html$/, '')}`);
    const fb = (Array.isArray(parsed) ? parsed : [parsed]).find((n) => n['@type'] === 'BreadcrumbList');
    if (fb && rel !== 'index.html') {
      /* Every breadcrumb item URL except home must resolve to a built page */
      const items = fb.itemListElement || [];
      for (const it of items.slice(1)) {
        const target = it.item?.replace(/^https?:\/\/[^/]+/, '');
        const file = (target === '/' ? 'index.html' : target.replace(/^\//, '') + '.html');
        ok(pages.has(file), `breadcrumb target exists for /${rel.replace(/\.html$/, '')}`, `${target} → ${file}`);
      }
    }
  }
}

/* Uniqueness of titles */
{
  const seen = new Map();
  for (const [rel, t] of titles) {
    if (seen.has(t)) ok(false, 'titles unique across indexable pages', `${rel} duplicates ${seen.get(t)}: ${t}`);
    else seen.set(t, rel);
  }
  ok(seen.size === titles.size, 'titles unique across indexable pages', `${seen.size}/${titles.size}`);
}
/* Uniqueness of descriptions */
{
  const seen = new Map();
  for (const rel of INDEXABLE) {
    const d = descOf(pages.get(rel));
    if (seen.has(d)) ok(false, 'descriptions unique across indexable pages', `${rel} duplicates ${seen.get(d)}`);
    else seen.set(d, rel);
  }
  ok(seen.size === INDEXABLE.length, 'descriptions unique across indexable pages', `${seen.size}/${INDEXABLE.length}`);
}

/* FAQ page carries FAQPage schema */
ok(/"@type":\s*"FAQPage"/.test(pages.get('faq.html')), 'FAQPage schema on /faq');
if (pages.has('index.html')) ok(/"@type":\s*"FAQPage"/.test(pages.get('index.html')), 'FAQPage schema on / (homepage FAQ)');

/* ---------- sitemap ---------- */
{
  const smPath = resolve(dist, 'sitemap.xml');
  ok(existsSync(smPath), 'sitemap.xml exists in dist');
  const sm = existsSync(smPath) ? readFileSync(smPath, 'utf8') : '';
  ok(sm.startsWith('<?xml'), 'sitemap.xml prolog present');
  ok(sm.includes('<urlset'), 'sitemap urlset element present');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  ok(locs.length > 0, 'sitemap has URLs', `count=${locs.length}`);
  ok(locs.every((l) => l.startsWith('https://') && l.includes('/')), 'sitemap URLs absolute https');

  /* Coverage: each canonical indexable page present */
  for (const rel of INDEXABLE) {
    ok(locs.includes(siteUrlOf(rel)), `sitemap lists /${rel.replace(/\.html$/, '')}`);
  }
  /* Every sitemap URL corresponds to a built indexable page */
  for (const l of locs) {
    const route = l.replace(SITE_URL, '').replace(/^\//, '');
    const file = route === '' ? 'index.html' : `${route}.html`;
    ok(pages.has(file) && !NOINDEX_PAGES.has(file), `sitemap URL matches built page: ${l}`, file);
  }
  }

/* ---------- robots.txt ---------- */
{
  const rbPath = resolve(dist, 'robots.txt');
  ok(existsSync(rbPath), 'robots.txt exists in dist');
  const rb = existsSync(rbPath) ? readFileSync(rbPath, 'utf8') : '';
  ok(/user-agent:\s*\*/i.test(rb), 'robots.txt allows user-agent *');
  ok(rb.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), 'robots.txt references sitemap URL');
  ok(!/disallow:\s*\/(assets|fonts|css|js)/i.test(rb), 'robots.txt does not block assets');
}

/* ---------- internal links resolve ---------- */
{
  const routeToFile = (href) => {
    const clean = href.split('#')[0].split('?')[0];
    if (clean === '' || clean === '/') return 'index.html';
    if (clean.startsWith('http')) return null;
    const route = clean.replace(/^\//, '');
    const asPage = route.endsWith('.html') ? route : `${route}.html`;
    /* Asset hrefs (favicon, fonts, css, js, images, manifest, robots) are
       valid when the file exists in dist; pages must exist as built pages. */
    if (existsSync(resolve(dist, route))) return null;
    return asPage;
  };
  let checked = 0;
  for (const [rel, html] of pages) {
    const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      const file = routeToFile(href);
      checked++;
      ok(file === null || pages.has(file), `internal link resolves: /${rel} → ${href}`,
        pages.has(file || '') ? '' : 'missing page');
    }
  }  ok(checked > 50, 'internal links checked in volume', `count=${checked}`);
}

/* ---------- report ---------- */
console.log(`\n  Nextora POS SEO validation`);
console.log(`  Pages indexed : ${INDEXABLE.length}`);
console.log(`  Checks passed : ${checks.passed}`);
console.log(`  Checks failed : ${checks.failed}\n`);
if (failures.length) {
  for (const f of failures.slice(0, 60)) console.log(`  ✗ ${f}`);
  if (failures.length > 60) console.log(`  … and ${failures.length - 60} more`);
  console.log();
  process.exit(1);
}
console.log(`  All SEO checks passed ✓\n`);
