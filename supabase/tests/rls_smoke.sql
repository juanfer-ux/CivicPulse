-- Permission smoke test for docs/roles-and-permissions.md (cases T1 to T12).
-- Run in the Supabase SQL editor after the migrations and both seeds. A Super Admin must exist.
-- It simulates signed-in users inside ONE DO block that ALWAYS ends by raising an exception, so every row it
-- creates (fake users, recommendations, decisions, audit events) is rolled back. Read the RESULT line.
--
-- Expected result:  RESULT PASS 35/35 ...
-- Any failing check is listed by name, e.g.  RESULT FAIL 31/35 failed: T3 sp0_sees_nothing, T7 ...
--
-- Fake users (all in Kennedy, locality 8):
--   la    Locality Admin, no category rows     -> must see ALL categories in Kennedy
--   sp1   Specialist, category parking         -> only parking in Kennedy
--   sp_env Specialist, category illegal_dumping -> only dumping in Kennedy
--   sp0   Specialist, no categories            -> sees nothing
do $$
declare
  v_admin uuid := (select p.id from public.profiles p where p.role = 'super_admin' limit 1);
  v_la uuid := gen_random_uuid();  v_sp1 uuid := gen_random_uuid();
  v_env uuid := gen_random_uuid(); v_sp0 uuid := gen_random_uuid();
  fails text[] := '{}'; n int; n2 int; ok boolean; v_rec uuid; v_rec2 uuid; v_status text;
  e_all int; e_park int; e_dump int; e_other int; v_cnt int;

