(() => {
  'use strict';
  const products = window.PRODUCTS || [];
  const labels = {'Food': 'Food & ingredients', 'Pharma': 'Pharma & related chemicals', 'Home and personal care': 'Home & personal care', 'Paint, coating, speciality & others': 'Paint, coating & speciality'};
  const params = new URLSearchParams(location.search);
  let query = params.get('q') || '';
  const search = document.querySelector('#product-search');
  const grid = document.querySelector('#product-grid');
  const dialog = document.querySelector('#product-dialog');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const hasCas = p => Boolean(p && p.cas && typeof p.cas === 'string' && p.cas.trim() !== '' && !p.cas.toLowerCase().includes('not uniquely') && !p.cas.toLowerCase().includes('not available') && p.cas.toLowerCase() !== 'n/a' && p.cas.toLowerCase() !== 'none');
  const normalizeFormula = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '').replace(/[·•⋅]/g, '.');
  // Index formula tokens separately from descriptive notes in the catalogue data.
  const formulaIndex = new Map(products.map(p => [p.id,
    String(p.formula || '').normalize('NFKC').split(/[\s;:,]+/)
      .filter(token => /[A-Z]/.test(token) && /^(?:[A-Z][a-z]?|[0-9()[\]·.•⋅+−-]|n)+$/.test(token))
      .map(normalizeFormula)
  ]));
  search.value = query;

  function updateURL() {
    const next = new URL(location.href);
    next.searchParams.delete('category');
    if (query) next.searchParams.set('q', query); else next.searchParams.delete('q');
    history.replaceState(null, '', next.pathname + next.search);
  }

  function render() {
    const prefix = query.toLocaleLowerCase().trim();
    // NFKC lets visitors type ordinary digits for formulas printed with subscripts.
    const formulaQuery = normalizeFormula(prefix);
    const visible = products.filter(p => p.name.toLocaleLowerCase().startsWith(prefix) ||
      (formulaQuery.length > 1 && formulaIndex.get(p.id).some(formula => formula.includes(formulaQuery))) ||
      (/^\d/.test(prefix) && hasCas(p) && p.cas.startsWith(prefix)));
    visible.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity:'base'}));
    document.querySelector('#result-count').textContent = visible.length ? `${visible.length} products · A–Z` : 'No matching products';
    let letter = '';
    grid.innerHTML = visible.map(p => {
      const initial = p.name.charAt(0).toLocaleUpperCase();
      const heading = initial !== letter ? `<h2 class="product-letter">${escape(initial)}</h2>` : '';
      letter = initial;
      const formula = p.formula ? `<p class="product-meta"><span>Formula</span> ${escape(p.formula)}</p>` : '';
      const cas = hasCas(p) ? `<p class="product-meta"><span>CAS No.</span> ${escape(p.cas)}</p>` : '';
      return `${heading}<article class="product-card" data-product="${p.id}" tabindex="0" aria-label="${escape(p.name)}"><div class="product-summary"><h3 class="product-title">${escape(p.name)}</h3>${formula}${cas}</div><button class="product-detail-button" data-product="${p.id}" aria-label="View details and enquire about ${escape(p.name)}"><span>View details</span><span class="btn-arrow" aria-hidden="true">↗</span></button></article>`;
    }).join('');
    if (!visible.length) grid.innerHTML = `<div class="empty-state"><span aria-hidden="true">⌕</span><h2>No products found.</h2><p>Try the beginning of a chemical name, a chemical formula or a CAS number.</p><button class="button button-navy" id="clear-search">Clear search <span aria-hidden="true">↗</span></button></div>`;
    updateURL();
  }

  search.addEventListener('input', () => { query = search.value; render(); });
  grid.addEventListener('click', event => {
    const target = event.target.closest('[data-product]');
    if (target) openProduct(products.find(p => p.id === Number(target.dataset.product)));
    if (event.target.closest('#clear-search')) { query = ''; search.value = ''; render(); search.focus(); }
  });
  grid.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      const card = event.target.closest('.product-card');
      if (card && event.target === card) {
        event.preventDefault();
        openProduct(products.find(p => p.id === Number(card.dataset.product)));
      }
    }
  });

  function openProduct(product) {
    if (!product) return;
    const casRow = hasCas(product) ? `<div><dt>CAS number</dt><dd>${escape(product.cas)}</dd></div>` : '';
    document.querySelector('#dialog-content').innerHTML = `<div class="product-category">${escape(labels[product.category] || product.category)}</div><h2 id="dialog-title">${escape(product.name)}</h2><dl class="product-data"><div><dt>Chemical name</dt><dd>${escape(product.chemicalName)}</dd></div><div><dt>Chemical formula</dt><dd>${escape(product.formula || 'Confirm with our team')}</dd></div>${casRow}</dl><p class="product-notes">${product.notes ? `${escape(product.notes)} ` : ''}Please confirm the required grade, specification and suitability for your intended application.</p><form class="enquiry-form"><h3>Tell us what you need.</h3><p>Prepare an enquiry for ${escape(product.name)}.</p><div class="enquiry-fields"><label>Your name / company *<input name="name" autocomplete="organization" placeholder="Name or company" required maxlength="150"></label><label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@company.com" maxlength="200"></label><label>Quantity & grade<input name="quantity" placeholder="e.g. 500 kg, required grade" maxlength="250"></label><label>Delivery location<input name="location" autocomplete="address-level2" placeholder="City, country" maxlength="200"></label><label>Application & additional details<textarea name="details" placeholder="Tell us about your application and specification…" maxlength="2000"></textarea></label></div><div class="enquiry-actions"><button type="submit" class="button button-navy" data-channel="email">Open email enquiry <span aria-hidden="true">↗</span></button><button type="submit" class="button button-outline" data-channel="whatsapp">Open WhatsApp <span aria-hidden="true">↗</span></button></div><p class="enquiry-note">Opens your email app or WhatsApp with a prepared message. Review and send it there. This website does not store your enquiry.</p><div class="external-status" role="status" aria-live="polite"></div></form>`;
    document.querySelector('.enquiry-form').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.target);
      const casInfo = hasCas(product) ? `CAS: ${product.cas}\n` : '';
      const body = `Hello Instant International,\n\nI would like to enquire about ${product.name}.\n${casInfo}Name / company: ${data.get('name')}\nEmail: ${data.get('email') || 'Not provided'}\nQuantity & grade: ${data.get('quantity') || 'To discuss'}\nDelivery location: ${data.get('location') || 'To discuss'}\nApplication & details: ${data.get('details') || 'To discuss'}\n\nPlease share availability and discuss the appropriate specification.\nThank you.`;
      const isWhatsApp = event.submitter?.dataset.channel === 'whatsapp';
      if (isWhatsApp) {
        window.open(`https://wa.me/919222105421?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
        event.target.querySelector('.external-status').textContent = 'Continue in WhatsApp to review and send your enquiry.';
      } else {
        location.href = `mailto:sales@instant-international.com?subject=${encodeURIComponent(`Product enquiry — ${product.name}`)}&body=${encodeURIComponent(body)}`;
        event.target.querySelector('.external-status').textContent = 'Review and send in your email app. You can also email sales@instant-international.com directly.';
      }
    });
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.scrollTop = 0;
  }
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  render();
})();
