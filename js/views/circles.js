import { db, el, esc, toast, timeAgo } from '../main.js';

export async function showCircles(session) {
  const root = el('<div></div>');
  root.innerHTML = `<h1>Circles</h1>
    <p class="lede">One identity. Many Circles. Everything you build together.</p>
    <div id="list"></div>
    <h2 class="sec">Start a new Circle</h2>
    <div class="card">
      <div class="field"><label>Name</label><input id="cname" placeholder="e.g. Community Event Team"></div>
      <div class="field"><label>Purpose</label><textarea id="cdesc" placeholder="What is this Circle for?"></textarea></div>
      <button class="btn" id="create">Create Circle</button>
    </div>`;

  const render = async () => {
    const circles = await db.listCircles();
    const list = root.querySelector('#list');
    list.innerHTML = circles.length ? '' : `<div class="empty"><div class="big">◯</div><p>Your Circles will live here.</p></div>`;
    for (const c of circles) {
      const card = el(`<div class="card tappable">
        <div class="title">${esc(c.name)}</div>
        <div class="meta">${esc(c.description || '')}</div>
        <div class="meta" style="margin-top:6px">${c.memberCount ?? ''} members</div>
      </div>`);
      card.onclick = () => location.hash = '#/circle/' + c.id;
      list.appendChild(card);
    }
  };
  await render();

  root.querySelector('#create').onclick = async () => {
    const name = root.querySelector('#cname').value;
    const description = root.querySelector('#cdesc').value;
    try {
      const c = await db.createCircle({ name, description });
      toast('Circle created');
      location.hash = '#/circle/' + c.id;
    } catch (e) { toast(e.message); }
  };
  return root;
}

export async function showJoin(session, token) {
  const root = el('<div></div>');
  root.innerHTML = `<h1>Join Circle</h1><p class="lede">Checking your invitation…</p>`;
  try {
    const c = await db.acceptInvite(token);
    root.innerHTML = `<h1>Welcome in.</h1>
      <p class="lede">You're now a member of <b>${esc(c.name)}</b>.</p>
      <button class="btn" id="open">Open the Circle</button>`;
    root.querySelector('#open').onclick = () => location.hash = '#/circle/' + c.id;
  } catch (e) {
    root.innerHTML = `<h1>Invite didn't work</h1>
      <p class="lede">${esc(e.message)}</p>
      <button class="btn secondary" id="back">Back to Circles</button>`;
    root.querySelector('#back').onclick = () => location.hash = '#/circles';
  }
  return root;
}

const TABS = ['Activity', 'Missions', 'Commitments', 'Chat', 'Members'];

export async function showCircleDetail(session, circleId) {
  const root = el('<div></div>');
  let circle;
  try { circle = await db.getCircle(circleId); }
  catch (e) { root.innerHTML = `<h1>Circle unavailable</h1><p class="lede">${esc(e.message)}</p>`; return root; }

  root.innerHTML = `
    <h1>${esc(circle.name)}</h1>
    <p class="lede">${esc(circle.description || '')}</p>
    <div id="tabrow" style="display:flex;gap:8px;overflow-x:auto;margin-bottom:14px"></div>
    <div id="tabbody"></div>`;

  const tabrow = root.querySelector('#tabrow');
  const tabbody = root.querySelector('#tabbody');
  let active = 'Activity';

  const draw = async () => {
    tabrow.innerHTML = '';
    for (const t of TABS) {
      const b = el(`<button class="btn small ${t === active ? '' : 'secondary'}">${t}</button>`);
      b.onclick = () => { active = t; draw(); };
      tabrow.appendChild(b);
    }
    tabbody.innerHTML = '<p class="lede">Loading…</p>';
    try {
      if (active === 'Activity') tabbody.appendChild(await vActivity(circleId));
      if (active === 'Missions') tabbody.appendChild(await vMissions(session, circle, root, draw));
      if (active === 'Commitments') tabbody.appendChild(await vCommitments(session, circle));
      if (active === 'Chat') tabbody.appendChild(await vChat(session, circleId));
      if (active === 'Members') tabbody.appendChild(await vMembers(session, circle));
    } catch (e) { tabbody.innerHTML = `<p class="lede">${esc(e.message)}</p>`; }
  };
  await draw();
  return root;
}

