-- Synthetic ILLEGAL DUMPING incidents (Environmental specialization). Every row has is_synthetic = true.
-- Re-runnable: replaces only the synthetic illegal_dumping rows. Run in the Supabase SQL editor (bypasses RLS).
-- Deterministic (setseed). Dates are relative to now(): last 120 days.
-- Patterns for the investigations: concentrated in southern localities, ~65% of reports at night
-- (22:00 to 05:59 Bogotá time), 3 recurring hotspots per locality (50% of reports), no incidents in Sumapaz.
-- Needs migration 20261017010000_roles_alignment.sql (category 'illegal_dumping', subtype column).

delete from public.incidents where is_synthetic and category = 'illegal_dumping';
select setseed(0.77);

with w(code, weight, lat, lng) as (values
  (19, 22, 4.5400, -74.1600), (5, 14, 4.4900, -74.1200), (7, 14, 4.6050, -74.1950), (8, 12, 4.6300, -74.1500),
  (6, 8, 4.5750, -74.1350), (18, 6, 4.5700, -74.1100), (4, 6, 4.5500, -74.0850), (3, 4, 4.6000, -74.0600),
  (11, 5, 4.7400, -74.0900), (10, 4, 4.7000, -74.1100), (9, 3, 4.6700, -74.1450), (15, 2, 4.5900, -74.1000),
  (14, 2, 4.6050, -74.0900), (16, 2, 4.6200, -74.1100), (1, 1, 4.7500, -74.0300)
),
cum as (
  select code::smallint as code, lat, lng,
         sum(weight) over (order by code) - weight as lo, sum(weight) over (order by code) as hi
  from w
),
raw as materialized (
  select g, random() * (select max(hi) from cum) as pick,
         random() as r_spot, random() as r_k, random() as r_day, random() as r_night, random() as r_h2,
         random() as r_min, random() as r_lat, random() as r_lng, random() as r_sub, random() as r_veh,
         random() as r_conf, random() as r_val, random() as r_stat, random() as r_delay, random() as r_dup,
         random() as r_plate
  from generate_series(1, 150) g
),
s as (
  select raw.*, cum.code, cum.lat as clat, cum.lng as clng, loc.name,
         r_spot < 0.5 as hot,
         1 + floor(r_k * 3)::int as k,
         1 + r_day * 119 as days_ago,
         case when r_night < 0.65 then (22 + floor(r_h2 * 8)::int) % 24 else floor(r_h2 * 24)::int end as hr,
         case when r_sub < 0.45 then 'household_waste' when r_sub < 0.75 then 'construction_debris'
              else 'bulky_items' end as sub,
         case when r_veh < 0.35 then 'truck' when r_veh < 0.55 then 'van' when r_veh < 0.75 then 'car'
              else 'other' end::public.vehicle_type as veh,
         case when r_val < 0.60 then 'human_validated' when r_val < 0.70 then 'human_rejected'
              else 'pending' end as val
  from raw
  join cum on pick >= cum.lo and pick < cum.hi
  join public.localities loc on loc.code = cum.code
),
t as (
  select s.*,
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
  (reference, category, title, description, locality_code, lat, lng, location_description, occurred_at, reported_at,
   vehicle_type, license_plate, subtype, evidence_metadata, ai_classification, ai_confidence,
   uncertainty_flags, validation_status, status, outcome)
select
  'CD-' || lpad(g::text, 5, '0'),
  'illegal_dumping',
  'Illegal dumping: ' || replace(sub, '_', ' '),
  'Synthetic report: ' || replace(sub, '_', ' ') || ' left in a public space in ' || name || '.',
  code,
  case when hot then clat + (((code * 3 + k * 7) % 11) - 5) * 0.0012 + (r_lat - 0.5) * 0.0006
       else clat + (r_lat - 0.5) * 0.03 end,
  case when hot then clng + (((code * 11 + k * 5) % 11) - 5) * 0.0012 + (r_lng - 0.5) * 0.0006
       else clng + (r_lng - 0.5) * 0.03 end,
  case when hot then 'Synthetic dumping hotspot ' || code || '-' || k || ', ' || name
       else 'Synthetic dumping location CD-' || lpad(g::text, 5, '0') || ', ' || name end,
  occ,
  greatest(occ, least(occ + make_interval(mins => (5 + r_delay * 175)::int), now())),
  veh,
  case when r_plate < 0.3 then 'SIM-' || lpad(floor(r_plate * 3333)::int::text, 3, '0') end,  -- fictional, often unknown
  sub,
  jsonb_build_object('placeholder', true, 'photos', 1 + floor(r_conf * 3)::int),
  replace(sub, '_', ' '),
  round((0.55 + r_conf * 0.44)::numeric, 2),
  case when r_conf < 0.3 then array['low_confidence'] else '{}'::text[] end,
  case when st = 'duplicate' then 'human_validated' else val end,
  st,
  case st when 'resolved' then 'Synthetic: waste removed'
          when 'intervention_approved' then 'Synthetic: intervention approved'
          when 'intervention_rejected' then 'Synthetic: intervention rejected' end
from t;

-- Duplicates point to the nearest-in-time non-duplicate in the same locality and category.
insert into public.incident_relations (incident_id, related_incident_id, relation_type)
select i.id, o.id, 'duplicate'
from public.incidents i
cross join lateral (
  select id from public.incidents o
  where o.locality_code = i.locality_code and o.category = i.category and o.is_synthetic and o.status <> 'duplicate'
  order by abs(extract(epoch from o.occurred_at - i.occurred_at)) limit 1
) o
where i.is_synthetic and i.category = 'illegal_dumping' and i.status = 'duplicate';

-- Placeholder media: 1-3 photos per incident and a video on about 1 in 5. No files exist yet.
insert into public.incident_media (incident_id, kind, duration_seconds)
select i.id, 'photo'::public.media_kind, null
from public.incidents i, generate_series(1, (i.evidence_metadata ->> 'photos')::int)
where i.is_synthetic and i.category = 'illegal_dumping'
union all
select i.id, 'video'::public.media_kind, 8 + abs(hashtext(i.id::text)) % 20
from public.incidents i
where i.is_synthetic and i.category = 'illegal_dumping' and abs(hashtext(i.id::text)) % 5 = 0;
