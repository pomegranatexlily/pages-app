# PAGES Supabase email code template

PAGES supports both a 6-digit email code and a sign-in magic link. The frontend expects the 6-digit code to be present in the same Supabase authentication email.

**To activate (requires Supabase project owner access):** In Supabase Dashboard → Authentication → Email Templates → Magic Link, replace the HTML body with the contents of [magic-link.html](magic-link.html) and save. Depending on Supabase's current UI, the template can be under another Email Template label.

The template uses Supabase placeholders:
- `{{ .Token }}` — the numeric email OTP used by PAGES.
- `{{ .ConfirmationURL }}` — the Supabase-generated magic-link callback URL.

After saving, send a test login email and verify both the code and link. Check the Authentication site URL and redirect allowlist for the **actual** currently hosted PAGES origin. Do not switch origins without updating these settings, or sign-in callbacks may fail.

The HTML file in this repository does **not** change the live Supabase project until a privileged administrator applies it there. Never commit Supabase secret/service-role keys.
