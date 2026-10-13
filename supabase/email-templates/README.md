# PAGES — six-digit email sign-in

**Prepared in GitHub, not yet activated in Supabase.** Updating this repo does not change the live email sent by Supabase.

PAGES uses a browser-installed PWA. When the user taps an emailed magic link, iPhone Mail may open a different browser, leaving the installed PAGES app unauthenticated. A six-digit code lets users return to their original PAGES window.

## Supabase provider configuration

1. Open https://supabase.com/dashboard, choose the project configured in `js/config.js`, then **Authentication → Email Templates**.
2. Open **Magic Link** or **Magic Link / OTP**; set subject to **Your PAGES sign-in code** and replace the HTML body with [magic-link.html](magic-link.html).
3. Open **Confirm signup**; set subject to **Confirm your PAGES email — six-digit code** and replace its HTML body with [confirm-signup.html](confirm-signup.html). First-time users can receive this separate template.
4. Preserve the literal Supabase substitution variable `{{ .Token }}`. Both templates intentionally omit `{{ .ConfirmationURL }}` so the email presents a code instead of an external link.
5. Save each template, then test existing and brand-new accounts using PAGES opened from the iPhone home screen: request an email, read six digits, return to PAGES, enter the code and confirm the Circles screen opens.
6. Test invalid/expired codes and the 60-second resend limit; test profile creation and actual Supabase Row Level Security separately.

**Important Free-tier limitation (Supabase June 2026):** New free projects that use Supabase's **default email provider** cannot customize their auth email templates. Pre-June-3 existing free projects retain their custom templates, and setting up your **own SMTP provider** can restore customization on eligible free projects. If the template editor is locked, source changes alone cannot produce a six-digit email: configure a compatible SMTP provider or another permitted auth flow. Do not spend money or upgrade automatically; first check what the project allows. Source: https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier

## Client already prepared

- `signInWithOtp({ email })` requests the email; Supabase decides whether to send a link or code based on these templates.
- `verifyOtp({ email, token, type: 'email' })` verifies six digits, following current Supabase JavaScript docs.
- PAGES retains only the pending email and send timestamp in window `sessionStorage` for up to 30 minutes so returning from Mail does not lose the code screen.
- The generated code itself is not stored; verification is done by Supabase.
- Older links may continue to open a separate browser until the provider settings change.

**Docs:** https://supabase.com/docs/guides/auth/auth-email-passwordless and https://supabase.com/docs/guides/auth/auth-email-templates

**No confidential credentials or live OTPs belong in GitHub or public issue comments.**