async function vActivity(circleId) {
  const wrap = el('<div></div>');
  const evs = await db.listActivity(circleId);
  wrap.innerHTML = evs.length
    ? evs.map(e => `<div class="ev">${esc(e.summary)}<div class="when">${timeAgo(e.createdAt || e.created_at)}</div></div>`).join('')
    : `<div class="empty"><p>Nothing has happened here yet. Start the first Mission.</p></div>`;
  return wrap;
}

async function vMissions(session, circle, root, redraw) {
  const wrap = el('<div></div>');
  const missions = await db.listMissions(circle.id);
  const box = el('<div></div>');
  for (const m of missions) {
    const card = el(`<div class="card">
      <div class="row"><div class="title">${esc(m.title)}</div>
        <span class="pill ${m.status}">${m.status}</span></div>
      ${m.description ? `<div class="meta">${esc(m.description)}</div>` : ''}
      <div class="ms"></div>
      <div class="field" style="margin-top:10px"><input placeholder="Add a milestone…" class="msin"></div>
    </div>`);
    const msBox = card.querySelector('.ms');
    const paint = async () => {
      const cur = (await db.listMissions(circle.id)).find(x => x.id === m.id);
      msBox.innerHTML = '';
      const list = cur.milestones || [];
      for (const ms of list) {
        const an = ms.assigneeId ? '' : '';
        const row = el(`<div class="item">
          <div class="check ${ms.status === 'done' ? 'on' : ''}"></div>
          <div class="grow"><div class="t ${ms.status === 'done' ? 'strike' : ''}">${esc(ms.title)}</div>
          ${ms.dueDate || ms.due_date ? `<div class="s">due ${esc(ms.dueDate || ms.due_date)}</div>` : ''}</div>
        </div>`);
        row.querySelector('.check').onclick = async () => { await db.toggleMilestone(ms.id); paint(); };
        msBox.appendChild(row);
      }
      if (!list.length) msBox.innerHTML = '<div class="meta" style="padding:8px 0">No milestones yet.</div>';
    };
    await paint();
    card.querySelector('.msin').addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter' || !e.target.value.trim()) return;
      await db.createMilestone(m.id, { title: e.target.value.trim() });
      e.target.value = ''; paint(); toast('Milestone added');
    });
    const foot = el(`<div style="display:flex;gap:8px;margin-top:8px"></div>`);
    if (m.status === 'open') {
      const done = el('<button class="btn small secondary">Mark mission complete</button>');
      done.onclick = async () => { await db.updateMission(m.id, { status: 'done' }); redraw(); };
      foot.appendChild(done);
    }
    card.appendChild(foot);
    box.appendChild(card);
  }
  const form = el(`<div class="card"><h2 class="sec" style="margin-top:0">Start a Mission</h2>
    <div class="field"><label>Title</label><input class="mt" placeholder="e.g. Organize our first community event"></div>
    <div class="field"><label>Description</label><textarea class="md" placeholder="What does done look like?"></textarea></div>
    <button class="btn">Create Mission</button></div>`);
  form.querySelector('.btn').onclick = async () => {
    try {
      await db.createMission(circle.id, {
        title: form.querySelector('.mt').value,
        description: form.querySelector('.md').value,
      });
      toast('Mission started'); redraw();
    } catch (e) { toast(e.message); }
  };
  wrap.append(box, form);
  return wrap;
}

