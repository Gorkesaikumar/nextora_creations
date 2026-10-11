/* Shared footer — columns per brand spec, only verified links. */
import { SITE } from '../../data/site.js';

const COLS = [
  {
    h: 'Product',
    links: [
      ['Overview', '/'],
      ['Nextora POS Desktop', '/desktop'],
      ['Nextora POS Mobile', '/android'],
      ['Owner Cloud Analytics', 'https://owner.nextoracreations.co.in'],
      ['Features', '/features'],
      ['Pricing', '/pricing'],
      ['Download', '/download'],
    ],
  },
  {
    h: 'Resources',
    links: [
      ['Support Center', '/support'],
      ['FAQ', '/faq'],
      ['Releases', '/releases'],
      ['How It Works', '/how-it-works'],
    ],
  },
  {
    h: 'Company',
    links: [
      ['Nextora Creations', SITE.companyUrl],
      ['Contact Sales', '/contact'],
    ],
  },
  {
    h: 'Legal',
    links: [
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/terms'],
      ['License Terms', '/license'],
    ],
  },
];

export function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;

  const col = ({ h, links }) => `
    <div>
      <h4>${h}</h4>
      <ul>
        ${links
          .map(([label, href]) =>
            href.startsWith('http')
              ? `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`
              : `<li><a href="${href}">${label}</a></li>`
          )
          .join('')}
      </ul>
    </div>`;

  mount.innerHTML = `
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <img src="/brand/logo.png" srcset="/brand/logo.png 1x, /brand/logo-512.png 2x" alt="Nextora Logo" width="38" height="38">
          <p class="name">Nextora POS</p>
          <p>Restaurant billing that works even offline. ${SITE.companyPos}</p>
        </div>
        ${COLS.map(col).join('')}
      </div>
      <div class="footer__legal">
        <span>© <span data-year>2026</span> ${SITE.company}. Nextora POS is a product of ${SITE.company}.</span>
        <span>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
          &nbsp;·&nbsp;
          <a href="${SITE.phoneHref}">${SITE.phone}</a>
        </span>
      </div>
    </div>
  </footer>`;
}
