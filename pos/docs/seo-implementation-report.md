# Nextora POS — SEO Audit & Implementation Report

**Site audited:** https://pos.nextoracreations.co.in
**Repository path:** `pos/` (independent Vite multi-page static site deployed via Netlify from `pos/netlify.toml`)
**Date:** 2026-10-14

---

## A. Executive summary

The Nextora POS website was already in materially good SEO health: every public route is
server-rendered static HTML with unique titles, meta descriptions, self-referencing canonicals,
Open Graph/Twitter metadata, a valid sitemap, robots.txt with the sitemap reference, a real 404
page, 301 canonical redirects for URL variants, security + asset-caching headers, GA4 behind an
env-var gate with conversion event tracking, LCP-conscious image delivery (srcset, explicit
dimensions, eager hero, lazy below-fold), and JSON-LD schema.

This engagement **fixed genuine defects and hardened weak points** rather than rebuilding a
healthy site:

**What was wrong (evidence-based):**

1. **Sitemap gaps (P1):** `/support/billing` and `/support/troubleshooting` existed and were
   indexable but were absent from `sitemap.xml`.
2. **Broken breadcrumb URLs in structured data (P1):** the `crumbsLd()` helper built breadcrumb
   item URLs by joining label words with dashes (`🏠 → Support → Billing` produced
   `/support-billing`, a 404). Nested routes like `/support/*` emitted invalid breadcrumb targets.
3. **Structured data shipped only via client JS (P2):** JSON-LD was injected at runtime by
   `src/js/components/seo.js`. Google renders JS, but serving schema inside the static HTML is
   more robust for crawlers, validators, and non-rendering consumers.
4. **JSON-LD was also injected on noindex/utility pages** (`/404`, `/reviewer`) — unnecessary.
5. **Legacy brand in SERP titles (P2):** 9 support pages plus `404.html`, `privacy.html`,
   `terms.html` still carried the discontinued "Nextora Mini POS" name in `<title>`, which is
   what is shown in search results; the site's own metadata map brands everything "Nextora POS".
6. **Missing canonical on `/license` (P2):** the only indexable page without a static canonical.
7. **Homepage title/description (P2):** brand-first title replaced with the keyword-first
   recommended default; description now includes "request a demo" CTA language and the KOT /
   inventory / thermal-printing keyword themes.
8. **No automated SEO regression tests (P2):** nothing validated sitemap coverage, canonical
   correctness, metadata uniqueness, JSON-LD validity, or internal links after a build.

**Highest-priority remaining issues:** the legacy "Nextora Mini POS" wording throughout
*body copy* of support/legal pages (left untouched deliberately — legal/product-copy edits need
editorial review), the WhatsApp URL being env-configured but rendered nowhere, and all external
Google Search Console actions (manual checklist below).

---

## B. Change log

| File | Change | Reason | Verification |
|---|---|---|---|
| `pos/public/sitemap.xml` | Added `/support/billing`, `/support/troubleshooting` URLs | Pages exist & indexable but were missing from sitemap | test-seo: sitemap coverage check (560 checks pass) |
| `pos/pages/index.html` | Title → `Restaurant Billing Software & POS System | Nextora POS`; description/OG/Twitter updated | Master-prompt recommended keyword-first defaults; adds demo CTA | Build + test-seo uniqueness checks |
| `pos/pages/support/*.html` (9 files) | `<title>` "… \| Nextora Mini POS Support" → "… \| Nextora POS Support" | Legacy brand removed from SERP titles; consistency with site metadata map | grep of all `<title>` after change; uniqueness enforced by test |
| `pos/pages/404.html` | Title "Page not found \| Nextora Mini POS" → "… \| Nextora POS" | Legacy brand in title (P3) | grep |
| `pos/pages/privacy.html`, `pos/pages/terms.html` | `<title>` legacy brand → "Nextora POS" | seo.js already served these titles at runtime; static now matches | test-seo title metadata |
| `pos/pages/license.html` | Added `<link rel="canonical">` | Only indexable page missing a static canonical | test-seo canonical check |
| `pos/src/js/components/seo.js` | (1) Homepage title/description synced with new static head; (2) breadcrumb builder uses real route paths; (3) `NO_LD` set skips JSON-LD on `/privacy`, `/terms`, `/license`, `/404`, `/reviewer`; (4) JSON-LD injection skipped when a static build-stamped script is already present (no duplication at runtime) | Preserve dev-mode fallback; kill invalid breadcrumb URLs; avoid duplicate/conflicting schema | Build + test-seo; JS still injects schema in dev (vite dev), skips in prod |
| `pos/scripts/build-meta.mjs` | Post-build step now **bakes a static `<script type="application/ld+json">` block** (Organization + WebSite + 2× SoftwareApplication + FAQPage on `/` and `/faq` + BreadcrumbList on inner pages) into 20 built HTML pages; skips legal/utility pages; URL-stamped for `VITE_SITE_URL` | Static, crawler-robust structured data with no runtime duplication | Build log: "JSON-LD: baked statically in 20 pages"; JSON.parse verified by test |
| `pos/scripts/test-seo.mjs` (new) | SEO validation harness over `dist/`: title/description presence & uniqueness, canonical self-reference, sitemap coverage both directions, robots.txt policy, JSON-LD parse + node-type + breadcrumb-target validation, internal-link resolution (incl. assets on disk) | Automate regression protection | Executed: **560 checks passed, 0 failed**, exit code 0 |
| `pos/package.json` | Added `"test": "npm run build && node scripts/test-seo.mjs"` and `"test:seo"` | Wire the harness into the project's test workflow | `npm run build && node scripts/test-seo.mjs` → pass |

