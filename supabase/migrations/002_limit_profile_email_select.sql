-- PAGES privacy hardening migration (requires applying to the real Supabase database).
-- Source-only commits do NOT modify live Row Level Security or grants.
-- Any logged-in user previously had SELECT * access to every row in profiles
-- because policy "profiles readable by authenticated" USING (true), including email.
-- Preserve display-name joins while preventing public profile email enumeration.
BEGIN;
REVOKE SELECT ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, display_name, created_at) ON TABLE public.profiles TO authenticated;
-- Existing RLS policies still apply; display names remain readable by signed-in
-- users as previously designed. This cannot stop server-side service-role access.
COMMIT;

-- Post-deployment verification in Supabase SQL editor:
-- 1. Sign in with two test accounts; confirm circle rosters still load.
-- 2. As either user, a public REST select on profiles?select=email MUST fail.
-- 3. Sign-in profile upsert and joined display_name queries MUST still succeed.
-- 4. Check for any other SQL views or functions exposing profile emails.
