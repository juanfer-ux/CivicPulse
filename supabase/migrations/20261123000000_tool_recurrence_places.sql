-- Agent tool: the stored places around one recurrence (owner, 2026-11-23; the table is recurrence_places, migration 20261120000000).
-- SECURITY INVOKER like every tool: it runs as the signed-in user, so RLS on recurrence_places (which follows the recurrence's scope) applies,
-- and it also needs the 'ask_agent' permission. Rows are nearest first. ADDITIVE ONLY: one new function.
-- Run in the Supabase SQL editor as postgres, after 20261120000000_recurrence_places.sql. Rollback: 20261123000000_tool_recurrence_places_rollback.sql.
begin;

create function public.tool_recurrence_places(p_problem_id uuid)
returns table (source_ref text, kind text, name text, label text, lat double precision, lng double precision, dist_m integer, snapshot_at date)
language sql stable set search_path = '' as $$
  select rp.source_ref, rp.kind, rp.name, rp.label, rp.lat, rp.lng, rp.dist_m, rp.snapshot_at
  from public.recurrence_places rp
  where public.has_permission('ask_agent')
    and rp.problem_id = p_problem_id
  order by rp.dist_m, rp.source_ref
$$;

revoke execute on function public.tool_recurrence_places(uuid) from public, anon;
grant execute on function public.tool_recurrence_places(uuid) to authenticated;

commit;
