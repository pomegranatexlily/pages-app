# Pomegranate × Lily Labs

Founder & AI-Assisted Full-Stack Developer: Dr. Nachamasha Yahsharala.
Business portfolio: Packet Lily (flagship), POM Lily Labs and Python Atelier. Personal research and publishing projects are not featured.

## Scope and approved UI
This content/behavior update is on `fix/studio-landing-page-ux`, associated with draft PR #5. It does not merge or publish that PR. The current layout, CSS, monochrome icon and illustrative product model are preserved. `studio.css` and `favicon.svg` are protected by recorded Git blob hashes in the regression suite. Any visual change needs separate user approval. Some obsolete invoice-demo selectors remain intentionally untouched under this UI freeze.

## Files
- index.html: unchanged markup structure with business-package copy and consistent full-stack title.
- studio.js: contact CTA navigation/focus, local G-CAFL-QC brief download, error handling and existing swipe behavior.
- docs/business-package.md: positioning, portfolio, Upwork copy, service scopes, intake, delivery and roadmap.
- tests/studio.test.cjs: markup, behavior and visual-asset invariants.
- .github/workflows/studio-qc.yml: checks on pull requests and branch pushes, without deployment.

## Local use and checks
Run `python3 -m http.server 8000`, then open `http://localhost:8000`.
Run `node --check studio.js` and `node --test tests/studio.test.cjs`. No runtime or test dependencies are required beyond Node for these checks.
Tests use a mocked DOM. They do not prove real-browser rendering, physical iPhone behavior, provider access or production hosting. Do not set STUDIO_LOCAL_SOURCE_ONLY in CI: that local-only flag skips the asset-hash check when remote CSS/icon fixtures are unavailable.

## Privacy and behavior
No analytics, backend, account system, cookies, payment processing or inquiry submission is installed. The brief stays in the page until explicitly downloaded. It is plain text, not a sent inquiry. Download failure retains the typed text. Avoid secrets, credentials and customer data. Do not read other apps' storage.
The Packet Lily render remains illustrative. Its external payment handoff does not verify receipt. Public/private project links require network access and sometimes authorization.

## Before release
Keep PR #5 draft until mobile/desktop browser navigation, keyboard focus, overflow, reduced motion and brief downloads are verified. Verify real deployment separately; workflow existence and Node tests do not prove hosting. A real inquiry destination and authentic visuals remain separate follow-up work requiring appropriate approval.
