/* Android page: real Nextora POS Android screenshots in device frames. */
import { mobileDevice } from '../components/devices.js';
import { bindTrackers } from '../components/analytics.js';

const hero = document.getElementById('ph-hero-phone');
if (hero) {
  hero.innerHTML = mobileDevice({
    eager: true,
    tag: 'Android · Mobile',
    sizes: '(min-width: 900px) 340px, 70vw',
  });
}

const shot = document.getElementById('ph-android-shot');
if (shot) {
  shot.innerHTML = mobileDevice({
    sizes: '(min-width: 900px) 300px, 62vw',
  });
}

bindTrackers();

export default function initAndroidPage() {}
