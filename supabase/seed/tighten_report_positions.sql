-- Owner-run, once, in the Supabase SQL editor (2026-11-25). For a database seeded before this date: moves the synthetic
-- reports of one occurrence next to its first report (each keeps 6 % of its offset, so under 3 m). Only dataset
-- 'problems_v1'; the original 650 incidents are not touched. Running it twice changes nothing.
-- The incidents guard trigger allows only assignment changes, so it is off inside this transaction only.
begin;
alter table public.incidents disable trigger guard_incident_assignment_trigger;

with first as (
  select distinct on (evidence_metadata -> 'seed_truth' ->> 'occurrence')
         evidence_metadata -> 'seed_truth' ->> 'occurrence' as occ, lat, lng
  from public.incidents
  where is_synthetic and evidence_metadata ->> 'dataset' = 'problems_v1'
  order by evidence_metadata -> 'seed_truth' ->> 'occurrence', occurred_at, id
)
update public.incidents i
set lat = f.lat + (i.lat - f.lat) * 0.06, lng = f.lng + (i.lng - f.lng) * 0.06
from first f
where i.is_synthetic and i.evidence_metadata ->> 'dataset' = 'problems_v1'
  and i.evidence_metadata -> 'seed_truth' ->> 'occurrence' = f.occ
  and public.geo_m(i.lat, i.lng, f.lat, f.lng) > 3.5;

alter table public.incidents enable trigger guard_incident_assignment_trigger;
commit;

-- check: widest_m should be about 7 or less, and guard should be 'O' (enabled)
select round(max(public.geo_m(a.lat, a.lng, b.lat, b.lng))::numeric, 1) as widest_m,
       (select tgenabled from pg_trigger where tgname = 'guard_incident_assignment_trigger') as guard
from public.incidents a join public.incidents b
  on a.evidence_metadata -> 'seed_truth' ->> 'occurrence' = b.evidence_metadata -> 'seed_truth' ->> 'occurrence'
where a.evidence_metadata ->> 'dataset' = 'problems_v1' and b.evidence_metadata ->> 'dataset' = 'problems_v1';
