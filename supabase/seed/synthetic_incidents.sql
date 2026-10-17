-- Synthetic parking-obstruction incidents for Bogotá. Every row has is_synthetic = true.
-- Re-runnable: replaces only the synthetic parking rows (illegal dumping has its own seed file). Run in the Supabase SQL editor (postgres role, bypasses RLS).
-- Deterministic: setseed fixes the random stream. Dates are relative to now(): last 120 days.
-- Built-in patterns for the investigations: uneven distribution across localities, evening/noon peaks,
-- 3 recurring hotspots per locality (40% of reports), and a Chapinero spike in the last 30 days.
-- Sumapaz gets no incidents: its territory lies south of the lat >= 4.4 check on incidents.

delete from public.incidents where is_synthetic and category = 'parking';
select setseed(0.42);

with w(code, weight, lat, lng) as (values
  (1, 9, 4.7500, -74.0300), (2, 14, 4.6500, -74.0550), (3, 5, 4.6000, -74.0600), (4, 2, 4.5500, -74.0850),
  (5, 1, 4.4900, -74.1200), (6, 2, 4.5750, -74.1350), (7, 3, 4.6050, -74.1950), (8, 12, 4.6300, -74.1500),
  (9, 7, 4.6700, -74.1450), (10, 9, 4.7000, -74.1100), (11, 11, 4.7400, -74.0900), (12, 6, 4.6700, -74.0800),
  (13, 8, 4.6400, -74.0900), (14, 4, 4.6050, -74.0900), (15, 2, 4.5900, -74.1000), (16, 5, 4.6200, -74.1100),
  (17, 4, 4.5950, -74.0700), (18, 2, 4.5700, -74.1100), (19, 3, 4.5400, -74.1600)
),
cum as (
  select code::smallint as code, lat, lng,
         sum(weight) over (order by code) - weight as lo, sum(weight) over (order by code) as hi
  from w
),
raw as materialized (
  select g, random() * (select max(hi) from cum) as pick,
         random() as r_spot, random() as r_k, random() as r_day, random() as r_hour, random() as r_h2,
         random() as r_min, random() as r_lat, random() as r_lng, random() as r_sub, random() as r_veh,
         random() as r_conf, random() as r_val, random() as r_stat, random() as r_delay, random() as r_dup,
         random() as r_plate
  from generate_series(1, 500) g
),
s as (
  select raw.*, cum.code, cum.lat as clat, cum.lng as clng, loc.name,
         r_spot < 0.4 as hot,
         1 + floor(r_k * 3)::int as k,
         case when cum.code = 2 and r_day < 0.55 then 1 + r_day / 0.55 * 29
              when cum.code = 2 then 31 + (r_day - 0.55) / 0.45 * 89
              else 1 + r_day * 119 end as days_ago,
         case when r_hour < 0.35 then 17 + floor(r_h2 * 4)::int
              when r_hour < 0.60 then 12 + floor(r_h2 * 3)::int
              else floor(r_h2 * 24)::int end as hr,
         case when r_sub < 0.35 then 'sidewalk' when r_sub < 0.50 then 'pedestrian_access'
              when r_sub < 0.70 then 'prohibited_zone' when r_sub < 0.80 then 'access_ramp'
              when r_sub < 0.92 then 'intersection' else 'other_public_space' end::public.obstruction_subtype as sub,
         case when r_veh < 0.55 then 'car' when r_veh < 0.75 then 'motorcycle' when r_veh < 0.85 then 'van'
              when r_veh < 0.91 then 'truck' when r_veh < 0.95 then 'bus' else 'other' end::public.vehicle_type as veh,
         case when r_val < 0.60 then 'human_validated' when r_val < 0.70 then 'human_rejected'
              else 'pending' end as val
  from raw
  join cum on pick >= cum.lo and pick < cum.hi
  join public.localities loc on loc.code = cum.code
),
t as (
  select s.*,
         -- hr is Bogotá local time; convert the local timestamp to timestamptz.
         (date_trunc('day', now() at time zone 'America/Bogota') - make_interval(days => floor(days_ago)::int)
           + make_interval(hours => hr, mins => floor(r_min * 60)::int)) at time zone 'America/Bogota' as occ,
         case when r_dup < 0.04 then 'duplicate'
              when val = 'human_rejected' then 'rejected'
              when val = 'pending' then case when r_stat < 0.6 then 'received' else 'under_review' end
              else case when r_stat < 0.40 then 'validated' when r_stat < 0.60 then 'intervention_proposed'
                        when r_stat < 0.75 then 'intervention_approved' when r_stat < 0.82 then 'intervention_rejected'
                        else 'resolved' end
         end::public.incident_status as st
  from s
)
insert into public.incidents
  (reference, title, description, locality_code, lat, lng, location_description, occurred_at, reported_at,
   vehicle_type, license_plate, obstruction_subtype, evidence_metadata, ai_classification, ai_confidence,
   uncertainty_flags, validation_status, status, outcome)
