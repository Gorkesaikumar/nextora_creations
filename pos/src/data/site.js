/* ============================================================
   NEXTORA POS — Site & Product Configuration
   Single source of truth for product facts, copy, links and
   release metadata. Update product capabilities HERE only.
   ============================================================ */

export const SITE = {
  name: 'Nextora POS',
  company: 'Nextora Creations',
  companyUrl: 'https://nextoracreations.co.in',
  companyPos: 'A product of Nextora Creations.',
  tagline: 'Billing that keeps working.',
  description:
    'Nextora POS is an offline-first billing application for Windows and Android with fast billing, local data storage, backup and supported thermal printing.',
  url: typeof __SITE_URL__ !== 'undefined' ? __SITE_URL__ : 'https://pos.nextoracreations.co.in',
  email: 'support@nextoracreations.co.in',
  phone: '+91 7674981970',
  phoneHref: 'tel:+917674981970',
  calendly: 'https://calendly.com/gorkesaikumar/30min',
  // Contact form posts to the company's existing Apps Script lead endpoint
  // (same one used by the main website).
  formAction:
    'https://script.google.com/macros/s/AKfycbwj8ewoi-zyYufafUrlxkU8wVqbrZDXkSQn_DSIssFbDsmXub-CB6lNxGxHbTXpAlJ-TQ/exec',
  analyticsId: 'G-DNFKFLE1GL',
};

export const DESKTOP = {
  id: 'desktop',
  name: 'Nextora POS Desktop',
  shortName: 'Desktop',
  platform: 'Windows',
  platformDetail: 'Windows 10 (64-bit) or newer',
  connection: 'ESC/POS — USB / serial, where supported',
  headline: 'Built for your billing counter.',
  summary:
    'A focused Windows billing application designed to keep everyday billing simple, fast and available even when internet connectivity isn\u2019t.',
  url: '/desktop',
  downloadUrl: '/download',
  features: [
    { title: 'Offline-first billing', body: 'Billing runs on locally stored data and continues when the network drops.' },
    { title: 'Fast item selection', body: 'Organized items with quick search to move from selection to bill in seconds.' },
    { title: 'Bill generation', body: 'Numbered bills with itemized totals, ready for the counter workflow.' },
    { title: 'Thermal receipt printing', body: 'Print receipts on supported ESC/POS thermal printers.' },
    { title: 'Item management', body: 'Add, edit and organize the items your counter sells every day.' },
    { title: 'Local backups', body: 'Export backups to a file and restore them when moving or recovering data.' },
    { title: 'License activation', body: 'Activate your device with the annual license key supplied by Nextora.' },
    { title: 'Software updates', body: 'Check for and install supported product updates from within the app.' },
  ],
  screens: ['billing', 'items', 'bills', 'settings', 'printer', 'backup', 'license', 'updates'],
};

export const ANDROID = {
  id: 'android',
  name: 'Nextora POS Android',
  shortName: 'Android',
  platform: 'Android',
  platformDetail: 'Android 8.0 or newer',
  connection: 'Bluetooth / Wi-Fi, where supported',
  headline: 'Billing wherever your business needs it.',
  summary:
    'Run essential billing directly from Android and print receipts using supported thermal printers \u2014 at the counter or on the move.',
  url: '/android',
  downloadUrl: '/download',
  features: [
    { title: 'Offline billing', body: 'Create bills from locally stored items without depending on connectivity.' },
    { title: 'Item management', body: 'Maintain your item list with prices ready for quick selection.' },
    { title: 'Bill creation', body: 'Build bills line by line with live totals as you go.' },
    { title: 'Bluetooth thermal printing', body: 'Print receipts on supported Bluetooth thermal printers, where supported.' },
    { title: 'Wi-Fi thermal printing', body: 'Print to supported network thermal printers over Wi-Fi, where supported.' },
    { title: 'Backup export', body: 'Export a backup file of your billing data whenever you choose.' },
    { title: 'Backup import & restore', body: 'Import a backup file to restore your items and billing data.' },
    { title: 'License activation', body: 'Activate with your annual license key and check for updates in-app.' },
  ],
  screens: ['billing', 'items', 'bill-preview', 'printer', 'backup', 'settings', 'license'],
};

/* Feature grid on the homepage — 8 meaningful capabilities, no fluff. */
export const FEATURES = [
  { icon: 'offline', title: 'Offline-first billing', body: 'Keep supported billing workflows available without constant internet dependency.' },
  { icon: 'bolt', title: 'Fast checkout', body: 'Designed to minimize the steps between item selection and bill generation.' },
  { icon: 'printer', title: 'Thermal printing', body: 'Print receipts through supported thermal printers on both platforms.' },
  { icon: 'device', title: 'Local data', body: 'Core billing information is stored locally on the device, not on someone else\u2019s server.' },
  { icon: 'backup', title: 'Backup & restore', body: 'Export backups to a file and restore them onto any device running Nextora POS.' },
  { icon: 'devices', title: 'Windows + Android', body: 'Choose the device that fits your counter \u2014 or use both with separate licenses.' },
  { icon: 'key', title: 'Annual licensing', body: 'One simple yearly license per device, with renewal reminders before expiry.' },
  { icon: 'update', title: 'Software updates', body: 'Check for and install supported product updates from inside the app.' },
];

