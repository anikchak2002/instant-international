(() => {
  'use strict';
  const products = window.PRODUCTS || [];
  const categories = ['Food', 'Pharma', 'Home and personal care', 'Paint, coating, speciality & others'];
  const labels = {'Food': 'Food & ingredients', 'Pharma': 'Pharma & related chemicals', 'Home and personal care': 'Home & personal care', 'Paint, coating, speciality & others': 'Paint, coating & speciality'};
  const params = new URLSearchParams(location.search);
  let category = categories.includes(params.get('category')) ? params.get('category') : 'All';
  let query = params.get('q') || '';
  let sort = 'asc';
  let page = 1;
  const perPage = 12;
  const search = document.querySelector('#product-search');
  const grid = document.querySelector('#product-grid');
  const filters = document.querySelector('#category-filters');
  const dialog = document.querySelector('#product-dialog');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  search.value = query;

  function updateURL() {
    const next = new URL(location.href);
    if (category === 'All') next.searchParams.delete('category'); else next.searchParams.set('category', category);
    if (query) next.searchParams.set('q', query); else next.searchParams.delete('q');
    history.replaceState(null, '', next.pathname + next.search);
  }

  function renderFilters() {
    filters.innerHTML = ['All', ...categories].map(value => {
      const count = value === 'All' ? products.length : products.filter(p => p.category === value).length;
      return `<button class="filter-button ${value === category ? 'active' : ''}" data-category="${escape(value)}" aria-pressed="${value === category}"><span>${escape(value === 'All' ? 'All products' : labels[value])}</span><span class="count">${count}</span></button>`;
    }).join('');
  }

  function render() {
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = products.filter(p => (category === 'All' || p.category === category) && terms.every(term => [p.name, p.chemicalName, p.formula, p.cas].join(' ').toLocaleLowerCase().includes(term)));
    visible.sort((a, b) => a.name.localeCompare(b.name) * (sort === 'asc' ? 1 : -1));
    const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
    page = Math.min(page, totalPages);
    const start = (page - 1) * perPage;
    document.querySelector('#result-count').textContent = visible.length ? `Showing ${start + 1}–${Math.min(start + perPage, visible.length)} of ${visible.length} products` : 'No matching products';
    grid.innerHTML = visible.slice(start, start + perPage).map(p => `<article class="product-card"><span class="product-category">${escape(labels[p.category])}</span><h2>${escape(p.name)}</h2><p class="formula">${escape(p.formula || 'Formula varies by composition')}</p><div class="product-card-bottom"><div class="cas-summary">CAS NUMBER<span>${escape(p.cas || 'Confirm with our team')}</span></div><button class="product-detail-button" data-product="${p.id}" aria-label="View details and enquire about ${escape(p.name)}" title="View product and enquire">↗</button></div></article>`).join('');
    if (!visible.length) grid.innerHTML = `<div class="empty-state"><span aria-hidden="true">⌕</span><h2>No products found.</h2><p>Try another name or CAS number, or explore all categories.</p><button class="button button-navy" id="clear-filters">Clear search & filters <span aria-hidden="true">↗</span></button></div>`;
    const pagination = document.querySelector('#pagination');
    pagination.innerHTML = totalPages > 1 ? `<button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">←</button>${Array.from({length:totalPages}, (_, i) => `<button data-page="${i + 1}" class="${page === i + 1 ? 'active' : ''}" ${page === i + 1 ? 'aria-current="page"' : ''} aria-label="Page ${i + 1}">${i + 1}</button>`).join('')}<button data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''} aria-label="Next page">→</button>` : '';
    renderFilters();
    updateURL();
  }

  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    page = 1;
    render();
    filters.querySelector(`[data-category="${CSS.escape(category)}"]`)?.focus({preventScroll:true});
  });
  search.addEventListener('input', () => { query = search.value; page = 1; render(); });
  document.querySelector('#sort-products').addEventListener('change', event => { sort = event.target.value; page = 1; render(); });
  document.querySelector('#pagination').addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    page = Number(button.dataset.page); render();
    document.querySelector('.results-toolbar').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
    document.querySelector(`#pagination [data-page="${page}"].active`)?.focus({preventScroll:true});
  });
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-product]');
    if (button) openProduct(products.find(p => p.id === Number(button.dataset.product)));
    if (event.target.closest('#clear-filters')) { query = ''; category = 'All'; page = 1; search.value = ''; render(); search.focus(); }
  });

  function openProduct(product) {
    if (!product) return;
    document.querySelector('#dialog-content').innerHTML = `<div class="product-category">${escape(labels[product.category])}</div><h2 id="dialog-title">${escape(product.name)}</h2><dl class="product-data"><div><dt>Chemical name</dt><dd>${escape(product.chemicalName)}</dd></div><div><dt>Chemical formula</dt><dd>${escape(product.formula || 'Confirm with our team')}</dd></div><div><dt>CAS number</dt><dd>${escape(product.cas || 'Confirm with our team')}</dd></div></dl><p class="product-notes">${product.notes ? `${escape(product.notes)} ` : ''}Please confirm the required grade, specification and suitability for your intended application.</p><form class="enquiry-form"><h3>Tell us what you need.</h3><p>Prepare an enquiry for ${escape(product.name)}.</p><div class="enquiry-fields"><label>Your name / company *<input name="name" autocomplete="organization" placeholder="Name or company" required maxlength="150"></label><label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@company.com" maxlength="200"></label><label>Quantity & grade<input name="quantity" placeholder="e.g. 500 kg, required grade" maxlength="250"></label><label>Delivery location<input name="location" autocomplete="address-level2" placeholder="City, country" maxlength="200"></label><label>Application & additional details<textarea name="details" placeholder="Tell us about your application and specification…" maxlength="2000"></textarea></label></div><div class="enquiry-actions"><button type="submit" class="button button-navy" data-channel="email">Open email enquiry <span aria-hidden="true">↗</span></button><button type="submit" class="button button-outline" data-channel="whatsapp">Open WhatsApp <span aria-hidden="true">↗</span></button></div><p class="enquiry-note">Opens your email app or WhatsApp with a prepared message. Review and send it there. This website does not store your enquiry.</p><div class="external-status" role="status" aria-live="polite"></div></form>`;
    document.querySelector('.enquiry-form').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.target);
      const body = `Hello Instant International,\n\nI would like to enquire about ${product.name}.\nCAS: ${product.cas || 'Please confirm'}\n\nName / company: ${data.get('name')}\nEmail: ${data.get('email') || 'Not provided'}\nQuantity & grade: ${data.get('quantity') || 'To discuss'}\nDelivery location: ${data.get('location') || 'To discuss'}\nApplication & details: ${data.get('details') || 'To discuss'}\n\nPlease share availability and discuss the appropriate specification.\nThank you.`;
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
