-- Problems layer (decision 0030): persistent territorial problems above incident reports.
--   report (an incidents row, unchanged)  ->  occurrence (one real-world event)  ->  problem (the persistent situation).
-- ADDITIVE ONLY: no existing table, column, enum, function or policy is touched. In particular nothing writes to
-- public.incidents (the guard_incident_assignment trigger blocks every update except assigned_to).
-- Read access = the incident rule: has_permission('view_incidents') + can_access(locality, category).
-- NOBODY can write these tables from the browser (no write policy, no grants); rows come from the owner-run
-- matching functions at the bottom and from seeds. Run in the Supabase SQL editor as postgres.
-- One transaction: if anything fails, nothing changes. Rollback: 20261030000000_problems_layer_rollback.sql.
begin;

-- ───────── 1. Where reports come from (provenance) ─────────
create table public.source_platforms (
  code text primary key,
  name text not null,
  categories text[] not null,                  -- categories this platform may carry (a mobility platform cannot carry dumping)
  simulated boolean not null default true      -- no real integration exists; every platform here is simulated
);
insert into public.source_platforms (code, name, categories) values
  ('salvajes_en_la_via', 'Salvajes en la Vía', '{parking}'),
  ('simur', 'SIMUR (Yo reporto tránsito)', '{parking}'),
  ('bogota_te_escucha', 'Bogotá te Escucha', '{parking,illegal_dumping}'),
  ('civic_pulse', 'Civic Pulse direct report', '{parking,illegal_dumping}'),
  ('community_channel', 'Community reporting channel', '{parking,illegal_dumping}'),
  ('uaesp', 'UAESP operational records', '{illegal_dumping}'),
  ('synthetic', 'Original synthetic seed', '{parking,illegal_dumping}');

-- One row per report: where it came from, in the platform's own terms. The incidents row stays as it is.
create table public.incident_sources (
  incident_id uuid primary key references public.incidents (id) on delete cascade,
  platform text not null references public.source_platforms (code),
  external_ref text,
  submitted_at timestamptz not null,
  geo_precision text not null default 'gps' check (geo_precision in ('gps', 'address', 'centroid')),
  original_category text,
  original_description text,
  original_status text,
  evidence_refs jsonb not null default '[]'::jsonb,
  ingested_at timestamptz not null default now(),
  unique (platform, external_ref)
);
-- Original status of the report over time, as the platform said it (insert-only).
create table public.incident_source_status (
  id bigint generated always as identity primary key,
  incident_id uuid not null references public.incidents (id) on delete cascade,
  source_status text not null,
  observed_at timestamptz not null
);
create index incident_source_status_idx on public.incident_source_status (incident_id, observed_at);

-- ───────── 2. Problems, occurrences, links ─────────
create type public.problem_status as enum ('active', 'monitoring', 'resolved', 'archived');

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  title text not null,
  category text not null references public.incident_categories (code),
  locality_code smallint not null references public.localities (code),
  lat double precision not null check (lat between 4.4 and 4.9),
  lng double precision not null check (lng between -74.3 and -73.9),
  location_description text not null,
  status public.problem_status not null default 'active',
  merged_into uuid references public.problems (id),
  dataset text,                                 -- tags rows of one synthetic dataset so it can be removed alone
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, locality_code, category)
);
create index problems_scope_idx on public.problems (locality_code, category, status);
create index problems_geo_idx on public.problems (lat, lng);
create sequence public.problem_ref_seq;

-- One real-world event. Many reports can describe it. Start/end of reporting is derived (see views).
create table public.occurrences (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null,
  locality_code smallint not null,
  category text not null,
  subject_key text,                             -- the vehicle (plate) when known; null for dumping
  ended_at timestamptz,
  ended_reason text check (ended_reason in ('intervention', 'operator')),
  created_at timestamptz not null default now(),
  check ((ended_at is null) = (ended_reason is null)),
  foreign key (problem_id, locality_code, category)
    references public.problems (id, locality_code, category) on delete cascade
);
create index occurrences_problem_idx on public.occurrences (problem_id);

