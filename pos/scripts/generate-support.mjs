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
    title: 'Getting Started & Installation | Nextora Mini POS Support',
    desc: 'Install, activate your annual license and start billing in three steps.',
  },
  desktop: {
    title: 'Windows Desktop Setup | Nextora Mini POS Support',
    desc: 'Install Nextora Mini POS on Windows 10/11, configure thermal printers and manage counter workflows.',
  },
  android: {
    title: 'Android Mobile Setup | Nextora Mini POS Support',
    desc: 'Install Nextora Mini POS for Android, configure Bluetooth thermal printers and start mobile billing.',
  },
  billing: {
    title: 'Billing & Item Management | Nextora Mini POS Support',
    desc: 'Manage your item catalog, create fast counter bills, calculate taxes, and print receipts.',
  },
  printers: {
    title: 'Thermal Printer Setup — ESC/POS, Bluetooth & Wi-Fi | Nextora Mini POS Support',
    desc: 'Connect supported ESC/POS USB, serial, Bluetooth and Wi-Fi thermal printers.',
  },
  activation: {
    title: 'License Activation & Annual Renewal | Nextora Mini POS Support',
    desc: 'Activate your device with an annual license key and manage seamless yearly renewals.',
  },
  'backup-restore': {
    title: 'Backup & Restore | Nextora Mini POS Support',
    desc: 'Export complete database backups to local files and restore safely on any supported device.',
  },
  troubleshooting: {
    title: 'Troubleshooting & Common Fixes | Nextora Mini POS Support',
    desc: 'Solutions for common printer connection issues, activation warnings, and local database recovery.',
  },
  updates: {
    title: 'Software Updates | Nextora Mini POS Support',
    desc: 'Check for and install product updates safely while protecting your local billing records.',
  },
};

