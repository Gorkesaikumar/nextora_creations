/* ============================================================
   NEXTORA MINI POS — Site & Product Configuration
   Single source of truth for product facts, copy, links and
   release metadata. Update product capabilities HERE only.
   ============================================================ */

export const SITE = {
  name: 'Nextora Mini POS',
  productName: 'Nextora Mini POS',
  company: 'Nextora Creations',
  companyUrl: 'https://nextoracreations.co.in',
  companyPos: 'A product of Nextora Creations.',
  tagline: "Simple billing. Even when the internet isn't.",
  description:
    'Nextora Mini POS is an offline-first billing solution for restaurants, cafés and growing businesses, available on Windows and Android.',
  url: typeof __SITE_URL__ !== 'undefined' && __SITE_URL__ ? __SITE_URL__ : 'https://pos.nextoracreations.co.in',
  email: typeof __SUPPORT_EMAIL__ !== 'undefined' && __SUPPORT_EMAIL__ ? __SUPPORT_EMAIL__ : 'support@nextoracreations.co.in',
  phone: typeof __SUPPORT_PHONE__ !== 'undefined' && __SUPPORT_PHONE__ ? __SUPPORT_PHONE__ : '+91 7674981970',
  phoneHref: typeof __SUPPORT_PHONE__ !== 'undefined' && __SUPPORT_PHONE__ ? 'tel:' + __SUPPORT_PHONE__.replace(/\s/g, '') : 'tel:+917674981970',
  calendly: 'https://calendly.com/gorkesaikumar/30min',
  googlePlayUrl: typeof __GOOGLE_PLAY_URL__ !== 'undefined' && __GOOGLE_PLAY_URL__ ? __GOOGLE_PLAY_URL__ : '',
  windowsDownloadUrl: typeof __WINDOWS_DOWNLOAD_URL__ !== 'undefined' && __WINDOWS_DOWNLOAD_URL__ ? __WINDOWS_DOWNLOAD_URL__ : '',
  whatsappUrl: typeof __WHATSAPP_URL__ !== 'undefined' && __WHATSAPP_URL__ ? __WHATSAPP_URL__ : '',
  // Contact form posts to the company's verified Apps Script lead endpoint
  formAction:
    'https://script.google.com/macros/s/AKfycbwj8ewoi-zyYufafUrlxkU8wVqbrZDXkSQn_DSIssFbDsmXub-CB6lNxGxHbTXpAlJ-TQ/exec',
  // Tracking disabled by default unless VITE_GA_MEASUREMENT_ID is explicitly provided
  analyticsId: typeof __GA_MEASUREMENT_ID__ !== 'undefined' && __GA_MEASUREMENT_ID__ ? __GA_MEASUREMENT_ID__ : '',
};

export const DESKTOP = {
  id: 'desktop',
  name: 'Nextora Mini POS for Windows',
  shortName: 'Desktop',
  platform: 'Windows',
  platformDetail: 'Windows 10 (64-bit) or newer',
  connection: 'ESC/POS — USB / serial, where supported',
  headline: 'Built for your billing counter.',
  summary:
    'A focused Windows billing application designed to keep everyday billing simple, fast and available even when internet connectivity isn’t.',
  url: '/desktop',
  downloadUrl: '/download',
  features: [
    { title: 'Offline-first billing', body: 'Billing runs on locally stored data and continues smoothly when the network drops.' },
    { title: 'Fast item selection', body: 'Organized items with quick search to move from selection to bill in seconds.' },
    { title: 'Bill generation', body: 'Numbered bills with itemized totals, tax calculation, and payment breakdown.' },
    { title: 'Thermal receipt printing', body: 'Print receipts on supported ESC/POS thermal printers via USB or serial.' },
    { title: 'Item management', body: 'Add, edit and organize the items, categories, and prices your counter sells.' },
    { title: 'Reports & summaries', body: 'View daily sales, order counts, average order values, and cash/UPI/card breakdowns.' },
    { title: 'Local backups & restore', body: 'Export backups to a local file and restore them when moving or recovering data.' },
    { title: 'Annual license activation', body: 'Activate your device with the annual license key supplied by Nextora.' },
    { title: 'Software updates', body: 'Check for and install supported product updates from within the app.' },
  ],
  screens: ['billing', 'items', 'bills', 'settings', 'printer', 'backup', 'license', 'updates'],
};

