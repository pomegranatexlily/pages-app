/**
 * PAGES data layer — interface definition.
 *
 * Every adapter implements these methods. The app never touches
 * localStorage or Supabase directly; it talks to `db`.
 *
 * Two implementations:
 *  - local-adapter.js    → browser localStorage. Demo/pilot mode. No backend needed.
 *  - supabase-adapter.js → Supabase Auth + Postgres + RLS. Production mode.
 *
 * The active adapter is chosen in main.js based on config (see .env.example).
 */

export const ROLES = { OWNER: 'owner', ADMIN: 'admin', MEMBER: 'member' };
export const MEMBER_STATUS = { ACTIVE: 'active', INVITED: 'invited', REMOVED: 'removed' };
export const MISSION_STATUS = { OPEN: 'open', DONE: 'done' };
export const MILESTONE_STATUS = { OPEN: 'open', DONE: 'done' };
export const COMMITMENT_STATUS = {
  PROPOSED: 'proposed', ACCEPTED: 'accepted', DECLINED: 'declined',
  COMPLETED: 'completed', CANCELLED: 'cancelled',
};

/**
 * @typedef {object} Session
 * @property {string} userId
 * @property {string} email
 * @property {string} displayName
 */

const db = {
  mode: 'abstract',

  // ---- auth ----
  /** @returns {Promise<Session|null>} */
  currentSession() { throw new Error('not implemented'); },
  /** @returns {Promise<Session>} */
  signIn(email, displayName) { throw new Error('not implemented'); },
  /** @returns {Promise<void>} */
  signOut() { throw new Error('not implemented'); },

  // ---- circles ----
  /** @returns {Promise<Array>} circles the session user belongs to */
  listCircles() { throw new Error('not implemented'); },
  /** @returns {Promise<object>} */
  createCircle({ name, description }) { throw new Error('not implemented'); },
  /** @returns {Promise<object>} full circle incl. members (authz enforced) */
  getCircle(circleId) { throw new Error('not implemented'); },

  // ---- invitations ----
  /** @returns {Promise<{token:string, url:string}>} */
  createInvite(circleId, { maxUses = 10, ttlHours = 72 } = {}) { throw new Error('not implemented'); },
  /** @returns {Promise<object>} Redeem a token → membership. Throws on invalid/expired. */
  acceptInvite(token) { throw new Error('not implemented'); },

  // ---- missions ----
  /** @returns {Promise<Array>} */
  listMissions(circleId) { throw new Error('not implemented'); },
  /** @returns {Promise<object>} */
  createMission(circleId, { title, description }) { throw new Error('not implemented'); },
  /** @returns {Promise<object>} */
  updateMission(missionId, patch) { throw new Error('not implemented'); },

  // ---- milestones ----
  /** @returns {Promise<object>} */
  createMilestone(missionId, { title, assigneeId, dueDate }) { throw new Error('not implemented'); },
  /** @returns {Promise<object>} toggle open/done */
  toggleMilestone(milestoneId) { throw new Error('not implemented'); },

  // ---- commitments (Keystone Lite) ----
  /** @returns {Promise<Array>} */
  listCommitments(circleId) { throw new Error('not implemented'); },
  /** @returns {Promise<object>} proposer = session user */
  proposeCommitment(circleId, { recipientId, title, terms }) { throw new Error('not implemented'); },
  /** Only the recipient may accept/decline their own commitment. */
  respondCommitment(commitmentId, accept) { throw new Error('not implemented'); },
  /** Mark completed (proposer or recipient). */
  completeCommitment(commitmentId) { throw new Error('not implemented'); },
  /** @returns {Promise<Array>} immutable history */
  commitmentHistory(commitmentId) { throw new Error('not implemented'); },

  // ---- conversation ----
  /** @returns {Promise<Array>} */
  listMessages(circleId) { throw new Error('not implemented'); },
  /** @returns {Promise<object>} */
  sendMessage(circleId, body) { throw new Error('not implemented'); },

  // ---- activity ----
  /** @returns {Promise<Array>} newest first */
  listActivity(circleId, limit = 50) { throw new Error('not implemented'); },
};

export default db;
