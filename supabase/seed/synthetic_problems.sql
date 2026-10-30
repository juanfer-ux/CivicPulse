-- Synthetic PERSISTENT-PROBLEMS dataset 'problems_v1' (decision 0030). Every row is synthetic (is_synthetic = true).
-- Run in the Supabase SQL editor (bypasses RLS) AFTER migration 20261030000000_problems_layer.sql.
-- Re-runnable: it removes only this dataset (rows tagged evidence_metadata->>'dataset' = 'problems_v1') and rebuilds it.
-- The ORIGINAL 650 incidents are never changed: they only get a provenance row in incident_sources (platform 'synthetic').
--
-- 200 new reports. 16 planted problems (8 parking, 8 illegal dumping), 48 planted occurrences, 32 interventions, about
-- three months. The seed does NOT fill problems, occurrences or links: it inserts the reports (each carries its planted
-- truth in evidence_metadata->'seed_truth'), replays time in order, records each intervention when it "happens", and lets
-- the rule-based matcher (match_unlinked / propose_links) build everything. supabase/tests/matching_smoke.sql then compares
-- the result with the planted truth.
-- Scenarios planted in BOTH categories: bursts of reports of one event (one occurrence); several platforms for one problem;
-- a new occurrence after an intervention; a problem returning despite repeated interventions; a different vehicle or pile at
-- the same place; two nearby but unrelated problems that must stay separate; a genuinely resolved problem; and a case with
-- too little evidence to tell a new event from an ongoing one (the occurrence boundary stays uncertain).
-- Platforms are SIMULATED: no integration exists. Dumping reports never come from mobility platforms.

-- ───────── 0. Reset this dataset only ─────────
delete from public.problems where dataset = 'problems_v1';                          -- cascades occurrences, links, interventions
delete from public.incidents where evidence_metadata ->> 'dataset' = 'problems_v1';  -- cascades sources, links, media

-- ───────── 1. Provenance for the 650 original incidents (plain INSERT, nothing else touched) ─────────
insert into public.incident_sources (incident_id, platform, external_ref, submitted_at, geo_precision, original_category,
                                     original_description, original_status)
select i.id, 'synthetic', i.reference, i.reported_at, 'gps', i.category, i.description, 'imported'
from public.incidents i
on conflict (incident_id) do nothing;

-- ───────── 2. The planted truth ─────────
drop table if exists pg_temp._prob; drop table if exists pg_temp._occ; drop table if exists pg_temp._iv; drop table if exists pg_temp._rep;