const body = {
  'getting-started': `
    <p>Nextora Mini POS gets your counter up and running in three simple steps: <strong>install</strong>, <strong>activate</strong>, and <strong>bill</strong>.</p>
    <h2>1. Installation</h2>
    <p>Download the edition built for your hardware from the official <a href="/download" style="color:var(--accent-ink)">Download</a> page — Nextora Mini POS for Windows (Desktop) or Nextora Mini POS for Android (Google Play / APK). Follow the on-screen installer on Windows or allow installation on Android.</p>
    <h2>2. License Activation</h2>
    <p>Launch the app, open <strong>License</strong> settings, and enter the annual activation key provided by Nextora. Activation validates once over the internet to bind your device. Afterward, daily billing operates 100% offline.</p>
    <h2>3. Setup and Take Your First Bill</h2>
    <p>Configure your item catalog in <strong>Items</strong>, select your thermal printer in <strong>Printer</strong> settings, and begin billing immediately. All your transactions are saved to your local device database.</p>
    <h2>Need Assistance?</h2>
    <p>Contact our support team at <a href="mailto:support@nextoracreations.co.in" style="color:var(--accent-ink)">support@nextoracreations.co.in</a> or phone <a href="tel:+917674981970" style="color:var(--accent-ink)">+91 76749 81970</a>.</p>`,

  desktop: `
    <p>Nextora Mini POS for Windows runs natively on 64-bit Windows 10 and Windows 11.</p>
    <h2>System Requirements</h2>
    <ul>
      <li>Operating System: Windows 10 (64-bit) or newer</li>
      <li>Memory: 4 GB RAM recommended</li>
      <li>Storage: 500 MB free space</li>
      <li>Display: 1366 × 768 or higher</li>
    </ul>
    <h2>Installation</h2>
    <p>Run the official setup package (<code>NextoraMiniPOS-Setup.exe</code>). The installer will set up desktop shortcuts and register the application. Launch the app from the Start menu.</p>
    <h2>First Run Checklist</h2>
    <ul>
      <li>Activate your annual license in <strong>License</strong> settings.</li>
      <li>Add categories and menu items in <strong>Items</strong>.</li>
      <li>Connect your ESC/POS thermal printer via USB or COM port and select it in <strong>Printer</strong> settings.</li>
      <li>Export a baseline backup file in <strong>Backup</strong> settings.</li>
    </ul>`,

  android: `
    <p>Nextora Mini POS for Android brings fast, offline billing to smartphones, tablets, and dedicated handheld POS devices running Android 8.0 (Oreo) or newer.</p>
    <h2>Installation</h2>
    <p>Install Nextora Mini POS via the official release link on Google Play or through our official APK package available on the <a href="/download" style="color:var(--accent-ink)">Download</a> page.</p>
    <h2>Permissions</h2>
    <ul>
      <li><strong>Bluetooth (Nearby Devices):</strong> Required solely to search for and pair with Bluetooth ESC/POS thermal printers.</li>
      <li><strong>Storage / Documents:</strong> Used when exporting manual database backup files or importing a restoration file.</li>
    </ul>
    <h2>First Run</h2>
    <p>Open License settings, enter your annual key, and activate. Turn on your Bluetooth printer, pair it in Android Bluetooth settings, and select the printer inside Nextora Mini POS. You are ready to bill anywhere.</p>`,

  billing: `
    <p>Nextora Mini POS is designed to streamline counter checkout with minimum keystrokes and zero latency.</p>
    <h2>Adding and Managing Items</h2>
    <p>Navigate to <strong>Items</strong> to create your menu or inventory list. You can specify item names, categories, pricing, and tax rates. Organized categories appear as quick-access tabs on the billing screen.</p>
    <h2>Creating a Bill</h2>
    <ol style="list-style:decimal;padding-left:22px;color:var(--ink-2);display:grid;gap:8px;margin-bottom:18px">
      <li>Tap or click items to add them to the current ticket.</li>
      <li>Adjust quantities or remove items directly from the ticket pane.</li>
      <li>Select payment mode: <strong>Cash</strong>, <strong>UPI / QR</strong>, or <strong>Card</strong>.</li>
      <li>Click <strong>Generate Bill / Print</strong>. The sequential invoice is recorded in the local database and immediately printed on your thermal printer.</li>
    </ol>
    <h2>Sales Reports & Summaries</h2>
    <p>View real-time totals on your dashboard: today’s total sales, completed order count, average ticket size, and breakdown across payment methods.</p>`,

  printers: `
    <p>Nextora Mini POS supports receipt printing on thermal printers using standard ESC/POS protocols.</p>
    <h2>Desktop — ESC/POS (USB / Serial)</h2>
    <ul>
      <li>Connect your printer via USB or serial cable and turn it on.</li>
      <li>Install any manufacturer drivers if needed (e.g. for virtual COM port emulation).</li>
      <li>In Nextora Mini POS, open <strong>Printer</strong> settings, choose your printer port or Windows spooler driver, and click <strong>Test Print</strong>.</li>
    </ul>
    <h2>Android — Bluetooth Thermal Printers</h2>
    <ul>
      <li>Power on your portable thermal printer and put it in pairing mode.</li>
      <li>Go to Android <strong>Settings → Connected devices → Pair new device</strong> and select your printer (default PINs are usually <code>0000</code> or <code>1234</code>).</li>
      <li>Open Nextora Mini POS, navigate to <strong>Printer</strong> settings, select the paired Bluetooth printer, and test.</li>
    </ul>
    <h2>Android — Wi-Fi Network Printers</h2>
    <ul>
      <li>Ensure both the mobile device and printer are connected to the same local Wi-Fi router.</li>
      <li>Enter the printer's local IP address (typically <code>192.168.1.xxx</code>) and port <code>9100</code> into the app's printer setup.</li>
    </ul>`,

  activation: `
    <p>Nextora Mini POS uses a straightforward <strong>annual subscription license</strong> model tied per device.</p>
    <h2>Activating a New Device</h2>
    <ol style="list-style:decimal;padding-left:22px;color:var(--ink-2);display:grid;gap:8px;margin-bottom:18px">
      <li>Acquire an annual license key from Nextora Creations.</li>
      <li>Open <strong>License</strong> in the application settings.</li>
      <li>Paste or enter your key and click <strong>Activate</strong>.</li>
      <li>The app contacts Nextora licensing over the internet once to validate and bind your hardware ID.</li>
    </ol>
    <h2>Annual Renewals</h2>
    <p>The app displays non-intrusive renewal reminders 30 days prior to license expiry. Contact Nextora before expiration to renew your subscription. Entering your renewal key instantly extends validity for another 365 days with zero interruption to your local database records.</p>`,

  'backup-restore': `
    <p>Because all billing records live in the local database on your device, manual backups provide complete peace of mind.</p>
    <h2>Exporting a Backup</h2>
    <ul>
      <li><strong>Windows:</strong> Open <strong>Backup</strong> settings, click <strong>Export Backup</strong>, and save the <code>.db</code>/archive file to your hard drive, a USB flash drive, or personal cloud folder.</li>
      <li><strong>Android:</strong> Open <strong>Backup</strong>, click <strong>Export</strong>, and save to your Documents folder or share via email to yourself.</li>
    </ul>
    <h2>Restoring a Backup</h2>
    <ol style="list-style:decimal;padding-left:22px;color:var(--ink-2);display:grid;gap:8px;margin-bottom:18px">
      <li>In Nextora Mini POS, open <strong>Backup</strong> settings and select <strong>Import / Restore</strong>.</li>
      <li>Select the previously exported backup file.</li>
      <li>Confirm restoration. The app reloads all items, prices, and past bills from the backup file.</li>
    </ol>
    <div class="note note--warn" style="margin-bottom:20px"><span><strong>Important:</strong> Restoring a backup overwrites the current local database with the contents of the backup file. Always take a fresh export before restoring.</span></div>`,

  troubleshooting: `
    <p>Quick troubleshooting steps for common counter questions:</p>
    <h2>Printer Not Printing</h2>
    <ul>
      <li>Check paper roll orientation and ensure the thermal paper is facing the right way.</li>
      <li>Verify the printer is powered on and the status LED is green.</li>
      <li>For Bluetooth: ensure Bluetooth is turned on, permissions are granted, and no other phone is currently connected to the printer.</li>
      <li>For USB: ensure the USB cable is firmly plugged in and the driver is active in Windows Device Manager.</li>
    </ul>
    <h2>License Shows "Validation Failed"</h2>
    <ul>
      <li>Ensure the device has active internet access during activation (required only for the one-time check).</li>
      <li>Verify the key has been typed correctly without extra spaces.</li>
      <li>Confirm that the key corresponds to the correct platform (Desktop vs Android).</li>
    </ul>
    <h2>Database or App Moving to a New Machine</h2>
    <ul>
      <li>Always export a fresh backup from the old machine before retirement.</li>
      <li>Install Nextora Mini POS on the new device, activate the license, and import the backup file.</li>
    </ul>`,

  updates: `
    <p>We provide regular software updates with performance enhancements and printer compatibility updates.</p>
    <h2>How to Check for Updates</h2>
    <ul>
      <li><strong>In-App:</strong> Open <strong>Settings → Software Updates</strong> and click <strong>Check for Updates</strong>.</li>
      <li><strong>Website:</strong> Visit <a href="/download" style="color:var(--accent-ink)">pos.nextoracreations.co.in/download</a> or the Releases page.</li>
    </ul>
    <h2>Data Safety During Updates</h2>
    <p>Installing software updates does not erase your local database or your active license. However, as best engineering practice, always export a manual backup before performing any software update.</p>`,
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
          <a href="/">Nextora Mini POS</a><span class="sep">/</span><a href="/support">Support</a><span class="sep">/</span><span aria-current="page">${m.title.split(' — ')[0].split(' |')[0]}</span>
        </nav>
        <h1 class="h2">${m.title.split(' — ')[0].split(' |')[0]}</h1>
        <p class="lead">${m.desc}</p>
      </div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="article-grid">
          <nav class="article-nav" aria-label="Support topics">
            <a href="/support/getting-started">Installation</a>
            <a href="/support/desktop">Desktop Setup</a>
            <a href="/support/android">Android Setup</a>
            <a href="/support/billing">Billing Workflows</a>
            <a href="/support/printers">Printer Setup</a>
            <a href="/support/activation">License &amp; Renewal</a>
            <a href="/support/backup-restore">Backup &amp; Restore</a>
            <a href="/support/troubleshooting">Troubleshooting</a>
            <a href="/support/updates">Software Updates</a>
          </nav>
          <article class="prose">
            ${html}
            <div class="note" style="margin-top:34px">
              <span>Need further help? Email <a href="mailto:support@nextoracreations.co.in" style="color:var(--accent-ink)">support@nextoracreations.co.in</a> or call <a href="tel:+917674981970" style="color:var(--accent-ink)">+91 76749 81970</a>.</span>
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
