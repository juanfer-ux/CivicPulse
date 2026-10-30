-- Permission smoke test for docs/roles-and-permissions.md (cases T1 to T16; T14 to T16 cover the problems layer).
-- Run in the Supabase SQL editor after the migrations and both seeds. A Super Admin must exist.
-- It simulates signed-in users inside ONE DO block that ALWAYS ends by raising an exception, so every row it
-- creates (fake users, recommendations, decisions, audit events) is rolled back. Read the RESULT line.
--
-- Expected result:  RESULT PASS 47/47 ...
-- Any failing check is listed by name, e.g.  RESULT FAIL 43/47 failed: T3 sp0_sees_nothing, T7 ...
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
  v_pp uuid; v_pd uuid; v_po uuid; v_op uuid; v_od uuid; v_oo uuid; v_ip uuid; v_idump uuid; v_iv uuid; v_ids uuid[];

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

  -- ── Problems layer fixtures (decision 0030): one problem per scope, linked to real Kennedy incidents ──
  select id into v_ip from public.incidents where locality_code = 8 and category = 'parking' limit 1;
  select id into v_idump from public.incidents where locality_code = 8 and category = 'illegal_dumping' limit 1;
  insert into public.problems (reference, title, category, locality_code, lat, lng, location_description)
    values ('RLS-1', 'rls parking Kennedy', 'parking', 8, 4.63, -74.15, 'rls') returning id into v_pp;
  insert into public.problems (reference, title, category, locality_code, lat, lng, location_description)
    values ('RLS-2', 'rls dumping Kennedy', 'illegal_dumping', 8, 4.63, -74.15, 'rls') returning id into v_pd;
  insert into public.problems (reference, title, category, locality_code, lat, lng, location_description)
    values ('RLS-3', 'rls parking Usaquen', 'parking', 1, 4.70, -74.03, 'rls') returning id into v_po;
  insert into public.occurrences (problem_id, locality_code, category) values (v_pp, 8, 'parking') returning id into v_op;
  insert into public.occurrences (problem_id, locality_code, category) values (v_pd, 8, 'illegal_dumping') returning id into v_od;
  insert into public.occurrences (problem_id, locality_code, category) values (v_po, 1, 'parking') returning id into v_oo;
  insert into public.incident_links (incident_id, problem_id, occurrence_id, state, actor_type, score, band, config_version)
    values (v_ip, v_pp, v_op, 'confirmed', 'rule', 90, 'high', 1), (v_idump, v_pd, v_od, 'confirmed', 'rule', 90, 'high', 1);
  insert into public.interventions (problem_id, action_type, agency, performed_at, description)
    values (v_pp, 'tow', 'rls', now(), 'rls') returning id into v_iv;
  v_ids := array[v_pp, v_pd, v_po];

  -- ── Locality Admin (la) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_la, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  if n <> e_all then fails := fails || 'T1 la_sees_all_categories_in_zone'::text; end if;
  select count(*) into n from public.incidents where locality_code <> 8;
  if n <> 0 then fails := fails || 'T10 la_cannot_read_other_localities'::text; end if;
  select count(*) into n from public.tool_incidents_by_locality();
  select count(*) into n2 from public.tool_incidents_by_locality() where locality_code <> 8;
  if n <> 1 or n2 <> 0 then fails := fails || 'T11 agent_tools_scoped_for_la'::text; end if;
  select count(*) into n from public.profiles where id in (v_sp1, v_env, v_sp0);
  if n <> 3 then fails := fails || 'team_view_la_sees_team'::text; end if;
  begin insert into public.user_locality_access values (v_la, 1); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T9 la_cannot_manage_access'::text; end if;
  begin update public.profiles set role = 'super_admin' where id = v_sp1; exception when others then null; end;
  begin insert into public.audit_events (action, entity) values ('fake', 'x'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T12a la_cannot_forge_audit'::text; end if;
  select count(*) into n from public.problems where id = any (v_ids);
  select count(*) into n2 from public.occurrences where problem_id = any (v_ids);
  if n <> 2 or n2 <> 2 then fails := fails || 'T14a la_sees_problems_in_scope'::text; end if;
  begin insert into public.problems (reference, title, category, locality_code, lat, lng, location_description)
        values ('RLS-X', 'x', 'parking', 8, 4.63, -74.15, 'x'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T15a la_cannot_write_problems'::text; end if;
  begin perform public.match_unlinked('problems_v1'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T15e matcher_not_callable_from_api'::text; end if;
  reset role;
  if (select role from public.profiles where id = v_sp1) <> 'specialist_operator' then fails := fails || 'T9b la_cannot_change_roles'::text; end if;

  -- ── Specialist with parking (sp1) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_sp1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  select count(*) into n2 from public.incidents where category <> 'parking' or locality_code <> 8;
  if n <> e_park or n2 <> 0 then fails := fails || 'T2 sp1_sees_only_assigned_category'::text; end if;
  select coalesce(sum(incident_count), 0) into n from public.tool_incidents_by_locality();
  if n > e_park or n = 0 then fails := fails || 'T11 agent_tools_scoped_for_sp1'::text; end if;
  select count(*) into n from public.profiles where id = v_la;
  if n <> 0 then fails := fails || 'team_view_sp1_cannot_see_team'::text; end if;
  begin update public.profiles set role = 'super_admin' where id = v_sp1; exception when others then null; end;
  -- T5: propose outside scope (other locality, then unassigned category) must fail
  begin
    insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
    values (1, 'parking', 'x', 'p', now(), now(), '{}', 'l', 'i'); ok := true;
  exception when others then ok := false; end;
  if ok then fails := fails || 'T5a sp1_cannot_propose_other_locality'::text; end if;
  begin
    insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
    values (8, 'illegal_dumping', 'x', 'p', now(), now(), '{}', 'l', 'i'); ok := true;
  exception when others then ok := false; end;
  if ok then fails := fails || 'T5b sp1_cannot_propose_other_category'::text; end if;
  -- T12: pre-approved recommendation must fail
  begin
    insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention, status)
    values (8, 'parking', 'x', 'p', now(), now(), '{}', 'l', 'i', 'approved'); ok := true;
  exception when others then ok := false; end;
  if ok then fails := fails || 'T12b no_preapproved_recommendation'::text; end if;
  -- T6: propose and approve inside scope
  insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
  values (8, 'parking', 'RLS smoke 1', 'p', now() - interval '90 days', now(), '{}', 'l', 'i') returning id into v_rec;
  insert into public.decisions (recommendation_id, decision, explanation) values (v_rec, 'approved', 'smoke');
  select status::text into v_status from public.recommendations where id = v_rec;
  if v_status <> 'approved' then fails := fails || 'T6 sp1_can_approve_in_scope'::text; end if;
  -- T7: escalate, then the specialist can no longer decide it
  insert into public.recommendations (locality_code, category, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
  values (8, 'parking', 'RLS smoke 2', 'p', now() - interval '90 days', now(), '{}', 'l', 'i') returning id into v_rec2;
  perform public.escalate_recommendation(v_rec2, 'needs second opinion');
  select status::text into v_status from public.recommendations where id = v_rec2;
  if v_status <> 'needs_second_approval' then fails := fails || 'escalation_sets_status'::text; end if;
  begin insert into public.decisions (recommendation_id, decision) values (v_rec2, 'approved'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T7 sp1_cannot_decide_escalated'::text; end if;
  begin insert into public.audit_events (action, entity) values ('fake', 'x'); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T12c sp1_cannot_forge_audit'::text; end if;
  select count(*) into n from public.problems where id = any (v_ids);
  select count(*) into n2 from public.problem_stats where problem_id = any (v_ids);
  if n <> 1 or n2 <> 1 or not exists (select 1 from public.problems where id = v_pp) then fails := fails || 'T14b sp1_sees_only_assigned_category_problems'::text; end if;
  select count(*) into n from public.incident_links where problem_id = any (v_ids);
  select count(*) into n2 from public.interventions where problem_id = any (v_ids);
  if n <> 1 or n2 <> 1 then fails := fails || 'T14f links_and_interventions_follow_scope'::text; end if;
  begin insert into public.incident_links (incident_id, problem_id, occurrence_id, state, actor_type, config_version)
        values (v_ip, v_pp, v_op, 'proposed', 'operator', 1); ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T15b sp1_cannot_write_links'::text; end if;
  begin update public.problems set status = 'archived' where id = v_pp; exception when others then null; end;
  if (select status::text from public.problems where id = v_pp) <> 'active' then fails := fails || 'T15c sp1_cannot_update_problems'::text; end if;
  begin delete from public.problems where id = v_pp; exception when others then null; end;
  if not exists (select 1 from public.problems where id = v_pp) then fails := fails || 'T15d sp1_cannot_delete_problems'::text; end if;
  reset role;
  if (select role from public.profiles where id = v_sp1) <> 'specialist_operator' then fails := fails || 'T4 sp1_cannot_change_own_role'::text; end if;

  -- ── Specialist with dumping only (sp_env) and with nothing (sp0) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_env, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  select count(*) into n2 from public.incidents where category <> 'illegal_dumping';
  if n <> e_dump or n2 <> 0 then fails := fails || 'T2b sp_env_sees_only_dumping'::text; end if;
  select count(*) into n from public.problems where id = any (v_ids);
  select count(*) into n2 from public.problems where id = v_pd;
  if n <> 1 or n2 <> 1 then fails := fails || 'T14c sp_env_sees_only_dumping_problems'::text; end if;
  select count(*) into n from public.recommendations;
  if n <> 0 then fails := fails || 'recs_scoped_by_category'::text; end if;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_sp0, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  select coalesce(sum(incident_count), 0) into n2 from public.tool_incidents_by_locality();
  if n <> 0 or n2 <> 0 then fails := fails || 'T3 sp0_sees_nothing'::text; end if;
  select count(*) into n from public.problems where id = any (v_ids);
  select count(*) into n2 from public.incident_links where problem_id = any (v_ids);
  select count(*) into v_cnt from public.interventions where problem_id = any (v_ids);
  if n <> 0 or n2 <> 0 or v_cnt <> 0 then fails := fails || 'T14d sp0_sees_no_problems'::text; end if;
  reset role;

  -- ── Locality Admin decides the escalated recommendation (T8) ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_la, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.recommendations where id = v_rec2;
  if n <> 1 then fails := fails || 'la_sees_escalated_recommendation'::text; end if;
  insert into public.decisions (recommendation_id, decision, explanation) values (v_rec2, 'approved', 'second approval');
  select status::text into v_status from public.recommendations where id = v_rec2;
  if v_status <> 'approved' then fails := fails || 'T8 la_can_decide_escalated'::text; end if;
  reset role;

  -- ── User management (T13 and the Users screen) ──
  if (select email from public.profiles where id = v_la) is distinct from 'rls-la@example.invalid' then
    fails := fails || 'email_stored_on_profile'::text;
  end if;
  perform set_config('request.jwt.claims', '', true);  -- act as the database owner, not as the last fake user
  select count(*) into v_cnt from public.profiles where role = 'super_admin' and is_active;
  if v_cnt = 1 then
    begin update public.profiles set role = null where id = v_admin; ok := true; exception when others then ok := false; end;
    if ok then fails := fails || 'T13 last_super_admin_cannot_be_demoted'::text; end if;
    begin update public.profiles set is_active = false where id = v_admin; ok := true; exception when others then ok := false; end;
    if ok then fails := fails || 'T13b last_super_admin_cannot_be_deactivated'::text; end if;
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.profiles set role = 'locality_admin' where id = v_sp0;
  select count(*) into n from public.audit_events
    where action = 'user_role_changed' and entity_id = v_sp0::text and actor = v_admin;
  if n <> 1 then fails := fails || 'role_change_is_audited'::text; end if;
  insert into public.user_locality_access values (v_sp0, 1);
  select count(*) into n from public.audit_events
    where action = 'locality_access_granted' and entity_id = v_sp0::text and actor = v_admin;
  if n <> 1 then fails := fails || 'access_grant_is_audited'::text; end if;
  delete from public.user_locality_access where user_id = v_sp0 and locality_code = 1;
  select count(*) into n from public.audit_events
    where action = 'locality_access_revoked' and entity_id = v_sp0::text and actor = v_admin;
  if n <> 1 then fails := fails || 'access_revoke_is_audited'::text; end if;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_sp1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.audit_events where actor is distinct from v_sp1;
  if n <> 0 then fails := fails || 'specialist_cannot_read_others_audit'::text; end if;
  reset role;

  -- ── Invitations: pending until accepted ──
  perform set_config('request.jwt.claims', '', true);
  update public.profiles set invitation_pending = true where id = v_sp1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_sp1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update public.profiles set invitation_pending = false where id = v_sp1; ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'cannot_clear_own_invitation_flag'::text; end if;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  update auth.users set email_confirmed_at = now() where id = v_sp1;
  if (select invitation_pending from public.profiles where id = v_sp1) then fails := fails || 'invitation_clears_on_accept'::text; end if;

  -- ── Super Admin ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.incidents;
  if n < e_all + e_other then fails := fails || 'super_admin_sees_everything'::text; end if;
  select count(*) into n from public.problems where id = any (v_ids);
  if n <> 3 then fails := fails || 'T14e super_admin_sees_all_problems'::text; end if;
  select count(*) into n from public.audit_events where entity_id in (v_rec::text, v_rec2::text);
  if n < 4 then fails := fails || 'audit_trail_written_by_triggers'::text; end if;
  select count(*) into n from public.role_permissions;
  if n < 20 then fails := fails || 'permissions_readable'::text; end if;
  reset role;

  -- ── The incidents table stays read-only except for assignment (migration 20261029000000) ──
  perform set_config('request.jwt.claims', '', true);
  begin update public.incidents set title = title || '.' where id = v_ip; ok := true; exception when others then ok := false; end;
  if ok then fails := fails || 'T16 incidents_only_assignment_can_change'::text; end if;

  raise exception 'RESULT % % | kennedy all=% parking=% dumping=% | failed: %',
    case when cardinality(fails) = 0 then 'PASS' else 'FAIL' end,
    (47 - cardinality(fails)) || '/47',
    e_all, e_park, e_dump,
    coalesce(nullif(array_to_string(fails, ', '), ''), 'none');
end $$;
