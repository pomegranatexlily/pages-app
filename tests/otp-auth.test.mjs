import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const adapter = read('js/store/supabase-adapter.js');
const ui = read('js/views/auth.js');
const policy = read('privacy.html');
const magic = read('supabase/email-templates/magic-link.html');
const signup = read('supabase/email-templates/confirm-signup.html');

assert.match(adapter, /auth\.signInWithOtp\(/, 'Client requests Supabase passwordless email');
assert.match(adapter, /auth\.verifyOtp\([\s\S]*?type:\s*'email'/, 'Verify as Supabase email OTP');
assert.doesNotMatch(adapter, /type:\s*'magiclink'/, 'Do not verify email codes as magiclinks');
for (const [name, template] of [['Magic link', magic], ['Confirm signup', signup]]) {
  assert.ok(template.includes('{{ .Token }}'), name + ': display six-digit provider token');
  assert.ok(!template.includes('{{ .ConfirmationURL }}'), name + ': do not force opening a browser');
  assert.ok(!template.includes('https://'), name + ': no external links');
}
assert.match(ui, /readPending\(\)/, 'Recover code screen after returning from Mail');
assert.match(ui, /savePending\(email, sentAt\)/, 'Persist pending state');
assert.match(ui, /clearPending\(\)/, 'Clear after sign-in or change');
assert.match(ui, /Resend code/, 'Resend entry present');
assert.match(ui, /Sign in with code/, 'Code entry explicitly supported');
assert.match(policy, /temporarily stores the email address/, 'Privacy notice discloses pending email state');
console.log('PAGES email OTP source and template acceptance checks passed.');
