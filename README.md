# Pomegranate × Lily Labs

Founder-led, AI-assisted software studio website, based on approved Mockup 04. This replaces the retired PAGES application in this repository.

## Files
- index.html: static-first studio views and illustrative Packet Lily model.
- studio.css: approved neutral design, responsive layout and native perspective controls.
- studio.js: local invoice preview, printable HTML download, inquiry-draft download and swipe enhancement.
- favicon.svg: monochrome vector brand symbol; no emoji rendering.
- .github/workflows/deploy-pages.yml: syntax checking, static packaging and Pages deployment.

## Run
Serve the root with `python3 -m http.server 8000` and open http://localhost:8000. No application dependencies or build step.

## Hosting
The workflow attempts GitHub Pages deployment on pushes to main. Pages must be enabled for GitHub Actions in repository settings. A committed workflow alone does not prove a successful deployment. Existing hosting can also serve the root files directly.

## Data and scope
No analytics, backend, cookies, customer record storage, payment processing or inquiry submission is installed. Demo fields stay in the current page until the user downloads a file. The invoice export is printable HTML, not an automatically generated PDF. Use fictional data only. Product renderings are illustrative, not app screenshots. External project links require network access and may require authorization.

The contact view saves a local project brief only; a real inquiry destination remains unconnected. Never claim a brief was sent. Do not automatically read other applications' browser storage. No secrets belong in this repository.

## Acceptance checks
Check mobile overflow, vector-icon rendering, the three perspective controls, navigation with JavaScript disabled, live invoice updates, invalid amounts, invoice download, draft download, and reduced-motion behavior. Physical iPhone and live hosting checks remain separate from syntax validation.
