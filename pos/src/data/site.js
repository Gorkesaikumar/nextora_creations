/* ============================================================
   NEXTORA POS — Site & Product Configuration
   Single source of truth for product facts, copy, links and
   release metadata. Update product capabilities HERE only.
   ============================================================ */

export const SITE = {
  name: 'Nextora POS',
  productName: 'Nextora POS',
  legacyName: 'Nextora Mini POS',
  company: 'Nextora Creations',
  companyUrl: 'https://nextoracreations.co.in',
  companyPos: 'A product of Nextora Creations.',
  tagline: "Restaurant billing that works even offline.",
  description:
    'Nextora POS is an offline-first restaurant billing software for Windows and Android. Bill customers, print receipts, manage kitchen orders, and track stock with cloud analytics.',
  url: typeof __SITE_URL__ !== 'undefined' && __SITE_URL__ ? __SITE_URL__ : 'https://pos.nextoracreations.co.in',
  ownerUrl: 'https://owner.nextoracreations.co.in',
  ownerApiUrl: 'https://ownerapi.nextoracreations.co.in',
  email: typeof __SUPPORT_EMAIL__ !== 'undefined' && __SUPPORT_EMAIL__ ? __SUPPORT_EMAIL__ : 'support@nextoracreations.co.in',
  phone: typeof __SUPPORT_PHONE__ !== 'undefined' && __SUPPORT_PHONE__ ? __SUPPORT_PHONE__ : '+91 76749 81970',
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

/* ============================================================
   COMMERCIAL LICENSING & PRICING
   Strictly two annual plans: Mobile (₹5,999/yr) & Desktop (₹7,999/yr)
   Thermal printing is an optional add-on (+₹2,000) for either.
   Desktop + App Bundle is permanently removed.
   Live KDS and Cloud Analytics are exclusive to Desktop.
   ============================================================ */
export const PRICING = {
  mobile: {
    id: 'mobile',
    name: 'Nextora POS Mobile',
    platform: 'Android 8.0+',
    badge: 'Mobile Billing',
    annualPrice: '₹5,999',
    annualPriceNumber: 5999,
    period: '/ year',
    modelLabel: 'Annual License',
    subLabel: 'Per mobile device · billed yearly',
    summary: 'Fast, portable restaurant billing for Android smartphones and tablets.',
    thermalAddon: '+₹2,000',
    thermalAddonNumber: 2000,
    combinedTotal: '₹7,999',
    combinedTotalNumber: 7999,
    combinedLabel: '₹7,999 / year with thermal printing',
    included: [
      'Mobile restaurant billing on Android',
      '100% offline billing with local SQLite storage',
      'Menu, item & category management',
      'Bill history & daily sales summaries',
      'Database backup export & restore',
      'Annual license for 1 device (billed yearly)',
      'Software updates & customer support',
    ],
    addonNote: 'Optional add-on: Thermal receipt printing (+₹2,000 via Bluetooth/Wi-Fi)',
    exclusions: [
      'Live KDS (Kitchen Display System) — Desktop only',
      'Nextora Owner Cloud Analytics remote sync — Desktop only',
    ],
    ctaText: 'Get Nextora POS Mobile',
    ctaHref: '/pricing#request',
  },
  desktop: {
    id: 'desktop',
    name: 'Nextora POS Desktop',
    platform: 'Windows 10 / 11 (64-bit)',
    badge: 'Complete Restaurant Solution',
    featured: true,
    annualPrice: '₹7,999',
    annualPriceNumber: 7999,
    period: '/ year',
    modelLabel: 'Annual License',
    subLabel: 'Per PC counter · billed yearly',
    summary: 'Complete restaurant management: billing, Live KDS, stock inventory & cloud analytics.',
    thermalAddon: '+₹2,000',
    thermalAddonNumber: 2000,
    combinedTotal: '₹9,999',
    combinedTotalNumber: 9999,
    combinedLabel: '₹9,999 / year with thermal printing',
    included: [
      'Offline-first restaurant billing (Windows)',
      'Live Kitchen Display System (KDS) via local LAN/Wi-Fi',
      'Kitchen Order Ticket (KOT) workflow & printing',
      'Stock inventory & recipe management (COGS, wastage)',
      'Nextora Owner Cloud Analytics remote sync',
      'User roles (Admin, Cashier, Kitchen Staff)',
      'Local database & automatic backup restore',
      'Annual license for 1 PC (billed yearly)',
      'Software updates & priority support',
    ],
    addonNote: 'Optional add-on: Thermal receipt printing (+₹2,000 via USB/Serial)',
    exclusions: [],
    ctaText: 'Get Nextora POS Desktop',
    ctaHref: '/pricing#request',
  },
};

export const DESKTOP = {
  id: 'desktop',
  name: 'Nextora POS Desktop',
  shortName: 'Desktop',
  platform: 'Windows',
  platformDetail: 'Windows 10 (64-bit) or Windows 11',
  connection: 'ESC/POS — USB / serial, where supported (Optional Add-on +₹2,000)',
  headline: 'The complete restaurant billing & kitchen system.',
  summary:
    'A powerhouse Windows restaurant application engineered to run offline-first billing, broadcast live kitchen orders over local Wi-Fi, manage inventory recipes, and sync to owner analytics.',
  url: '/desktop',
  downloadUrl: '/download',
  annualPrice: '₹7,999 / year',
  thermalPrice: '+₹2,000',
  features: [
    { title: 'Offline-first restaurant billing', body: 'Billing runs on a fast local SQLite database and continues smoothly when internet connectivity drops.' },
    { title: 'Live Kitchen Display System (KDS)', body: 'Built-in local LAN server broadcasts order updates to kitchen screens in real time without cloud latency.' },
    { title: 'Kitchen Order Ticket (KOT) workflow', body: 'Generate numbered KOTs with table numbers and item preparation notes, formatted cleanly without prices.' },
    { title: 'Stock inventory & recipe management', body: 'Track raw materials, map ingredients to dishes, deduct stock automatically on billing, and log wastage.' },
    { title: 'Nextora Owner Cloud Analytics', body: 'Syncs sales records to owner.nextoracreations.co.in when connected for remote KPIs, reports, and PDF/Excel exports.' },
    { title: 'User roles & access control', body: 'Separate logins for Admin, Cashier, and Kitchen Staff to protect financials and sensitive reports.' },
    { title: 'Thermal receipt printing', body: 'Print receipts on standard 58mm/80mm ESC/POS printers via USB or serial (optional add-on: +₹2,000).' },
    { title: 'Local backups & restore', body: 'Export complete database backup archives to local files or USB drives with one-click restore.' },
    { title: 'Annual license activation', body: 'Activate your PC with your annual license key; license stays valid offline for 365 days.' },
  ],
  screens: ['billing', 'items', 'bills', 'kds', 'inventory', 'reports', 'settings', 'printer', 'backup', 'license'],
};

export const ANDROID = {
  id: 'android',
  name: 'Nextora POS Mobile',
  shortName: 'Mobile',
  platform: 'Android',
  platformDetail: 'Android 8.0 or newer',
  connection: 'Bluetooth / Wi-Fi thermal printers (Optional Add-on +₹2,000)',
  headline: 'Restaurant billing wherever your team moves.',
  summary:
    'Run fast restaurant billing directly from Android smartphones and tablets with local offline data, table management, and Bluetooth/Wi-Fi printing.',
  url: '/android',
  downloadUrl: '/download',
  annualPrice: '₹5,999 / year',
  thermalPrice: '+₹2,000',
  features: [
    { title: 'Offline mobile billing', body: 'Create restaurant bills from locally stored menus directly on Android without depending on cloud connectivity.' },
    { title: 'Fast touch checkout', body: 'Category filters, quick search, and live bill review designed for handheld tablets and phones.' },
    { title: 'Bluetooth & Wi-Fi thermal printing', body: 'Print receipts on supported Bluetooth or Wi-Fi thermal printers (optional add-on: +₹2,000).' },
    { title: 'Menu & item management', body: 'Maintain your dish catalog, categories, and prices ready for quick counter selection.' },
    { title: 'Bill history & daily summaries', body: 'Review daily revenue, order counts, and cash/UPI/card breakdowns right on mobile.' },
    { title: 'Backup export & restore', body: 'Safeguard your billing records to device storage anytime with simple import options.' },
    { title: 'Annual license activation', body: 'Activate with your annual license key and check for updates in-app.' },
  ],
  exclusions: [
    'Live KDS and Nextora Owner Cloud Analytics are exclusive to Nextora POS Desktop and not included in Mobile.',
  ],
  screens: ['billing', 'items', 'bill-preview', 'printer', 'backup', 'settings', 'license'],
};

export const OWNER_CLOUD = {
  id: 'cloud',
  name: 'Nextora Owner Cloud Analytics',
  shortName: 'Cloud Analytics',
  url: 'https://owner.nextoracreations.co.in',
  apiUrl: 'https://ownerapi.nextoracreations.co.in',
  headline: 'Monitor your restaurant from anywhere.',
  summary:
    'A secure, read-only remote dashboard for restaurant owners. Access synchronized sales KPIs, daily bills, product performance, and PDF/Excel exports from any web browser.',
  note: 'Available exclusively with Nextora POS Desktop terminals.',
  features: [
    { title: 'Sales KPIs & Revenue trends', body: 'Real-time overview of gross sales, net revenue, average order value, discounts, and tax totals.' },
    { title: 'Hourly sales patterns', body: 'Analyze peak ordering times and hourly volume to optimize counter and kitchen staffing.' },
    { title: 'Product performance analytics', body: 'Track best-selling items, revenue contributors, and sales quantities across customizable date ranges.' },
    { title: 'Bill & invoice ledger', body: 'Inspect individual bills, line items, order types (Dine-in, Takeaway), and payment breakdowns (Cash, UPI, Card).' },
    { title: 'Terminal connection monitoring', body: 'Verify paired Desktop POS sync heartbeats and last transmission timestamps.' },
    { title: 'PDF & Excel export generation', body: 'Download formal business sales reports in spreadsheet and printable PDF formats for bookkeeping.' },
  ],
};

/* Feature grid on the homepage — 8 verified capabilities */
export const FEATURES = [
  { icon: 'offline', title: 'Offline-first billing', body: 'Restaurant counter billing continues 100% uninterrupted even during complete internet outages.' },
  { icon: 'bolt', title: 'Fast checkout & KOT', body: 'Move from table selection to kitchen ticket and customer bill in seconds.' },
  { icon: 'monitor', title: 'Live KDS (Desktop only)', body: 'Broadcast real-time order tickets to kitchen display screens over local LAN/Wi-Fi without cloud lag.' },
  { icon: 'receipt', title: 'Recipe & stock inventory (Desktop)', body: 'Map ingredients to dishes, deduct stock on sales, log wastage, and calculate food cost.' },
  { icon: 'chart', title: 'Owner Cloud Analytics (Desktop)', body: 'Remote owner portal at owner.nextoracreations.co.in for revenue trends, bill ledgers, and reports.' },
  { icon: 'printer', title: 'Thermal printing (Optional add-on)', body: 'Supported 58mm & 80mm ESC/POS printers via USB/Serial on Desktop and Bluetooth/Wi-Fi on Mobile (+₹2,000).' },
  { icon: 'device', title: 'Local SQLite database', body: 'Transactions live securely in a local database file on your device, guaranteeing instant speed and privacy.' },
  { icon: 'key', title: 'Annual licensing', body: 'Transparent yearly subscription (Mobile ₹5,999/yr, Desktop ₹7,999/yr) with 365-day offline validity.' },
];

export const COMPARISON = [
  { label: 'Annual licence price', desktop: '₹7,999 / year', mobile: '₹5,999 / year', highlight: true },
  { label: 'Platform & Operating System', desktop: 'Windows 10 / 11 (64-bit)', mobile: 'Android 8.0+' },
  { label: 'Restaurant billing', desktop: 'Included — Fixed counter workflow', mobile: 'Included — Mobile & table service', yes: true },
  { label: 'Offline billing', desktop: 'Included — Local SQLite database', mobile: 'Included — Local SQLite database', yes: true },
  { label: 'Live KDS (Kitchen Display)', desktop: 'Included — Local LAN / Wi-Fi server', mobile: 'Not included (Desktop only)', desktopYes: true, mobileNo: true },
  { label: 'Kitchen Order Tickets (KOT)', desktop: 'Included — Ticket print & status flow', mobile: 'Included — Mobile ticket printing', yes: true },
  { label: 'Stock inventory & recipes', desktop: 'Included — Recipes, COGS, wastage', mobile: 'Included — Basic stock catalog', highlight: true },
  { label: 'Owner Cloud Analytics', desktop: 'Included — owner.nextoracreations.co.in', mobile: 'Not included (Desktop only)', desktopYes: true, mobileNo: true },
  { label: 'Thermal receipt printing', desktop: 'Optional Add-on: +₹2,000 (USB / Serial)', mobile: 'Optional Add-on: +₹2,000 (Bluetooth / Wi-Fi)' },
  { label: 'Combined 1st-year with printing', desktop: '₹9,999 / year', mobile: '₹7,999 / year', highlight: true },
  { label: 'User roles & permissions', desktop: 'Admin, Cashier, Kitchen Staff', mobile: 'Basic Manager PIN' },
  { label: 'Local backup & restore', desktop: 'Included — Disk & USB export', mobile: 'Included — Device storage export', yes: true },
  { label: 'Recommended restaurant use', desktop: 'Fixed billing counter, QSR, Dine-in', mobile: 'Handheld table billing, food trucks, pop-ups' },
];

export const LICENSE_STEPS = [
  { n: '01', title: 'Choose Desktop or Mobile', body: 'Select Nextora POS Desktop (₹7,999/yr) or Nextora POS Mobile (₹5,999/yr) based on your counter setup.' },
  { n: '02', title: 'Add optional thermal printing', body: 'Include thermal receipt printing (+₹2,000) if you connect a 58mm or 80mm thermal printer.' },
  { n: '03', title: 'Receive your activation key', body: 'We issue an annual license key specifically bound to your purchased device.' },
  { n: '04', title: 'Activate once online', body: 'Enter the key in License settings. Internet is required once for cryptographic activation.' },
  { n: '05', title: 'Run offline for 365 days', body: 'Billing, KOTs, and local operations run 100% offline for the full annual license period.' },
];

export const HOW_IT_WORKS = [
  { n: '01', title: 'Install Nextora POS', body: 'Install on your Windows counter PC or Android handheld device from official release sources.' },
  { n: '02', title: 'Activate your annual license', body: 'Enter the activation key supplied by Nextora to bind and enable the terminal for one year.' },
  { n: '03', title: 'Start offline billing', body: 'Add your menu, set up table numbering, connect your thermal printer, and take bills without internet.' },
];

/* Support center content */
export const SUPPORT_TOPICS = [
  { slug: 'getting-started', title: 'Getting Started', desc: 'Install, activate and take your first bill.' },
  { slug: 'desktop', title: 'Desktop Setup', desc: 'Windows installation, KDS setup, and printer config.' },
  { slug: 'android', title: 'Android Setup', desc: 'App install, permissions, Bluetooth and first run.' },
  { slug: 'billing', title: 'Everyday Billing', desc: 'Table orders, KOT generation, and bill settlement.' },
  { slug: 'printers', title: 'Printer Setup', desc: 'Connect ESC/POS USB, Bluetooth and Wi-Fi printers.' },
  { slug: 'activation', title: 'License Activation', desc: 'Activate, check validity and renew annual keys.' },
  { slug: 'backup-restore', title: 'Backup & Restore', desc: 'Export, import and safeguard your data safely.' },
  { slug: 'troubleshooting', title: 'Troubleshooting', desc: 'Diagnostic steps for printers, sync, and license.' },
  { slug: 'updates', title: 'Software Updates', desc: 'Check for and install product updates.' },
];

export const FAQS = [
  {
    q: 'How does Nextora POS pricing work?',
    a: 'Nextora POS is offered as a transparent annual license: Nextora POS Mobile is ₹5,999 per year, and Nextora POS Desktop is ₹7,999 per year. Each license is valid for 365 days on one device. Thermal receipt printing is an optional add-on for an additional ₹2,000 per year on either product (total ₹7,999/yr for Mobile or ₹9,999/yr for Desktop with printing).',
  },
  {
    q: 'What is the difference between Desktop and Mobile?',
    a: 'Nextora POS Desktop (₹7,999/yr) is the complete restaurant management solution for fixed billing counters. It includes offline billing, Live Kitchen Display System (KDS) via local LAN/Wi-Fi, KOT tickets, recipe-level stock inventory (COGS, wastage), user roles (Admin, Cashier, Kitchen Staff), and synchronization to Nextora Owner Cloud Analytics (owner.nextoracreations.co.in). Nextora POS Mobile (₹5,999/yr) is a focused handheld billing solution for Android tablets and phones; Live KDS and Owner Cloud Analytics are exclusive to Desktop and not included in Mobile.',
  },
  {
    q: 'Is there a Desktop + Mobile bundle?',
    a: 'No. Desktop and Mobile are independent products with separate per-device annual licenses. If you need both a fixed counter PC and a mobile handheld terminal, they are purchased as individual licenses (Desktop at ₹7,999/yr and Mobile at ₹5,999/yr).',
  },
  {
    q: 'Does Nextora POS work without internet?',
    a: 'Yes. Core billing workflows run on a local SQLite database stored directly on your device, so billing continues seamlessly even when the internet is completely down. Connectivity is only required for initial license activation, software updates, and cloud synchronization.',
  },
  {
    q: 'How does Live KDS work in Nextora POS Desktop?',
    a: 'Nextora POS Desktop includes a built-in LAN server that runs on your local Wi-Fi router. Kitchen display screens, tablets, or monitors open the local kitchen app and pair via a 6-digit code. Kitchen orders appear on the display in real time without needing an active internet connection.',
  },
  {
    q: 'What is Nextora Owner Cloud Analytics?',
    a: 'Nextora Owner Cloud Analytics (https://owner.nextoracreations.co.in) is a remote, read-only web portal for restaurant owners with Nextora POS Desktop. When the counter PC is online, it securely transmits synchronized sales totals, bill ledgers, product performance, and hourly trends so owners can check revenue and download PDF/Excel reports from any browser.',
  },
  {
    q: 'Which thermal printers are supported?',
    a: 'Desktop supports ESC/POS thermal printers connected via USB or serial ports. Mobile supports thermal printers via Bluetooth (SPP/BLE) or local Wi-Fi. Thermal printing is available as an optional add-on for +₹2,000/year.',
  },
  {
    q: 'How long is the license valid and how do renewals work?',
    a: 'Each license is valid for one full year (365 days) from activation. The app displays timely renewal reminders as expiry approaches so you can renew without disruption. After expiry, billing pauses until renewed, but your locally stored data remains completely safe on the device.',
  },
  {
    q: 'How do I back up my restaurant data?',
    a: 'Both Desktop and Mobile allow you to export a complete encrypted database backup file. On Desktop, use Backup settings to save to local disk or a USB drive. On Mobile, export to device storage. Backups can be restored at any time to recover or migrate devices.',
  },
];

export const RELEASES = {
  desktop: {
    available: Boolean(typeof __WINDOWS_DOWNLOAD_URL__ !== 'undefined' && __WINDOWS_DOWNLOAD_URL__),
    downloadUrl: typeof __WINDOWS_DOWNLOAD_URL__ !== 'undefined' && __WINDOWS_DOWNLOAD_URL__ ? __WINDOWS_DOWNLOAD_URL__ : '',
    version: '1.3.0',
    released: null,
    fileName: 'Nextora-POS-Setup-1.3.0.exe',
    size: null,
    requirements: [
      { k: 'Operating system', v: 'Windows 10 (64-bit) or Windows 11' },
      { k: 'Memory', v: '4 GB RAM or more recommended' },
      { k: 'Storage', v: '500 MB free space' },
      { k: 'Printer', v: 'ESC/POS thermal printer (USB / serial), optional add-on' },
      { k: 'Display', v: '1366 × 768 or higher' },
    ],
  },
  android: {
    available: Boolean(typeof __GOOGLE_PLAY_URL__ !== 'undefined' && __GOOGLE_PLAY_URL__),
    playStoreUrl: typeof __GOOGLE_PLAY_URL__ !== 'undefined' && __GOOGLE_PLAY_URL__ ? __GOOGLE_PLAY_URL__ : '',
    version: '1.2.5',
    released: null,
    fileName: 'NextoraPOS-v1.2.5.apk',
    size: null,
    minOs: 'Android 8.0 (Oreo) or newer',
    requirements: [
      { k: 'Operating system', v: 'Android 8.0 (Oreo) or newer' },
      { k: 'Memory', v: '2 GB RAM or more recommended' },
      { k: 'Storage', v: '150 MB free space' },
      { k: 'Printer', v: 'Bluetooth / Wi-Fi thermal printer, optional add-on' },
    ],
  },
};
