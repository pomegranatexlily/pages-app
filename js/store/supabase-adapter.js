/**
 * Supabase adapter — production PAGES data layer.
 *
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY (see .env.example).
 * Authorization is enforced by Postgres row-level security; see
 * supabase/migrations/001_initial_schema.sql. This adapter never
 * uses the service-role key in the browser.
 *
 * Status: IMPLEMENTED, UNTESTED against a live project (no Supabase
 * project exists yet — founder action required). The interface matches
 * local-adapter.js exactly; switching adapters requires no view changes.
 */
import db from './db.js';

let supabase = null;
let session = null;

async function client() {
  if (supabase) return supabase;
  const url = window.PAGES_CONFIG?.SUPABASE_URL;
  const key = window.PAGES_CONFIG?.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  supabase = mod.createClient(url, key);
  return supabase;
}

async function me() {
  const sb = await client();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  let { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!profile) {
    // first sign-in: create the profile row (RLS allows own-profile insert)
    const displayName =
      sessionStorage.getItem('pages_display_name') || user.email.split('@')[0];
    const { data, error } = await sb.from('profiles')
      .insert({ id: user.id, email: user.email, display_name: displayName })
      .select().single();
    if (error) throw error;
    profile = data;
  }
  session = { userId: user.id, email: user.email, displayName: profile.display_name };
  return session;
}

const sbx = Object.create(db);
sbx.mode = 'supabase';

sbx.currentSession = async () => {
  try { return await me(); } catch { return null; }
};

sbx.signIn = async (email, displayName) => {
  const sb = await client();
  if (displayName) sessionStorage.setItem('pages_display_name', displayName);
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: location.origin + location.pathname },
  });
  if (error) throw error;
  return { email, pendingMagicLink: true };
};

sbx.signOut = async () => { (await client()).auth.signOut(); session = null; };

sbx.listCircles = async () => {
  const sb = await client(); const s = await me();
  const { data, error } = await sb.from('circles')
    .select('*, memberships!inner(user_id)')
    .eq('memberships.user_id', s.userId).eq('memberships.status', 'active');
  if (error) throw error;
  return data;
};

sbx.createCircle = async ({ name, description }) => {
  const sb = await client(); const s = await me();
  const { data, error } = await sb.from('circles')
    .insert({ name, description, created_by: s.userId }).select().single();
  if (error) throw error;
  return data;
};

sbx.getCircle = async (circleId) => {
  const sb = await client();
  const { data, error } = await sb.from('circles').select(
    '*, memberships(*, profiles(display_name))').eq('id', circleId).single();
  if (error) throw error;
  return data;
};

sbx.createInvite = async (circleId, { maxUses = 10, ttlHours = 72 } = {}) => {
  const sb = await client(); const s = await me();
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const { error } = await sb.from('invitations').insert({
    circle_id: circleId, token, created_by: s.userId, max_uses: maxUses,
    expires_at: new Date(Date.now() + ttlHours * 3600e3).toISOString(),
  });
  if (error) throw error;
  return { token, url: `${location.origin}${location.pathname}#/join/${token}` };
};

sbx.acceptInvite = async (tok) => {
  const sb = await client(); const s = await me();
  const { data, error } = await sb.rpc('accept_invite', { p_token: tok });
  if (error) throw error;
  return data;
};

sbx.listMissions = async (circleId) => {
  const sb = await client();
  const { data, error } = await sb.from('missions')
    .select('*, milestones(*)').eq('circle_id', circleId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

sbx.createMission = async (circleId, { title, description }) => {
  const sb = await client(); const s = await me();
  const { data, error } = await sb.from('missions')
    .insert({ circle_id: circleId, title, description, created_by: s.userId })
    .select().single();
  if (error) throw error;
  return data;
};

sbx.updateMission = async (missionId, patch) => {
  const sb = await client();
  const p = {};
  if (patch.title !== undefined) p.title = patch.title;
  if (patch.description !== undefined) p.description = patch.description;
  if (patch.status !== undefined) p.status = patch.status;
  const { data, error } = await sb.from('missions').update(p).eq('id', missionId).select().single();
  if (error) throw error;
  return data;
};

sbx.createMilestone = async (missionId, { title, assigneeId, dueDate }) => {
  const sb = await client(); const s = await me();
  const { data, error } = await sb.from('milestones').insert({
    mission_id: missionId, title, assignee_id: assigneeId || null,
    due_date: dueDate || null, created_by: s.userId,
  }).select().single();
  if (error) throw error;
  return data;
};

sbx.toggleMilestone = async (milestoneId) => {
  const sb = await client();
  const { data: cur } = await sb.from('milestones').select('status').eq('id', milestoneId).single();
  const { data, error } = await sb.from('milestones')
    .update({ status: cur.status === 'open' ? 'done' : 'open' })
    .eq('id', milestoneId).select().single();
  if (error) throw error;
  return data;
};

sbx.listCommitments = async (circleId) => {
  const sb = await client();
  const { data, error } = await sb.from('commitments')
    .select('*, proposer:profiles!commitments_proposer_id_fkey(display_name), recipient:profiles!commitments_recipient_id_fkey(display_name)')
    .eq('circle_id', circleId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

sbx.proposeCommitment = async (circleId, { recipientId, title, terms }) => {
  const sb = await client(); const s = await me();
  const { data, error } = await sb.from('commitments').insert({
    circle_id: circleId, proposer_id: s.userId, recipient_id: recipientId, title, terms,
  }).select().single();
  if (error) throw error;
  return data;
};

sbx.respondCommitment = async (commitmentId, accept) => {
  const sb = await client();
  // RLS + a check constraint ensure only the recipient can decide a proposed commitment.
  const { data, error } = await sb.rpc('respond_commitment', {
    p_commitment_id: commitmentId, p_accept: accept,
  });
  if (error) throw error;
  return data;
};

sbx.completeCommitment = async (commitmentId) => {
  const sb = await client();
  const { data, error } = await sb.rpc('complete_commitment', { p_commitment_id: commitmentId });
  if (error) throw error;
  return data;
};

sbx.commitmentHistory = async (commitmentId) => {
  const sb = await client();
  const { data, error } = await sb.from('commitment_events')
    .select('*, actor:profiles(display_name)').eq('commitment_id', commitmentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

sbx.listMessages = async (circleId) => {
  const sb = await client();
  const { data, error } = await sb.from('messages')
    .select('*, user:profiles(display_name)').eq('circle_id', circleId)
    .order('created_at', { ascending: true }).limit(200);
  if (error) throw error;
  return data;
};

sbx.sendMessage = async (circleId, body) => {
  const sb = await client(); const s = await me();
  const { data, error } = await sb.from('messages')
    .insert({ circle_id: circleId, user_id: s.userId, body }).select().single();
  if (error) throw error;
  return data;
};

sbx.listActivity = async (circleId, limit = 50) => {
  const sb = await client();
  const { data, error } = await sb.from('activity_events')
    .select('*, actor:profiles(display_name)').eq('circle_id', circleId)
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
};

export default sbx;
