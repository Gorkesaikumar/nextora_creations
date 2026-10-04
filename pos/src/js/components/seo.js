/* Per-page SEO: unique meta per route + JSON-LD. Pages carry complete static
   <head> tags; this module keeps canonical/OG/JSON-LD in sync with SITE.url. */
import { SITE, DESKTOP, ANDROID, FAQS, RELEASES } from '../../data/site.js';

const pageSeo = {
  '/': {
    title: 'Nextora POS — Offline Billing Software for Windows & Android',
    description: SITE.description,
  },
  '/desktop': {
    title: 'Nextora POS Desktop — Windows Billing Software | Nextora POS',
    description: `${DESKTOP.summary} Offline billing, fast item selection, thermal receipt printing and local backups.`,
  },
  '/android': {
    title: 'Nextora POS Android — Offline Billing App | Nextora POS',
    description: `${ANDROID.summary} Offline billing, item management, Bluetooth/Wi-Fi thermal printing and backup restore.`,
  },
  '/features': {
    title: 'Features — Offline Billing, Local Data, Thermal Printing | Nextora POS',
    description: 'Offline-first billing, fast checkout, local data storage, backup & restore, thermal printing and annual licensing across Windows and Android.',
  },
  '/how-it-works': {
    title: 'How It Works — Install, Activate, Start Billing | Nextora POS',
    description: 'Install Nextora POS on Windows or Android, activate your annual license and start billing in three steps.',
  },
  '/pricing': {
    title: 'Pricing — Simple Annual Licensing | Nextora POS',
    description: 'Nextora POS uses simple annual licensing for Desktop and Android. Request pricing for a single counter or a Desktop + Android bundle.',
  },
  '/download': {
    title: 'Download — Nextora POS for Windows & Android',
    description: 'Download Nextora POS Desktop for Windows or the Nextora POS Android APK from the official Nextora release source. System requirements and installation guides included.',
  },
  '/releases': {
    title: 'Releases — Nextora POS Version History',
    description: 'Official Nextora POS release history and software updates for Windows and Android.',
  },
  '/support': {
    title: 'Support — Setup, Printing, Licensing & Backups | Nextora POS',
    description: 'Guides for getting started, desktop and Android setup, printer configuration, license activation, backup & restore and software updates.',
  },
  '/faq': {
    title: 'FAQ — Offline Billing, Printers, Licensing & Backups | Nextora POS',
    description: 'Answers about offline operation, supported printers, license activation and renewal, backups and moving devices.',
  },
  '/contact': {
    title: 'Contact Sales & Support | Nextora POS',
    description: 'Talk to Nextora about Nextora POS — request pricing, a demo or support for your business.',
  },
  '/privacy': { title: 'Privacy Policy | Nextora POS', description: 'How Nextora POS and pos.nextoracreations.co.in handle information.' },
  '/terms': { title: 'Terms of Service | Nextora POS', description: 'Terms for using Nextora POS and this website.' },
  '/license': { title: 'License Terms | Nextora POS', description: 'Nextora POS annual license terms: activation, devices, renewal and data responsibility.' },
};

const UNINDEXED = new Set(['/privacy', '/terms', '/license']);

function orgLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.companyUrl}/#organization`,
    name: SITE.company,
    url: SITE.companyUrl,
    logo: `${SITE.companyUrl}/logo.webp`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE.phone.replace(/\s/g, ''),
      email: SITE.email,
      contactType: 'sales',
      availableLanguage: 'English',
    },
  };
}

function appLd() {
  const offer = { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/PreOrder' };
  return [
    {
      '@type': 'SoftwareApplication',
      name: 'Nextora POS Desktop',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Windows',
      description: DESKTOP.summary,
      softwareVersion: RELEASES.desktop.version || undefined,
      offers: offer,
      publisher: { '@id': `${SITE.companyUrl}/#organization` },
      url: `${SITE.url}/desktop`,
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Nextora POS Android',
      applicationCategory: 'MobileApplication',
      operatingSystem: 'Android',
      description: ANDROID.summary,
      softwareVersion: RELEASES.android.version || undefined,
      offers: offer,
      publisher: { '@id': `${SITE.companyUrl}/#organization` },
      url: `${SITE.url}/android`,
    },
  ];
}

function faqLd() {
  return {
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function crumbsLd(labels) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: labels.map((name, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE.url}${i === 0 ? '/' : '/' + labels.slice(1, i + 1).join('-').toLowerCase()}`,
    })),
  };
}

export function injectSEO() {
  const d = document;
  const path = d.body.dataset.path || '/';
  const staticDesc = d.head.querySelector('meta[name="description"]')?.content || '';
  const meta = pageSeo[path] || {
    title: d.title || SITE.name,
    description: staticDesc || SITE.description,
  };

  const setMeta = (attr, key, content) => {
    let n = d.head.querySelector(`meta[${attr}="${key}"]`);
    if (!n) {
      n = d.createElement('meta');
      n.setAttribute(attr, key);
      d.head.appendChild(n);
    }
    n.setAttribute('content', content);
  };

  d.title = meta.title;
  setMeta('name', 'description', meta.description);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:url', SITE.url + (path === '/' ? '/' : path));
  setMeta('property', 'og:image', `${SITE.url}/brand/og-cover.png`);
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  setMeta('name', 'twitter:image', `${SITE.url}/brand/og-cover.png`);

  let canonical = d.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = d.createElement('link');
    canonical.rel = 'canonical';
    d.head.appendChild(canonical);
  }
  canonical.href = SITE.url + (path === '/' ? '/' : path);

  /* JSON-LD — skip entirely on legal pages */
  if (UNINDEXED.has(path)) return;
  const ld = [orgLd(), ...appLd()];
  if (path === '/' || path === '/faq') ld.push(faqLd());
  if (path !== '/') {
    const parts = path.split('/').filter(Boolean);
    const labels = ['Nextora POS', ...parts.map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))];
    ld.push(crumbsLd(labels));
  }
  const s = d.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(ld);
  d.head.appendChild(s);
}
