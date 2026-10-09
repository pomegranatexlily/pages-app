/**
 * Local adapter — full PAGES data layer on browser localStorage.
 *
 * DEMO MODE ONLY. Authorization is enforced in this client code so the
 * prototype behaves like production, but a hostile client could bypass it.
 * Real enforcement lives in Supabase row-level security (see
 * supabase/migrations/). Never treat local mode as secure.
 */
import db, {
  ROLES, MEMBER_STATUS, MISSION_STATUS, MILESTONE_STATUS, COMMITMENT_STATUS,
} from './db.js';

const KEY = 'pages_db_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || blank(); }
  catch { return blank(); }
}
function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
function blank() {
  return {
    users: [], circles: [], memberships: [], invites: [],
    missions: [], milestones: [], commitments: [], commitmentEvents: [],
    messages: [], activity: [],
  };
}
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const now = () => new Date().toISOString();
const token = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

function sessionUser() {
  const s = JSON.parse(sessionStorage.getItem('pages_session') || 'null');
  if (!s) throw new Error('Not signed in');
  return s;
}
function isMember(s, circleId, userId) {
  return s.memberships.some(m => m.circleId === circleId && m.userId === userId
    && m.status === MEMBER_STATUS.ACTIVE);
}
function requireMember(s, circleId, userId) {
  if (!isMember(s, circleId, userId)) throw new Error('Not a member of this circle');
}
function log(s, circleId, actorId, eventType, summary) {
  s.activity.unshift({ id: uid('ev'), circleId, actorId, eventType, summary, createdAt: now() });
}

const local = Object.create(db);
local.mode = 'local';

local.currentSession = async () =>
  JSON.parse(sessionStorage.getItem('pages_session') || 'null');

local.signIn = async (email, displayName) => {
  const s = load();
  let u = s.users.find(x => x.email === email.toLowerCase());
  if (!u) {
    u = { id: uid('u'), email: email.toLowerCase(), displayName: displayName || email.split('@')[0], createdAt: now() };
    s.users.push(u); save(s);
  } else if (displayName && displayName !== u.displayName) {
    u.displayName = displayName; save(s);
  }
  const sess = { userId: u.id, email: u.email, displayName: u.displayName };
  sessionStorage.setItem('pages_session', JSON.stringify(sess));
  try { localStorage.setItem('pages_last_email', u.email); } catch {}
  return sess;
};

local.signOut = async () => sessionStorage.removeItem('pages_session');

// ---- circles ----
local.listCircles = async () => {
  const s = load(); const me = sessionUser();
  const myIds = s.memberships.filter(m => m.userId === me.userId && m.status === MEMBER_STATUS.ACTIVE)
    .map(m => m.circleId);
  return s.circles.filter(c => myIds.includes(c.id))
    .map(c => ({ ...c, memberCount: s.memberships.filter(m => m.circleId === c.id && m.status === 'active').length }));
};

local.createCircle = async ({ name, description }) => {
  if (!name || !name.trim()) throw new Error('Circle needs a name');
  const s = load(); const me = sessionUser();
  const c = { id: uid('c'), name: name.trim(), description: (description || '').trim(),
    createdBy: me.userId, createdAt: now() };
  s.circles.push(c);
  s.memberships.push({ id: uid('m'), circleId: c.id, userId: me.userId,
    role: ROLES.OWNER, status: MEMBER_STATUS.ACTIVE, createdAt: now() });
  log(s, c.id, me.userId, 'circle.created', `${me.displayName} created the circle`);
  save(s);
  return c;
};

local.getCircle = async (circleId) => {
  const s = load(); const me = sessionUser();
  const c = s.circles.find(x => x.id === circleId);
  if (!c) throw new Error('Circle not found');
  requireMember(s, circleId, me.userId);
  const members = s.memberships.filter(m => m.circleId === circleId && m.status === 'active')
    .map(m => ({ ...m, user: s.users.find(u => u.id === m.userId) }));
  return { ...c, members };
};

// ---- invitations ----
local.createInvite = async (circleId, { maxUses = 10, ttlHours = 72 } = {}) => {
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  const inv = { id: uid('inv'), circleId, token: token(), createdBy: me.userId,
    maxUses, uses: 0, expiresAt: new Date(Date.now() + ttlHours * 3600e3).toISOString(),
    createdAt: now() };
  s.invites.push(inv); save(s);
  const url = `${location.origin}${location.pathname}#/join/${inv.token}`;
  return { token: inv.token, url };
};

