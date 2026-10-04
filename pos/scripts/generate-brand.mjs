/* Regenerates brand assets in the Nextora POS green system (sampled from the apps).
   Run from pos/:  node scripts/generate-brand.mjs   (sharp resolves from repo root) */
import sharp from 'sharp';

const GREEN_DEEP = '#15382e'; // app sidebar forest green
const GREEN_LINE = '#2c5243';
const GREEN_PALE = '#e9f0df';
const NIGHT = '#0c1310';

/* Geometric "N" — pure path, no font dependency. */
const N_PATH = 'M42 92 V36 L86 92 V36';

function markSvg(size, radius) {
  const r = Math.round(radius);
  const stroke = Math.round(size * 0.105);
  const path = `M${size * 0.328} ${size * 0.72} V${size * 0.28} L${size * 0.672} ${size * 0.72} V${size * 0.28}`;
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${r}" fill="${GREEN_DEEP}"/>
      <path d="${path}" fill="none" stroke="${GREEN_PALE}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  );
}

async function mark(file, size, radius) {
  await sharp(markSvg(size, radius)).png().toFile(file);
  console.log('wrote', file, size + 'x' + size);
}

/* ---------- App marks ---------- */
await mark('public/brand/favicon.png', 64, 14);
await mark('public/brand/logo.png', 128, 28);
await mark('public/brand/logo-512.png', 512, 112);
await mark('public/brand/apple-touch-icon.png', 180, 40);

/* ---------- OG cover: real desktop screenshot on a green stage ---------- */
const W = 1200;
const H = 630;
const shotW = 920;
const shotH = Math.round((shotW / 1492) * 886); // keep native ratio → 546

const shotBuf = await sharp('public/products/desktop/dashboard.webp')
  .resize({ width: shotW })
  .toBuffer();
const mask = Buffer.from(
  `<svg width="${shotW}" height="${shotH}"><rect width="${shotW}" height="${shotH}" rx="22" fill="#fff"/></svg>`
);
const shotRounded = await sharp(shotBuf)
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const canvas = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="24%" cy="18%" r="85%">
        <stop offset="0%" stop-color="#1d4a38" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${NIGHT}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${NIGHT}"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <g transform="translate(72,62)">
      <rect width="96" height="96" rx="22" fill="${GREEN_DEEP}" stroke="${GREEN_LINE}" stroke-width="1.5"/>
      <path d="M30 64 V30 L66 64 V30" fill="none" stroke="${GREEN_PALE}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="72" y="200" width="7" height="46" rx="3.5" fill="#7ea892"/>
    <rect x="94" y="206" width="120" height="9" rx="4.5" fill="${GREEN_LINE}"/>
    <rect x="94" y="228" width="78" height="9" rx="4.5" fill="#1d3327"/>
    <rect x="72" y="540" width="92" height="7" rx="3.5" fill="#1d3327"/>
  </svg>`
);

await sharp(canvas)
  .composite([{ input: shotRounded, left: W - shotW - 56, top: Math.round((H - shotH) / 2) }])
  .png()
  .toFile('public/brand/og-cover.png');
console.log('wrote public/brand/og-cover.png', W + 'x' + H);
