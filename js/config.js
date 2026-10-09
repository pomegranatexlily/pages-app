// PAGES production config — Supabase backend.
// The publishable key is public by design (Supabase docs): it is safe in
// browser code. Real security is the Postgres row-level security in
// supabase/migrations/001_initial_schema.sql. Never put the secret key here.
export default {
  MODE: 'supabase',
  SUPABASE_URL: 'https://cwcdbmlorgjgngjaqlap.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_8oMKini1j2ooixV8sFMPlw_26NT_u7D',
};