**Deliberately NOT changed:** body-copy mentions of "Nextora Mini POS" in support/legal/contact
pages, all CSS, all JS page modules, navbar/footer, design, routes, Netlify redirects/headers,
analytics config, image assets.

---

## C. SEO audit comparison

| Area | Before | After | Evidence |
|---|---|---|---|
| Indexability | All 23 indexable pages crawlable; no accidental noindex; reviewer/404 correctly noindex; SPA fallback returns 404 register (not homepage) | Unchanged (already correct) | `netlify.toml` fallback → `/404.html` status 404; noindex meta on reviewer/404; test-seo noindex check |
| Metadata | Unique titles/descriptions per page ✓, but 11 pages carried legacy "Nextora Mini POS" brand in title; license.html lacked static canonical; homepage title brand-first | 0 legacy titles among 25 pages; canonical on every indexable page; keyword-first homepage title | grep before/after; test-seo uniqueness + canonical checks |
| Sitemap | 21 URLs, missing 2 live support pages | 23 URLs, full coverage of indexable routes, no invented routes | test-seo both-direction coverage check |
| Performance | Real screenshots via `srcset`, explicit width/height, `fetchpriority=high` + eager hero, lazy below-fold; 58% image savings at build (~292 kB) | Unchanged (already correct) | Build log image-optimizer output; `src/js/components/devices.js` |
| Structured data | JS-only injection; invalid breadcrumb URLs on nested pages; schema also emitted on noindex/404 pages; FAQPage missing from static HTML | Static JSON-LD baked into 20 pages at build; correct breadcrumb URLs; FAQPage present on home + /faq; no runtime duplication; none on legal/utility pages | Baked types verified in `dist/index.html` (FAQPage ×1, Organization, WebSite, 2× SoftwareApplication, 9 Questions); breadcrumb `item` URLs are real routes |
| Conversion tracking | GA4 behind `VITE_GA_MEASUREMENT_ID`; auto-tracked `data-track` click events (pricing CTAs, contact CTAs); form submit fires `request_demo` / `contact_sales` on successful submission (not on click) | Unchanged | `src/js/components/analytics.js`, `src/js/pages/contact.js` |
| Internal links | All internal hrefs resolve to built pages or existing assets | Now regression-protected by test | test-seo: every `href="/…"` verified against dist (500+ link checks) |

**Measured vs code-level:** The only *executed measurements* in this engagement are the
production build (success, 25 pages, 9 JS chunks, ~58% image-byte savings at build time) and the
SEO test suite (560/560). **No Lighthouse/PageSpeed/CDP scores were measured** in this session —
no claims are made about current Core Web Vitals. No **indexing status** claims: Google
Search Console actions are external and listed in section E.

---

## D. Testing report

- **Production build:** `npm run build` (vite build + build-meta post-build) — success, exit 0.
  Output: 25 HTML pages (flattened to `dist/` root), 9 JS chunks, optimized brand/OG images.
- **SEO validation suite (new):** `npm run build && node scripts/test-seo.mjs` — success,
  exit 0. Executed checks: **560 passed / 0 failed**, covering:
  - titles/descriptions present, sane length, unique across 23 indexable pages;
  - canonical present, absolute HTTPS, matches route (incl. fixed `/license`);
  - sitemap: prolog/urlset, absolute URLs, full forward+reverse coverage, no noindex/404 pages;
  - robots.txt: UA allow-all, sitemap reference, assets not blocked;
  - JSON-LD: parses, expected types, breadcrumb targets exist as built pages;
  - internal links: every page-relative href resolves to a built page or a dist asset;
  - homepage & /faq carry FAQPage schema.
- **Routes checked:** all 21 sitemap routes + `/releases`, `/reviewer`, `/404`.
- **Sitemap XML validity:** structural checks passed (prolog, urlset, `<loc>` well-formedness,
  count = built indexable pages). Full XSD validation was **not** run (no XSD tooling in repo) —
  noted as a limitation; the sitemaps.org urlset structure matches the schema namespace.
