const arrow = '<span aria-hidden="true">↗</span>';
// Hosts may serve catalogue.html at /catalogue. Detect the rendered page,
// rather than relying on a filename that the host can rewrite.
const isCatalogue = Boolean(document.querySelector('#product-grid'));
const isContact = Boolean(document.querySelector('#contact-form'));
const isAbout = document.body.classList.contains('about-page');
const home = isCatalogue || isContact || isAbout ? 'index.html' : '';
document.querySelector('#site-header').innerHTML = `
  <header class="main-header"><div class="container nav-wrap"><a class="brand" href="index.html" aria-label="Instant International home"><img class="brand-logo" src="assets/instant-logo.jpg?v=2019" alt="Instant International" width="1600" height="901"><span class="brand-since">Since 2019</span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="main-nav"><span></span><span></span></button><nav id="main-nav" class="main-nav" aria-label="Main navigation"><a href="index.html" ${!isCatalogue && !isContact && !isAbout ? 'aria-current="page"' : ''}>Home</a><a href="about.html" ${isAbout ? 'aria-current="page"' : ''}>About us</a><a href="catalogue.html" ${isCatalogue ? 'aria-current="page"' : ''}>Our products</a><a href="${home}#industries">Industries</a><a class="nav-contact" href="contact.html" ${isContact ? 'aria-current="page"' : ''}>Get in touch ${arrow}</a></nav></div></header>`;
document.querySelector('#site-footer').innerHTML = `<footer class="footer"><div class="container"><div class="footer-main"><div><a class="brand footer-brand" href="index.html" aria-label="Instant International home"><img class="brand-logo" src="assets/instant-logo.jpg?v=2019" alt="Instant International" width="1600" height="901"><span class="brand-since">Since 2019</span></a></div><div class="footer-nav"><a href="about.html" ${isAbout ? 'aria-current="page"' : ''}>About us</a><a href="catalogue.html">Our products</a><a href="${home}#industries">Industries</a><a href="contact.html">Contact</a></div><a class="footer-download" href="assets/Instant-International-Product-Catalogue.pdf" download>Our product catalogue <span aria-hidden="true">↓</span><small>DOWNLOAD</small></a></div><div class="footer-contacts" aria-label="Contact details"><a href="tel:+919222105421"><span>CALL US</span><strong>+91 92221 05421</strong></a><a href="mailto:sales@instant-international.com"><span>SALES ENQUIRIES</span><strong>sales@instant-international.com</strong></a><a href="mailto:sayhello.instant@gmail.com"><span>SAY HELLO</span><strong>sayhello.instant@gmail.com</strong></a></div><div class="footer-offices-social"><div class="footer-locations" aria-label="Office locations"><p><strong>Registered Office:</strong> Shahpura Bhilwara Rajasthan</p><p><strong>Corporate Office:</strong> Mumbai Maharashtra</p></div><div class="footer-social" role="group" aria-label="Social media"><span class="footer-social-icon" role="img" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"/></svg></span><span class="footer-social-icon" role="img" aria-label="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.46 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42ZM19 18.75h-2.95V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.76V9.2h2.83v1.3h.04c.39-.75 1.36-1.54 2.79-1.54 2.98 0 3.58 1.96 3.58 4.51v5.28Z"/></svg></span><span class="footer-social-icon" role="img" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></span></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Instant International. All rights reserved.</span><a href="#main" aria-label="Back to top">Back to top ↑</a></div></div></footer>`;
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

// Animate the chemistry composition only while it is on screen.
const whyChoose = document.querySelector('.why-choose');
if (whyChoose && 'IntersectionObserver' in window) {
  const chemistryObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      whyChoose.classList.toggle('is-visible', entry.isIntersecting);
      if (entry.isIntersecting) whyChoose.classList.add('has-entered');
    }
  }, { threshold: 0.12 });
  chemistryObserver.observe(whyChoose);
}

// About content stays readable without JavaScript; reveal each section once.
if (isAbout && 'IntersectionObserver' in window) {
  const aboutRevealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('about-revealed');
      aboutRevealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.about-story .about-editorial, .about-business .about-editorial, .about-purpose-grid article').forEach(section => aboutRevealObserver.observe(section));
}

// Reveal homepage company sections once, without hiding content by default.
if (document.body.classList.contains('home-page') && 'IntersectionObserver' in window) {
  const companyObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('company-revealed');
      companyObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.home-page #about, .home-page .business').forEach(section => companyObserver.observe(section));
}
