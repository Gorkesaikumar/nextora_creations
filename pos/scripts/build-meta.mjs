/* Post-build: stamp the deploy origin into sitemap/robots and summarize output.
   The origin comes from VITE_SITE_URL (set in Netlify UI) or the default. */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, DESKTOP, ANDROID, FAQS, RELEASES } from '../src/data/site.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const siteUrl = (process.env.VITE_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://pos.nextoracreations.co.in').replace(/\/$/, '');
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

/* -----------------------------------------------------------------
   Static JSON-LD baking.
   Mirrors src/js/components/seo.js so structured data ships inside the
   served HTML (no JS render required) for crawlers and validators.
   The client injector skips JSON-LD when a static script is present.
   Legal/utility pages intentionally receive none (mirrors seo.js). */
const orgLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE.companyUrl}/#organization`,
  name: SITE.company,
  url: SITE.companyUrl,
  logo: `${SITE.companyUrl}/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: SITE.phone.replace(/\s/g, ''),
    email: SITE.email,
    contactType: 'customer support',
    availableLanguage: 'English',
  },
});

const webSiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  name: SITE.name,
  url: SITE.url,
  publisher: { '@id': `${SITE.companyUrl}/#organization` },
});

const appLd = () => [
  {
    '@type': 'SoftwareApplication',
    name: 'Nextora POS Desktop',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Windows 10, Windows 11',
    description: DESKTOP.summary,
    softwareVersion: RELEASES.desktop.version || undefined,
    offers: {
      '@type': 'Offer',
      price: '7999',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2027-12-31',
    },
    publisher: { '@id': `${SITE.companyUrl}/#organization` },
    url: `${SITE.url}/desktop`,
  },
  {
    '@type': 'SoftwareApplication',
    name: 'Nextora POS Mobile',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Android 8.0 and above',
    description: ANDROID.summary,
    softwareVersion: RELEASES.android.version || undefined,
    offers: {
      '@type': 'Offer',
      price: '5999',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2027-12-31',
    },
    publisher: { '@id': `${SITE.companyUrl}/#organization` },
    url: `${SITE.url}/android`,
  },
];

const faqLd = () => ({
  '@type': 'FAQPage',
  '@id': `${SITE.url}/#faq`,
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

const crumbsLd = (parts, labels) => ({
  '@type': 'BreadcrumbList',
  itemListElement: labels.map((name, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: SITE.url + (i === 0 ? '/' : '/' + parts.slice(0, i).join('/')),
  })),
});

/* Pages that get no structured data (mirrors seo.js NO_LD). */
const NO_LD_PAGES = new Set(['404.html', 'reviewer.html', 'privacy.html', 'terms.html', 'license.html']);

function jsonLdFor(relPath) {
  let parts = relPath.replace(/\\/g, '/').replace(/\.html$/, '').split('/').filter(Boolean);
  if (parts.length === 1 && parts[0] === 'index') parts = []; /* dist root = '/' */
  const path = parts.length ? '/' + parts.join('/') : '/';
  if (NO_LD_PAGES.has(parts.length ? parts.join('/') : 'index')) return null;
  const ld = [orgLd(), webSiteLd(), ...appLd()];
  if (path === '/' || path === '/faq') ld.push(faqLd());
  if (path !== '/') {
    const labels = ['Nextora POS', ...parts.map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))];
    ld.push(crumbsLd(parts, labels));
  }
  return ld;
}

let ldBaked = 0;

function bakeJsonLd(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      bakeJsonLd(p);
      continue;
    }
    if (!f.endsWith('.html')) continue;
    const relPath = relative(dist, p);
    if (NO_LD_PAGES.has(relPath.replace(/\\/g, '/'))) continue;
    const ld = jsonLdFor(relPath);
    if (!ld) continue;
    let html = readFileSync(p, 'utf8');
    if (html.includes('type="application/ld+json"')) continue;
    if (!html.includes('</head>')) continue;
    const tag = `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;
    html = html.replace('</head>', `${tag}</head>`);
    writeFileSync(p, html);
    ldBaked++;
  }
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

bakeJsonLd(dist);

/* Summary */
const pages = htmlFiles.length;
const jsAssets = readdirSync(resolve(dist, 'assets')).filter((f) => f.endsWith('.js')).length;
console.log(`\n  Nextora POS website built ✓`);
console.log(`  Origin:      ${siteUrl}`);
console.log(`  Pages:       ${pages}`);
console.log(`  JS chunks:   ${jsAssets}`);
console.log(`  URL-stamped: ${stamped} files`);
console.log(`  JSON-LD:     baked statically in ${ldBaked} pages\n`);
