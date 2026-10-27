# Pomegranate × Lily Labs

Founder & AI-Assisted Full-Stack Developer: Dr. Nachamasha Yahsharala.
Business portfolio: Packet Lily (flagship), POM Lily Labs and Python Atelier. Personal research and publishing projects are not featured.

## Approved interface
The existing design, stylesheet, icon and perspective controls are preserved. This update connects the existing inquiry form and changes only necessary labels, validation and delivery/privacy text. No new visible fields or styling are introduced. The protected CSS/icon Git blob hashes remain in tests. PR #5 has already been merged; earlier draft/local-only descriptions in docs/business-package.md describe the preceding milestone, not this implementation.

## Inquiry delivery
The native form posts to https://api.easyformapi.com/submit using the founder-provided browser form access key. This key is intentionally present in the public form; it is not an administrative token. Inbox routing is configured in EasyFormAPI, not by exposing the recipient email in the page. Messages must include a reply address in their text if a response is wanted.
With JavaScript, submissions have a 20-second timeout, duplicate-tap protection, a hidden honeypot, and explicit acceptance/error states. An affirmative JSON success flag plus HTTP success is required to report acceptance. Unknown responses or network errors preserve text and warn against blind retries. Acceptance does not independently confirm inbox arrival. With JavaScript disabled, native HTML POST navigates to the provider response page.
No test email is sent on page load, deployment or by the regression suite. A live end-to-end submission and recipient readback must be verified separately. Provider API response compatibility, quota and spam filtering remain operational checks.

## Privacy
No analytics, backend, account system, browser record storage or payment processing is installed. The message is sent to EasyFormAPI only on explicit submission; provider delivery/logging policies apply. Do not submit passwords, keys or private customer records. The site does not read other applications' storage. Product artwork remains illustrative.

## Run and check
Serve with `python3 -m http.server 8000` and open http://localhost:8000.
Run `node --check studio.js` and `node --test tests/studio.test.cjs`.
The tests mock network and DOM behavior; they do not send real email or prove browser rendering. STUDIO_LOCAL_SOURCE_ONLY=1 skips repository-source and visual-asset checks only for local testing without those fixtures; never set it in CI.
The deployment workflow runs the full suite before publishing only public site assets. A passing test suite or successful commit does not alone prove deployment or inbox delivery. Physical iPhone, live hosting and recipient confirmation remain separate.
