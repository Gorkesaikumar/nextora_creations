/* Homepage: real-product device compositions + interactive demos (offline, billing flow, printing).
   Every device below renders an actual Nextora POS screenshot — no recreated UI. */
import { desktopDevice, mobileDevice } from '../components/devices.js';
import { bindTrackers } from '../components/analytics.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function mount(id, html) {
  const n = document.getElementById(id);
  if (n) n.innerHTML = html;
}

/* ---------- Hero: desktop dominant, phone overlapping lower-right ---------- */
mount(
  'ph-hero-laptop',
  desktopDevice({
    eager: true,
    tag: 'Desktop · Windows',
    sizes: '(min-width: 1240px) 940px, (min-width: 900px) 74vw, 92vw',
  })
);
mount(
  'ph-hero-phone',
  mobileDevice({
    eager: true,
    tag: 'Android · Mobile',
    sizes: '(min-width: 1200px) 236px, (min-width: 700px) 22vw, 60vw',
  })
);

/* ---------- Product intro cards ---------- */
mount('ph-desktop-visual', desktopDevice({ sizes: '(min-width: 900px) 520px, 90vw' }));
mount('ph-android-visual', mobileDevice({ sizes: '(min-width: 900px) 190px, 52vw' }));

/* ---------- Offline story ---------- */
mount('ph-desktop-offline', desktopDevice({ sizes: '(min-width: 900px) 560px, 90vw' }));

/* ---------- Showcases ---------- */
mount('ph-desktop-shot', desktopDevice({ sizes: '(min-width: 900px) 560px, 90vw' }));
mount('ph-android-shot', mobileDevice({ sizes: '(min-width: 900px) 300px, 62vw' }));

/* ---------- Printing flow ---------- */
mount('ph-print-phone', mobileDevice({ sizes: '(min-width: 900px) 230px, 55vw' }));

/* ---------- Offline demo (network state only — the app itself is a real screenshot) ---------- */
const offline = document.getElementById('offline-demo');
if (offline) {
  let off = false;
  let timer = null;
  const flip = () => {
    off = !off;
    offline.classList.toggle('is-off', off);
    const msg = offline.querySelector('[data-offline-msg]');
    if (msg) {
      msg.textContent = off
        ? 'Network unavailable — billing continues on local data.'
        : 'Network online — billing stays local.';
    }
  };
  offline.querySelector('[data-offline-toggle]')?.addEventListener('click', () => {
    clearTimeout(timer);
    flip();
    timer = setTimeout(flip, reduced ? 0 : 3600);
  });
}

/* ---------- Billing flow (scroll-driven) ---------- */
const flow = document.getElementById('bill-flow');
if (flow) {
  const steps = [...flow.querySelectorAll('.flow__step')];
  const meter = flow.querySelector('.flow__meter i');
  let idx = -1;

  const show = (i) => {
    if (i === idx) return;
    idx = i;
    steps.forEach((s, si) => s.classList.toggle('is-live', si === i));
    if (meter) meter.style.width = `${((i + 1) / steps.length) * 100}%`;
  };

  if (reduced || !('IntersectionObserver' in window)) {
    show(steps.length - 1);
  } else {
    show(0);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const r = e.intersectionRatio || 1;
          const i = Math.min(
            steps.length - 1,
            Math.floor((1 - r) * steps.length * 1.15)
          );
          show(i);
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    io.observe(flow);

    /* Gentle auto-advance while visible, paused when the section leaves view. */
    let timer = null;
    const vis = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !timer) {
          timer = setInterval(() => show((idx + 1) % steps.length), 1600);
        } else if (!e.isIntersecting && timer) {
          clearInterval(timer);
          timer = null;
        }
      });
    });
    vis.observe(flow);
  }
}

/* ---------- Print demo ---------- */
const printDemo = document.getElementById('print-demo');
if (printDemo) {
  const btn = printDemo.querySelector('[data-print-toggle]');
  const paper = printDemo.querySelector('.paper');
  btn?.addEventListener('click', () => {
    if (!paper) return;
    paper.classList.remove('is-feed');
    void paper.offsetWidth;
    paper.classList.add('is-feed');
    setTimeout(() => paper.classList.remove('is-feed'), 1200);
  });
}

bindTrackers();