-- pk, category, locality, lat, lng, address, subtype, platforms (the first two must have GPS precision)
create temp table _prob as select * from (values
  ('PK1', 'parking', 2, 4.6480, -74.0620, 'Cra 13 #62-40, entrada del edificio Aurora', 'access_ramp', 'salvajes_en_la_via,simur,bogota_te_escucha,civic_pulse,community_channel'),
  ('PK2', 'parking', 8, 4.6290, -74.1480, 'Av. Boyacá con Cl 42 sur, andén', 'sidewalk', 'salvajes_en_la_via,simur,bogota_te_escucha,civic_pulse,community_channel'),
  ('PK3', 'parking', 11, 4.7410, -74.0840, 'Cl 138 con Cra 55, esquina', 'intersection', 'simur,salvajes_en_la_via,civic_pulse,bogota_te_escucha'),
  ('PK4', 'parking', 10, 4.7080, -74.1100, 'Cra 72 con Cl 80, cruce peatonal', 'pedestrian_access', 'salvajes_en_la_via,community_channel,simur,bogota_te_escucha'),
  ('PK5', 'parking', 13, 4.6400, -74.0900, 'Cl 39 #20-15, garaje del conjunto Alcázar', 'access_ramp', 'simur,salvajes_en_la_via,community_channel,civic_pulse'),
  ('PK6', 'parking', 13, 4.6410, -74.0900, 'Cl 39 #21-02, entrada del local comercial', 'prohibited_zone', 'salvajes_en_la_via,simur,bogota_te_escucha'),
  ('PK7', 'parking', 1, 4.6960, -74.0310, 'Cra 7 #120-18, rampa de acceso', 'access_ramp', 'simur,salvajes_en_la_via,bogota_te_escucha'),
  ('PK8', 'parking', 12, 4.6700, -74.0800, 'Cl 72 #24-30, entrada del colegio', 'pedestrian_access', 'salvajes_en_la_via,simur,community_channel,bogota_te_escucha'),
  ('PKS1', 'parking', 9, 4.6760, -74.1440, 'Cl 17 #96-22, andén', 'sidewalk', 'simur'),
  ('PKS2', 'parking', 16, 4.6150, -74.1100, 'Cra 50 #12-40, esquina', 'intersection', 'salvajes_en_la_via'),
  ('DM1', 'illegal_dumping', 19, 4.5440, -74.1560, 'Cl 69 sur con Cra 18, esquina', 'household_waste', 'community_channel,uaesp,bogota_te_escucha'),
  ('DM2', 'illegal_dumping', 7, 4.6060, -74.1920, 'Cra 80 #62 sur, lote junto al parque', 'construction_debris', 'community_channel,uaesp,bogota_te_escucha'),
  ('DM3', 'illegal_dumping', 8, 4.6270, -74.1500, 'Cl 38 sur #78-10, junto al conjunto residencial', 'bulky_items', 'uaesp,community_channel,bogota_te_escucha'),
  ('DM4', 'illegal_dumping', 10, 4.7050, -74.1140, 'Parque La Serena, costado norte', 'household_waste', 'community_channel,bogota_te_escucha,uaesp'),
  ('DM5', 'illegal_dumping', 5, 4.4930, -74.1220, 'Lote baldío Cl 90 sur #5-20', 'construction_debris', 'uaesp,community_channel,bogota_te_escucha'),
  ('DM6', 'illegal_dumping', 5, 4.4940, -74.1220, 'Lote baldío Cl 90 sur #6-44', 'household_waste', 'community_channel,uaesp,bogota_te_escucha'),
  ('DM7', 'illegal_dumping', 6, 4.5770, -74.1340, 'Cra 52 #48 sur, esquina', 'household_waste', 'community_channel,uaesp,bogota_te_escucha'),
  ('DM8', 'illegal_dumping', 18, 4.5700, -74.1100, 'Cl 30 sur #20-05, ronda de la quebrada', 'bulky_items', 'uaesp,community_channel,bogota_te_escucha'),
  ('DMS1', 'illegal_dumping', 4, 4.5560, -74.0860, 'Cra 3 este #20 sur, ladera', 'household_waste', 'community_channel'),
  ('DMS2', 'illegal_dumping', 15, 4.5930, -74.1010, 'Cl 20 sur #25-10, andén', 'bulky_items', 'uaesp')
) as t(pk, category, locality, lat, lng, address, subtype, platforms);