-- Report -> occurrence/problem. INSERT-ONLY: a correction is a new row that supersedes the old one; the latest row
-- per report is its current link. Nothing about the report itself ever changes.
create table public.incident_links (
  id bigint generated always as identity primary key,
  incident_id uuid not null references public.incidents (id) on delete cascade,
  problem_id uuid references public.problems (id) on delete cascade,
  occurrence_id uuid references public.occurrences (id) on delete cascade,
  state text not null check (state in ('proposed', 'confirmed', 'rejected', 'unlinked')),
  actor_type text not null check (actor_type in ('rule', 'ai', 'operator')),
  actor_id uuid,
  score smallint check (score between 0 and 100),
  band text check (band in ('high', 'medium', 'low')),
  explanation jsonb not null default '{}'::jsonb,
  config_version int not null,
  supersedes bigint references public.incident_links (id),
  created_at timestamptz not null default now(),
  check (state <> 'confirmed' or (problem_id is not null and occurrence_id is not null)),
  check (not (actor_type = 'ai' and state in ('confirmed', 'unlinked')))   -- AI can never decide a link
);
create index incident_links_incident_idx on public.incident_links (incident_id, id desc);
create index incident_links_occurrence_idx on public.incident_links (occurrence_id);
create index incident_links_problem_idx on public.incident_links (problem_id);

-- ───────── 3. Interventions and history ─────────
create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems (id) on delete cascade,
  action_type text not null,
  agency text not null,
  performed_at timestamptz not null,
  description text not null,
  recorded_by uuid,
  dataset text,
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now()
);
create index interventions_problem_idx on public.interventions (problem_id, performed_at);
-- What happened afterwards is recorded separately and later; the latest row wins.
create table public.intervention_results (
  id bigint generated always as identity primary key,
  intervention_id uuid not null references public.interventions (id) on delete cascade,
  outcome text not null check (outcome in ('cleared', 'partial', 'no_effect', 'unknown')),
  note text,
  recorded_at timestamptz not null default now()
);
create index intervention_results_idx on public.intervention_results (intervention_id, id desc);
create table public.problem_events (
  id bigint generated always as identity primary key,
  problem_id uuid not null references public.problems (id) on delete cascade,
  kind text not null,                           -- created, status_changed, reopened, resolved, note
  payload jsonb not null default '{}'::jsonb,
  actor_type text not null default 'rule' check (actor_type in ('rule', 'ai', 'operator')),
  created_at timestamptz not null default now()
);
create index problem_events_idx on public.problem_events (problem_id, created_at);

-- ───────── 4. Settings (nothing is hard-coded in the matching function) ─────────
create table public.occurrence_rules (
  category text primary key references public.incident_categories (code),
  review_gap_hours int not null default 24      -- a gap longer than this is a SIGNAL to check, never a rule
);
insert into public.occurrence_rules (category, review_gap_hours) values ('parking', 24), ('illegal_dumping', 24);
create table public.match_config (
  key text primary key,
  value jsonb not null,
  version int not null default 1
);
insert into public.match_config (key, value) values ('stage1', jsonb_build_object(
  'max_anchor_m', 250, 'high_max_m', 75, 'high', 80, 'medium', 50, 'margin', 10,
  'distance_points', jsonb_build_array(jsonb_build_array(50, 45), jsonb_build_array(90, 35), jsonb_build_array(150, 15)), -- reports of one problem spread along a street, so up to 50 m is still the same spot
  'address', 30, 'subtype', 10, 'history', 5, 'address_precision_penalty', 10));

