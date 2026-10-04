/* Nextora POS site bootstrap — shared across all pages. */
import { injectSEO } from './components/seo.js';
import { initAnalytics } from './components/analytics.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { initReveal } from './components/reveal.js';
import { ICONS } from './icons.js';

injectSEO();
initAnalytics();
renderNavbar();
renderFooter();

/* Page modules — body[data-page] selects the enhancer. */
const PAGE_MODULES = {
  home: () => import('./pages/home.js'),
  desktop: () => import('./pages/desktop.js'),
  android: () => import('./pages/android.js'),
  pricing: () => import('./pages/pricing.js'),
  download: () => import('./pages/download.js'),
  releases: () => import('./pages/download.js'),
  support: () => import('./pages/support.js'),
  faq: () => import('./pages/support.js'),
  contact: () => import('./pages/contact.js'),
};

/* Icon-fill: replaces <i data-icon="name"></i> placeholders with inline SVG. */
const ICON_NAMES = Object.keys(ICONS);
document.querySelectorAll('i[data-icon]').forEach((n) => {
  const name = n.dataset.icon;
  if (ICONS[name]) n.outerHTML = ICONS[name];
});

const page = document.body.dataset.page;
if (page && PAGE_MODULES[page]) {
  PAGE_MODULES[page]().then((m) => m.default && m.default());
}

initReveal();
