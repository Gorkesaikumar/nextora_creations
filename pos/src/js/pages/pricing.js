/* Pricing page: pricing request form -> company Apps Script endpoint. */
import { SITE } from '../../data/site.js';
import { track } from '../components/analytics.js';

const form = document.getElementById('pricingForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('pf-submit');
    const ok = document.getElementById('pf-success');
    const err = document.getElementById('pf-error');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    ok.hidden = true;
    err.hidden = true;

    const data = new FormData(form);
    data.append('source', 'pos-website-pricing');

    try {
      await fetch(SITE.formAction, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams(data),
      });
      form.reset();
      ok.hidden = false;
      track('pricing_request');
    } catch {
      err.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Request Pricing';
    }
  });
}

export default function initPricingPage() {}
