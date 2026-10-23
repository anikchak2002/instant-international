# Instant International

Responsive chemical company website with an animated globe, searchable product catalogue, and email/WhatsApp enquiries.

## Run locally

No build or dependency installation is required.

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173 in your browser.

## Files

- `dist/index.html`: homepage
- `dist/catalogue.html`: product catalogue
- `dist/styles.css`: responsive styles
- `dist/app.js`: shared navigation and footer
- `dist/globe.js`: animated globe
- `dist/catalogue.js`: search, filters, product details and enquiries
- `dist/products.js`: catalogue data
- `dist/assets/`: branding and downloadable catalogue
- `catalogue-source.json`: source product records

Enquiries open the visitor's email application or WhatsApp for review and sending. The website does not store form submissions.

Deploy the contents of `dist/` to a static web host. `.openai/hosting.json` retains the existing Sites deployment configuration.
