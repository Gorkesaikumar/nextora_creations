/* Support & FAQ pages: render FAQ from data with live search. */
import { FAQS } from '../../data/site.js';
import { bindTrackers, track } from '../components/analytics.js';
import { ICONS } from '../icons.js';

function renderFaq(filter = '') {
  const list = document.getElementById('faq-list');
  if (!list) return;
  const q = filter.trim().toLowerCase();
  const items = FAQS.filter(
    (f) => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
  );

  list.innerHTML = items
    .map(
      (f, i) => `
      <details class="faq" ${i === 0 && !q ? 'open' : ''}>
        <summary>${f.q}<span class="ind"><i data-icon="plus"></i></span></summary>
        <div class="faq__a">${f.a}</div>
      </details>`
    )
    .join('');

  /* Fill icons inside freshly rendered nodes */
  list.querySelectorAll('i[data-icon]').forEach((n) => {
    const name = n.dataset.icon;
    if (ICONS[name]) n.outerHTML = ICONS[name];
  });

  const empty = document.getElementById('faq-empty');
  if (empty) empty.hidden = items.length > 0;
}

const search = document.getElementById('faq-search');
if (search) {
  let t;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      renderFaq(search.value);
      track('support_open', { context: 'faq_search' });
    }, 150);
  });
}

renderFaq();
bindTrackers();

export default function initSupportPage() {}
