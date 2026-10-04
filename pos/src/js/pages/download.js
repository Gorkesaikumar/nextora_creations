/* Download & Releases: render strictly from RELEASES metadata — never invent versions. */
import { RELEASES } from '../../data/site.js';
import { bindTrackers } from '../components/analytics.js';
import { ICONS } from '../icons.js';

const el = (sel) => document.querySelector(sel);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderReleaseCard(key) {
  const r = RELEASES[key];
  if (!r) return '';
  const name = key === 'desktop' ? 'Nextora Mini POS for Windows' : 'Nextora Mini POS for Android';
  const platform = key === 'desktop' ? 'Windows 10+ (64-bit)' : 'Android 8.0+';

  let isAvail = false;
  let badgeText = 'Coming soon';
  let ctaHtml = '';
  let noteHtml = '';

  if (key === 'desktop') {
    isAvail = Boolean(r.downloadUrl);
    badgeText = isAvail ? 'Available' : 'Coming soon';
    ctaHtml = isAvail
      ? `<a class="btn btn--primary" href="${r.downloadUrl}" data-track="download_desktop">Download for Windows</a>`
      : `<a class="btn btn--ghost" href="/contact" data-track="request_demo">Request installer access</a>`;
    noteHtml = isAvail
      ? ''
      : `<div class="dl__unavailable">${ICONS.info}<span>Windows installer is provided directly to licensed merchants. Request access or contact support to receive the setup package.</span></div>`;
  } else {
    isAvail = Boolean(r.playStoreUrl);
    badgeText = isAvail ? 'Available on Google Play' : 'Coming Soon on Google Play';
    ctaHtml = isAvail
      ? `<a class="btn btn--primary" href="${r.playStoreUrl}" target="_blank" rel="noopener noreferrer" data-track="download_android"><i data-icon="playstore"></i> Get it on Google Play</a>`
      : `<a class="btn btn--ghost" href="/contact" data-track="request_demo">Request Android access</a>`;
    noteHtml = isAvail
      ? ''
      : `<div class="dl__unavailable">${ICONS.info}<span>Coming Soon on Google Play. Official download links will appear here immediately once the listing is live.</span></div>`;
  }

  const meta = isAvail && r.version
    ? `
      <dl class="dl__meta">
        <div><dt>Version</dt><dd>${r.version}</dd></div>
        <div><dt>Released</dt><dd>${r.released || 'Latest'}</dd></div>
        <div><dt>File</dt><dd>${r.fileName}</dd></div>
        <div><dt>Size</dt><dd>${r.size || '—'}</dd></div>
      </dl>`
    : noteHtml;

  return `
    <article class="dl__card">
      <div>
        <span class="badge ${isAvail ? 'badge--accent' : 'badge--outline'}">${badgeText}</span>
        <h2 class="h3" style="margin-top:14px">${name}</h2>
        <p class="mono" style="color:var(--ink-3);margin-top:6px">${platform}</p>
      </div>
      ${meta}
      ${ctaHtml}
      <a href="/support/${key === 'desktop' ? 'desktop' : 'android'}" class="mono" style="color:var(--accent-ink)">${key === 'desktop' ? 'Desktop setup guide →' : 'Android setup guide →'}</a>
    </article>`;
}

/* Simple versions table for /releases (only when versions exist). */
function renderVersions() {
  const t = el('#versions-table');
  if (!t) return;
  const rows = ['desktop', 'android']
    .filter((k) => RELEASES[k].available)
    .map((k) => {
      const r = RELEASES[k];
      return `<tr>
        <td>${r.version}</td>
        <td>${k === 'desktop' ? 'Desktop (Windows)' : 'Android'}</td>
        <td>${r.released || '—'}</td>
        <td>${r.fileName}</td>
        <td><a href="${r.downloadUrl || '/download'}" data-track="download_${k}">Download</a></td>
      </tr>`;
    });

  t.innerHTML = rows.length
    ? rows.join('')
    : `<tr><td colspan="5" class="empty">No public releases yet — versions will be listed here as they ship.</td></tr>`;
}

renderVersions();

const wrap = el('#download-cards');
if (wrap) {
  wrap.innerHTML = ['desktop', 'android'].map(renderReleaseCard).join('');
  wrap.querySelectorAll('i[data-icon]').forEach((n) => {
    const name = n.dataset.icon;
    if (ICONS[name]) n.outerHTML = ICONS[name];
  });
}

/* Security guidance copy injection (kept near the download actions). */
const sec = el('#download-security');
if (sec) {
  sec.innerHTML = `
    <div class="note note--warn">
      ${ICONS.alert}
      <span><strong>Download only from official Nextora sources.</strong> Official installers and APKs are published only on
      pos.nextoracreations.co.in and nextoracreations.co.in. Never install Nextora POS from third-party app stores,
      messaging apps, or file-sharing links.</span>
    </div>`;
}

bindTrackers();