select
  'CP-' || lpad(g::text, 5, '0'),
  initcap(replace(sub::text, '_', ' ')) || ' obstruction',
  'Synthetic report: ' || veh::text || ' blocking ' || replace(sub::text, '_', ' ') || ' in ' || name || '.',
  code,
  case when hot then clat + (((code * 7 + k * 13) % 11) - 5) * 0.0012 + (r_lat - 0.5) * 0.0006
       else clat + (r_lat - 0.5) * 0.03 end,
  case when hot then clng + (((code * 5 + k * 17) % 11) - 5) * 0.0012 + (r_lng - 0.5) * 0.0006
       else clng + (r_lng - 0.5) * 0.03 end,
  case when hot then 'Synthetic hotspot ' || code || '-' || k || ', ' || name
       else 'Synthetic location CP-' || lpad(g::text, 5, '0') || ', ' || name end,
  occ,
  greatest(occ, least(occ + make_interval(mins => (5 + r_delay * 175)::int), now())),
  veh,
  'SIM-' || lpad(floor(r_plate * 1000)::int::text, 3, '0'),   -- not a real plate format
  sub,
  jsonb_build_object('placeholder', true, 'photos', 1 + floor(r_conf * 3)::int),
  replace(sub::text, '_', ' '),
  round((0.55 + r_conf * 0.44)::numeric, 2),
  case when r_conf < 0.3 then array['low_confidence'] else '{}'::text[] end,
  case when st = 'duplicate' then 'human_validated' else val end,
  st,
  case st when 'resolved' then 'Synthetic: vehicle removed'
          when 'intervention_approved' then 'Synthetic: intervention approved'
          when 'intervention_rejected' then 'Synthetic: intervention rejected' end
from t;

-- Duplicates point to the nearest-in-time non-duplicate in the same locality.
insert into public.incident_relations (incident_id, related_incident_id, relation_type)
select i.id, o.id, 'duplicate'
from public.incidents i
cross join lateral (
  select id from public.incidents o
  where o.locality_code = i.locality_code and o.category = i.category and o.is_synthetic and o.status <> 'duplicate'
  order by abs(extract(epoch from o.occurred_at - i.occurred_at)) limit 1
) o
where i.is_synthetic and i.category = 'parking' and i.status = 'duplicate';

-- Placeholder evidence media: 1-3 photos per incident (from evidence_metadata) and a video on about 1 in 5.
-- No files exist yet: rows are placeholders (storage_path null).
insert into public.incident_media (incident_id, kind, duration_seconds)
select i.id, 'photo'::public.media_kind, null
from public.incidents i, generate_series(1, (i.evidence_metadata ->> 'photos')::int)
where i.is_synthetic and i.category = 'parking'
union all
select i.id, 'video'::public.media_kind, 8 + abs(hashtext(i.id::text)) % 20
from public.incidents i
where i.is_synthetic and i.category = 'parking' and abs(hashtext(i.id::text)) % 5 = 0;
