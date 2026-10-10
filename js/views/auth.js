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
    ? 'Production mode — we\u2019ll email you a 6-digit code.'
    : 'Demo mode — no password. Use one email per test account (e.g. ama@test.com, ben@test.com).';
  wrap.querySelector('#mode').textContent = mode;
  // remember the last email so reopening the app is one tap
  if (db.mode !== 'supabase') {
    try {
      const last = localStorage.getItem('pages_last_email');
      if (last) wrap.querySelector('#email').value = last;
    } catch {}
  }
  wrap.querySelector('#go').onclick = async () => {
    const btn = wrap.querySelector('#go');
    if (btn.disabled) return; // already sending — don't stack up emails
    const email = wrap.querySelector('#email').value.trim();
    const name = wrap.querySelector('#name').value.trim();
    if (!email) return toast('Enter an email to continue');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const s = await db.signIn(email, name);
      if (s.pendingMagicLink) {
        showCodeStep(wrap, email);
        return;
      }
      location.hash = '#/';
    } catch (e) { toast(e.message); }
    btn.disabled = false;
    btn.textContent = 'Continue';
  };
  return wrap;
}

// Step 2 of email login: the user types the 6-digit code from the email.
// Works everywhere — home-screen PWA, any browser — because nothing has
// to hop between apps. The magic link in the same email keeps working too.
function showCodeStep(wrap, email) {
  const card = wrap.querySelector('.card');
  card.innerHTML = `
      <div class="field"><label>6-digit code</label>
        <input id="code" type="text" inputmode="numeric" autocomplete="one-time-code"
               placeholder="123456" maxlength="6" style="text-align:center;letter-spacing:0.35em;font-size:1.4em"></div>
      <button class="btn" id="verify">Verify</button>
      <button class="btn ghost" id="resend" disabled>Resend code (60s)</button>
      <p class="hint">Sent to ${esc(email)}. Didn\u2019t get it? Check spam — or tap the sign-in link in the email instead.</p>`;
  wrap.querySelector('#mode').textContent = 'Enter the code from your email.';
  const codeEl = card.querySelector('#code');
  const verifyBtn = card.querySelector('#verify');
  const resendBtn = card.querySelector('#resend');
  codeEl.focus();

  // Resend cooldown: one email per minute — hammering Continue trips
  // Supabase's email rate limit and locks everyone out.
  let wait = 60;
  const t = setInterval(() => {
    wait -= 1;
    if (wait <= 0) {
      clearInterval(t);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend code';
    } else {
      resendBtn.textContent = `Resend code (${wait}s)`;
    }
  }, 1000);

  resendBtn.onclick = async () => {
    if (resendBtn.disabled) return;
    resendBtn.disabled = true;
    try {
      await db.signIn(email);
      toast('New code sent');
    } catch (e) { toast(e.message); }
    wait = 60;
    resendBtn.textContent = `Resend code (${wait}s)`;
    const t2 = setInterval(() => {
      wait -= 1;
      if (wait <= 0) {
        clearInterval(t2);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend code';
      } else {
        resendBtn.textContent = `Resend code (${wait}s)`;
      }
    }, 1000);
  };

  verifyBtn.onclick = async () => {
    const code = codeEl.value.trim();
    if (code.length < 6) return toast('Enter the 6-digit code');
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying\u2026';
    try {
      if (typeof db.verifyCode !== 'function') throw new Error('Code login not supported here');
      await db.verifyCode(email, code);
      location.hash = '#/circles';
    } catch (e) {
      toast(e.message);
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify';
    }
  };
  codeEl.addEventListener('keydown', e => { if (e.key === 'Enter') verifyBtn.click(); });
}
