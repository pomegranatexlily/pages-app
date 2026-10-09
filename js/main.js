/**
 * PAGES v0.1 — boot, config, router, shell.
 */
import localDb from './store/local-adapter.js';
import supabaseDb from './store/supabase-adapter.js';
import { showAuth } from './views/auth.js';
import { showHome } from './views/home.js';
import { showCircles, showCircleDetail } from './views/circles.js';
import { showJoin } from './views/join.js';

// ---------- config ----------
// Local demo mode by default. To use Supabase, create a config.js next to
// this file (see config.example.js) — it is gitignored.
let PAGES_CONFIG = { MODE: 'local' };
try {
  const m = await import('./config.js');
  PAGES_CONFIG = { ...PAGES_CONFIG, ...m.default };
} catch { /* no config.js — local mode */ }
window.PAGES_CONFIG = PAGES_CONFIG;

export const db = PAGES_CONFIG.MODE === 'supabase' ? supabaseDb : localDb;

// ---------- tiny helpers ----------
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = el('<div id="toast"></div>'); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : d + 'd ago';
}
export async function requireSession() {
  const s = await db.currentSession();
  if (!s) { location.hash = '#/auth'; return null; }
  return s;
}

// ---------- shell ----------
const app = document.getElementById('app');

function shell(inner, active) {
  app.innerHTML = '';
  const top = el(`<div class="topbar">
      <div><div class="brand">PAGES</div></div>
      <div class="who" id="who"></div>
    </div>`);
  const screen = el('<div class="screen"></div>');
  screen.appendChild(inner);
  const tabs = el(`<nav class="tabbar">
      <a href="#/" data-t="home"><span class="ic">⌂</span>Home</a>
      <a href="#/circles" data-t="circles"><span class="ic">◯</span>Circles</a>
      <a href="#/discover" data-t="discover" class="soon"><span class="ic">✦</span>Discover</a>
      <a href="#/inbox" data-t="inbox" class="soon"><span class="ic">✉</span>Inbox</a>
      <a href="#/me" data-t="me" class="soon"><span class="ic">☺</span>My Page</a>
    </nav>`);
  tabs.querySelectorAll('a').forEach(a => {
    if (a.dataset.t === active) a.classList.add('active');
    if (a.classList.contains('soon')) a.addEventListener('click', e => {
      e.preventDefault(); toast('Coming in a future release');
    });
  });
  app.append(top, screen, tabs);
  db.currentSession().then(s => {
    const who = document.getElementById('who');
    if (who && s) {
      who.innerHTML = `${esc(s.displayName)} <button id="signout">Sign out</button>`;
      document.getElementById('signout').onclick = async () => {
        await db.signOut(); location.hash = '#/auth'; location.reload();
      };
    }
  });
  return screen;
}

// ---------- router ----------
const routes = [
  [/^#\/$/, async () => { const s = await requireSession(); if (s) shell(await showHome(s), 'home'); }],
  [/^#\/auth$/, async () => { app.innerHTML = ''; app.appendChild(await showAuth()); }],
  [/^#\/circles$/, async () => { const s = await requireSession(); if (s) shell(await showCircles(s), 'circles'); }],
  [/^#\/circle\/([\w-]+)$/, async (m) => {
    const s = await requireSession(); if (s) shell(await showCircleDetail(s, m[1]), 'circles');
  }],
  [/^#\/join\/([\w-]+)$/, async (m) => {
    const s = await requireSession(); if (s) shell(await showJoin(s, m[1]), 'circles');
  }],
];

async function route() {
  const h = location.hash || '#/';
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) { try { await fn(m); } catch (e) { toast(e.message); } return; }
  }
  location.hash = '#/';
}

window.addEventListener('hashchange', route);
route();
