# Pomegranate × Lily Labs

Founder-led, AI-assisted software studio website for practical web applications, AI-enabled tools, and business workflows. This replaces the retired PAGES application in this repository.

## Featured portfolio

- **Packet Lily** — phone-first job, invoice, payment-record, and closeout workflow. [Live app](https://pomegranatexlily.github.io/Closeout-Pocket/) · [Repository](https://github.com/pomegranatexlily/Closeout-Pocket)
- **POM Lily Labs** — mobile-first AI assistant project. [Live app](https://pom-lily-labs.pages.dev/) · [Repository](https://github.com/pomegranatexlily/pom-lily-labs)
- **Python Atelier** — browser-based Python learning and practice. [Live app](https://pomegranatexlily.github.io/Python-Atelier/) · [Repository](https://github.com/pomegranatexlily/Python-Atelier)

Personal publishing and research projects are intentionally not featured on this business landing page.

## Files

- index.html: static-first studio site, project links, services, founder summary, and local project-brief form.
- studio.css: responsive layout, accessible focus styles, and illustrative Packet Lily product rendering.
- studio.js: navigation CTAs, local project-brief download, and perspective/swipe controls for the illustration.
- favicon.svg: monochrome vector brand symbol.
- .github/workflows/deploy-pages.yml: JavaScript syntax check, static packaging, and GitHub Pages deployment workflow.

## Run locally

Serve the root with `python3 -m http.server 8000` and open `http://localhost:8000`. No application dependencies or build step are required.

## Hosting

The workflow attempts GitHub Pages deployment on pushes to main. Pages must be enabled for GitHub Actions in repository settings. A committed workflow alone does not prove a successful deployment. Existing hosting can also serve the root files directly.

## Data and scope

No analytics, backend, cookies, customer-record storage, payment processing, or inquiry submission is installed. The contact view downloads a local project brief only; it does not send an inquiry. Never claim a brief was sent. The Packet Lily visual is illustrative, not an app screenshot. External project links require network access and may require authorization.

No secrets belong in this repository. Do not automatically read other applications' browser storage.

## Acceptance checks

- [ ] Confirm all primary CTAs and navigation on mobile and desktop.
- [ ] Check mobile overflow, focus visibility, keyboard navigation, and reduced-motion behavior.
- [ ] Confirm all project links point to the intended live apps and repositories.
- [ ] Verify local project-brief download and empty-input behavior.
- [ ] Check the page with JavaScript disabled and confirm the limitation is understandable.
- [ ] Remove unused CSS and verify no references remain to the retired invoice demo.
- [ ] Run `node --check studio.js`.
- [ ] Verify the deployed page separately from code-level checks.
- [ ] Replace illustrative product artwork with authentic screenshots before presenting it as real product evidence.
