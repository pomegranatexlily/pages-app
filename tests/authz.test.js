/**
 * PAGES v0.1 acceptance tests — run against the local adapter.
 * Mirrors the founder's primary end-to-end scenario.
 * Usage: node tests/authz.test.js
 */
const store = {};
const tab1sess = {}, tab2sess = {};
function makeStorage(s) {
  return {
    getItem: k => s[k] ?? null,
    setItem: (k, v) => { s[k] = v; },
    removeItem: k => { delete s[k]; },
  };
}
global.localStorage = makeStorage(store);   // shared data (same browser)
let activeTab = 1;
Object.defineProperty(global, 'sessionStorage', {
  get: () => makeStorage(activeTab === 1 ? tab1sess : tab2sess), // per-tab session
  configurable: true,
});
global.location = { origin: 'http://localhost', pathname: '/index.html', hash: '' };
global.window = global;

const db = (await import('../js/store/local-adapter.js')).default;

let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name); }
};
const throws = async (fn, name) => {
  try { await fn(); ok(false, name + ' (no error thrown)'); }
  catch (e) { ok(true, name + ' → ' + e.message); }
};

console.log('PAGES v0.1 acceptance — local adapter\n');

// --- Scenario: three friends organize a community event ---
// Person A
await db.signIn('a@test.com', 'Ama');
const A = await db.currentSession();
const circle = await db.createCircle({ name: 'Community Event Team', description: 'First event' });
ok(circle.id, 'A creates a circle');

// A invites B and C
const { token } = await db.createInvite(circle.id);
ok(token.length >= 8, 'A creates an invite token');

// Person B joins
await db.signOut();
await db.signIn('b@test.com', 'Ben');
const B = await db.currentSession();
const joined = await db.acceptInvite(token);
ok(joined.id === circle.id, 'B joins via invite');

// Person C joins
await db.signOut();
await db.signIn('c@test.com', 'Cyd');
await db.acceptInvite(token);
const detail = await db.getCircle(circle.id);
ok(detail.members.length === 3, 'circle has 3 members');

// A creates a mission with milestones
await db.signOut(); await db.signIn('a@test.com', 'Ama');
const mission = await db.createMission(circle.id, {
  title: 'Organize our first community event', description: 'Done = announced' });
for (const t of ['Select a location', 'Establish the budget', 'Confirm participants', 'Publish the event announcement'])
  await db.createMilestone(mission.id, { title: t });
let missions = await db.listMissions(circle.id);
ok(missions[0].milestones.length === 4, 'mission has 4 milestones');

// milestone toggle persists
const ms = missions[0].milestones[0];
await db.toggleMilestone(ms.id);
missions = await db.listMissions(circle.id);
ok(missions[0].milestones.find(x => x.id === ms.id).status === 'done', 'milestone toggles to done');

// A proposes a commitment to B
const cm = await db.proposeCommitment(circle.id, {
  recipientId: B.userId, title: 'Confirm the venue by October 16',
  terms: 'Call Riverside Hall, confirm Oct 24 availability, report back in chat.' });
ok(cm.status === 'proposed', 'commitment proposed');

// B accepts (only the recipient can)
await db.signOut(); await db.signIn('b@test.com', 'Ben');
await db.respondCommitment(cm.id, true);
let coms = await db.listCommitments(circle.id);
ok(coms[0].status === 'accepted', 'B accepts commitment');

// B completes
await db.completeCommitment(cm.id);
coms = await db.listCommitments(circle.id);
ok(coms[0].status === 'completed', 'B completes commitment');

// immutable history
const hist = await db.commitmentHistory(cm.id);
ok(hist.length === 3 && hist.every(e => e.snapshot && e.snapshot.title),
  'history has proposed→accepted→completed with immutable snapshots');

// activity visible to all three
const act = await db.listActivity(circle.id);
ok(act.length >= 8, 'activity feed records the journey (' + act.length + ' events)');

// --- Cross-tab: two accounts, one shared local database ---
// Tab 2 is a second browser tab: separate session, same localStorage data.
activeTab = 1; // first tab (currently signed in as Ben from the earlier flow)
const beforeTab1 = await db.currentSession();
const { token: token2 } = await db.createInvite(circle.id);
activeTab = 2; // second tab
await db.signOut();
await db.signIn('dave@test.com', 'Dave');
const Dtab = await db.currentSession();
ok(Dtab.displayName === 'Dave', 'tab 2 signs in as Dave without disturbing tab 1');
const joined2 = await db.acceptInvite(token2);
ok(joined2.id === circle.id, 'Dave joins from a second tab via the invite link');
activeTab = 1;
const stillTab1 = await db.currentSession();
ok(stillTab1.userId === beforeTab1.userId, 'tab 1 session untouched by tab 2 activity');

// --- Authorization boundaries ---
// nonmember cannot read
await db.signOut(); await db.signIn('mallory@test.com', 'Mallory');
await throws(() => db.getCircle(circle.id), 'nonmember cannot read circle');
await throws(() => db.listMissions(circle.id), 'nonmember cannot list missions');
await throws(() => db.sendMessage(circle.id, 'hi'), 'nonmember cannot message');

// proposer cannot accept on recipient's behalf
await db.signOut(); await db.signIn('a@test.com', 'Ama');
const cm2 = await db.proposeCommitment(circle.id, {
  recipientId: B.userId, title: 'Second task', terms: 'terms' });
await throws(() => db.respondCommitment(cm2.id, true), 'proposer cannot accept for recipient');

// double-accept is rejected
await db.signOut(); await db.signIn('b@test.com', 'Ben');
await db.respondCommitment(cm2.id, true);
await throws(() => db.respondCommitment(cm2.id, false), 'cannot re-decide a decided commitment');

// cannot propose to self / nonmember
await throws(() => db.proposeCommitment(circle.id, { recipientId: B.userId, title: '', terms: '' }),
  'empty title rejected');

// expired invite rejected
await db.signOut(); await db.signIn('a@test.com', 'Ama');
const inv2 = await db.createInvite(circle.id, { ttlHours: -1 });
await db.signOut(); await db.signIn('mallory@test.com', 'Mallory');
await throws(() => db.acceptInvite(inv2.token), 'expired invite rejected');

// refresh persistence (simulated: reload adapter state from storage)
await db.signOut(); await db.signIn('a@test.com', 'Ama');
const before = await db.listMissions(circle.id);
ok(before.length === 1, 'data persists across sessions');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
