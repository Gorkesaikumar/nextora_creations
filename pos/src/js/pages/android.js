/* Android page: real Nextora Mini POS Android screenshots + Google Play state */
import { mobileDevice } from '../components/devices.js';
import { bindTrackers } from '../components/analytics.js';
import { SITE } from '../../data/site.js';
import { ICONS } from '../icons.js';

const hero = document.getElementById('ph-hero-phone');
if (hero) {
  hero.innerHTML = mobileDevice({
    eager: true,
    tag: 'Nextora Mini POS · Android',
    sizes: '(min-width: 900px) 340px, 70vw',
  });
}

const shot = document.getElementById('ph-android-shot');
if (shot) {
  shot.innerHTML = mobileDevice({
    sizes: '(min-width: 900px) 300px, 62vw',
  });
}

function renderPlayCta(containerId, isNight = false) {
  const c = document.getElementById(containerId);
  if (!c) return;

  if (SITE.googlePlayUrl) {
    c.innerHTML = `
      <a class="btn ${isNight ? 'btn--night' : 'btn--primary'}" href="${SITE.googlePlayUrl}" target="_blank" rel="noopener noreferrer" data-track="download_android">
        <i data-icon="playstore"></i> Get it on Google Play
      </a>
      <a class="btn ${isNight ? 'btn--ghost-night' : 'btn--ghost'}" href="/pricing" data-track="pricing_view">Request Pricing</a>
    `;
  } else {
    c.innerHTML = `
      <span class="badge ${isNight ? 'badge--outline' : 'badge--accent'}" style="font-size:0.92rem;padding:10px 18px;display:inline-flex;align-items:center;gap:8px">
        <i data-icon="playstore"></i> Coming Soon on Google Play
      </span>
      <a class="btn ${isNight ? 'btn--night' : 'btn--primary'}" href="/download" data-track="hero_get_pos">Download Options</a>
      <a class="btn ${isNight ? 'btn--ghost-night' : 'btn--ghost'}" href="/pricing" data-track="pricing_view">Request Pricing</a>
    `;
  }

  c.querySelectorAll('i[data-icon]').forEach((n) => {
    const name = n.dataset.icon;
    if (ICONS[name]) n.outerHTML = ICONS[name];
  });
}

renderPlayCta('ph-android-play-cta', false);
renderPlayCta('ph-android-play-cta-bottom', true);

bindTrackers();

export default function initAndroidPage() {}