-- pk, occurrence number, start (days ago), span of the reports (hours), reports, plate, first report shows a different
-- vehicle/pile, reports over several days (later ones say it is still there), uncertain chunk, and the occurrence it truly belongs to
create temp table _occ as select * from (values
  ('PK1', 1, 88.0, 6, 8, 'FIC-101', false, false, false, 1), ('PK1', 2, 70.0, 3, 5, 'FIC-202', false, false, false, 2),
  ('PK1', 3, 69.0, 3, 4, 'FIC-303', false, false, false, 3), ('PK1', 4, 40.0, 4, 5, 'FIC-404', false, false, false, 4),
  ('PK2', 1, 80.0, 10, 5, 'FIC-501', false, false, false, 1), ('PK2', 2, 60.0, 8, 5, null, false, false, false, 2),
  ('PK2', 3, 30.0, 5, 4, null, false, false, false, 3),
  ('PK3', 1, 75.0, 72, 5, 'FIC-601', false, true, false, 1), ('PK3', 2, 50.0, 4, 4, 'FIC-602', false, false, false, 2),
  ('PK3', 3, 20.0, 6, 3, 'FIC-603', false, false, false, 3),
  ('PK4', 1, 66.0, 5, 4, 'FIC-701', false, false, false, 1), ('PK4', 2, 45.0, 4, 4, 'FIC-702', false, false, false, 2),
  ('PK4', 3, 15.0, 6, 3, 'FIC-703', false, false, false, 3),
  ('PK5', 1, 79.0, 6, 5, 'FIC-801', false, false, false, 1), ('PK5', 2, 52.0, 5, 4, 'FIC-802', false, false, false, 2),
  ('PK5', 3, 18.0, 5, 3, 'FIC-803', false, false, false, 3),
  ('PK6', 1, 58.0, 4, 4, 'FIC-901', false, false, false, 1), ('PK6', 2, 25.0, 3, 2, 'FIC-902', false, false, false, 2),
  ('PK7', 1, 83.0, 5, 4, 'FIC-111', false, false, false, 1), ('PK7', 2, 57.0, 4, 3, 'FIC-112', false, false, false, 2),
  ('PK8', 1, 85.0, 5, 3, 'FIC-121', false, false, false, 1), ('PK8', 2, 61.0, 4, 3, 'FIC-122', false, false, false, 2),
  ('PK8', 3, 37.0, 3, 3, 'FIC-123', false, false, false, 3), ('PK8', 4, 29.0, 5, 2, 'FIC-124', false, false, false, 4),
  ('PK8', 5, 24.0, 3, 3, null, false, false, true, 4),
  ('PKS1', 1, 40.0, 0, 1, 'FIC-131', false, false, false, 1), ('PKS2', 1, 52.0, 0, 1, null, false, false, false, 1),
  ('DM1', 1, 90.0, 130, 6, null, false, true, false, 1), ('DM1', 2, 70.0, 110, 5, null, false, true, false, 2),
  ('DM1', 3, 40.0, 6, 4, null, false, false, false, 3), ('DM1', 4, 14.0, 5, 5, null, false, false, false, 4),
  ('DM2', 1, 78.0, 24, 5, null, false, false, false, 1), ('DM2', 2, 50.0, 6, 4, null, false, false, false, 2),
  ('DM2', 3, 19.0, 4, 4, null, false, false, false, 3),
  ('DM3', 1, 70.0, 8, 5, null, false, false, false, 1), ('DM3', 2, 69.0, 4, 4, null, true, false, false, 2),
  ('DM3', 3, 30.0, 5, 3, null, false, false, false, 3),
  ('DM4', 1, 64.0, 6, 4, null, false, false, false, 1), ('DM4', 2, 44.0, 5, 4, null, false, false, false, 2),
  ('DM4', 3, 12.0, 6, 3, null, false, false, false, 3),
  ('DM5', 1, 76.0, 6, 5, null, false, false, false, 1), ('DM5', 2, 48.0, 6, 4, null, false, false, false, 2),
  ('DM5', 3, 21.0, 5, 3, null, false, false, false, 3),
  ('DM6', 1, 55.0, 4, 4, null, false, false, false, 1), ('DM6', 2, 23.0, 4, 2, null, false, false, false, 2),
  ('DM7', 1, 81.0, 6, 4, null, false, false, false, 1), ('DM7', 2, 59.0, 5, 3, null, false, false, false, 2),
  ('DM8', 1, 84.0, 48, 4, null, false, true, false, 1), ('DM8', 2, 56.0, 6, 3, null, false, false, false, 2),
  ('DM8', 3, 33.0, 5, 3, null, false, false, false, 3), ('DM8', 4, 28.0, 4, 3, null, false, false, true, 3),
  ('DM8', 5, 14.0, 5, 4, null, true, false, false, 4),
  ('DMS1', 1, 35.0, 0, 1, null, false, false, false, 1), ('DMS2', 1, 61.0, 0, 1, null, false, false, false, 1)
) as t(pk, n, days_ago, span_h, n_reports, plate, first_diff, multiday, uncertain, truth_n);