local.acceptInvite = async (tok) => {
  const s = load(); const me = sessionUser();
  const inv = s.invites.find(x => x.token === tok);
  if (!inv) throw new Error('Invite not found');
  if (new Date(inv.expiresAt) < new Date()) throw new Error('Invite expired');
  if (inv.uses >= inv.maxUses) throw new Error('Invite fully used');
  const existing = s.memberships.find(m => m.circleId === inv.circleId && m.userId === me.userId);
  if (existing && existing.status === 'active') throw new Error('Already a member');
  if (existing) { existing.status = 'active'; }
  else {
    s.memberships.push({ id: uid('m'), circleId: inv.circleId, userId: me.userId,
      role: ROLES.MEMBER, status: MEMBER_STATUS.ACTIVE, createdAt: now() });
  }
  inv.uses += 1;
  const c = s.circles.find(x => x.id === inv.circleId);
  log(s, inv.circleId, me.userId, 'member.joined', `${me.displayName} joined the circle`);
  save(s);
  return c;
};

// ---- missions ----
local.listMissions = async (circleId) => {
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  return s.missions.filter(m => m.circleId === circleId).map(m => ({
    ...m,
    milestones: s.milestones.filter(ms => ms.missionId === m.id),
  }));
};

local.createMission = async (circleId, { title, description }) => {
  if (!title || !title.trim()) throw new Error('Mission needs a title');
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  const m = { id: uid('mis'), circleId, title: title.trim(),
    description: (description || '').trim(), status: MISSION_STATUS.OPEN,
    createdBy: me.userId, createdAt: now() };
  s.missions.push(m);
  log(s, circleId, me.userId, 'mission.created', `${me.displayName} started mission “${m.title}”`);
  save(s);
  return { ...m, milestones: [] };
};

local.updateMission = async (missionId, patch) => {
  const s = load(); const me = sessionUser();
  const m = s.missions.find(x => x.id === missionId);
  if (!m) throw new Error('Mission not found');
  requireMember(s, m.circleId, me.userId);
  if (patch.title !== undefined) m.title = patch.title;
  if (patch.description !== undefined) m.description = patch.description;
  if (patch.status !== undefined) {
    m.status = patch.status;
    log(s, m.circleId, me.userId, 'mission.' + patch.status,
      `${me.displayName} marked mission “${m.title}” ${patch.status}`);
  }
  save(s);
  return m;
};

// ---- milestones ----
local.createMilestone = async (missionId, { title, assigneeId, dueDate }) => {
  if (!title || !title.trim()) throw new Error('Milestone needs a title');
  const s = load(); const me = sessionUser();
  const mis = s.missions.find(x => x.id === missionId);
  if (!mis) throw new Error('Mission not found');
  requireMember(s, mis.circleId, me.userId);
  if (assigneeId && !isMember(s, mis.circleId, assigneeId)) throw new Error('Assignee is not a member');
  const ms = { id: uid('ms'), missionId, title: title.trim(), assigneeId: assigneeId || null,
    dueDate: dueDate || null, status: MILESTONE_STATUS.OPEN, createdBy: me.userId, createdAt: now() };
  s.milestones.push(ms);
  log(s, mis.circleId, me.userId, 'milestone.created',
    `${me.displayName} added milestone “${ms.title}”`);
  save(s);
  return ms;
};

local.toggleMilestone = async (milestoneId) => {
  const s = load(); const me = sessionUser();
  const ms = s.milestones.find(x => x.id === milestoneId);
  if (!ms) throw new Error('Milestone not found');
  const mis = s.missions.find(x => x.id === ms.missionId);
  requireMember(s, mis.circleId, me.userId);
  ms.status = ms.status === 'open' ? 'done' : 'open';
  log(s, mis.circleId, me.userId, 'milestone.' + ms.status,
    `${me.displayName} marked “${ms.title}” ${ms.status}`);
  save(s);
  return ms;
};

// ---- commitments ----
local.listCommitments = async (circleId) => {
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  return s.commitments.filter(c => c.circleId === circleId)
    .map(c => ({ ...c,
      proposer: s.users.find(u => u.id === c.proposerId),
      recipient: s.users.find(u => u.id === c.recipientId) }));
};

