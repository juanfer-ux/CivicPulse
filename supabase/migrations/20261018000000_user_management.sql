-- Super Admin "Users" screen support (docs/roles-and-permissions.md, "Manage users").
-- The screen itself needs no new permission: 'manage_users' already allows reading and updating profiles
-- and managing both access tables. This migration adds what makes it safe and usable:
--   * profiles.email (the browser cannot read auth.users)
--   * a guard that keeps at least one active Super Admin
--   * audit events for role, activation and access changes
-- One transaction: if anything fails, nothing changes.

-- ───────── Email on profiles ─────────
alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end $$;

-- ───────── Never lock everyone out ─────────
create function public.protect_last_super_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'super_admin' and old.is_active
     and (new.role is distinct from 'super_admin' or not new.is_active)
     and not exists (select 1 from public.profiles p
                     where p.role = 'super_admin' and p.is_active and p.id <> old.id) then
    raise exception 'There must always be at least one active Super Admin';
  end if;
  return new;
end $$;
create trigger protect_last_super_admin before update on public.profiles
  for each row execute function public.protect_last_super_admin();

-- ───────── Audit trail for user management (written only by triggers) ─────────
create function public.audit_profile_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events (actor, action, entity, entity_id, details)
  values ((select auth.uid()),
          case when old.role is distinct from new.role then 'user_role_changed' else 'user_activation_changed' end,
          'user', new.id::text,
          jsonb_build_object('email', new.email, 'from_role', old.role, 'to_role', new.role,
                             'from_active', old.is_active, 'to_active', new.is_active));
  return null;
end $$;
create trigger audit_profile_changes after update on public.profiles
  for each row when (old.role is distinct from new.role or old.is_active is distinct from new.is_active)
  execute function public.audit_profile_changes();

create function public.audit_access_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_events (actor, action, entity, entity_id, details)
  values ((select auth.uid()),
          case tg_table_name when 'user_locality_access' then 'locality_access_' else 'category_access_' end
            || case when tg_op = 'DELETE' then 'revoked' else 'granted' end,
          'user', v ->> 'user_id', v);
  return null;
end $$;
create trigger audit_locality_access after insert or delete on public.user_locality_access
  for each row execute function public.audit_access_changes();
create trigger audit_category_access after insert or delete on public.user_incident_type_access
  for each row execute function public.audit_access_changes();

-- Trigger functions are never callable through the API.
revoke execute on function
  public.protect_last_super_admin(), public.audit_profile_changes(), public.audit_access_changes()
  from public, anon, authenticated;
