/* Analytics: GA4 (company property) + named event helper. No invasive tracking. */
import { SITE } from '../../data/site.js';

const MEASUREMENT_ID = SITE.analyticsId;
let gtag = null;
let loaded = false;

export function initAnalytics() {
  if (loaded || !MEASUREMENT_ID) return;
  loaded = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    // Subdomain-scoped config; cross-domain visits to the main site stay intact.
    cookie_domain: 'nextoracreations.co.in',
    send_page_view: true,
  });
  gtag = window.gtag;
}

/** Named conversion events — call track('hero_get_pos') etc. */
export function track(name, params = {}) {
  if (window.gtag) {
    window.gtag('event', name, params);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
  }
}

/* Auto-track declared conversion actions via data-track="event_name". */
export function bindTrackers() {
  document.querySelectorAll('[data-track]').forEach((n) => {
    n.addEventListener('click', () => track(n.dataset.track), { passive: true });
  });
}
