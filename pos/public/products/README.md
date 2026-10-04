# Nextora POS — product screenshots

This directory holds the **real application screenshots** shown across the site.
Every device on the website renders one of these images — the site never shows
a recreated or redesigned version of the app UI.

## Current screenshots

| File | Native size | Ratio | Used for |
|------|-------------|-------|----------|
| `desktop/dashboard.webp` | 1492 × 886 | 1.684 | Desktop hero, product card, offline story, desktop showcase |
| `desktop/dashboard-900.webp` | 900 × 534 | — | Small-viewport / low-density variant (via `srcset`) |
| `android/dashboard.webp` | 779 × 1600 | 1 : 2.054 | Android hero, product card, android showcase, printing flow |
| `android/dashboard-460.webp` | 460 × 945 | — | Small-viewport / low-density variant (via `srcset`) |

Device frames are built around these native aspect ratios (see `DESKTOP_SHOT` /
`ANDROID_SHOT` in `pos/src/js/components/devices.js`), so nothing is stretched,
squashed or cropped. High-resolution originals are kept in
`pos/assets/screenshots-source/` (not shipped).

## Adding more real screenshots later

1. Export a full-window capture as WebP (quality ~85–90). Do **not** crop
   app content — presentation-level window chrome only.
2. Add it to `public/products/desktop/` or `public/products/android/` with a
   descriptive name (e.g. `desktop/billing.webp`, `android/backup.webp`).
3. Extend the `DESKTOP_SHOT` / `ANDROID_SHOT`-style constants in
   `components/devices.js` (or add a new constant) with `src`, `srcset`,
   native `w × h` and descriptive `alt` text.
4. If the ratio differs from an existing device, add a matching
   `aspect-ratio` in `src/css/style.css` (`.ddesk__viewport` / `.dphone__viewport`)
   or create a new frame variant — never force a screenshot into the wrong ratio.

## Printers — `products/printers/`

Optional photos of supported printer models (your own product photography only).

## Authenticity rule

Anything shown inside a device frame must be a real application screenshot.
Marketing copy may describe features; imagery must not invent screens, data or
interfaces that customers will not see after installing Nextora POS.
