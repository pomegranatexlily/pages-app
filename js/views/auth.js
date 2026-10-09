import { db, el, esc, toast } from '../main.js';

export async function showAuth() {
  const wrap = el(`<div class="authwrap">
    <div class="mark">PAGES</div>
    <div class="tag">Build a Life Together.</div>
    <div class="card" style="text-align:left">
      <div class="field"><label>Email</label><input id="email" type="email" placeholder="you@example.com" autocomplete="email"></div>
      <div class="field"><label>Display name</label><input id="name" type="text" placeholder="What should Circles call you?" autocomplete="nickname"></div>
      <button class="btn" id="go">Continue</button>
    </div>
    <div class="mode-note" id="mode"></div>
  </div>`);
  const mode = db.mode === 'supabase'
    ? 'Production mode — check your email for a sign-in link.'
    : 'Demo mode — no password. Use one email per test account (e.g. ama@test.com, ben@test.com).';
  wrap.querySelector('#mode').textContent = mode;
  wrap.querySelector('#go').onclick = async () => {
    const email = wrap.querySelector('#email').value.trim();
    const name = wrap.querySelector('#name').value.trim();
    if (!email) return toast('Enter an email to continue');
    try {
      const s = await db.signIn(email, name);
      if (s.pendingMagicLink) { toast('Check your email for the sign-in link'); return; }
      location.hash = '#/';
    } catch (e) { toast(e.message); }
  };
  return wrap;
}