-- pk, days ago, agency, action, what, outcome (recorded with the intervention, as the agency reports it)
create temp table _iv as select *, false as done from (values
  ('PK1', 84.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed from the entrance', 'cleared'),
  ('PK1', 66.0, 'Secretaría Distrital de Movilidad', 'fine', 'Fine issued; the vehicle moved on', 'partial'),
  ('PK1', 36.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed from the entrance', 'cleared'),
  ('PK2', 76.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed from the sidewalk', 'cleared'),
  ('PK2', 55.0, 'Secretaría Distrital de Movilidad', 'fine', 'Fines issued along the block', 'partial'),
  ('PK3', 73.2, 'Policía de Tránsito', 'warning', 'Verbal warning to the driver', 'no_effect'),
  ('PK3', 70.0, 'Policía de Tránsito', 'tow', 'Vehicle towed from the corner', 'cleared'),
  ('PK4', 62.0, 'Policía de Tránsito', 'tow', 'Vehicle towed from the crossing', 'cleared'),
  ('PK4', 41.0, 'Policía de Tránsito', 'fine', 'Fine issued', 'partial'),
  ('PK5', 75.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed from the garage entrance', 'cleared'),
  ('PK5', 48.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed from the garage entrance', 'cleared'),
  ('PK6', 54.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed from the shop entrance', 'cleared'),
  ('PK7', 79.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed from the ramp', 'cleared'),
  ('PK7', 53.0, 'Secretaría Distrital de Movilidad', 'tow', 'Vehicle towed; bollards placed', 'cleared'),
  ('PK8', 81.0, 'Policía de Tránsito', 'tow', 'Vehicle towed from the school entrance', 'cleared'),
  ('PK8', 57.0, 'Policía de Tránsito', 'fine', 'Fine issued', 'partial'),
  ('DM1', 80.0, 'UAESP', 'cleanup', 'Waste collected from the corner', 'cleared'),
  ('DM1', 62.0, 'UAESP', 'cleanup', 'Waste collected from the corner', 'cleared'),
  ('DM1', 36.0, 'UAESP', 'cleanup', 'Partial collection; part of the waste remained', 'partial'),
  ('DM2', 74.0, 'UAESP', 'cleanup', 'Debris removed', 'cleared'),
  ('DM2', 46.0, 'UAESP', 'cleanup', 'Debris removed', 'cleared'),
  ('DM3', 66.0, 'UAESP', 'cleanup', 'Bulky waste removed', 'cleared'),
  ('DM3', 26.0, 'UAESP', 'cleanup', 'Partial removal', 'partial'),
  ('DM4', 60.0, 'UAESP', 'cleanup', 'Waste removed from the park edge', 'cleared'),
  ('DM4', 40.0, 'UAESP', 'cleanup', 'Waste removed from the park edge', 'cleared'),
  ('DM5', 72.0, 'UAESP', 'cleanup', 'Debris removed from the lot', 'cleared'),
  ('DM5', 44.0, 'UAESP', 'cleanup', 'Partial removal', 'partial'),
  ('DM6', 51.0, 'UAESP', 'cleanup', 'Waste removed from the lot', 'cleared'),
  ('DM7', 77.0, 'UAESP', 'cleanup', 'Waste removed', 'cleared'),
  ('DM7', 55.0, 'UAESP', 'cleanup', 'Waste removed; fence repaired', 'cleared'),
  ('DM8', 78.0, 'UAESP', 'cleanup', 'Bulky waste removed', 'cleared'),
  ('DM8', 52.0, 'UAESP', 'cleanup', 'Bulky waste removed', 'cleared')
) as t(pk, days_ago, agency, action_type, descr, outcome);

-- ───────── 3. The 200 reports ─────────
create temp table _rep as
with base as (
  select o.pk, o.n, o.truth_n, o.uncertain, o.first_diff, o.multiday, o.plate as occ_plate, o.span_h, o.n_reports, k,
         now() - make_interval(secs => o.days_ago * 86400)
           + make_interval(secs => case when o.n_reports > 1 then (k - 1) * o.span_h * 3600.0 / (o.n_reports - 1) else 0 end) as occurred_at,
         p.category, p.locality, p.lat, p.lng, p.address, p.subtype, string_to_array(p.platforms, ',') as plats
  from _occ o join _prob p on p.pk = o.pk cross join lateral generate_series(1, o.n_reports) k
), ranked as (
  select b.*, row_number() over (partition by b.pk order by b.occurred_at, b.k) as rn,
         row_number() over (partition by b.category order by b.occurred_at, b.pk, b.k) as cat_n
  from base b
)
select gen_random_uuid() as id, r.*,
       r.plats[((r.rn - 1) % cardinality(r.plats)) + 1] as platform,
       case when r.category = 'parking' then 'PRK-' else 'DMP-' end || lpad(r.cat_n::text, 4, '0') as reference
from ranked r;

insert into public.incidents (id, reference, category, title, description, locality_code, lat, lng, location_description,
  occurred_at, reported_at, vehicle_type, license_plate, obstruction_subtype, subtype, evidence_metadata, ai_classification,
  ai_confidence, uncertainty_flags, validation_status, status, is_synthetic)
select r.id, r.reference, r.category,
       case when r.category = 'parking' then initcap(replace(r.subtype, '_', ' ')) || ' blocked by a parked vehicle'
            else initcap(replace(r.subtype, '_', ' ')) || ' left in public space' end,
       'Synthetic report received through ' || sp.name || ' about ' || r.address || '.',
       r.locality, r.lat + (hashtext(r.reference) % 21) * 0.000005, r.lng + (hashtext(r.reference || 'x') % 21) * 0.000005,
       r.address, r.occurred_at,
       r.occurred_at + case r.platform when 'bogota_te_escucha' then interval '27 hours' when 'uaesp' then interval '6 hours'
                                       else interval '10 minutes' end,
       (case when r.category = 'parking' then 'car' else 'other' end)::public.vehicle_type,
       case when r.category = 'parking' then case when r.k = 1 or (r.k % 3) <> 0 then r.occ_plate end end,
       case when r.category = 'parking' then r.subtype::public.obstruction_subtype end,
       case when r.category <> 'parking' then r.subtype end,
       jsonb_build_object('dataset', 'problems_v1', 'placeholder', true,
         'seed_truth', jsonb_build_object('problem', r.pk, 'occurrence', r.pk || '-' || r.truth_n, 'uncertain', r.uncertain),
         'different_subject', (r.first_diff and r.k = 1), 'continues', (r.multiday and r.k > 1)),
       (select name from public.incident_categories where code = r.category),
       round((0.70 + (abs(hashtext(r.reference)) % 30) / 100.0)::numeric, 2), '{}',
       case when abs(hashtext(r.reference)) % 5 = 2 then 'human_validated' else 'pending' end,
       (array['received', 'under_review', 'validated', 'received', 'duplicate'])[1 + abs(hashtext(r.reference)) % 5]::public.incident_status,
       true
from _rep r join public.source_platforms sp on sp.code = r.platform;

-- provenance: where each report came from, in the platform's own terms
insert into public.incident_sources (incident_id, platform, external_ref, submitted_at, geo_precision, original_category,
                                     original_description, original_status, evidence_refs)
select i.id, r.platform, upper(left(r.platform, 3)) || '-' || r.reference, i.reported_at,
       case when r.platform in ('bogota_te_escucha') then 'address' else 'gps' end,
       case when r.category = 'parking' then 'Vehículo mal estacionado' else 'Disposición ilegal de residuos' end,
       i.description, 'Recibido', jsonb_build_array(jsonb_build_object('kind', 'photo', 'placeholder', true))
from _rep r join public.incidents i on i.id = r.id;
insert into public.incident_source_status (incident_id, source_status, observed_at)
select i.id, 'Recibido', i.reported_at from public.incidents i where i.evidence_metadata ->> 'dataset' = 'problems_v1'
union all
select i.id, 'En gestión', i.reported_at + interval '2 days' from public.incidents i
where i.evidence_metadata ->> 'dataset' = 'problems_v1' and i.status in ('under_review', 'validated');
insert into public.incident_media (incident_id, kind, is_placeholder)
select i.id, 'photo', true from public.incidents i
where i.evidence_metadata ->> 'dataset' = 'problems_v1' and abs(hashtext(i.reference)) % 5 < 2;

-- ───────── 4. Replay time: interventions happen as they would, the matcher links each report in order ─────────
do $$
declare r record; v record; pid uuid; iv uuid; n int := 0;
begin
  for r in select id, occurred_at from public.incidents where evidence_metadata ->> 'dataset' = 'problems_v1' order by occurred_at, id loop
    for v in select * from _iv where not done and now() - make_interval(secs => days_ago * 86400) <= r.occurred_at order by days_ago desc loop
      select l.problem_id into pid from public.incident_links l join public.incidents m on m.id = l.incident_id
        where m.evidence_metadata -> 'seed_truth' ->> 'problem' = v.pk and l.problem_id is not null limit 1;
      if pid is not null then
        insert into public.interventions (problem_id, action_type, agency, performed_at, description, dataset)
          values (pid, v.action_type, v.agency, now() - make_interval(secs => v.days_ago * 86400), v.descr, 'problems_v1')
          returning id into iv;
        insert into public.intervention_results (intervention_id, outcome, note, recorded_at)
          values (iv, v.outcome, 'Outcome reported by the agency (synthetic)', now() - make_interval(secs => v.days_ago * 86400) + interval '1 day');
        update _iv set done = true where pk = v.pk and days_ago = v.days_ago;
        perform public.refresh_problem_status(pid);
      end if;
    end loop;
    perform public.propose_links(r.id);
    n := n + 1;
  end loop;
  -- interventions after the last report of their problem
  for v in select * from _iv where not done loop
    select l.problem_id into pid from public.incident_links l join public.incidents m on m.id = l.incident_id
      where m.evidence_metadata -> 'seed_truth' ->> 'problem' = v.pk and l.problem_id is not null limit 1;
    insert into public.interventions (problem_id, action_type, agency, performed_at, description, dataset)
      values (pid, v.action_type, v.agency, now() - make_interval(secs => v.days_ago * 86400), v.descr, 'problems_v1')
      returning id into iv;
    insert into public.intervention_results (intervention_id, outcome, note, recorded_at)
      values (iv, v.outcome, 'Outcome reported by the agency (synthetic)', now() - make_interval(secs => v.days_ago * 86400) + interval '1 day');
    perform public.refresh_problem_status(pid);
  end loop;
  -- Resolved is an operator's decision, never a result of silence: the two planted "genuinely resolved" problems
  for pid in select distinct l.problem_id from public.incident_links l join public.incidents m on m.id = l.incident_id
             where m.evidence_metadata -> 'seed_truth' ->> 'problem' in ('PK7', 'DM7') and l.problem_id is not null loop
    update public.problems set status = 'resolved' where id = pid;
    insert into public.problem_events (problem_id, kind, payload, actor_type, created_at)
      values (pid, 'resolved', jsonb_build_object('reason', 'two cleared interventions and no new occurrence (synthetic operator decision)'),
              'operator', now() - interval '40 days');
  end loop;
  raise notice 'problems_v1: % reports replayed', n;
end $$;

-- To remove ONLY this dataset later:
--   delete from public.problems where dataset = 'problems_v1';
--   delete from public.incidents where evidence_metadata ->> 'dataset' = 'problems_v1';
