/* ============================================================
   Real-product device components.

   The site showcases the ACTUAL Nextora POS applications via
   real screenshots — never a recreated UI. Both device frames
   are built around each screenshot's native aspect ratio, so
   nothing is stretched, squashed or cropped:

     Desktop screenshot: 1492 × 886  (ratio 1.684)
     Android screenshot:  779 × 1600 (ratio 1 : 2.054)

   Replace /products/... screenshots and only these constants
   need to change.
   ============================================================ */

export const DESKTOP_SHOT = {
  src: '/products/desktop/dashboard.webp',
  srcset: '/products/desktop/dashboard-900.webp 900w, /products/desktop/dashboard.webp 1492w',
  w: 1492,
  h: 886,
  ratio: '1492 / 886',
  alt: 'Nextora Mini POS Windows dashboard showing Today’s sales, Today’s orders, Average order, Cancelled bills, payment breakdown and billing shortcuts',
};

export const ANDROID_SHOT = {
  src: '/products/android/dashboard.webp',
  srcset: '/products/android/dashboard-460.webp 460w, /products/android/dashboard.webp 779w',
  w: 779,
  h: 1600,
  ratio: '779 / 1600',
  alt: 'Nextora Mini POS Android dashboard showing Nextora Cafe, License Active, welcome header, sales summary, payment breakdown and bottom navigation',
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
