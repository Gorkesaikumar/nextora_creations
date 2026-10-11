/* ============================================================
   Real-product device components.

   The site showcases the ACTUAL Nextora POS applications via
   real screenshots — never a recreated UI. Both device frames
   are built around each screenshot's native aspect ratio, so
   nothing is stretched, squashed or cropped:

     Desktop screenshot: 1620 × 971  (ratio 1.668)
     Android screenshot:  720 × 1600 (ratio 1 : 2.222)

   Replace /products/... screenshots and only these constants
   need to change.
   ============================================================ */

export const DESKTOP_SHOT = {
  src: '/products/desktop/dashboard.webp',
  srcset: '/products/desktop/dashboard-900.webp 900w, /products/desktop/dashboard.webp 1620w',
  w: 1620,
  h: 971,
  ratio: '1620 / 971',
  alt: 'Nextora POS desktop dashboard showing Today’s sales ₹1,54,000, Today’s orders 180, Average order, Cancelled bills, payment breakdown and billing shortcuts',
};

export const ANDROID_SHOT = {
  src: '/products/android/dashboard.webp',
  srcset: '/products/android/dashboard-460.webp 460w, /products/android/dashboard.webp 720w',
  w: 720,
  h: 1600,
  ratio: '720 / 1600',
  alt: 'Nextora POS mobile dashboard showing Sanddeep restaurant, Welcome back Abhijeeth, Today’s sales ₹5,591.25, payment breakdown and bottom navigation',
};

function shotImg(shot, { eager = false, sizes } = {}) {
  const loading = eager
    ? 'decoding="async" fetchpriority="high"'
    : 'loading="lazy" decoding="async"';
  const s = sizes ? ` sizes="${sizes}"` : '';
  return `<img src="${shot.src}" srcset="${shot.srcset}"${s} width="${shot.w}" height="${shot.h}" alt="${shot.alt}" ${loading}>`;
}

/* ---------- Desktop display / laptop-style frame ---------- */
export function desktopDevice({ eager = false, sizes, tag, label } = {}) {
  return `
  <figure class="ddesk"${label ? ` aria-label="${label}"` : ''}>
    <div class="ddesk__screen">
      <div class="ddesk__viewport">${shotImg(DESKTOP_SHOT, { eager, sizes })}</div>
    </div>
    <div class="ddesk__base" aria-hidden="true"></div>
    ${tag ? `<figcaption class="dtag">${tag}</figcaption>` : ''}
  </figure>`;
}

/* ---------- Phone frame ---------- */
export function mobileDevice({ eager = false, sizes, tag, label } = {}) {
  return `
  <figure class="dphone"${label ? ` aria-label="${label}"` : ''}>
    <div class="dphone__screen">
      <div class="dphone__viewport">${shotImg(ANDROID_SHOT, { eager, sizes })}</div>
    </div>
    ${tag ? `<figcaption class="dtag dtag--on-frame">${tag}</figcaption>` : ''}
  </figure>`;
}
