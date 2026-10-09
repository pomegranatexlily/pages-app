-- PAGES v0.1 — initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)
-- All private tables have row-level security. The anon key can only
-- touch rows the RLS policies allow; privileged mutations go through
-- SECURITY DEFINER functions below.

-- ---------- tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','invited','removed')),
  created_at timestamptz not null default now(),
  unique (circle_id, user_id)
);
create index on public.memberships (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles(id),
  max_uses int not null default 10 check (max_uses > 0),
  uses int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.messages (circle_id, created_at);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.missions (circle_id);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  assignee_id uuid references public.profiles(id),
  due_date date,
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  proposer_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 120),
  terms text not null default '',
  status text not null default 'proposed'
    check (status in ('proposed','accepted','declined','completed','cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check (proposer_id <> recipient_id)
);

create table public.commitment_events (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  event_type text not null check (event_type in ('proposed','accepted','declined','completed','cancelled')),
  actor_id uuid not null references public.profiles(id),
  snapshot jsonb not null,           -- immutable copy of title+terms at event time
  created_at timestamptz not null default now()
);
create index on public.commitment_events (commitment_id, created_at);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  event_type text not null,
  summary text not null,
  created_at timestamptz not null default now()
);
create index on public.activity_events (circle_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, read);

-- ---------- helpers ----------
-- (must come after the tables: Postgres validates SQL function bodies
--  against existing tables at creation time)
create or replace function public.is_circle_member(p_circle uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.memberships
    where circle_id = p_circle and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.circle_role(p_circle uuid)
returns text language sql stable security definer as $$
  select role from public.memberships
  where circle_id = p_circle and user_id = auth.uid() and status = 'active'
  limit 1;
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.messages enable row level security;
alter table public.missions enable row level security;
alter table public.milestones enable row level security;
alter table public.commitments enable row level security;
alter table public.commitment_events enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;

-- profiles: anyone authenticated can read (needed for member lists); users manage own row
create policy "profiles readable by authenticated" on public.profiles
  for select to authenticated using (true);
create policy "users manage own profile" on public.profiles
  for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- circles: visible to members; anyone authenticated can create
create policy "members read circles" on public.circles
  for select to authenticated using (public.is_circle_member(id));
create policy "authenticated create circles" on public.circles
  for insert to authenticated with check (created_by = auth.uid());
-- circle creator becomes owner via trigger below

-- memberships: members read their circle's roster; owners/admins manage
create policy "members read roster" on public.memberships
  for select to authenticated using (public.is_circle_member(circle_id));
create policy "owners manage memberships" on public.memberships
  for all to authenticated
  using (public.circle_role(circle_id) in ('owner','admin'))
  with check (public.circle_role(circle_id) in ('owner','admin'));

-- invitations: members can create; anyone with a valid token redeems via RPC only
create policy "members manage invites" on public.invitations
  for all to authenticated
  using (public.is_circle_member(circle_id))
  with check (public.is_circle_member(circle_id) and created_by = auth.uid());

-- messages / missions / commitments / events / activity: members only
create policy "members read-write messages" on public.messages
  for all to authenticated
  using (public.is_circle_member(circle_id))
  with check (public.is_circle_member(circle_id) and user_id = auth.uid());

create policy "members read-write missions" on public.missions
  for all to authenticated
  using (public.is_circle_member(circle_id))
  with check (public.is_circle_member(circle_id));

create policy "members read-write milestones" on public.milestones
  for all to authenticated
  using (exists (select 1 from public.missions m
                 where m.id = mission_id and public.is_circle_member(m.circle_id)))
  with check (exists (select 1 from public.missions m
                      where m.id = mission_id and public.is_circle_member(m.circle_id)));

create policy "members read commitments" on public.commitments
  for select to authenticated using (public.is_circle_member(circle_id));
create policy "members propose commitments" on public.commitments
  for insert to authenticated
  with check (public.is_circle_member(circle_id) and proposer_id = auth.uid());
-- status changes go through RPC functions (SECURITY DEFINER) so the
-- recipient-only rule is enforced server-side, not by client honesty.

create policy "members read commitment events" on public.commitment_events
  for select to authenticated using (
    exists (select 1 from public.commitments c
            where c.id = commitment_id and public.is_circle_member(c.circle_id)));

create policy "members read activity" on public.activity_events
  for select to authenticated using (public.is_circle_member(circle_id));

create policy "users read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());

-- ---------- triggers ----------
-- creator becomes owner on circle insert
create or replace function public.make_creator_owner()
returns trigger language plpgsql security definer as $$
begin
  insert into public.memberships (circle_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'active')
  on conflict (circle_id, user_id) do nothing;
  return new;
end $$;
create trigger trg_creator_owner after insert on public.circles
  for each row execute function public.make_creator_owner();

-- activity log helper
create or replace function public.log_activity()
returns trigger language plpgsql security definer as $$
begin
  insert into public.activity_events (circle_id, actor_id, event_type, summary)
  values (coalesce(new.circle_id, old.circle_id), auth.uid(),
          tg_argv[0], tg_argv[1]);
  return new;
end $$;

-- ---------- privileged RPCs ----------
-- Redeem an invite token. Validates expiry/uses server-side (idempotent-ish:
-- re-accepting as an active member is a no-op, not an error).
create or replace function public.accept_invite(p_token text)
returns jsonb language plpgsql security definer as $$
declare v_inv public.invitations%rowtype; v_existing public.memberships%rowtype;
begin
  select * into v_inv from public.invitations where token = p_token;
  if not found then raise exception 'Invite not found'; end if;
  if v_inv.expires_at < now() then raise exception 'Invite expired'; end if;
  if v_inv.uses >= v_inv.max_uses then raise exception 'Invite fully used'; end if;
  select * into v_existing from public.memberships
   where circle_id = v_inv.circle_id and user_id = auth.uid();
  if found and v_existing.status = 'active' then
    return jsonb_build_object('circle_id', v_inv.circle_id, 'already_member', true);
  end if;
  if found then
    update public.memberships set status = 'active' where id = v_existing.id;
  else
    insert into public.memberships (circle_id, user_id, role, status)
    values (v_inv.circle_id, auth.uid(), 'member', 'active');
  end if;
  update public.invitations set uses = uses + 1 where id = v_inv.id;
  insert into public.activity_events (circle_id, actor_id, event_type, summary)
  values (v_inv.circle_id, auth.uid(), 'member.joined', 'A new member joined the circle');
  return jsonb_build_object('circle_id', v_inv.circle_id, 'already_member', false);
end $$;

-- Respond to a commitment. ONLY the recipient may decide, and only once.
create or replace function public.respond_commitment(p_commitment_id uuid, p_accept boolean)
returns public.commitments language plpgsql security definer as $$
declare v_c public.commitments%rowtype;
begin
  select * into v_c from public.commitments where id = p_commitment_id for update;
  if not found then raise exception 'Commitment not found'; end if;
  if v_c.recipient_id <> auth.uid() then
    raise exception 'Only the recipient can accept or decline';
  end if;
  if v_c.status <> 'proposed' then
    raise exception 'Commitment is no longer awaiting a response';
  end if;
  update public.commitments
     set status = case when p_accept then 'accepted' else 'declined' end,
         decided_at = now()
   where id = p_commitment_id
  returning * into v_c;
  insert into public.commitment_events (commitment_id, event_type, actor_id, snapshot)
  values (v_c.id, case when p_accept then 'accepted' else 'declined' end, auth.uid(),
          jsonb_build_object('title', v_c.title, 'terms', v_c.terms));
  insert into public.activity_events (circle_id, actor_id, event_type, summary)
  values (v_c.circle_id, auth.uid(),
          'commitment.' || v_c.status,
          'A commitment was ' || v_c.status || ': ' || v_c.title);
  return v_c;
end $$;

-- Complete a commitment. Proposer or recipient, only from accepted state.
create or replace function public.complete_commitment(p_commitment_id uuid)
returns public.commitments language plpgsql security definer as $$
declare v_c public.commitments%rowtype;
begin
  select * into v_c from public.commitments where id = p_commitment_id for update;
  if not found then raise exception 'Commitment not found'; end if;
  if v_c.status <> 'accepted' then
    raise exception 'Only accepted commitments can be completed';
  end if;
  if v_c.proposer_id <> auth.uid() and v_c.recipient_id <> auth.uid() then
    raise exception 'Only the proposer or recipient can complete';
  end if;
  update public.commitments set status = 'completed', decided_at = now()
   where id = p_commitment_id returning * into v_c;
  insert into public.commitment_events (commitment_id, event_type, actor_id, snapshot)
  values (v_c.id, 'completed', auth.uid(),
          jsonb_build_object('title', v_c.title, 'terms', v_c.terms));
  insert into public.activity_events (circle_id, actor_id, event_type, summary)
  values (v_c.circle_id, auth.uid(), 'commitment.completed',
          'Completed: ' || v_c.title);
  return v_c;
end $$;
