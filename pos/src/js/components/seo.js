/* Per-page SEO: unique meta per route + JSON-LD. Pages carry complete static
   <head> tags; this module keeps canonical/OG/JSON-LD in sync with SITE.url. */
import { SITE, DESKTOP, ANDROID, FAQS, RELEASES } from '../../data/site.js';

const pageSeo = {
  '/': {
    title: 'Nextora POS | Offline-First Restaurant Billing Software',
    description: SITE.description,
  },
  '/desktop': {
    title: 'Nextora POS Desktop — Offline Restaurant Billing & Live KDS | Nextora POS',
    description: `${DESKTOP.summary} Offline billing, Live KDS over local Wi-Fi, KOT tickets, recipe inventory, and Owner Cloud Analytics for ₹7,999/year.`,
  },
  '/android': {
    title: 'Nextora POS Mobile — Android Restaurant Billing App | Nextora POS',
    description: `${ANDROID.summary} Fast offline mobile billing, table orders, and Bluetooth/Wi-Fi thermal printing for ₹5,999/year.`,
  },
  '/features': {
    title: 'Features — Offline Billing, Live KDS, Recipes & Cloud Analytics | Nextora POS',
    description: 'Offline-first restaurant billing, Live KDS, KOT kitchen tickets, recipe inventory, Owner Cloud Analytics, thermal printing, and annual licensing.',
  },
  '/how-it-works': {
    title: 'How It Works — Install, Activate, Start Billing | Nextora POS',
    description: 'Install Nextora POS on Windows or Android, activate your annual license and start restaurant billing in three steps.',
  },
  '/pricing': {
    title: 'Pricing — Nextora POS Mobile (₹5,999/yr) & Desktop (₹7,999/yr) | Nextora POS',
    description: 'Transparent annual licensing: Nextora POS Mobile is ₹5,999/year, Nextora POS Desktop is ₹7,999/year. Optional thermal printing is +₹2,000 for either.',
  },
  '/download': {
    title: 'Download — Nextora POS for Windows & Android',
    description: 'Download Nextora POS for Windows and Android from official release sources. System requirements and setup guides included.',
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
    description: 'Answers about offline operation, supported printers, pricing, license activation and renewal, backups and moving devices.',
  },
  '/contact': {
    title: 'Contact Sales & Support | Nextora POS',
    description: 'Talk to Nextora about Nextora POS — request pricing, book a demo, or get support for your restaurant.',
  },
  '/privacy': { title: 'Privacy Policy | Nextora POS', description: 'Privacy policy for Nextora POS (Android and Desktop) and website. Covers local data storage and licensing communications.' },
  '/terms': { title: 'Terms of Service | Nextora POS', description: 'Terms of Service and licensing conditions for Nextora POS.' },
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
    logo: `${SITE.companyUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE.phone.replace(/\s/g, ''),
      email: SITE.email,
      contactType: 'customer support',
      availableLanguage: 'English',
    },
  };
}

function webSiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    publisher: { '@id': `${SITE.companyUrl}/#organization` },
  };
}

function appLd() {
  return [
    {
      '@type': 'SoftwareApplication',
      name: 'Nextora POS Desktop',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Windows 10, Windows 11',
      description: DESKTOP.summary,
      softwareVersion: RELEASES.desktop.version || undefined,
      offers: {
        '@type': 'Offer',
        price: '7999',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2027-12-31',
      },
      publisher: { '@id': `${SITE.companyUrl}/#organization` },
      url: `${SITE.url}/desktop`,
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Nextora POS Mobile',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Android 8.0 and above',
      description: ANDROID.summary,
      softwareVersion: RELEASES.android.version || undefined,
      offers: {
        '@type': 'Offer',
        price: '5999',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2027-12-31',
      },
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
  const ld = [orgLd(), webSiteLd(), ...appLd()];
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
