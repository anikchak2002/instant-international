const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dist = path.resolve(__dirname, '../dist');
const productsCode = fs.readFileSync(path.join(dist, 'products.js'), 'utf8');
const catalogueCode = fs.readFileSync(path.join(dist, 'catalogue.js'), 'utf8');

function setupEnvironment() {
  const sandbox = {
    window: {},
    location: { search: '', href: 'https://example.com/catalogue.html', pathname: '/catalogue.html' },
    history: { replaceState() {} },
    document: null,
    URL,
    URLSearchParams,
    FormData: class {
      constructor(form) { this.form = form; }
      get(name) { return 'Test value'; }
    },
    encodeURIComponent
  };

  // Run products.js in sandbox
  vm.runInNewContext(productsCode, sandbox);

  // Setup mock DOM
  const elements = new Map();
  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        style: {},
        listeners: {},
        addEventListener(event, fn) { this.listeners[event] = fn; },
        dispatchEvent(event) { if (this.listeners[event.type]) this.listeners[event.type](event); },
        querySelector(sel) {
          if (sel === '.external-status') return { textContent: '' };
          return getElement(sel);
        },
        querySelectorAll() { return []; },
        closest(sel) {
          if (sel === '[data-page]' && this.dataset?.page) return this;
          if (sel === '[data-product]' && this.dataset?.product) return this;
          if (sel === '#clear-search' && this.id === 'clear-search') return this;
          return null;
        },
        showModal() {},
        close() {},
        focus() {},
        scrollIntoView() {},
        getBoundingClientRect() { return { left: 0, right: 100, top: 0, bottom: 100 }; }
      });
    }
    return elements.get(id);
  }

  sandbox.document = {
    body: { style: {} },
    querySelector(sel) {
      return getElement(sel);
    },
    querySelectorAll() { return []; }
  };

  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  sandbox.window.PRODUCTS = sandbox.window.PRODUCTS;

  // Run catalogue.js
  vm.runInNewContext(catalogueCode, sandbox);

  return { sandbox, elements };
}

test('products without CAS number have cas === null in products list', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(productsCode, sandbox);
  const products = sandbox.window.PRODUCTS;
  
  const nullCasProducts = products.filter(p => p.cas === null);
  assert.equal(nullCasProducts.length, 12, 'Expected exactly 12 products without CAS');
  
  const expectedNames = [
    'Calcium Amino Acid Complex',
    'Copper Amino Acid Complex',
    'EDTA Diammonium – Liquid',
    'EDTA Ferric Ammonium',
    'EDTA NaFe Premix for Iron Fortification',
    'EDTA Tetra Ammonium',
    'EDTA Zinc Ammonium',
    'Ferrous Amino Acid Complex',
    'Magnesium Amino Acid Complex',
    'Manganese Amino Acid Complex',
    'Metallic Salts (general)',
    'Mix Mineral Amino Acid Complex'
  ];
  for (const name of expectedNames) {
    const p = products.find(prod => prod.name === name);
    assert.ok(p, `Product ${name} should exist`);
    assert.equal(p.cas, null, `Product ${name} should have cas === null`);
  }
});

test('product card omits CAS option when CAS is not available', () => {
  const { sandbox, elements } = setupEnvironment();
  const grid = elements.get('#product-grid');
  
  // Calcium Amino Acid Complex has no CAS
  assert.ok(grid.innerHTML.includes('Calcium Amino Acid Complex'));
  
  // Find the article for Calcium Amino Acid Complex
  const cards = grid.innerHTML.split('<article ').filter(c => c.includes('Calcium Amino Acid Complex'));
  assert.equal(cards.length, 1);
  const cardHtml = cards[0];
  assert.equal(cardHtml.includes('CAS NO.'), false, 'Card should not contain CAS NO.');
  assert.equal(cardHtml.includes('cas-summary'), false, 'Card should not contain cas-summary');
  assert.equal(cardHtml.includes('CAS NUMBER'), false, 'Card should not contain CAS NUMBER');
  assert.equal(cardHtml.includes('Not uniquely assignable'), false, 'Card should not display unassignable CAS placeholder');
});

