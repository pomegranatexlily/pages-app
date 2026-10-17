-- PAGES: atomic, authenticated invite redemption.
-- This is a database migration. Committing it does not apply it to Supabase.
-- Preserves the existing RPC name and JSON response for old app clients.
create or replace function public.accept_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations%rowtype;
  v_existing public.memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if nullif(btrim(p_token), '') is null then
    raise exception 'Invite token required';
  end if;

  -- Serialize concurrent redemptions of the SAME invitation. Without this
  -- lock, two requests can both observe uses < max_uses and both redeem.
  select * into v_inv
    from public.invitations
   where token = p_token
   for update;
  if not found then raise exception 'Invite not found'; end if;
  if v_inv.expires_at <= now() then raise exception 'Invite expired'; end if;
  if v_inv.uses >= v_inv.max_uses then raise exception 'Invite fully used'; end if;

  select * into v_existing
    from public.memberships
   where circle_id = v_inv.circle_id and user_id = auth.uid()
   for update;
  if found and v_existing.status = 'active' then
    return jsonb_build_object('circle_id', v_inv.circle_id, 'already_member', true);
  end if;
  if found then
    -- Rejoining via a member invitation must not restore a removed admin.
    update public.memberships
       set status = 'active', role = 'member'
     where id = v_existing.id;
  else
    insert into public.memberships (circle_id, user_id, role, status)
    values (v_inv.circle_id, auth.uid(), 'member', 'active');
  end if;

  update public.invitations set uses = uses + 1 where id = v_inv.id;
  insert into public.activity_events (circle_id, actor_id, event_type, summary)
  values (v_inv.circle_id, auth.uid(), 'member.joined', 'A new member joined the circle');
  return jsonb_build_object('circle_id', v_inv.circle_id, 'already_member', false);
end;
$$;

-- Do not let anonymous callers execute a privileged SECURITY DEFINER RPC.
revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;
