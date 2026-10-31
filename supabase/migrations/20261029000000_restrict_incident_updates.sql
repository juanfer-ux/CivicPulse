-- The "assign incidents in scope" UPDATE policy on public.incidents only checks WHICH ROWS
-- can be updated (locality/category scope), not WHICH COLUMNS. Any user with assign_incidents
-- (Locality Admin, Super Admin) could therefore PATCH any field on an in-scope incident --
-- status, validation_status, outcome, category, lat/lng, etc. -- via a direct REST call, with
-- no audit trail (no trigger covers incidents UPDATE). The UI never does this today; only
-- reassignment is intended. Lock it down the same way guard_profile_changes already guards profiles.
create or replace function public.guard_incident_assignment()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if (to_jsonb(new) - 'assigned_to') is distinct from (to_jsonb(old) - 'assigned_to') then
    raise exception 'Only assignment (assigned_to) can be changed on an incident';
  end if;
  return new;
end;
$$;

create trigger guard_incident_assignment_trigger
before update on public.incidents
for each row execute function public.guard_incident_assignment();

-- Match the existing trigger functions (apply_decision, guard_profile_changes, etc.): trigger
-- functions have no business being callable directly via PostgREST RPC. Supabase's default
-- privileges grant EXECUTE on new public-schema functions directly to anon/authenticated (not
-- via the `public` role), so both must be revoked explicitly.
revoke all on function public.guard_incident_assignment() from public, anon, authenticated;
