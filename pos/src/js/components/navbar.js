/* Shared navigation: sticky bar + accessible mobile overlay menu. */
import { SITE } from '../../data/site.js';

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/desktop', label: 'Desktop' },
  { href: '/android', label: 'Android' },
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/support', label: 'Support' },
];

/* Pages whose hero is dark — nav text starts light until scrolled */
const NIGHT_PATHS = new Set(['/features', '/how-it-works', '/pricing', '/download', '/releases']);

function currentPath() {
  return document.body.dataset.path || '/';
}

function isActive(href) {
  const p = currentPath();
  if (href === '/') return p === '/';
  return p === href || p.startsWith(href + '/');
}

export function renderNavbar() {
  const path = currentPath();
  const night = NIGHT_PATHS.has(path);
  const mount = document.getElementById('site-nav');
  if (!mount) return;

  mount.innerHTML = `
  <header class="nav ${night ? 'nav--night' : ''}" data-nav>
    <div class="container nav__inner">
      <a class="nav__logo" href="/" aria-label="Nextora POS home">
        <img src="/brand/logo.png" alt="" width="34" height="34">
        <span><b>Nextora</b> POS</span>
      </a>
      <nav class="nav__links" aria-label="Primary">
        ${LINKS.map(
          (l) =>
            `<a class="nav__link ${isActive(l.href) ? 'is-active' : ''}" href="${l.href}" ${
              isActive(l.href) ? 'aria-current="page"' : ''
            }>${l.label}</a>`
        ).join('')}
      </nav>
      <div class="nav__cta">
        <a class="btn btn--sm btn--ghost" href="/download">Download</a>
        <a class="btn btn--sm btn--primary" href="/pricing" data-track="hero_get_pos">Get Nextora POS</a>
        <button class="nav__burger" aria-expanded="false" aria-controls="mnav" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
  <div class="mnav" id="mnav" aria-hidden="true">
    ${LINKS.map(
      (l) =>
        `<a href="${l.href}" ${isActive(l.href) ? 'aria-current="page"' : ''}>${l.label}<small>0${LINKS.indexOf(l) + 1}</small></a>`
    ).join('')}
    <a href="/download">Download<small>${String(LINKS.length + 1).padStart(2, '0')}</small></a>
    <a href="/contact">Contact<small>${String(LINKS.length + 2).padStart(2, '0')}</small></a>
    <div class="mnav__foot">
      <a class="btn btn--primary" href="/pricing" data-track="hero_get_pos">Get Nextora POS</a>
      <p class="mnav__meta">${SITE.companyPos} <a href="${SITE.companyUrl}" rel="noopener" style="color:var(--accent-ink)">nextoracreations.co.in</a></p>
    </div>
  </div>`;

  const header = mount.querySelector('[data-nav]');
  const burger = mount.querySelector('.nav__burger');
  const menu = mount.querySelector('#mnav');
  let open = false;
  let lastFocus = null;

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setState = (v) => {
    open = v;
    menu.classList.toggle('is-open', v);
    menu.setAttribute('aria-hidden', String(!v));
    burger.setAttribute('aria-expanded', String(v));
    burger.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('no-scroll', v);
    if (v) {
      lastFocus = document.activeElement;
      menu.querySelector('a').focus();
    } else if (lastFocus) {
      lastFocus.focus();
    }
  };

  burger.addEventListener('click', () => setState(!open));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setState(false)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setState(false);
  });
}
