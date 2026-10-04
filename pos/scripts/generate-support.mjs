/* Generate support article pages from one content source.
   Usage: node scripts/generate-support.mjs
   Rerun after editing SUPPORT_ARTICLES below. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'pages', 'support');

const meta = {
  'getting-started': {
    title: 'Getting Started — Install, Activate, First Bill | Nextora POS Support',
    desc: 'Set up Nextora POS in three steps: install, activate your license and start billing.',
  },
  desktop: {
    title: 'Desktop Setup (Windows) | Nextora POS Support',
    desc: 'Install Nextora POS Desktop on Windows, configure your printer and take your first bill.',
  },
  android: {
    title: 'Android Setup | Nextora POS Support',
    desc: 'Install the Nextora POS Android APK, activate and set up printing and backups.',
  },
  printers: {
    title: 'Printer Setup — ESC/POS, Bluetooth & Wi-Fi | Nextora POS Support',
    desc: 'Connect supported thermal printers to Nextora POS on Desktop and Android.',
  },
  activation: {
    title: 'License Activation & Renewal | Nextora POS Support',
    desc: 'Activate Nextora POS with your annual license key and manage renewals.',
  },
  'backup-restore': {
    title: 'Backup & Restore | Nextora POS Support',
    desc: 'Export backups of your billing data and restore them on any Nextora POS device.',
  },
  updates: {
    title: 'Software Updates | Nextora POS Support',
    desc: 'Check for and install Nextora POS software updates on Desktop and Android.',
  },
};

const body = {
  'getting-started': `
    <p>Nextora POS gets your counter billing in three steps: <strong>install</strong>, <strong>activate</strong>, <strong>bill</strong>.</p>
    <h2>1. Install</h2>
    <p>Download the version for your device from the official <a href="/download" style="color:var(--accent-ink)">Download</a> page — Desktop for Windows, or the Android APK. Install using the Windows installer or by opening the APK on your device.</p>
    <h2>2. Activate</h2>
    <p>Open <strong>License</strong> settings and enter the activation key supplied by Nextora. Activation validates your key over the internet once; after that, billing works online or offline.</p>
    <h2>3. Set up and bill</h2>
    <p>Add your items, connect a supported printer if you use one, and take your first bill. Daily billing runs on local data — no internet needed.</p>
    <h2>Need help?</h2>
    <p>Email <a href="mailto:support@nextoracreations.co.in" style="color:var(--accent-ink)">support@nextoracreations.co.in</a> or call <a href="tel:+917674981970" style="color:var(--accent-ink)">+91 76749 81970</a>.</p>`,
  desktop: `
    <p>Nextora POS Desktop runs on Windows 10 (64-bit) or newer.</p>
    <h2>Install</h2>
    <p>Download the installer from the <a href="/download" style="color:var(--accent-ink)">Download</a> page and run it. Follow the setup wizard and launch Nextora POS from the Start menu or desktop shortcut.</p>
    <h2>First run</h2>
    <ul>
      <li>Activate your license in <strong>License</strong> settings.</li>
      <li>Add your items in <strong>Items</strong>.</li>
      <li>Configure your printer in <strong>Printer</strong> settings.</li>
      <li>Export your first backup in <strong>Backup</strong> settings.</li>
    </ul>
    <h2>Printer</h2>
    <p>Connect your ESC/POS thermal printer via USB or serial, install the printer's driver if the manufacturer provides one, then select it in Nextora POS printer settings. See <a href="/support/printers" style="color:var(--accent-ink)">Printer Setup</a>.</p>
    <h2>Moving to a new PC</h2>
    <p>Export a backup from the old machine, install Nextora POS on the new one, activate, then import the backup. See <a href="/support/backup-restore" style="color:var(--accent-ink)">Backup &amp; Restore</a>.</p>`,
  android: `
    <p>Nextora POS Android runs on Android 8.0 or newer and installs from the official APK.</p>
    <h2>Install the APK</h2>
    <ol style="list-style:disc;padding-left:22px;color:var(--ink-2);display:grid;gap:8px;margin-bottom:18px">
      <li>Download the APK from the <a href="/download" style="color:var(--accent-ink)">Download</a> page on your device.</li>
      <li>Open the file; when Android asks, allow installs from your browser or file manager.</li>
      <li>Complete the installation and open Nextora POS.</li>
    </ol>
    <div class="note note--warn" style="margin-bottom:20px"><span>Download only from pos.nextoracreations.co.in — never from third-party stores or messaging apps.</span></div>
    <h2>First run</h2>
    <ul>
      <li>Activate your license in <strong>License</strong> settings.</li>
      <li>Add your items in <strong>Items</strong>.</li>
      <li>Pair your Bluetooth printer in Android settings, or connect your Wi-Fi printer to the same network, then select it in <strong>Printer</strong> settings.</li>
      <li>Export a backup in <strong>Backup</strong> settings.</li>
    </ul>
    <h2>Printing</h2>
    <p>Both Bluetooth and Wi-Fi thermal printing are supported where the printer model supports them. See <a href="/support/printers" style="color:var(--accent-ink)">Printer Setup</a>.</p>`,
  printers: `
    <p>Nextora POS prints receipts to supported thermal printers. Compatibility can vary by model and connection type — test your model before purchase if you can.</p>
    <h2>Desktop — ESC/POS (USB / serial)</h2>
    <ul>
      <li>Connect the printer to the PC via USB or serial and power it on.</li>
      <li>Install the manufacturer's driver if provided.</li>
      <li>In Nextora POS, open <strong>Printer</strong> settings and select the printer.</li>
      <li>Print a test receipt.</li>
    </ul>
    <h2>Android — Bluetooth</h2>
    <ul>
      <li>Pair the printer in Android <strong>Settings → Connected devices</strong>.</li>
      <li>In Nextora POS, open <strong>Printer</strong> settings and select the paired printer.</li>
      <li>Print a test receipt.</li>
    </ul>
    <h2>Android — Wi-Fi</h2>
    <ul>
      <li>Connect the printer and the phone to the same Wi-Fi network.</li>
      <li>Note the printer's IP address (usually in its settings or on a network printout).</li>
      <li>In Nextora POS printer settings, add the printer by IP.</li>
      <li>Print a test receipt.</li>
    </ul>
    <h2>Troubleshooting</h2>
    <ul>
      <li><strong>No output:</strong> confirm the printer is powered, has paper, and the cable/pairing is active.</li>
      <li><strong>Garbled output:</strong> the printer may not support the ESC/POS commands being sent — confirm the model supports ESC/POS.</li>
      <li><strong>Slow or failed Wi-Fi printing:</strong> confirm both devices are on the same network and the IP is correct.</li>
    </ul>`,
  activation: `
    <p>Nextora POS uses annual licensing, one license per device.</p>
    <h2>Activate</h2>
    <ol style="list-style:disc;padding-left:22px;color:var(--ink-2);display:grid;gap:8px;margin-bottom:18px">
      <li>Request or purchase a license from Nextora.</li>
      <li>Receive your activation key for the product and platform you bought.</li>
      <li>Open <strong>License</strong> settings in the app and enter the key.</li>
      <li>Activation validates once over the internet — daily billing then works online or offline.</li>
    </ol>
    <h2>Check validity</h2>
    <p>License settings shows your activation status and validity period. The app reminds you as expiry approaches.</p>
    <h2>Renew</h2>
    <p>Contact Nextora before expiry to renew. Enter the renewal in License settings to continue — your local data is unaffected by renewals.</p>
    <h2>If activation fails</h2>
    <ul>
      <li>Confirm the device has internet access for the one-time validation.</li>
      <li>Confirm the key matches the product (Desktop vs Android).</li>
      <li>Contact support with your key and device details if the problem continues.</li>
    </ul>`,
  'backup-restore': `
    <p>Your billing data lives locally on the device. Backups are files you export, keep and restore yourself.</p>
    <h2>Export a backup</h2>
    <ul>
      <li><strong>Desktop:</strong> open <strong>Backup</strong> settings and choose a file location.</li>
      <li><strong>Android:</strong> open <strong>Backup</strong> and export to device storage; share or copy the file somewhere safe.</li>
    </ul>
    <p>Export regularly — especially before updates, device changes or big menu edits.</p>
    <h2>Restore a backup</h2>
    <ol style="list-style:disc;padding-left:22px;color:var(--ink-2);display:grid;gap:8px;margin-bottom:18px">
      <li>Open <strong>Backup</strong> settings on the target device.</li>
      <li>Choose the import/restore option and select your backup file.</li>
      <li>Confirm the restore. The current local data is replaced by the backup's contents.</li>
    </ol>
    <div class="note note--warn" style="margin-bottom:20px"><span>Restoring replaces current data. If you need what is on the device now, export a fresh backup first.</span></div>
    <h2>Moving devices</h2>
    <p>Export from the old device → install and activate on the new device → import the backup. Contact us if your license needs a device change.</p>`,
  updates: `
    <p>Both apps can check for supported product updates from inside the app.</p>
    <h2>Check for updates</h2>
    <ul>
      <li><strong>Desktop:</strong> open <strong>Updates</strong> in settings and check for updates. Available updates install through the app.</li>
      <li><strong>Android:</strong> open <strong>Updates</strong> in settings to check. When a new version is available, download the official APK from this site and install it (your data and license stay on the device).</li>
    </ul>
    <h2>Only official sources</h2>
    <div class="note note--warn" style="margin:16px 0 20px"><span>Install updates only from the in-app update check or from pos.nextoracreations.co.in. Never from third-party stores, messaging apps or shared links.</span></div>
    <h2>Before you update</h2>
    <ul>
      <li>Export a fresh backup.</li>
      <li>Note your license status (it carries over — no re-activation needed for normal updates).</li>
    </ul>`,
};

mkdirSync(OUT, { recursive: true });

for (const [slug, html] of Object.entries(body)) {
  const m = meta[slug];
  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${m.title}</title>
  <meta name="description" content="${m.desc}" />
  <link rel="canonical" href="https://pos.nextoracreations.co.in/support/${slug}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#ffffff" />
  <link rel="icon" type="image/png" href="/brand/favicon.png" />
  <link rel="preload" as="font" type="font/woff2" href="/fonts/hanken-grotesk-latin.woff2" crossorigin />
  <link rel="stylesheet" href="/src/css/style.css" />
</head>
<body data-page="support" data-path="/support/${slug}">
  <a class="skip" href="#main">Skip to content</a>
  <div id="site-nav"></div>
  <main id="main">
    <section class="pagehero">
      <div class="container">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/">Nextora POS</a><span class="sep">/</span><a href="/support">Support</a><span class="sep">/</span><span aria-current="page">${m.title.split(' — ')[0].split(' |')[0]}</span>
        </nav>
        <h1 class="h2">${m.title.split(' — ')[0].split(' |')[0]}</h1>
        <p class="lead">${m.desc}</p>
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="article-grid">
          <nav class="article-nav" aria-label="Support topics">
            <a href="/support/getting-started">Getting Started</a>
            <a href="/support/desktop">Desktop Setup</a>
            <a href="/support/android">Android Setup</a>
            <a href="/support/printers">Printer Setup</a>
            <a href="/support/activation">License Activation</a>
            <a href="/support/backup-restore">Backup &amp; Restore</a>
            <a href="/support/updates">Software Updates</a>
          </nav>
          <article class="prose">
            ${html}
            <div class="note" style="margin-top:34px">
              <span>Still stuck? Email <a href="mailto:support@nextoracreations.co.in" style="color:var(--accent-ink)">support@nextoracreations.co.in</a> or call <a href="tel:+917674981970" style="color:var(--accent-ink)">+91 76749 81970</a>.</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  </main>
  <div id="site-footer"></div>
  <script type="module" src="/src/js/app.js"></script>
</body>
</html>
`;
  writeFileSync(resolve(OUT, `${slug}.html`), page);
  console.log('generated', slug);
}
console.log('done');