export const ANDROID = {
  id: 'android',
  name: 'Nextora Mini POS for Android',
  shortName: 'Android',
  platform: 'Android',
  platformDetail: 'Android 8.0 or newer',
  connection: 'Bluetooth / Wi-Fi, where supported',
  headline: 'Billing wherever your business needs it.',
  summary:
    'Run essential billing directly from Android and print receipts using supported thermal printers — at the counter or on the move.',
  url: '/android',
  downloadUrl: '/download',
  features: [
    { title: 'Offline billing', body: 'Create bills from locally stored items without depending on connectivity.' },
    { title: 'Item management', body: 'Maintain your item catalog with prices ready for quick counter selection.' },
    { title: 'Bill creation & preview', body: 'Build bills line by line with live totals as you go and review before printing.' },
    { title: 'Reports overview', body: 'Instant visibility into today’s sales, total orders, and payment split directly on mobile.' },
    { title: 'Bluetooth thermal printing', body: 'Print receipts on supported Bluetooth thermal printers, where supported.' },
    { title: 'Wi-Fi thermal printing', body: 'Print to supported network thermal printers over local Wi-Fi, where supported.' },
    { title: 'Backup export & restore', body: 'Export a backup file of your billing data to storage and import anytime.' },
    { title: 'Annual license activation', body: 'Activate with your annual license key and check for updates in-app.' },
  ],
  screens: ['billing', 'items', 'bill-preview', 'printer', 'backup', 'settings', 'license'],
};

/* Feature grid on the homepage — 8 verified capabilities, no invented fluff */
export const FEATURES = [
  { icon: 'offline', title: 'Offline-first billing', body: 'Keep counter billing operational 100% of the time without depending on internet access.' },
  { icon: 'bolt', title: 'Fast checkout', body: 'Designed to minimize the steps between item selection and receipt generation.' },
  { icon: 'printer', title: 'Thermal printing', body: 'Print receipts through supported thermal printers (ESC/POS on Desktop, Bluetooth/Wi-Fi on Android).' },
  { icon: 'device', title: 'Local database', body: 'Core billing information is stored locally on your device in a local database, not on external cloud servers.' },
  { icon: 'receipt', title: 'Item management', body: 'Add, categorize, and update menu items and pricing for swift counter lookups.' },
  { icon: 'chart', title: 'Reports & summaries', body: 'Track today’s sales totals, order counts, average ticket size, and payment splits (Cash, UPI, Card).' },
  { icon: 'backup', title: 'Backup & restore', body: 'Export complete database backups to a file you control and restore onto any compatible device.' },
  { icon: 'key', title: 'Annual licensing', body: 'Transparent yearly subscription per device with offline license validity and renewal reminders.' },
];

export const COMPARISON = [
  { label: 'Platform', desktop: 'Windows 10+ (64-bit)', android: 'Android 8.0+' },
  { label: 'Offline billing', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'Local database', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'Thermal printing', desktop: 'ESC/POS — USB / serial, where supported', android: 'Bluetooth / Wi-Fi, where supported' },
  { label: 'Sales reports', desktop: 'Yes — Sales, orders, average, payments', android: 'Yes — Sales, orders, payments', yes: true },
  { label: 'Backup export', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'Backup import / restore', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'Commercial model', desktop: 'Annual license, per device', android: 'Annual license, per device' },
  { label: 'Update mechanism', desktop: 'In-app update check', android: 'In-app update check · APK / Play Store' },
  { label: 'Distribution', desktop: 'Official installer via pos.nextoracreations.co.in', android: 'Google Play / Official APK download' },
  { label: 'Recommended use', desktop: 'Fixed counter — cafés, restaurants, hotels, retail', android: 'Mobile billing — table service, deliveries, pop-ups' },
];

export const LICENSE_STEPS = [
  { n: '01', title: 'Purchase / request a license', body: 'Contact Nextora for an annual license for each Windows or Android device you want to activate.' },
  { n: '02', title: 'Receive your activation key', body: 'We issue an annual license key tailored for your purchased device and platform.' },
  { n: '03', title: 'Activate the device', body: 'Enter the key in License settings. Internet connection is required once during activation.' },
  { n: '04', title: 'License stays valid offline', body: 'Billing continues normally for the entire annual license period — online or offline.' },
  { n: '05', title: 'Renew annually', body: 'Renew before expiry to keep receiving product updates and dedicated technical support.' },
];

export const HOW_IT_WORKS = [
  { n: '01', title: 'Install Nextora Mini POS', body: 'Install on your Windows computer or Android mobile device from official release sources.' },
  { n: '02', title: 'Activate your license', body: 'Enter the activation key supplied by Nextora to bind and activate your device.' },
  { n: '03', title: 'Start billing', body: 'Set up your items and connect your thermal printer — then take bills with no internet required.' },
];

/* Support center content */
export const SUPPORT_TOPICS = [
  { slug: 'getting-started', title: 'Getting Started', desc: 'Install, activate and take your first bill.' },
  { slug: 'desktop', title: 'Desktop Setup', desc: 'Windows installation, printer and data setup.' },
  { slug: 'android', title: 'Android Setup', desc: 'App install, permissions, Bluetooth and first run.' },
  { slug: 'printers', title: 'Printer Setup', desc: 'Connect ESC/POS USB, Bluetooth and Wi-Fi printers.' },
  { slug: 'activation', title: 'License Activation', desc: 'Activate, check validity and renew annual keys.' },
  { slug: 'backup-restore', title: 'Backup & Restore', desc: 'Export, import and safeguard your data safely.' },
  { slug: 'updates', title: 'Software Updates', desc: 'Check for and install product updates.' },
];