- **Untested areas:** end-to-end contact form POST to the Apps Script endpoint (live
  submission intentionally not triggered), Playwright browser tests (the repo's Playwright
  config targets the *main* Nextora Creations site, not `pos/`; extending it was out of scope
  for this pass), Rich Results Test / URL inspection (external Google tools).

---

## E. Manual Google setup checklist (external actions requiring human access)

1. **Domain property in Search Console:** create a **Domain property** for
   `nextoracreations.co.in` so `pos.` and `owner.` subdomains are covered in one property, or a
   URL-prefix property for `https://pos.nextoracreations.co.in`. Domain verification via DNS
   **TXT** record (Google gives the token; add it at the domain's DNS host; TTL/propagation may
   take up to a day).
2. **Submit the sitemap:** Search Console → Sitemaps → enter
   `https://pos.nextoracreations.co.in/sitemap.xml`.
3. **URL Inspection** on the priority URLs (request indexing after verifying 200 + canonical):
   `/`, `/desktop`, `/android`, `/pricing`, `/download`, `/features`, `/how-it-works`,
   `/support`, `/faq`, `/contact` — then the support detail pages.
4. **GA4:** set `VITE_GA_MEASUREMENT_ID` in the POS site's Netlify UI (this is already coded to
   load only when set). Link GA4 ↔ Search Console in Analytics Admin if desired.
5. **Rich Results Test / Schema validator:** test `/` and `/faq` (FAQPage, Organization,
   SoftwareApplication) and one nested page (BreadcrumbList) — browser-run external tool.
6. **Google Business Profile** (already configured — do not duplicate):
   - confirm category (e.g. "Software company" — keep it truthful to the offering),
   - check that the website link points at this POS site and the WhatsApp/chat link actually
     connects (the verified number is `917674981970`),
   - add genuine product photos/screenshots (the repo has real desktop/mobile screenshots),
   - request honest reviews from actual customers — never fabricate or incentivize,
   - reply to reviews, watch Q&A, monitor insights monthly.

---

## F. Remaining risks

1. **Legacy "Nextora Mini POS" body copy** on contact, privacy, terms, license and support
   pages. Titles are fixed; body rebranding is an editorial decision (legal copy especially).
   Until then, Google may show mixed brand references in snippets.
2. **No live PageSpeed/Lighthouse measurements taken in this session.** The site's static
   multi-page architecture and image handling are strong on paper, but the **ffee/final CWV
   status is unverified** — run PageSpeed Insights on `/` and `/desktop` before claiming scores.
3. **WhatsApp:** `VITE_WHATSAPP_URL` is supported in config (`pos/src/data/site.js`) and
   documented in `.env.example` with the verified number, but no component currently renders a
   WhatsApp CTA. Adding one is a product decision (conversion upside, but user requested only
   to check the existing links).
4. **Tracking IDs are unset unless configured** in Netlify: `VITE_GA_MEASUREMENT_ID`,
   `VITE_GOOGLE_PLAY_URL`, `VITE_WINDOWS_DOWNLOAD_URL`, `VITE_WHATSAPP_URL`. Without them the
   Play/Autodesk download CTAs hide (by design — no fabricated links) and analytics stays off.
5. **Structured data does not guarantee rich results** (Google's choice). `priceValidUntil`
   in SoftwareApplication offers is set to 2027-12-31 — revisit when pricing changes.
6. **No Playwright browser automation for pos/** — interactive/contact-flow tests remain manual.

---

## G. Next 30-day plan

| Week | Actions |
|---|---|
| 1 | Complete Search Console (domain property + TXT verification), submit sitemap, request indexing for the 10 priority URLs. Run PageSpeed Insights on `/`, `/desktop`, `/android`, `/pricing` and record baselines (LCP, INP, CLS). Set `VITE_GA_MEASUREMENT_ID` in Netlify so event data starts accumulating. |
| 2 | Editorial review of legacy "Mini POS" body copy (contact + support pages first; legal pages with counsel). Decide on adding a WhatsApp CTA wired to `whatsappUrl`. Verify GBP: category, links, upload 3–5 genuine screenshots. |
| 3 | First Search Console data review: impressions/CTR for the keyword themes (restaurant billing software, POS software India, offline POS, KOT software, inventory, thermal printer billing, pricing). Fix any crawl/index anomalies. Ask 2–3 real customers for honest GBP reviews. Relevant backlinks: product directories (e.g. POS/restaurant-software listings), local business/community listing, partner/vendor pages — all truthful, no paid link schemes. |
| 4 | Begin content roadmap (one article, edited & accurate — do not bulk-publish AI drafts): "Offline POS vs Cloud POS for Small Restaurants" or "What Is KOT Software and How Does It Work?" (support/ features-adjacent pages already serve some of this intent — check before writing). Review GA4 events vs actual leads (demo requests, pricing clicks). Re-run the SEO suite after any new pages are added so sitemap coverage stays green. |

**Keep the harness green:** every new public page must be added to `pos/public/sitemap.xml` and
will be validated automatically by `npm test`.
