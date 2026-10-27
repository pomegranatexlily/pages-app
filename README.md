# Pomegranate × Lily Labs

Founder & AI-Assisted Full-Stack Developer: Dr. Nachamasha Yahsharala.
Business portfolio: Packet Lily (flagship), POM Lily Labs and Python Atelier.

## Approved interface
The stylesheet, icon, product illustration and perspective controls remain unchanged. The existing contact area retains its textarea and button styling. The primary action is now a real mailto link labeled Open email app. Only necessary contact instructions and behavior are changed.

## Email-app handoff
Inquiries no longer use an email-sending API. The current page has no provider access key, honeypot, HTTP submission, quota dependency or delivery-status parser. Historical Git commits and strategy documents may describe the retired API implementation; they do not represent current behavior. No account keys are revoked by this code change.
The recipient is editor.hw12@gmail.com. JavaScript encodes a fixed subject and the visitor's message into a mailto URI on a normal link. Their configured mail app or handler chooses the sending account. The visitor must review the draft and press Send themselves. The site neither sends email nor detects whether an app opened, the visitor sent, or the message arrived.
The textarea is never cleared automatically. If no configured handler opens, the page exposes the address and instructions to copy the message manually. With JavaScript disabled, the static link still supplies recipient and subject; visitors must paste their typed message into that draft. Native form POST is a mailto fallback, not an HTTP API submission.
Mail-client and URI-length support varies. Long drafts must be reviewed for completeness; the code does not intentionally truncate them. Browser tests and recipient readback are separate from encoding/unit tests. A public email address can still receive spam; this change is not a guarantee against inbox abuse.

## Privacy
No analytics, backend, account system, browser record storage, payment processing or form-delivery service is installed. Typed messages are handed to the visitor's mail handler only when they choose the link. Do not enter passwords, keys or private customer records. The site does not read other applications' storage.

## Run and check
Serve with `python3 -m http.server 8000`, then open http://localhost:8000.
Run `node --check studio.js` and `node --test tests/*.test.cjs`.
The suite checks recipient/subject/body encoding, header-injection resistance, draft validation, text preservation, CTA/swipe behavior, retired-provider removal and frozen CSS/icon hashes. Mocked tests do not open mail apps or send emails. STUDIO_LOCAL_SOURCE_ONLY=1 skips repository-source and visual-asset checks only when local fixtures are unavailable; never set it in CI.
Deployment runs both test files before packaging only public site assets. Actual hosting, physical iPhone behavior, configured mail-handler behavior and delivery require separate verification.
