import { db, el, esc, timeAgo } from '../main.js';

export async function showHome(session) {
  const root = el('<div></div>');
  root.innerHTML = `<h1>Good to see you, ${esc(session.displayName)}.</h1>
    <p class="lede">Your Circles, and what needs you today.</p>
    <div id="needs"></div>
    <h2 class="sec">Recent activity</h2>
    <div id="feed"></div>`;

  const circles = await db.listCircles();
  const needs = root.querySelector('#needs');
  const feed = root.querySelector('#feed');

  if (!circles.length) {
    needs.innerHTML = `<div class="empty"><div class="big">◯</div>
      <p>No Circles yet. Everything on PAGES starts with people you trust.</p></div>`;
  } else {
    // commitments awaiting this user + open missions across circles
    let waiting = [];
    for (const c of circles) {
      const coms = await db.listCommitments(c.id);
      waiting.push(...coms.filter(x => x.status === 'proposed' && x.recipientId === session.userId)
        .map(x => ({ ...x, circleName: c.name })));
    }
    needs.innerHTML = waiting.length
      ? waiting.map(w => `<div class="card tappable" data-c="${w.circleId}">
          <div class="row"><div class="title">${esc(w.title)}</div>
          <span class="pill proposed">needs your answer</span></div>
          <div class="meta">${esc(w.circleName)} · proposed by ${esc(w.proposer?.displayName || w.proposer?.display_name || 'someone')}</div>
        </div>`).join('')
      : `<div class="card"><div class="meta">Nothing needs your answer right now. ${circles.length} circle${circles.length > 1 ? 's' : ''} running.</div></div>`;
    needs.querySelectorAll('[data-c]').forEach(card =>
      card.onclick = () => location.hash = '#/circle/' + card.dataset.c);
  }

  // activity across circles (newest first)
  let events = [];
  for (const c of circles.slice(0, 5)) {
    const evs = await db.listActivity(c.id, 8);
    events.push(...evs.map(e => ({ ...e, circleName: c.name })));
  }
  events.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
  feed.innerHTML = events.length
    ? events.slice(0, 20).map(e => `<div class="ev">${esc(e.summary)}
        <div class="when">${esc(e.circleName)} · ${timeAgo(e.createdAt || e.created_at)}</div></div>`).join('')
    : `<div class="empty"><p>Activity from your Circles will appear here.</p></div>`;
  return root;
}
