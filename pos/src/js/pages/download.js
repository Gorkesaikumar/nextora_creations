/* Download & Releases: render strictly from RELEASES metadata — never invent versions. */
import { RELEASES } from '../../data/site.js';
import { bindTrackers } from '../components/analytics.js';
import { ICONS } from '../icons.js';

const el = (sel) => document.querySelector(sel);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderReleaseCard(key) {
  const r = RELEASES[key];
  if (!r) return '';
  const name = key === 'desktop' ? 'Nextora POS Desktop' : 'Nextora POS Android';
  const platform = key === 'desktop' ? 'Windows' : 'Android';

  const meta = r.available
    ? `
      <dl class="dl__meta">
        <div><dt>Version</dt><dd>${r.version}</dd></div>
        <div><dt>Released</dt><dd>${r.released}</dd></div>
        <div><dt>File</dt><dd>${r.fileName}</dd></div>
        <div><dt>Size</dt><dd>${r.size || '—'}</dd></div>
      </dl>`
    : `
      <div class="dl__unavailable">${ICONS.info}
        <span>Release pending — this build has not been published yet. Official download links will appear here the moment a version is released.</span>
      </div>`;

  const cta = r.available
    ? `<a class="btn btn--primary" href="${r.downloadUrl || '#'}" data-track="download_${key}">Download for ${platform}</a>`
    : `<a class="btn btn--ghost" href="/contact" data-track="request_demo">Request release access</a>`;

  return `
    <article class="dl__card">
      <div>
        <span class="badge ${r.available ? 'badge--accent' : 'badge--outline'}">${r.available ? 'Available' : 'Coming soon'}</span>
        <h2 class="h3" style="margin-top:14px">${name}</h2>
        <p class="mono" style="color:var(--ink-3);margin-top:6px">${platform}</p>
      </div>
      ${meta}
      ${cta}
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
if (wrap) wrap.innerHTML = ['desktop', 'android'].map(renderReleaseCard).join('');

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