export const COMPARISON = [
  { label: 'Platform', desktop: 'Windows 10+ (64-bit)', android: 'Android 8.0+' },
  { label: 'Offline billing', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'Local database', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'Thermal printing', desktop: 'ESC/POS \u2014 USB / serial, where supported', android: 'Bluetooth / Wi-Fi, where supported' },
  { label: 'Backup export', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'Backup import / restore', desktop: 'Yes', android: 'Yes', yes: true },
  { label: 'License model', desktop: 'Annual, per device', android: 'Annual, per device' },
  { label: 'Update mechanism', desktop: 'In-app update check', android: 'In-app update check \u00b7 APK install' },
  { label: 'Distribution', desktop: 'Windows installer from nextoracreations.co.in', android: 'APK from official Nextora release source' },
  { label: 'Recommended use', desktop: 'Fixed counter \u2014 caf\u00e9s, restaurants, shops', android: 'Mobile billing \u2014 tables, deliveries, pop-up counters' },
];

export const LICENSE_STEPS = [
  { n: '01', title: 'Purchase / request a license', body: 'Contact Nextora for an annual license for each device you want to activate.' },
  { n: '02', title: 'Receive your activation key', body: 'We issue a license key for the product and platform you purchased.' },
  { n: '03', title: 'Activate the device', body: 'Enter the key in License settings. Internet access is required for activation.' },
  { n: '04', title: 'License stays valid', body: 'Billing continues normally for the license period \u2014 online or offline.' },
  { n: '05', title: 'Renew annually', body: 'Renew before expiry to keep receiving updates and continued support.' },
];

export const HOW_IT_WORKS = [
  { n: '01', title: 'Install Nextora POS', body: 'Choose Windows or Android and install from the official download source.' },
  { n: '02', title: 'Activate your license', body: 'Enter the activation key supplied by Nextora to enable the device.' },
  { n: '03', title: 'Start billing', body: 'Set up your items and supported printer, then begin billing \u2014 no internet required.' },
];

/* Support center content */
export const SUPPORT_TOPICS = [
  { slug: 'getting-started', title: 'Getting Started', desc: 'Install, activate and set up your first bill.' },
  { slug: 'desktop', title: 'Desktop Setup', desc: 'Windows installation, printer and data setup.' },
  { slug: 'android', title: 'Android Setup', desc: 'APK install, permissions and first run.' },
  { slug: 'printers', title: 'Printer Setup', desc: 'Connect ESC/POS, Bluetooth and Wi-Fi printers.' },
  { slug: 'activation', title: 'License Activation', desc: 'Activate, check validity and renew.' },
  { slug: 'backup-restore', title: 'Backup & Restore', desc: 'Export, import and move your data safely.' },
  { slug: 'updates', title: 'Software Updates', desc: 'Check for and install product updates.' },
];

export const FAQS = [
  {
    q: 'Does Nextora POS work without internet?',
    a: 'Yes. Core billing workflows run on data stored locally on your device, so billing continues when the internet is down. Activities that need connectivity \u2014 license activation, software updates and downloads \u2014 require an internet connection.',
  },
  {
    q: 'Which printers are supported?',
    a: 'Desktop prints to supported ESC/POS thermal printers over USB or serial. Android prints to supported Bluetooth and Wi-Fi thermal printers. Printer compatibility can vary by model and connection type, so we recommend testing your printer model with the trial before purchase.',
  },
  {
    q: 'How do I activate Nextora POS?',
    a: 'Open License settings in the app and enter the activation key supplied by Nextora for that device. Activation validates your key over the internet once; after that, billing works online or offline.',
  },
  {
    q: 'What happens when my annual license expires?',
    a: 'The app will remind you as expiry approaches. After expiry, billing stops until the license is renewed \u2014 your locally stored data remains on the device.',
  },
  {
    q: 'How do I renew?',
    a: 'Contact Nextora before your license expires and we will issue a renewal. Enter the renewal in the app\u2019s License settings to continue.',
  },
  {
    q: 'How do I back up my data?',
    a: 'Both apps let you export a backup file. On Desktop, use Backup settings to export to a file location of your choice. On Android, use Backup to export a backup file to your device storage. We recommend exporting regularly, especially before updates or device changes.',
  },
  {
    q: 'How do I restore a backup?',
    a: 'Use the import/restore option in Backup settings and select your backup file. Restoring replaces the current local data with the backup\u2019s contents, so always export a fresh backup first if you need the current data.',
  },
  {
    q: 'Can I move Nextora POS to another device?',
    a: 'Yes. Export a backup from the old device, install Nextora POS on the new device, activate it with your license, then import the backup. Contact us if you need a device change applied to your license.',
  },
  {
    q: 'Where should I download updates?',
    a: 'Only from inside the app\u2019s update check or from the official Nextora POS website \u2014 pos.nextoracreations.co.in. Do not download installers or APKs from third-party sites or messaging apps.',
  },
  {
    q: 'Does Android support Bluetooth printers?',
    a: 'Yes, where the printer model supports it. Pair the printer in Android settings, then select it in Nextora POS printer setup. Wi-Fi thermal printers are supported the same way.',
  },
];

/*
 * Release metadata — version-gated.
 * IMPORTANT: never hardcode invented versions here. When a build is ready,
 * set `available: true` and fill in the real values (or serve this object
 * from a controlled endpoint and fetch it). Everything on the /download and
 * /releases pages renders from these fields.
 */
export const RELEASES = {
  desktop: {
    available: false,
    version: null,
    released: null,
    fileName: 'NextoraPOS-Setup.exe',
    size: null,
    requirements: [
      { k: 'Operating system', v: 'Windows 10 (64-bit) or newer' },
      { k: 'Memory', v: '4 GB RAM or more recommended' },
      { k: 'Storage', v: '500 MB free space' },
      { k: 'Printer', v: 'ESC/POS thermal printer (USB / serial), optional' },
      { k: 'Display', v: '1366 \u00d7 768 or higher' },
    ],
  },
  android: {
    available: false,
    version: null,
    released: null,
    fileName: 'nextora-pos.apk',
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