export const FAQS = [
  {
    q: 'Does Nextora Mini POS work without internet?',
    a: 'Yes. Core billing workflows run on data stored locally on your device, so billing continues seamlessly even when the internet is completely down. Connectivity is only required for initial license activation, software updates, and file downloads.',
  },
  {
    q: 'Where is my data stored?',
    a: 'All items, customer bills, order histories, and settings are stored locally on your device in the application’s local database (SQLite/local file storage). Your business and billing data is never sent to external servers or cloud accounts.',
  },
  {
    q: 'Which thermal printers are supported?',
    a: 'Desktop supports ESC/POS thermal printers connected via USB or serial ports. Android supports thermal printers via Bluetooth or local Wi-Fi. Because printer hardware and command dialects vary by manufacturer, we recommend verifying your printer model before deployment.',
  },
  {
    q: 'How do I activate Nextora Mini POS?',
    a: 'Open License settings in the app and enter the activation key supplied by Nextora for that device. Activation performs a one-time validation over the internet; after that, daily billing works completely offline.',
  },
  {
    q: 'How long is the license valid?',
    a: 'Each Nextora Mini POS license is an annual subscription valid for one full year (365 days) from activation. The app displays timely renewal reminders as expiry approaches so you can renew without disruption.',
  },
  {
    q: 'What happens when my annual license expires?',
    a: 'The application alerts you in advance. Upon expiration, billing stops until renewed, but all your locally stored items, records, and history remain intact on your device. Renewing immediately restores full access.',
  },
  {
    q: 'How do I renew?',
    a: 'Contact Nextora Creations before your license expires. We will issue a renewal for your annual subscription. Enter the updated key in License settings to continue.',
  },
  {
    q: 'How do I back up my data?',
    a: 'Both apps allow you to export a complete database backup file. On Desktop, use Backup settings to save the file to your disk or external USB drive. On Android, export to device storage. We recommend exporting regular backups.',
  },
  {
    q: 'Can I restore my data?',
    a: 'Yes. Use the import/restore option in Backup settings and select your saved backup file. Restoring safely repopulates your items and billing history.',
  },
  {
    q: 'Can I move Nextora Mini POS to another device?',
    a: 'Yes. Export a backup from your current device, install Nextora Mini POS on the new device, activate it with your license, and import the backup file. Contact Nextora support if your license requires a device re-assignment.',
  },
  {
    q: 'Where should I download updates?',
    a: 'Only from inside the app’s update check or from the official product website — pos.nextoracreations.co.in. Never download installers or APKs from third-party sites, file hosts, or messaging apps.',
  },
  {
    q: 'Does Android support Bluetooth printers?',
    a: 'Yes, where the thermal printer model supports standard Bluetooth ESC/POS printing. Pair the printer in Android system settings, then select it in Nextora Mini POS printer setup. Network Wi-Fi printers are configured similarly via IP address.',
  },
];

/*
 * Release metadata — version-gated.
 * Real values can be populated via environment variables or build flags.
 */
export const RELEASES = {
  desktop: {
    available: Boolean(typeof __WINDOWS_DOWNLOAD_URL__ !== 'undefined' && __WINDOWS_DOWNLOAD_URL__),
    downloadUrl: typeof __WINDOWS_DOWNLOAD_URL__ !== 'undefined' && __WINDOWS_DOWNLOAD_URL__ ? __WINDOWS_DOWNLOAD_URL__ : '',
    version: null,
    released: null,
    fileName: 'NextoraMiniPOS-Setup.exe',
    size: null,
    requirements: [
      { k: 'Operating system', v: 'Windows 10 (64-bit) or newer' },
      { k: 'Memory', v: '4 GB RAM or more recommended' },
      { k: 'Storage', v: '500 MB free space' },
      { k: 'Printer', v: 'ESC/POS thermal printer (USB / serial), optional' },
      { k: 'Display', v: '1366 × 768 or higher' },
    ],
  },
  android: {
    available: Boolean(typeof __GOOGLE_PLAY_URL__ !== 'undefined' && __GOOGLE_PLAY_URL__),
    playStoreUrl: typeof __GOOGLE_PLAY_URL__ !== 'undefined' && __GOOGLE_PLAY_URL__ ? __GOOGLE_PLAY_URL__ : '',
    version: null,
    released: null,
    fileName: 'nextora-mini-pos.apk',
    size: null,
    minOs: 'Android 8.0 (Oreo) or newer',
    requirements: [
      { k: 'Operating system', v: 'Android 8.0 (Oreo) or newer' },
      { k: 'Memory', v: '2 GB RAM or more recommended' },
      { k: 'Storage', v: '150 MB free space' },
      { k: 'Printer', v: 'Bluetooth / Wi-Fi thermal printer, optional' },
    ],
  },
};
