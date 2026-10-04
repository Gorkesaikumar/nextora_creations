/* Contact page: contact form -> company Apps Script endpoint. */
import { SITE } from '../../data/site.js';
import { track } from '../components/analytics.js';

const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('cf-submit');
    const ok = document.getElementById('cf-success');
    const err = document.getElementById('cf-error');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    ok.hidden = true;
    err.hidden = true;

    const data = new FormData(form);
    data.append('source', 'pos-website-contact');

    try {
      await fetch(SITE.formAction, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams(data),
      });
      form.reset();
      ok.hidden = false;
      const topic = data.get('topic');
      track(topic === 'Demo' ? 'request_demo' : 'contact_sales');
    } catch {
      err.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
}

export default function initContactPage() {}
