(() => {
  'use strict';
  const form = document.querySelector('#contact-form');
  const productSelect = document.querySelector('#contact-products');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const productNames = [...new Set((window.PRODUCTS || []).map(product => product.name))]
    .sort((a, b) => a.localeCompare(b, 'en', {sensitivity: 'base'}));
  productSelect.innerHTML = '<option value="">Select a product</option>' +
    productNames.map(name => `<option value="${escape(name)}">${escape(name)}</option>`).join('') +
    '<option value="Other / not listed">Other / not listed — describe in your message</option>';

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = key => String(data.get(key) || '').trim();
    const body = `Hello Instant International,\n\nI would like to make an enquiry.\n\nName: ${value('name')}\nCompany: ${value('company') || 'Not provided'}\nEmail: ${value('email')}\nPhone: ${value('phone') || 'Not provided'}\nCountry: ${value('country') || 'Not provided'}\nProducts: ${value('products') || 'To discuss'}\n\nMessage:\n${value('message')}`;
    window.open(`https://wa.me/919222105421?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
    document.querySelector('#contact-status').textContent = 'Continue in WhatsApp to review and send your enquiry. If it did not open, please allow pop-ups or email our team directly.';
  });
})();
