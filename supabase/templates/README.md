# PAGES — Supabase email template handoff

This is a **ready-to-paste source file**, not a deployed Supabase setting. The account owner must apply it in the correct Supabase project.

- Use [magic-link.html](magic-link.html) as the **Magic Link** email template in the Supabase dashboard: **Authentication → Email Templates → Magic Link**.
- Confirm the variable for the code is `{{ .Token }}` (Supabase template syntax; six digits), while `{{ .ConfirmationURL }}` provides the direct sign-in link.
- Verify the deployed PAGES hostname is on **Authentication → URL Configuration → Redirect URLs**, matching the address used by the app. Keep the current GitHub Pages redirect until migration is explicitly completed.
- Request a sign-in email, enter the code from the email inside the app, and test the link in Safari and a separate browser. Do not paste any real code or magic link into GitHub issues.
- Apply and test `supabase/migrations/002_limit_profile_email_select.sql` in the live project before encouraging sign-ups. The template does **not** resolve database security.

No real user emails, credentials, or private tokens belong in either template file.
