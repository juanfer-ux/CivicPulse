-- RLS smoke test. Run in the Supabase SQL editor after the migrations and seed.
-- It simulates signed-in users inside one DO block that ALWAYS ends with a raised exception, so every
-- row it creates (including the fake user) is rolled back. Read the RESULT line in the error message.
--
-- Expected:
--   restricted_visible = restricted_expected      (a locality admin sees only their locality)
--   other_localities_visible = 0
--   tool_localities = 1, tool_locality = 8        (the agent's SQL tools are scoped the same way)
--   media_visible = media_expected
--   self_promotion = blocked                      (nobody can make themselves super admin)
--   cross_locality_proposal = blocked
--   admin_status = approved, admin_audits = 2     (propose + decide are audited by triggers)
--   forged_audit = blocked, preapproved_insert = blocked
do $$
declare
  v_user uuid := gen_random_uuid();
  v_admin uuid := (select id from public.profiles where role = 'super_admin' limit 1);
  v_visible int; v_expected int; v_other int; v_tool_n int; v_tool_code int; v_media int; v_media_exp int;
  v_promo text; v_cross text; v_forged text; v_pre text; v_status text; v_audits int;
begin
  if v_admin is null then raise exception 'No super admin exists: bootstrap one first'; end if;

  -- A fake locality admin limited to locality 8 (Kennedy), created as the postgres role.
  insert into auth.users (id, email) values (v_user, 'rls-test@example.invalid');
  update public.profiles set role = 'locality_admin' where id = v_user;
  insert into public.user_locality_access values (v_user, 8);
  insert into public.user_incident_type_access values (v_user, 'parking');

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*), count(*) filter (where locality_code <> 8) into v_visible, v_other from public.incidents;
  select count(*), min(locality_code) into v_tool_n, v_tool_code from public.tool_incidents_by_locality();
  select count(*) into v_media from public.incident_media;
  begin update public.profiles set role = 'super_admin' where id = v_user; v_promo := 'ALLOWED';
  exception when others then v_promo := 'blocked'; end;
  begin
    insert into public.recommendations (locality_code, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
    values (1, 'x', 'p', now(), now(), '{}', 'l', 'i');
    v_cross := 'ALLOWED';
  exception when others then v_cross := 'blocked'; end;
  reset role;

  select count(*) into v_expected from public.incidents where locality_code = 8;
  select count(*) into v_media_exp from public.incident_media m join public.incidents i on i.id = m.incident_id where i.locality_code = 8;

  -- The super admin: propose, then decide. Audit events come from triggers only.
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.recommendations (locality_code, title, problem, period_start, period_end, evidence, limitations, proposed_intervention)
  values (8, 'RLS smoke test', 'p', now() - interval '90 days', now(), '{}', 'l', 'i');
  begin
    insert into public.recommendations (locality_code, title, problem, period_start, period_end, evidence, limitations, proposed_intervention, status)
    values (8, 'RLS smoke test pre-approved', 'p', now(), now(), '{}', 'l', 'i', 'approved');
    v_pre := 'ALLOWED';
  exception when others then v_pre := 'blocked'; end;
  insert into public.decisions (recommendation_id, decision, explanation)
  select id, 'approved', 'smoke test' from public.recommendations where title = 'RLS smoke test';
  select r.status::text, (select count(*) from public.audit_events a where a.entity_id = r.id::text)
    into v_status, v_audits from public.recommendations r where r.title = 'RLS smoke test';
  begin insert into public.audit_events (action, entity) values ('fake', 'x'); v_forged := 'FORGED';
  exception when others then v_forged := 'blocked'; end;

  raise exception 'RESULT restricted_visible=% restricted_expected=% other_localities_visible=% tool_localities=% tool_locality=% media_visible=% media_expected=% self_promotion=% cross_locality_proposal=% admin_status=% admin_audits=% forged_audit=% preapproved_insert=%',
    v_visible, v_expected, v_other, v_tool_n, v_tool_code, v_media, v_media_exp, v_promo, v_cross, v_status, v_audits, v_forged, v_pre;
end $$;