async function vCommitments(session, circle) {
  const wrap = el('<div></div>');
  const list = await db.listCommitments(circle.id);
  const box = el('<div></div>');
  for (const c of list) {
    const pname = c.proposer?.displayName || c.proposer?.display_name || '?';
    const rname = c.recipient?.displayName || c.recipient?.display_name || '?';
    const mine = c.recipientId === session.userId || c.recipient_id === session.userId;
    const card = el(`<div class="card">
      <div class="row"><div class="title">${esc(c.title)}</div><span class="pill ${c.status}">${c.status}</span></div>
      <div class="meta">${esc(pname)} → ${esc(rname)} · ${timeAgo(c.createdAt || c.created_at)}</div>
      ${(c.terms) ? `<div style="margin-top:8px;font-size:14px">${esc(c.terms)}</div>` : ''}
      <div class="acts" style="display:flex;gap:8px;margin-top:10px"></div>
    </div>`);
    const acts = card.querySelector('.acts');
    if (c.status === 'proposed' && mine) {
      const a = el('<button class="btn small">Accept</button>');
      const d = el('<button class="btn small secondary">Decline</button>');
      a.onclick = async () => { await db.respondCommitment(c.id, true); toast('Commitment accepted'); location.reload(); };
      d.onclick = async () => { await db.respondCommitment(c.id, false); toast('Commitment declined'); location.reload(); };
      acts.append(a, d);
    } else if (c.status === 'accepted') {
      const done = el('<button class="btn small secondary">Mark completed</button>');
      done.onclick = async () => {
        try { await db.completeCommitment(c.id); toast('Completed'); location.reload(); }
        catch (e) { toast(e.message); }
      };
      acts.appendChild(done);
    }
    const hist = el('<button class="btn small ghost">History</button>');
    hist.onclick = async () => {
      const evs = await db.commitmentHistory(c.id);
      toast(evs.map(e => `${e.eventType}: ${e.snapshot?.title || ''}`).join(' → ') || 'No history');
    };
    acts.appendChild(hist);
    box.appendChild(card);
  }
  if (!list.length) box.innerHTML = `<div class="empty"><p>No commitments yet. Propose the first one.</p></div>`;

  // propose form — recipient picker from members
  const members = (circle.members || []).map(m => ({
    id: m.userId || m.user_id, name: m.user?.displayName || m.user?.display_name || m.profiles?.display_name || '?',
  })).filter(m => m.id !== session.userId);
  const form = el(`<div class="card"><h2 class="sec" style="margin-top:0">Propose a Commitment</h2>
    <div class="field"><label>To whom</label><select class="cr">
      ${members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}
    </select></div>
    <div class="field"><label>Title</label><input class="ct" placeholder="e.g. Confirm the venue"></div>
    <div class="field"><label>Exact terms</label><textarea class="cx" placeholder="What exactly is being promised, and by when?"></textarea></div>
    <button class="btn">Propose</button></div>`);
  form.querySelector('.btn').onclick = async () => {
    try {
      await db.proposeCommitment(circle.id, {
        recipientId: form.querySelector('.cr').value,
        title: form.querySelector('.ct').value,
        terms: form.querySelector('.cx').value,
      });
      toast('Commitment proposed'); location.reload();
    } catch (e) { toast(e.message); }
  };
  wrap.append(box, form);
  return wrap;
}

async function vChat(session, circleId) {
  const wrap = el('<div></div>');
  const msgs = await db.listMessages(circleId);
  const box = el('<div class="card"></div>');
  box.innerHTML = msgs.length
    ? msgs.map(m => `<div class="ev"><b>${esc(m.user?.displayName || m.user?.display_name || '?')}</b> — ${esc(m.body)}
        <div class="when">${timeAgo(m.createdAt || m.created_at)}</div></div>`).join('')
    : '<div class="meta">No messages yet. Say hello.</div>';
  const form = el(`<div class="card"><div class="field"><input class="mb" placeholder="Message the Circle…"></div>
    <button class="btn">Send</button></div>`);
  const send = async () => {
    const v = form.querySelector('.mb').value.trim();
    if (!v) return;
    try { await db.sendMessage(circleId, v); location.reload(); }
    catch (e) { toast(e.message); }
  };
  form.querySelector('.btn').onclick = send;
  form.querySelector('.mb').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  wrap.append(box, form);
  return wrap;
}

async function vMembers(session, circle) {
  const wrap = el('<div></div>');
  const members = circle.members || [];
  wrap.innerHTML = `<h2 class="sec" style="margin-top:0">Members (${members.length})</h2>` +
    members.map(m => {
      const name = m.user?.displayName || m.user?.display_name || m.profiles?.display_name || '?';
      return `<div class="item"><div class="grow"><div class="t">${esc(name)}</div>
        <div class="s">${esc(m.role)}</div></div></div>`;
    }).join('');
  const inv = el(`<div class="card" style="margin-top:14px"><h2 class="sec" style="margin-top:0">Invite someone</h2>
    <p class="lede">Generates a secure invite link. Expires in 72 hours, up to 10 uses.</p>
    <button class="btn">Create invite link</button><div class="out"></div></div>`);
  inv.querySelector('.btn').onclick = async () => {
    try {
      const { url } = await db.createInvite(circle.id);
      inv.querySelector('.out').innerHTML =
        `<div class="invitebox"><code>${esc(url)}</code></div>
         <button class="btn small secondary" id="cp">Copy link</button>`;
      inv.querySelector('#cp').onclick = async () => {
        await navigator.clipboard.writeText(url).catch(() => {});
        toast('Invite link copied');
      };
    } catch (e) { toast(e.message); }
  };
  wrap.appendChild(inv);
  return wrap;
}
