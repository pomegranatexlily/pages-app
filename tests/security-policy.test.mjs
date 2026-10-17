import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const baseline = read('supabase/migrations/001_initial_schema.sql');
const profile = read('supabase/migrations/002_limit_profile_email_select.sql');
const invite = read('supabase/migrations/003_atomic_invite_redemption.sql');
const tables = [...baseline.matchAll(/create table public\.([a-z_]+)\s*\(/gi)].map(m => m[1]);
assert(tables.length >= 10, 'Expected to verify all private SQL tables');
for (const table of tables) {
  assert(baseline.includes('alter table public.' + table + ' enable row level security;'),
    'Private table missing RLS: ' + table);
}
assert.match(profile, /revoke select on table public\.profiles from public, anon, authenticated;/i);
assert.match(profile, /grant select\s*\(id, display_name, created_at\)\s*on table public\.profiles to authenticated;/i);
assert.doesNotMatch(profile, /grant select\s*\(.*?email.*?\)/i, 'Email must remain excluded from member-list reads');

assert.match(invite, /security definer\s+set search_path\s*=\s*''/i,
  'Privileged RPC must pin its search path');
assert.match(invite, /if auth\.uid\(\) is null then/i);
assert.match(invite, /from public\.invitations[\s\S]*?where token = p_token\s+for update;/i,
  'Invite row must be locked before checking its use count');
assert.match(invite, /from public\.memberships[\s\S]*?where circle_id = v_inv\.circle_id and user_id = auth\.uid\(\)\s+for update;/i);
assert.match(invite, /if v_inv\.uses >= v_inv\.max_uses then/i);
assert.match(invite, /set status = 'active', role = 'member'/i,
  'Expired or removed admin membership may never silently regain elevated role');
assert.match(invite, /revoke execute on function public\.accept_invite\(text\) from public, anon;/i);
assert.match(invite, /grant execute on function public\.accept_invite\(text\) to authenticated;/i);
assert.match(invite, /drop policy if exists "members manage invites" on public\.invitations;/i);
assert.match(invite, /create policy "members read invites"[\s\S]*?for select to authenticated/i);
assert.match(invite, /create policy "members create invites"[\s\S]*?for insert to authenticated/i);
assert.match(invite, /and uses = 0[\s\S]*?and max_uses between 1 and 100/i);
for (const match of invite.matchAll(/create policy "[^"]+" on public\.invitations([\s\S]*?);/gi)) {
  assert.doesNotMatch(match[0], /for (?:all|update|delete) to authenticated/i,
    'User-level writes must never change server-tracked invite uses or tokens');
}
assert.match(invite, /drop policy if exists "owners manage memberships" on public\.memberships;/i);
assert.match(invite, /create policy "owners manage memberships"[\s\S]*?using \(public\.circle_role\(circle_id\) = 'owner'\)/i);
const clientFiles = ['js/config.js', 'js/main.js', 'js/store/supabase-adapter.js'];
for (const file of clientFiles) {
  const source = read(file);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|supabase_service_role/i,
    'Never include a privileged Supabase service-role credential in public client: ' + file);
}
console.log('PAGES source-level security contracts: all private tables RLS-enabled, profile email restricted, atomic authenticated invites, role downgrade on rejoin.');
console.log('The live Supabase database configuration and migrations still require a separate deployed-schema verification.');
