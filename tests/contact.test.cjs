const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const script = fs.readFileSync(require('node:path').join(__dirname, '../dist/contact.js'), 'utf8');
function setup(valid) {
  let submit, opened;
  const values = { name: 'Test & Co', company: 'Example', email: 'test@example.com', phone: '+91 12345', country: 'India', products: 'Zinc oxide', message: 'Grade A?\n500 kg & delivery' };
  const status = {};
  const form = { addEventListener: (_, fn) => submit = fn, reportValidity: () => valid };
  vm.runInNewContext(script, {
    document: { querySelector: s => s === '#contact-form' ? form : status },
    FormData: class { get(key) { return values[key]; } },
    window: { open: (...args) => opened = args },
  });
  submit({ preventDefault() {} });
  return { opened, status, values };
}
test('enquiry opens the correct WhatsApp recipient and preserves encoded field values', () => {
  const { opened, status, values } = setup(true);
  const url = new URL(opened[0]);
  assert.equal(url.origin + url.pathname, 'https://wa.me/919222105421');
  for (const value of Object.values(values)) assert.ok(url.searchParams.get('text').includes(value));
  assert.equal(opened[1], '_blank');
  assert.match(status.textContent, /review and send/);
});
test('invalid enquiries do not open an external app', () => {
  assert.equal(setup(false).opened, undefined);
});