-- ───────── 5. Views (security_invoker: the caller's access rules apply) ─────────
create view public.incident_current_link with (security_invoker = true) as
  select distinct on (incident_id) * from public.incident_links order by incident_id, id desc;

create view public.occurrence_stats with (security_invoker = true) as
  select o.id as occurrence_id, o.problem_id, o.locality_code, o.category, o.subject_key, o.ended_at, o.ended_reason,
         count(*) filter (where l.state = 'confirmed') as reports_n,
         min(i.occurred_at) filter (where l.state in ('confirmed', 'proposed')) as first_report_at,
         max(i.occurred_at) filter (where l.state in ('confirmed', 'proposed')) as last_report_at,
         coalesce(bool_or(l.state = 'proposed'), false) as boundary_uncertain
  from public.occurrences o
  left join public.incident_current_link l on l.occurrence_id = o.id and l.state in ('confirmed', 'proposed')
  left join public.incidents i on i.id = l.incident_id
  group by o.id;

-- Recurrence counts OCCURRENCES, never reports: occurrences_n - 1. reports_n is shown next to it as intensity only.
create view public.problem_stats with (security_invoker = true) as
  select p.id as problem_id, p.locality_code, p.category, p.status,
         count(s.occurrence_id) as occurrences_n,
         greatest(count(s.occurrence_id) - 1, 0) as recurrences_n,
         coalesce(sum(s.reports_n), 0)::bigint as reports_n,
         min(s.first_report_at) as first_seen,
         max(s.last_report_at) as last_seen,
         (select count(*) from public.interventions v where v.problem_id = p.id) as interventions_n,
         (select max(v.performed_at) from public.interventions v where v.problem_id = p.id) as last_intervention_at,
         count(s.occurrence_id) filter (where s.first_report_at >
           coalesce((select max(v.performed_at) from public.interventions v where v.problem_id = p.id), '-infinity')) as occurrences_after_last_intervention,
         count(s.occurrence_id) filter (where s.boundary_uncertain) as uncertain_n,
         -- derived label only, NEVER a status: no reports for 30 days does not mean the problem is solved
         coalesce(max(s.last_report_at) < now() - interval '30 days', false) as quiet
  from public.problems p
  left join public.occurrence_stats s on s.problem_id = p.id
  group by p.id;

-- ───────── 6. Access: read like incidents, write nobody ─────────
alter table public.source_platforms enable row level security;
alter table public.incident_sources enable row level security;
alter table public.incident_source_status enable row level security;
alter table public.problems enable row level security;
alter table public.occurrences enable row level security;
alter table public.incident_links enable row level security;
alter table public.interventions enable row level security;
alter table public.intervention_results enable row level security;
alter table public.problem_events enable row level security;
alter table public.occurrence_rules enable row level security;
alter table public.match_config enable row level security;

create policy "read platforms" on public.source_platforms for select to authenticated using (true);
create policy "read occurrence rules" on public.occurrence_rules for select to authenticated using (true);
create policy "read match config" on public.match_config for select to authenticated using (true);

-- A report's provenance follows the report: the incidents policy already limits which reports you can see.
create policy "read sources of incidents in scope" on public.incident_sources for select to authenticated
  using (exists (select 1 from public.incidents i where i.id = incident_id));
create policy "read source status of incidents in scope" on public.incident_source_status for select to authenticated
  using (exists (select 1 from public.incidents i where i.id = incident_id));

create policy "read problems in scope" on public.problems for select to authenticated
  using (public.has_permission('view_incidents') and public.can_access(locality_code, category));
create policy "read occurrences in scope" on public.occurrences for select to authenticated
  using (public.has_permission('view_incidents') and public.can_access(locality_code, category));
-- A link needs the report AND its problem in scope, like incident_relations.
create policy "read links in scope" on public.incident_links for select to authenticated
  using (exists (select 1 from public.incidents i where i.id = incident_id)
         and (problem_id is null or exists (select 1 from public.problems p where p.id = problem_id)));
create policy "read interventions in scope" on public.interventions for select to authenticated
  using (exists (select 1 from public.problems p where p.id = problem_id));
create policy "read intervention results in scope" on public.intervention_results for select to authenticated
  using (exists (select 1 from public.interventions v where v.id = intervention_id));
create policy "read problem events in scope" on public.problem_events for select to authenticated
  using (exists (select 1 from public.problems p where p.id = problem_id));

-- Supabase grants new tables to anon and authenticated by default: take writes (and everything for anon) away.
revoke all on public.source_platforms, public.incident_sources, public.incident_source_status, public.problems,
  public.occurrences, public.incident_links, public.interventions, public.intervention_results,
  public.problem_events, public.occurrence_rules, public.match_config, public.incident_current_link,
  public.occurrence_stats, public.problem_stats from anon, authenticated;
grant select on public.source_platforms, public.incident_sources, public.incident_source_status, public.problems,
  public.occurrences, public.incident_links, public.interventions, public.intervention_results,
  public.problem_events, public.occurrence_rules, public.match_config, public.incident_current_link,
  public.occurrence_stats, public.problem_stats to authenticated;

-- ───────── 7. Matching (rules, no AI). Owner-only: not callable from the API. Never a trigger on incidents. ─────────
-- Distance in metres between two points (no PostGIS in this project).
create function public.geo_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable set search_path = '' as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$$;

-- Address text compared without case, accents, punctuation or repeated spaces.
create function public.norm_addr(t text) returns text language sql immutable set search_path = '' as $$
  select trim(regexp_replace(regexp_replace(lower(translate(coalesce(t, ''),
    U&'\00E1\00E9\00ED\00F3\00FA\00FC\00F1\00C1\00C9\00CD\00D3\00DA\00DC\00D1', 'aeiouunAEIOUUN')), '[^a-z0-9 ]', ' ', 'g'), '\s+', ' ', 'g'))
$$;

-- Stage 2: put a report that belongs to problem p into an occurrence (the same event, or a new one) and write the link.
-- A new occurrence needs EVIDENCE: a documented intervention between the two, a different vehicle, or an explicit sign of
-- a different object. A gap longer than the category's review gap is only a signal: without more evidence the report is
-- attached as 'proposed' and the occurrence boundary stays uncertain, never an invented new event.
create function public.link_into_problem(p_incident uuid, p_problem uuid, p_score int, p_band text, p_stage1 jsonb)
returns text language plpgsql set search_path = '' as $$
declare
  i public.incidents%rowtype;
  v int := (select max(version) from public.match_config);
  gap interval := make_interval(hours => (select review_gap_hours from public.occurrence_rules
                                          where category = (select category from public.incidents where id = p_incident)));
  occ record; ended record; plate text; occ_id uuid; state text := 'confirmed'; decision text; reopened boolean := false;
begin
  select * into i from public.incidents where id = p_incident;
  plate := nullif(upper(trim(i.license_plate)), '');

  -- the latest occurrence, judged by its last CONFIRMED report (a provisional, uncertain report is not an observation yet)
  select o.id, o.subject_key, o.ended_at,
         (select max(m.occurred_at) from public.incident_current_link l join public.incidents m on m.id = l.incident_id
          where l.occurrence_id = o.id and l.state = 'confirmed') as last_at
    into occ
  from public.occurrences o where o.problem_id = p_problem
  order by 4 desc nulls last limit 1;

  if occ.id is null then
    decision := 'first_occurrence';
  else
    select v2.id, v2.performed_at into ended
    from public.interventions v2
    where v2.problem_id = p_problem and v2.performed_at > occ.last_at and v2.performed_at <= i.occurred_at
      and (select r.outcome from public.intervention_results r where r.intervention_id = v2.id order by r.id desc limit 1)
          in ('cleared', 'partial')
    order by v2.performed_at limit 1;
    if ended.id is not null then
      decision := 'documented_intervention';
      update public.occurrences set ended_at = ended.performed_at, ended_reason = 'intervention'
        where id = occ.id and ended_at is null;
    elsif plate is not null and occ.subject_key is not null and plate <> occ.subject_key then
      decision := 'different_vehicle';
    elsif coalesce((i.evidence_metadata ->> 'different_subject')::boolean, false) then
      decision := 'different_object_evidence';
    elsif plate is not null and plate = occ.subject_key then
      decision := 'same_vehicle'; occ_id := occ.id;
    elsif i.occurred_at - occ.last_at <= gap then
      decision := 'within_gap'; occ_id := occ.id;
    elsif coalesce((i.evidence_metadata ->> 'continues')::boolean, false) then
      decision := 'continuation_evidence'; occ_id := occ.id;
    else
      decision := 'boundary_uncertain'; occ_id := occ.id; state := 'proposed';
    end if;
  end if;

  if occ_id is null then
    insert into public.occurrences (problem_id, locality_code, category, subject_key)
      values (p_problem, i.locality_code, i.category, plate) returning id into occ_id;
    -- a new occurrence reopens a resolved problem (never erases anything) and ends a monitoring period
    if (select status from public.problems where id = p_problem) = 'resolved' then
      reopened := true;
      insert into public.problem_events (problem_id, kind, payload) values (p_problem, 'reopened',
        jsonb_build_object('incident', i.reference, 'reason', decision));
    end if;
    update public.problems set status = 'active' where id = p_problem and status in ('monitoring', 'resolved');
  elsif plate is not null then
    update public.occurrences set subject_key = plate where id = occ_id and subject_key is null;
  end if;

  insert into public.incident_links (incident_id, problem_id, occurrence_id, state, actor_type, score, band, explanation, config_version)
  values (p_incident, p_problem, occ_id, state, 'rule', p_score, p_band,
          jsonb_build_object('stage1', p_stage1, 'stage2', jsonb_build_object('decision', decision, 'reopened', reopened)), v);
  return decision;
end $$;

-- Recompute Active / Monitoring from the facts. Resolved and Archived are decided by a person and are never touched here;
-- the absence of reports never resolves anything.
create function public.refresh_problem_status(p_problem uuid) returns void language plpgsql set search_path = '' as $$
declare s public.problem_status; want public.problem_status; last_iv timestamptz; last_rep timestamptz;
begin
  select status into s from public.problems where id = p_problem;
  if s not in ('active', 'monitoring') then return; end if;
  select max(performed_at) into last_iv from public.interventions where problem_id = p_problem;
  select last_seen into last_rep from public.problem_stats where problem_id = p_problem;
  want := case when last_iv is not null and (last_rep is null or last_iv >= last_rep) then 'monitoring' else 'active' end;
  if want <> s then
    update public.problems set status = want where id = p_problem;
    insert into public.problem_events (problem_id, kind, payload)
      values (p_problem, 'status_changed', jsonb_build_object('from', s, 'to', want));
  end if;
end $$;

-- Points for a distance: the first tier whose limit covers it (settings: match_config stage1.distance_points).
create function public.dist_points(d double precision, c jsonb) returns int language sql immutable set search_path = '' as $$
  select coalesce((select (t ->> 1)::int from jsonb_array_elements(c -> 'distance_points') t
                   where d <= (t ->> 0)::double precision order by (t ->> 0)::double precision limit 1), 0)
$$;

-- Stage 1 + 2 for one report: find the problem it belongs to (or start one when two reports agree), then its occurrence.
-- Score 0..100 = distance tier + same address + same subtype + history - low-precision penalty. Bands: high links by itself,
-- medium is proposed for an operator, low stays unassociated. Returns 'linked' | 'proposed' | 'unassociated' | 'skipped'.
create function public.propose_links(p_incident uuid) returns text language plpgsql set search_path = '' as $$
declare
  i public.incidents%rowtype;
  prec text;
  c jsonb := (select value from public.match_config where key = 'stage1');
  v int := (select max(version) from public.match_config);
  best record; band text; pen int := 0; new_problem uuid; partner_ids uuid[]; pid uuid; first_partner public.incidents%rowtype;
begin
  select * into i from public.incidents where id = p_incident;
  if i.id is null or i.status = 'rejected' then return 'skipped'; end if;
  if exists (select 1 from public.incident_current_link where incident_id = p_incident and state in ('confirmed', 'proposed')) then
    return 'skipped';
  end if;
  select geo_precision into prec from public.incident_sources where incident_id = p_incident;
  if prec = 'address' then pen := (c ->> 'address_precision_penalty')::int; end if;

  -- candidate problems: same locality and category, within the anchor distance, not previously rejected for this report
  select k.id, k.score, k.d, k.addr, k.sub, lead(k.score) over (order by k.score desc, k.d) as runner into best
  from (
    select s.id, s.d, s.addr, s.sub,
           public.dist_points(s.d, c)
             + case when s.addr then (c ->> 'address')::int else 0 end
             + case when s.sub then (c ->> 'subtype')::int else 0 end
             + case when s.n >= 2 then (c ->> 'history')::int else 0 end - pen as score
    from public.problems p
    cross join lateral (select p.id,
        coalesce((select min(public.geo_m(i.lat, i.lng, m.lat, m.lng)) from public.incident_current_link l
                  join public.incidents m on m.id = l.incident_id where l.problem_id = p.id and l.state = 'confirmed'),
                 public.geo_m(i.lat, i.lng, p.lat, p.lng)) as d,
        public.geo_m(i.lat, i.lng, p.lat, p.lng) as da,
        exists (select 1 from public.incident_current_link l join public.incidents m on m.id = l.incident_id
                where l.problem_id = p.id and l.state = 'confirmed'
                  and public.norm_addr(m.location_description) = public.norm_addr(i.location_description)) as addr,
        exists (select 1 from public.incident_current_link l join public.incidents m on m.id = l.incident_id
                where l.problem_id = p.id and l.state = 'confirmed'
                  and coalesce(m.subtype, m.obstruction_subtype::text) = coalesce(i.subtype, i.obstruction_subtype::text)) as sub,
        (select count(*) from public.incident_current_link l where l.problem_id = p.id and l.state = 'confirmed') as n) s
    where p.category = i.category and p.locality_code = i.locality_code and p.merged_into is null and p.status <> 'archived'
      and abs(p.lat - i.lat) < 0.003 and abs(p.lng - i.lng) < 0.003
      and s.da <= (c ->> 'max_anchor_m')::double precision and s.d <= (c ->> 'max_anchor_m')::double precision
      and not exists (select 1 from public.incident_links x where x.incident_id = i.id and x.problem_id = p.id
                      and x.state in ('rejected', 'unlinked'))
  ) k
  order by k.score desc, k.d limit 1;

  if best.id is not null then
    band := case when best.score >= (c ->> 'high')::int and best.d <= (c ->> 'high_max_m')::double precision
                      and (best.addr or best.sub or best.d <= 30) and prec <> 'centroid'
                      and (best.runner is null or best.runner < best.score - (c ->> 'margin')::int) then 'high'
                 when best.score >= (c ->> 'medium')::int then 'medium' else 'low' end;
    if band = 'high' then
      perform public.link_into_problem(p_incident, best.id, best.score, band, jsonb_build_object(
        'distance_m', round(best.d::numeric, 1), 'address_match', best.addr, 'subtype_match', best.sub, 'runner_up', best.runner));
      perform public.refresh_problem_status(best.id);
      return 'linked';
    elsif band = 'medium' then
      insert into public.incident_links (incident_id, problem_id, state, actor_type, score, band, explanation, config_version)
      values (p_incident, best.id, 'proposed', 'rule', best.score, band, jsonb_build_object(
        'stage1', jsonb_build_object('distance_m', round(best.d::numeric, 1), 'address_match', best.addr,
                                     'subtype_match', best.sub, 'runner_up', best.runner),
        'stage2', jsonb_build_object('decision', 'needs_review')), v);
      return 'proposed';
    end if;
  end if;

  -- No problem fits. If earlier unassociated reports of the same place agree with this one, they start a problem together.
  select array_agg(u.id order by u.occurred_at, u.id) into partner_ids
  from public.incidents u
  where u.id <> i.id and u.category = i.category and u.locality_code = i.locality_code and u.status <> 'rejected'
    and u.occurred_at <= i.occurred_at and abs(u.lat - i.lat) < 0.003 and abs(u.lng - i.lng) < 0.003
    and not exists (select 1 from public.incident_current_link l where l.incident_id = u.id and l.state in ('confirmed', 'proposed'))
    and coalesce((select geo_precision from public.incident_sources where incident_id = u.id), 'gps') <> 'centroid'
    and public.geo_m(i.lat, i.lng, u.lat, u.lng) <= (c ->> 'high_max_m')::double precision
    and (public.dist_points(public.geo_m(i.lat, i.lng, u.lat, u.lng), c)
         + case when public.norm_addr(u.location_description) = public.norm_addr(i.location_description) then (c ->> 'address')::int else 0 end
         + case when coalesce(u.subtype, u.obstruction_subtype::text) = coalesce(i.subtype, i.obstruction_subtype::text) then (c ->> 'subtype')::int else 0 end
         - pen) >= (c ->> 'high')::int;
  if partner_ids is null then return 'unassociated'; end if;

  select * into first_partner from public.incidents where id = partner_ids[1];
  insert into public.problems (reference, title, category, locality_code, lat, lng, location_description, dataset, is_synthetic)
  values ('PR-' || lpad(nextval('public.problem_ref_seq')::text, 5, '0'),
          (select name from public.incident_categories where code = i.category) || ' - ' || first_partner.location_description,
          i.category, i.locality_code, first_partner.lat, first_partner.lng, first_partner.location_description,
          i.evidence_metadata ->> 'dataset', i.is_synthetic)
  returning id into new_problem;
  insert into public.problem_events (problem_id, kind, payload)
    values (new_problem, 'created', jsonb_build_object('reason', 'agreeing reports', 'reports', cardinality(partner_ids) + 1));
  foreach pid in array partner_ids || p_incident loop
    perform public.link_into_problem(pid, new_problem, 80, 'high', jsonb_build_object('started_problem', true));
  end loop;
  perform public.refresh_problem_status(new_problem);
  return 'linked';
end $$;

-- Batch: link every report of one dataset, oldest first. A dataset is required so this can never be run over all incidents by accident.
create function public.match_unlinked(p_dataset text) returns int language plpgsql set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in select id from public.incidents where evidence_metadata ->> 'dataset' = p_dataset order by occurred_at, id loop
    perform public.propose_links(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.geo_m(double precision, double precision, double precision, double precision),
  public.norm_addr(text), public.link_into_problem(uuid, uuid, int, text, jsonb), public.refresh_problem_status(uuid),
  public.propose_links(uuid), public.match_unlinked(text), public.dist_points(double precision, jsonb) from public, anon, authenticated;

commit;