test('product card renders CAS option when CAS is available', () => {
  const { sandbox, elements } = setupEnvironment();
  const grid = elements.get('#product-grid');
  
  // Aluminium Stearate has CAS 637-12-7
  assert.ok(grid.innerHTML.includes('Aluminium Stearate'));
  const cards = grid.innerHTML.split('<article ').filter(c => c.includes('Aluminium Stearate'));
  assert.equal(cards.length, 1);
  const cardHtml = cards[0];
  assert.ok(cardHtml.includes('cas-summary'), 'Card should contain cas-summary');
  assert.ok(cardHtml.includes('637-12-7'), 'Card should display the CAS number');
});

test('product detail dialog omits CAS number row when CAS is not available', () => {
  const { sandbox, elements } = setupEnvironment();
  const grid = elements.get('#product-grid');
  const products = sandbox.window.PRODUCTS;
  
  const noCasProduct = products.find(p => p.name === 'Calcium Amino Acid Complex');
  assert.ok(noCasProduct);
  
  // Simulate clicking on the product card
  const clickEvent = {
    target: {
      closest(sel) {
        if (sel === '[data-product]') return { dataset: { product: String(noCasProduct.id) } };
        return null;
      }
    }
  };
  grid.listeners['click'](clickEvent);
  
  const dialogContent = elements.get('#dialog-content').innerHTML;
  assert.ok(dialogContent.includes('Calcium Amino Acid Complex'));
  assert.equal(dialogContent.includes('<dt>CAS number</dt>'), false, 'Dialog should not contain CAS number dt');
  assert.equal(dialogContent.includes('CAS'), false, 'Dialog should not mention CAS when absent');
});

test('product detail dialog displays CAS number row when CAS is available', () => {
  const { sandbox, elements } = setupEnvironment();
  const grid = elements.get('#product-grid');
  const products = sandbox.window.PRODUCTS;
  
  const casProduct = products.find(p => p.name === 'Aluminium Stearate');
  assert.ok(casProduct);
  
  const clickEvent = {
    target: {
      closest(sel) {
        if (sel === '[data-product]') return { dataset: { product: String(casProduct.id) } };
        return null;
      }
    }
  };
  grid.listeners['click'](clickEvent);
  
  const dialogContent = elements.get('#dialog-content').innerHTML;
  assert.ok(dialogContent.includes('Aluminium Stearate'));
  assert.ok(dialogContent.includes('<dt>CAS number</dt>'));
  assert.ok(dialogContent.includes('637-12-7'));
});

test('enquiry form omits CAS line when product has no CAS', () => {
  const { sandbox, elements } = setupEnvironment();
  const grid = elements.get('#product-grid');
  const products = sandbox.window.PRODUCTS;
  
  const noCasProduct = products.find(p => p.name === 'Calcium Amino Acid Complex');
  grid.listeners['click']({
    target: {
      closest(sel) {
        if (sel === '[data-product]') return { dataset: { product: String(noCasProduct.id) } };
        return null;
      }
    }
  });

  let submittedUrl;
  sandbox.window.open = (url) => { submittedUrl = url; };

  const formElement = elements.get('.enquiry-form');
  formElement.listeners['submit']({
    preventDefault() {},
    target: formElement,
    submitter: { dataset: { channel: 'whatsapp' } }
  });

  assert.ok(submittedUrl);
  const decodedBody = decodeURIComponent(new URL(submittedUrl).searchParams.get('text'));
  assert.equal(decodedBody.includes('CAS:'), false, 'Should not contain CAS: line in enquiry message');
});

test('enquiry form includes CAS line when product has CAS', () => {
  const { sandbox, elements } = setupEnvironment();
  const grid = elements.get('#product-grid');
  const products = sandbox.window.PRODUCTS;
  
  const casProduct = products.find(p => p.name === 'Aluminium Stearate');
  grid.listeners['click']({
    target: {
      closest(sel) {
        if (sel === '[data-product]') return { dataset: { product: String(casProduct.id) } };
        return null;
      }
    }
  });

  let submittedUrl;
  sandbox.window.open = (url) => { submittedUrl = url; };

  const formElement = elements.get('.enquiry-form');
  formElement.listeners['submit']({
    preventDefault() {},
    target: formElement,
    submitter: { dataset: { channel: 'whatsapp' } }
  });

  assert.ok(submittedUrl);
  const decodedBody = decodeURIComponent(new URL(submittedUrl).searchParams.get('text'));
  assert.ok(decodedBody.includes('CAS: 637-12-7'), 'Should contain CAS: 637-12-7 in enquiry message');
});
