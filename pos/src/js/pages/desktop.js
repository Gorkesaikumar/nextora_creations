/* Desktop page: real Nextora POS Desktop screenshots in device frames. */
import { desktopDevice } from '../components/devices.js';
import { bindTrackers } from '../components/analytics.js';

const hero = document.getElementById('ph-hero-laptop');
if (hero) {
  hero.innerHTML = desktopDevice({
    eager: true,
    tag: 'Desktop · Windows',
    sizes: '(min-width: 1240px) 940px, (min-width: 900px) 74vw, 92vw',
  });
}

const shot = document.getElementById('ph-desktop-shot');
if (shot) {
  shot.innerHTML = desktopDevice({
    sizes: '(min-width: 900px) 560px, 90vw',
  });
}

const off = document.getElementById('ph-desktop-offline');
if (off) {
  off.innerHTML = desktopDevice({
    sizes: '(min-width: 900px) 560px, 90vw',
  });
}

bindTrackers();

export default function initDesktopPage() {}
