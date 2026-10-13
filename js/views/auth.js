import { db, el, esc, toast } from '../main.js';

// Restore the code field when a home-screen app reloads after opening Mail.
const OTP_KEY = 'pages.otp.pending.v1';
function readPending() {
  try {
    const p = JSON.parse(sessionStorage.getItem(OTP_KEY) || 'null');
    if (p && typeof p.email === 'string' && p.email.length < 255 &&
        Number.isFinite(p.sentAt) && Date.now() >= p.sentAt &&
        Date.now() - p.sentAt < 30 * 60 * 1000) return p;
    sessionStorage.removeItem(OTP_KEY);
  } catch {}
  return null;
}
function savePending(email, sentAt) {
  try { sessionStorage.setItem(OTP_KEY, JSON.stringify({email, sentAt})); } catch {}
}
function clearPending() {
  try { sessionStorage.removeItem(OTP_KEY); } catch {}
}


export async function showAuth() {
  const wrap = el(`<div class="authwrap">
    <img class="pages-seal" src="./icon-192.png" alt="" width="82" height="82">
    <div class="mark">PAGES</div>
    <div class="tag">Organize. Create. Connect.</div>
    <p class="pages-subline">Build a life together, one Circle at a time.</p>
    <p role="note" style="max-width:440px;margin:10px auto 18px;color:#48256d;font-size:13px;line-height:1.55">PAGES is an early-access prototype. Avoid sensitive personal information while account security and data controls are being verified. <a href="./privacy.html" style="color:inherit;text-decoration:underline">Privacy &amp; data</a></p>
    <div class="card" style="text-align:left">
      <div class="field"><label>Email</label><input id="email" type="email" placeholder="you@example.com" autocomplete="email"></div>
      <div class="field"><label>Display name</label><input id="name" type="text" placeholder="What should Circles call you?" autocomplete="nickname"></div>
      <button class="btn" id="go">Email me a sign-in code</button>
      <p class="hint" style="margin-top:12px;font-size:12px;line-height:1.5">PAGES uses your email for sign-in and stores Circle data through Supabase. Read the <a href="./privacy.html" style="color:#48256d;text-decoration:underline">Privacy &amp; Data notice</a> before joining. Do not enter sensitive personal information in this early-stage release.</p>
    </div>
    <div class="mode-note" id="mode"></div>
  </div>`);
  const mode = db.mode === 'supabase'
    ? 'Keep PAGES open. Check your email, then enter the six digits here.'
    : 'Demo mode — no password. Use one email per test account (e.g. ama@test.com, ben@test.com).';
  wrap.querySelector('#mode').textContent = mode;
  // Restore the code screen if iPhone suspends PAGES while opening Mail.
  if (db.mode === 'supabase') {
    const pending = readPending();
    if (pending) {
      showCodeStep(wrap, pending.email, pending.sentAt);
      return wrap;
    }
  } else {
    wrap.querySelector('#go').textContent = 'Continue';
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
    if (!email || !wrap.querySelector('#email').checkValidity()) return toast('Enter a valid email address');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const s = await db.signIn(email, name);
      if (s.pendingOtp || s.pendingMagicLink) {
        const sentAt = Date.now();
        savePending(email, sentAt);
        showCodeStep(wrap, email, sentAt);
        return;
      }
      clearPending();
      location.hash = '#/';
    } catch (e) { toast(e.message); }
    btn.disabled = false;
    btn.textContent = db.mode === 'supabase' ? 'Email me a sign-in code' : 'Continue';
  };
  return wrap;
}

// Step 2: email OTP. Provider templates must include {{ .Token }}.
function showCodeStep(wrap, email, sentAt = Date.now()) {
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