begin
  if v_admin is null then raise exception 'No super admin exists: bootstrap one first'; end if;

  -- ── Setup as the postgres role ──
  insert into auth.users (id, email) values
    (v_la, 'rls-la@example.invalid'), (v_sp1, 'rls-sp1@example.invalid'),
    (v_env, 'rls-env@example.invalid'), (v_sp0, 'rls-sp0@example.invalid');
  update public.profiles set role = 'locality_admin' where id = v_la;
  update public.profiles set role = 'specialist_operator' where id in (v_sp1, v_env, v_sp0);
  insert into public.user_locality_access values (v_la, 8), (v_sp1, 8), (v_env, 8), (v_sp0, 8);
  insert into public.user_incident_type_access values (v_sp1, 'parking'), (v_env, 'illegal_dumping');

  select count(*) into e_all  from public.incidents where locality_code = 8;
  select count(*) into e_park from public.incidents where locality_code = 8 and category = 'parking';
  select count(*) into e_dump from public.incidents where locality_code = 8 and category = 'illegal_dumping';
  select count(*) into e_other from public.incidents where locality_code <> 8;
  if e_park = 0 or e_dump = 0 then
    raise exception 'Seed missing: Kennedy needs parking (%) and illegal dumping (%) incidents', e_park, e_dump;
  end if;

  -- ── Locality Admin (la) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_la, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  if n <> e_all then fails := fails || 'T1 la_sees_all_categories_in_zone'; end if;
  select count(*) into n from public.incidents where locality_code <> 8;
  if n <> 0 then fails := fails || 'T10 la_cannot_read_other_localities'; end if;
  select count(*) into n from public.tool_incidents_by_locality();
  select count(*) into n2 from public.tool_incidents_by_locality() where locality_code <> 8;
  if n <> 1 or n2 <> 0 then fails := fails || 'T11 agent_tools_scoped_for_la'; end if;
  select count(*) into n from public.profiles where id in (v_sp1, v_env, v_sp0);
  if n <> 3 then fails := fails || 'team_view_la_sees_team'; end if;
  begin insert into public.user_locality_access values (v_la, 1); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T9 la_cannot_manage_access'; end if;
  begin update public.profiles set role = 'super_admin' where id = v_sp1; exception when others then null; end;
  begin insert into public.audit_events (action, entity) values ('fake', 'x'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T12a la_cannot_forge_audit'; end if;
  reset role;
  if (select role from public.profiles where id = v_sp1) <> 'specialist_operator' then fails := fails || 'T9b la_cannot_change_roles'; end if;

  -- ── Specialist with parking (sp1) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_sp1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  select count(*) into n2 from public.incidents where category <> 'parking' or locality_code <> 8;
  if n <> e_park or n2 <> 0 then fails := fails || 'T2 sp1_sees_only_assigned_category'; end if;
  select coalesce(sum(incident_count), 0) into n from public.tool_incidents_by_locality();
  if n > e_park or n = 0 then fails := fails || 'T11 agent_tools_scoped_for_sp1'; end if;
  select count(*) into n from public.profiles where id = v_la;
  if n <> 0 then fails := fails || 'team_view_sp1_cannot_see_team'; end if;
  begin update public.profiles set role = 'super_admin' where id = v_sp1; exception when others then null; end;
  -- T5: propose outside scope (other locality, then unassigned category) must fail
  begin
    insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
    values (1, 'parking', 'x', 'p', now(), now(), '{}', 'l', 'i'); ok := true;
  exception when others then ok := false; end;
  if ok then fails := fails || 'T5a sp1_cannot_propose_other_locality'; end if;
  begin
    insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
    values (8, 'illegal_dumping', 'x', 'p', now(), now(), '{}', 'l', 'i'); ok := true;
  exception when others then ok := false; end;
  if ok then fails := fails || 'T5b sp1_cannot_propose_other_category'; end if;
  -- T12: pre-approved recommendation must fail
  begin
    insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention, status)
    values (8, 'parking', 'x', 'p', now(), now(), '{}', 'l', 'i', 'approved'); ok := true;
  exception when others then ok := false; end;
  if ok then fails := fails || 'T12b no_preapproved_recommendation'; end if;
  -- T6: propose and approve inside scope
  insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
  values (8, 'parking', 'RLS smoke 1', 'p', now() - interval '90 days', now(), '{}', 'l', 'i') returning id into v_rec;
  insert into public.decisions (recommendation_id, decision, explanation) values (v_rec, 'approved', 'smoke');
  select status::text into v_status from public.recommendations where id = v_rec;
  if v_status <> 'approved' then fails := fails || 'T6 sp1_can_approve_in_scope'; end if;
  -- T7: escalate, then the specialist can no longer decide it
  insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
  values (8, 'parking', 'RLS smoke 2', 'p', now() - interval '90 days', now(), '{}', 'l', 'i') returning id into v_rec2;
  perform public.escalate_recommendation(v_rec2, 'needs second opinion');
  select status::text into v_status from public.recommendations where id = v_rec2;
  if v_status <> 'needs_second_approval' then fails := fails || 'escalation_sets_status'; end if;
  begin insert into public.decisions (recommendation_id, decision) values (v_rec2, 'approved'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T7 sp1_cannot_decide_escalated'; end if;
  begin insert into public.audit_events (action, entity) values ('fake', 'x'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T12c sp1_cannot_forge_audit'; end if;
  reset role;
  if (select role from public.profiles where id = v_sp1) <> 'specialist_operator' then fails := fails || 'T4 sp1_cannot_change_own_role'; end if;

  -- ── Specialist with dumping only (sp_env) and with nothing (sp0) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_env, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  select count(*) into n2 from public.incidents where category <> 'illegal_dumping';
  if n <> e_dump or n2 <> 0 then fails := fails || 'T2b sp_env_sees_only_dumping'; end if;
  select count(*) into n from public.recommendations;
  if n <> 0 then fails := fails || 'recs_scoped_by_category'; end if;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_sp0, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  select coalesce(sum(incident_count), 0) into n2 from public.tool_incidents_by_locality();
  if n <> 0 or n2 <> 0 then fails := fails || 'T3 sp0_sees_nothing'; end if;
  reset role;

  -- ── Locality Admin decides the escalated recommendation (T8) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_la, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.recommendations where id = v_rec2;
  if n <> 1 then fails := fails || 'la_sees_escalated_recommendation'; end if;
  insert into public.decisions (recommendation_id, decision, explanation) values (v_rec2, 'approved', 'second approval');
  select status::text into v_status from public.recommendations where id = v_rec2;
  if v_status <> 'approved' then fails := fails || 'T8 la_can_decide_escalated'; end if;
  reset role;

  -- ── User management (T13 and the Users screen) ──
  if (select email from public.profiles where id = v_la) is distinct from 'rls-la@example.invalid' then
    fails := fails || 'email_stored_on_profile';
  end if;
  perform set_config('request.jwt.claims', '', true);  -- act as the database owner, not as the last fake user
  select count(*) into v_cnt from public.profiles where role = 'super_admin' and is_active;
  if v_cnt = 1 then
    begin update public.profiles set role = null where id = v_admin; ok := true; exception when others then ok := false; end;
    if ok then fails := fails || 'T13 last_super_admin_cannot_be_demoted'; end if;
    begin update public.profiles set is_active = false where id = v_admin; ok := true; exception when others then ok := false; end;
    if ok then fails := fails || 'T13b last_super_admin_cannot_be_deactivated'; end if;
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.profiles set role = 'locality_admin' where id = v_sp0;
  select count(*) into n from public.audit_events
    where action = 'user_role_changed' and entity_id = v_sp0::text and actor = v_admin;
  if n <> 1 then fails := fails || 'role_change_is_audited'; end if;
  insert into public.user_locality_access values (v_sp0, 1);
  select count(*) into n from public.audit_events
    where action = 'locality_access_granted' and entity_id = v_sp0::text and actor = v_admin;
  if n <> 1 then fails := fails || 'access_grant_is_audited'; end if;
  delete from public.user_locality_access where user_id = v_sp0 and locality_code = 1;
  select count(*) into n from public.audit_events
    where action = 'locality_access_revoked' and entity_id = v_sp0::text and actor = v_admin;
  if n <> 1 then fails := fails || 'access_revoke_is_audited'; end if;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_sp1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.audit_events where actor is distinct from v_sp1;
  if n <> 0 then fails := fails || 'specialist_cannot_read_others_audit'; end if;
  reset role;

  -- ── Invitations: pending until accepted ──
  perform set_config('request.jwt.claims', '', true);
  update public.profiles set invitation_pending = true where id = v_sp1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_sp1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update public.profiles set invitation_pending = false where id = v_sp1; ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'cannot_clear_own_invitation_flag'; end if;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  update auth.users set email_confirmed_at = now() where id = v_sp1;
  if (select invitation_pending from public.profiles where id = v_sp1) then fails := fails || 'invitation_clears_on_accept'; end if;

  -- ── Super Admin ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  if n < e_all + e_other then fails := fails || 'super_admin_sees_everything'; end if;
  select count(*) into n from public.audit_events where entity_id in (v_rec::text, v_rec2::text);
  if n < 4 then fails := fails || 'audit_trail_written_by_triggers'; end if;
  select count(*) into n from public.role_permissions;
  if n < 20 then fails := fails || 'permissions_readable'; end if;
  reset role;

  raise exception 'RESULT % % | kennedy all=% parking=% dumping=% | failed: %',
    case when cardinality(fails) = 0 then 'PASS' else 'FAIL' end,
    (35 - cardinality(fails)) || '/35',
    e_all, e_park, e_dump,
    coalesce(nullif(array_to_string(fails, ', '), ''), 'none');
end $$;
