const arrow = '<span aria-hidden="true">↗</span>';
// Hosts may serve catalogue.html at /catalogue. Detect the rendered page,
// rather than relying on a filename that the host can rewrite.
const isCatalogue = Boolean(document.querySelector('#product-grid'));
const isContact = Boolean(document.querySelector('#contact-form'));
const isAbout = document.body.classList.contains('about-page');
const home = isCatalogue || isContact || isAbout ? 'index.html' : '';
document.querySelector('#site-header').innerHTML = `
  <header class="main-header"><div class="container nav-wrap"><a class="brand" href="index.html" aria-label="Instant International home"><img class="brand-logo" src="assets/instant-logo.jpg?v=2019" alt="Instant International" width="1600" height="901"><span class="brand-since">Since 2019</span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="main-nav"><span></span><span></span></button><nav id="main-nav" class="main-nav" aria-label="Main navigation"><a href="index.html" ${!isCatalogue && !isContact && !isAbout ? 'aria-current="page"' : ''}>Home</a><a href="about.html" ${isAbout ? 'aria-current="page"' : ''}>About us</a><a href="catalogue.html" ${isCatalogue ? 'aria-current="page"' : ''}>Our products</a><a href="${home}#industries">Industries</a><a class="nav-contact" href="contact.html" ${isContact ? 'aria-current="page"' : ''}>Get in touch ${arrow}</a></nav></div></header>`;
document.querySelector('#site-footer').innerHTML = `<footer class="footer"><div class="container"><div class="footer-main"><div><a class="brand footer-brand" href="index.html" aria-label="Instant International home"><img class="brand-logo" src="assets/instant-logo.jpg?v=2019" alt="Instant International" width="1600" height="901"><span class="brand-since">Since 2019</span></a></div><div class="footer-nav"><a href="about.html" ${isAbout ? 'aria-current="page"' : ''}>About us</a><a href="catalogue.html">Our products</a><a href="${home}#industries">Industries</a><a href="contact.html">Contact</a></div><a class="footer-download" href="assets/Instant-International-Chemical-Catalogue.xlsx" download>Our product catalogue <span aria-hidden="true">↓</span><small>DOWNLOAD</small></a></div><div class="footer-contacts" aria-label="Contact details"><a href="tel:+919222105421"><span>CALL US</span><strong>+91 92221 05421</strong></a><a href="mailto:sales@instant-international.com"><span>SALES ENQUIRIES</span><strong>sales@instant-international.com</strong></a><a href="mailto:sayhello.instant@gmail.com"><span>SAY HELLO</span><strong>sayhello.instant@gmail.com</strong></a></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Instant International. All rights reserved.</span><a href="#main" aria-label="Back to top">Back to top ↑</a></div></div></footer>`;
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); document.querySelector('.main-nav').classList.toggle('is-open', open); });
document.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', () => { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); document.querySelector('.main-nav').classList.remove('is-open'); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); document.querySelector('.main-nav').classList.remove('is-open'); } });

// Close the mobile drawer after a breakpoint change or a click outside it.
function closeNavigation() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open navigation');
  document.querySelector('.main-nav').classList.remove('is-open');
}
window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeNavigation(); });
document.addEventListener('click', event => { if (!event.target.closest('.main-header')) closeNavigation(); });
