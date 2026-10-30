-- Matching smoke test for the problems layer (decision 0030). Read-only: run it in the Supabase SQL editor AFTER
-- supabase/seed/synthetic_problems.sql. It compares what the rule-based matcher built with the truth planted in each report
-- (evidence_metadata->'seed_truth'), and checks the invariants that must always hold. Last row: RESULT PASS n/n.
-- A FAIL row says which rule broke; nothing is changed by this file.
with truth as (                                   -- one row per planted report with the matcher's current link
  select i.id, i.reference, i.category, i.evidence_metadata -> 'seed_truth' ->> 'problem' as t_prob,
         i.evidence_metadata -> 'seed_truth' ->> 'occurrence' as t_occ,
         coalesce((i.evidence_metadata -> 'seed_truth' ->> 'uncertain')::boolean, false) as t_uncertain,
         l.state, l.problem_id, l.occurrence_id
  from public.incidents i
  left join public.incident_current_link l on l.incident_id = i.id and l.state in ('confirmed', 'proposed')
  where i.evidence_metadata ->> 'dataset' = 'problems_v1'
),
linked as (select * from truth where problem_id is not null),
pairs as (                                        -- every pair of linked reports: same planted occurrence vs same built occurrence
  select (a.t_occ = b.t_occ) as truth_same, (a.occurrence_id = b.occurrence_id) as built_same
  from linked a join linked b on a.id < b.id
),
pm as (select count(*) filter (where truth_same and built_same) as tp, count(*) filter (where not truth_same and built_same) as fp,
              count(*) filter (where truth_same and not built_same) as fn from pairs),
checks(name, ok, detail) as (
  select 'reports planted', count(*) = 200, count(*)::text from truth
  union all select 'problems built = 16', (select count(*) from public.problems where dataset = 'problems_v1') = 16,
         (select count(*) from public.problems where dataset = 'problems_v1')::text
  union all select 'occurrences built = 48', (select count(*) from public.occurrences o join public.problems p on p.id = o.problem_id
                                               where p.dataset = 'problems_v1') = 48,
         (select count(*) from public.occurrences o join public.problems p on p.id = o.problem_id where p.dataset = 'problems_v1')::text
  union all select 'interventions = 32', (select count(*) from public.interventions where dataset = 'problems_v1') = 32,
         (select count(*) from public.interventions where dataset = 'problems_v1')::text
  union all select 'each planted problem is exactly one built problem',
         not exists (select 1 from linked group by t_prob having count(distinct problem_id) <> 1),
         (select count(distinct t_prob) from linked)::text || ' planted problems linked'
  union all select 'different planted problems stay separate (incl. the two nearby pairs)',
         (select count(distinct problem_id) from linked) = (select count(distinct t_prob) from linked),
         (select count(distinct problem_id) from linked)::text || ' built problems'
  union all select 'pairwise precision >= 0.98 (reports wrongly put in one occurrence)',
         (select tp::numeric / nullif(tp + fp, 0) from pm) >= 0.98, 'precision ' || (select round(tp::numeric / nullif(tp + fp, 0), 3) from pm)::text
  union all select 'pairwise recall >= 0.98 (reports of one event wrongly split)',
         (select tp::numeric / nullif(tp + fn, 0) from pm) >= 0.98, 'recall ' || (select round(tp::numeric / nullif(tp + fn, 0), 3) from pm)::text
  union all select 'a burst is ONE occurrence: recurrences count occurrences, never reports',
         not exists (select 1 from public.problem_stats s join public.problems p on p.id = s.problem_id
                     where p.dataset = 'problems_v1' and s.recurrences_n >= s.reports_n),
         (select string_agg(p.reference || ': ' || s.occurrences_n || ' occ / ' || s.reports_n || ' reports', ', ' order by p.reference)
          from public.problem_stats s join public.problems p on p.id = s.problem_id where p.dataset = 'problems_v1' and s.reports_n >= 20)
  union all select 'uncertain evidence is flagged, not turned into a new event',
         (select count(*) from truth where t_uncertain and state = 'proposed') = (select count(*) from truth where t_uncertain)
         and (select count(*) from truth where t_uncertain) > 0
         and (select count(*) from public.occurrence_stats where boundary_uncertain) = 2,
         (select count(*) from truth where t_uncertain and state = 'proposed')::text || ' proposed, '
           || (select count(*) from public.occurrence_stats where boundary_uncertain)::text || ' occurrences flagged'
  union all select 'single stray reports stay unassociated',
         (select count(*) from truth where problem_id is null) = 4, (select count(*) from truth where problem_id is null)::text
  union all select 'dumping never comes from a mobility platform',
         not exists (select 1 from public.incident_sources s join public.incidents i on i.id = s.incident_id
                     where i.category = 'illegal_dumping' and s.platform in ('salvajes_en_la_via', 'simur')), 'platform check'
  union all select 'planted resolved problems are Resolved, and nothing else resolved itself',
         (select count(*) from public.problems where dataset = 'problems_v1' and status = 'resolved') = 2
         and not exists (select 1 from public.problems p join truth t on t.problem_id = p.id
                         where t.t_prob in ('PK7', 'DM7') and p.status <> 'resolved'),
         (select string_agg(status::text || ' x' || n, ', ') from (select status, count(*) n from public.problems
                                                                    where dataset = 'problems_v1' group by status) q)
  union all select 'an intervention after the last report puts a problem in Monitoring',
         exists (select 1 from public.problems p join public.problem_stats s on s.problem_id = p.id
                 where p.dataset = 'problems_v1' and p.status = 'monitoring' and s.last_intervention_at >= s.last_seen)
         and not exists (select 1 from public.problems p join public.problem_stats s on s.problem_id = p.id
                         where p.dataset = 'problems_v1' and p.status = 'active' and s.last_intervention_at >= s.last_seen),
         (select count(*) from public.problems where dataset = 'problems_v1' and status = 'monitoring')::text || ' monitoring'
  union all select 'the 650 original incidents have no link and no change',
         not exists (select 1 from public.incident_links l join public.incidents i on i.id = l.incident_id
                     where coalesce(i.evidence_metadata ->> 'dataset', '') <> 'problems_v1')
         and (select count(*) from public.incidents where coalesce(evidence_metadata ->> 'dataset', '') <> 'problems_v1') = 650,
         (select count(*) from public.incidents where coalesce(evidence_metadata ->> 'dataset', '') <> 'problems_v1')::text || ' originals'
  union all select 'every original has a provenance row',
         not exists (select 1 from public.incidents i where coalesce(i.evidence_metadata ->> 'dataset', '') <> 'problems_v1'
                     and not exists (select 1 from public.incident_sources s where s.incident_id = i.id)), 'provenance'
  union all select 'every link keeps its score and explanation',
         not exists (select 1 from public.incident_links where score is null or explanation = '{}'::jsonb), 'explanations'
),
numbered as (select *, row_number() over (order by name) as n from checks)
select case when ok then 'PASS' else 'FAIL' end as result, name, detail from numbered
union all
select 'RESULT', 'PASS ' || count(*) filter (where ok) || '/' || count(*), '' from numbered
order by 1 desc, 2;
