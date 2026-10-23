const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dist = path.resolve(__dirname, '../dist');
const script = fs.readFileSync(path.join(dist, 'app.js'), 'utf8');

function render(page, pathname) {
  const elements = new Map();
  const node = () => ({ innerHTML: '', addEventListener() {}, setAttribute() {}, classList: { remove() {} } });
  const document = {
    querySelector(selector) {
      if (selector === '#product-grid') return page === 'catalogue' ? node() : null;
      if (!elements.has(selector)) elements.set(selector, node());
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
    addEventListener() {},
  };
  vm.runInNewContext(script, { document, location: { pathname }, window: { matchMedia: () => ({ addEventListener() {} }) } });
  return ['#site-header', '#site-footer'].map(key => elements.get(key).innerHTML);
}

for (const pathname of ['/catalogue', '/catalogue.html']) {
  test(`catalogue navigation returns to homepage sections at ${pathname}`, () => {
    for (const html of render('catalogue', pathname)) {
      for (const section of ['about', 'industries', 'contact']) {
        assert.ok(html.includes(`href="index.html#${section}"`));
        assert.ok(fs.readFileSync(path.join(dist, 'index.html'), 'utf8').includes(`id="${section}"`));
      }
    }
    assert.match(render('catalogue', pathname)[0], /href="catalogue.html" aria-current="page"/);
  });
}

test('homepage navigation and industry category links lead back to the catalogue', () => {
  for (const pathname of ['/', '/index', '/index.html']) {
    for (const html of render('home', pathname)) {
      assert.ok(html.includes('href="#industries"'));
      assert.ok(html.includes('href="catalogue.html"'));
    }
  }
  const homepage = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const industries = homepage.split('class="industry-list"')[1].split('</section>')[0];
  const links = [...industries.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(links.length, 4);
  for (const href of links) {
    const url = new URL(href.replaceAll('&amp;', '&'), 'https://example.com/');
    assert.equal(url.pathname, '/catalogue.html');
    assert.ok(url.searchParams.get('category'));
    assert.ok(fs.existsSync(path.join(dist, 'catalogue.html')));
  }
});