local.proposeCommitment = async (circleId, { recipientId, title, terms }) => {
  if (!title || !title.trim()) throw new Error('Commitment needs a title');
  if (!recipientId) throw new Error('Choose who this commitment is for');
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  if (!isMember(s, circleId, recipientId)) throw new Error('Recipient is not a member');
  if (recipientId === me.userId) throw new Error('Cannot propose a commitment to yourself');
  const c = { id: uid('cm'), circleId, proposerId: me.userId, recipientId,
    title: title.trim(), terms: (terms || '').trim(),
    status: COMMITMENT_STATUS.PROPOSED, createdAt: now(), decidedAt: null };
  s.commitments.push(c);
  s.commitmentEvents.push({ id: uid('ce'), commitmentId: c.id, eventType: 'proposed',
    actorId: me.userId, snapshot: { title: c.title, terms: c.terms }, createdAt: now() });
  const recip = s.users.find(u => u.id === recipientId);
  log(s, circleId, me.userId, 'commitment.proposed',
    `${me.displayName} proposed “${c.title}” to ${recip.displayName}`);
  save(s);
  return c;
};

local.respondCommitment = async (commitmentId, accept) => {
  const s = load(); const me = sessionUser();
  const c = s.commitments.find(x => x.id === commitmentId);
  if (!c) throw new Error('Commitment not found');
  requireMember(s, c.circleId, me.userId);
  if (c.recipientId !== me.userId) throw new Error('Only the recipient can accept or decline');
  if (c.status !== 'proposed') throw new Error('Commitment is no longer awaiting a response');
  c.status = accept ? 'accepted' : 'declined';
  c.decidedAt = now();
  // immutable snapshot of accepted terms
  s.commitmentEvents.push({ id: uid('ce'), commitmentId: c.id,
    eventType: accept ? 'accepted' : 'declined', actorId: me.userId,
    snapshot: { title: c.title, terms: c.terms }, createdAt: now() });
  log(s, c.circleId, me.userId, 'commitment.' + c.status,
    `${me.displayName} ${c.status} “${c.title}”`);
  save(s);
  return c;
};

local.completeCommitment = async (commitmentId) => {
  const s = load(); const me = sessionUser();
  const c = s.commitments.find(x => x.id === commitmentId);
  if (!c) throw new Error('Commitment not found');
  requireMember(s, c.circleId, me.userId);
  if (c.status !== 'accepted') throw new Error('Only accepted commitments can be completed');
  if (c.proposerId !== me.userId && c.recipientId !== me.userId)
    throw new Error('Only the proposer or recipient can complete');
  c.status = 'completed'; c.decidedAt = now();
  s.commitmentEvents.push({ id: uid('ce'), commitmentId: c.id, eventType: 'completed',
    actorId: me.userId, snapshot: { title: c.title, terms: c.terms }, createdAt: now() });
  log(s, c.circleId, me.userId, 'commitment.completed',
    `${me.displayName} completed “${c.title}”`);
  save(s);
  return c;
};

local.commitmentHistory = async (commitmentId) => {
  const s = load(); const me = sessionUser();
  const c = s.commitments.find(x => x.id === commitmentId);
  if (!c) throw new Error('Commitment not found');
  requireMember(s, c.circleId, me.userId);
  return s.commitmentEvents.filter(e => e.commitmentId === commitmentId)
    .map(e => ({ ...e, actor: s.users.find(u => u.id === e.actorId) }));
};

// ---- conversation ----
local.listMessages = async (circleId) => {
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  return s.messages.filter(m => m.circleId === circleId)
    .map(m => ({ ...m, user: s.users.find(u => u.id === m.userId) }));
};

local.sendMessage = async (circleId, body) => {
  if (!body || !body.trim()) throw new Error('Empty message');
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  const m = { id: uid('msg'), circleId, userId: me.userId, body: body.trim(), createdAt: now() };
  s.messages.push(m); save(s);
  return { ...m, user: s.users.find(u => u.id === me.userId) };
};

// ---- activity ----
local.listActivity = async (circleId, limit = 50) => {
  const s = load(); const me = sessionUser();
  requireMember(s, circleId, me.userId);
  return s.activity.filter(e => e.circleId === circleId).slice(0, limit)
    .map(e => ({ ...e, actor: s.users.find(u => u.id === e.actorId) }));
};

export default local;
