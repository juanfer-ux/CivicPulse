-- Invited people show as "Pending" until they accept the invitation (docs/roles-and-permissions.md, section 5).
-- The invite function sets the flag; it clears itself when the person confirms the email link.
-- One transaction: if anything fails, nothing changes.

alter table public.profiles add column invitation_pending boolean not null default false;

-- Nobody changes their own role, activation or invitation flag; only users with 'manage_users' may.
-- (Server-side changes, with no signed-in user, pass: the invite function and the trigger below.)
create or replace function public.guard_profile_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null
     and not public.has_permission('manage_users')
     and (new.role is distinct from old.role
          or new.is_active is distinct from old.is_active
          or new.invitation_pending is distinct from old.invitation_pending) then
    raise exception 'Only a Super Admin can change role, activation or invitation status';
  end if;
  return new;
end $$;

create function public.clear_invitation_pending() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set invitation_pending = false where id = new.id and invitation_pending;
  return null;
end $$;
create trigger clear_invitation_pending after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.clear_invitation_pending();

revoke execute on function public.clear_invitation_pending() from public, anon, authenticated;
