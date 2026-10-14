-- Investigation C (recurring locations), Investigation E (candidate areas) and recommendation audit.
-- Same rules as the other tools: SECURITY INVOKER (RLS applies), counts and incident ids from SQL only,
-- duplicates and rejected reports excluded.

-- Locations with repeated reports. 'exact' = identical described location. 'approximate' = reports whose
-- coordinates fall in the same ~200 m grid cell and that are not already part of an exact group.
-- Neither proves the reports describe the same event.
create function public.tool_recurring_locations(
  p_from timestamptz default null, p_to timestamptz default null, p_min int default 3)
returns table (match_type text, label text, locality_code smallint, locality_name text, incident_count bigint,
               lat double precision, lng double precision, first_at timestamptz, last_at timestamptz,
               incident_ids uuid[])
language sql stable set search_path = '' as $$
  with base as (
    select i.id, i.locality_code, i.location_description as descr, i.lat, i.lng, i.occurred_at
    from public.incidents i
    where i.status not in ('duplicate', 'rejected')
      and (p_from is null or i.occurred_at >= p_from)
      and (p_to is null or i.occurred_at < p_to)
  ),
  exact as (select b.descr from base b group by b.descr having count(*) >= p_min),
  rows_exact as (
    select 'exact'::text as match_type, b.descr as label, b.locality_code, count(*) as n,
           avg(b.lat) as lat, avg(b.lng) as lng, min(b.occurred_at) as first_at, max(b.occurred_at) as last_at,
           array_agg(b.id order by b.occurred_at desc) as ids
    from base b where b.descr in (select e.descr from exact e)
    group by b.descr, b.locality_code
  ),
  rows_approx as (
    select 'approximate'::text, 'Within ~200 m of ' || round(avg(b.lat)::numeric, 4) || ', ' || round(avg(b.lng)::numeric, 4),
           b.locality_code, count(*), avg(b.lat), avg(b.lng), min(b.occurred_at), max(b.occurred_at),
           array_agg(b.id order by b.occurred_at desc)
    from base b where b.descr not in (select e.descr from exact e)
    group by b.locality_code, round(b.lat / 0.002), round(b.lng / 0.002)
    having count(*) >= p_min
  )
  select u.match_type, u.label, u.locality_code, l.name, u.n, u.lat, u.lng, u.first_at, u.last_at, u.ids
  from (select * from rows_exact union all select * from rows_approx) u
  join public.localities l on l.code = u.locality_code
  order by u.n desc, u.label
  limit 30
$$;

-- Candidate areas for the evening shift (Bogotá 16:00-20:00). Ranking is transparent and fixed:
-- evening incidents, then total incidents, then incidents in the final 30 days of the window.
-- weekday_evening_count (evening incidents on p_dow) is reported, not used for ranking: it is usually tiny.
create function public.tool_candidate_areas(
  p_from timestamptz, p_to timestamptz, p_dow smallint, p_min int default 3)
returns table (label text, locality_code smallint, locality_name text, total_count bigint, evening_count bigint,
               weekday_evening_count bigint, recent_count bigint, lat double precision, lng double precision,
               last_at timestamptz, incident_ids uuid[])
language sql stable set search_path = '' as $$
  select x.descr, x.locality_code, l.name, count(*),
         count(*) filter (where x.hr between 16 and 19),
         count(*) filter (where x.hr between 16 and 19 and x.dow = p_dow),
         count(*) filter (where x.occurred_at >= p_to - interval '30 days'),
         avg(x.lat), avg(x.lng), max(x.occurred_at), array_agg(x.id order by x.occurred_at desc)
  from (
    select i.id, i.locality_code, i.location_description as descr, i.lat, i.lng, i.occurred_at,
           extract(hour from i.occurred_at at time zone 'America/Bogota')::int as hr,
           extract(isodow from i.occurred_at at time zone 'America/Bogota')::int as dow
    from public.incidents i
    where i.status not in ('duplicate', 'rejected') and i.occurred_at >= p_from and i.occurred_at < p_to
  ) x
  join public.localities l on l.code = x.locality_code
  group by x.descr, x.locality_code, l.name
  having count(*) >= p_min
  order by 5 desc, 4 desc, 7 desc, 1
  limit 5
$$;

revoke execute on function
  public.tool_recurring_locations(timestamptz, timestamptz, int),
  public.tool_candidate_areas(timestamptz, timestamptz, smallint, int)
  from public, anon;
grant execute on function
  public.tool_recurring_locations(timestamptz, timestamptz, int),
  public.tool_candidate_areas(timestamptz, timestamptz, smallint, int)
  to authenticated;

-- ───────── Audit trail hardening ─────────
-- Audit events are written only by triggers (never by the browser), so they cannot be forged.
drop policy "write own audit events" on public.audit_events;

-- A recommendation must start as 'proposed': approval only happens through a recorded decision.
drop policy "propose recommendations in scope" on public.recommendations;
create policy "propose recommendations in scope" on public.recommendations
  for insert to authenticated
  with check (public.can_decide() and public.can_access_locality(locality_code)
              and created_by = (select auth.uid()) and status = 'proposed');

create function public.audit_recommendation_proposed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events (actor, action, entity, entity_id, details)
  values (new.created_by, 'recommendation_proposed', 'recommendation', new.id::text,
          jsonb_build_object('locality_code', new.locality_code, 'title', new.title));
  return new;
end $$;
create trigger audit_recommendation_proposed after insert on public.recommendations
  for each row execute function public.audit_recommendation_proposed();
revoke execute on function public.audit_recommendation_proposed() from public, anon, authenticated;
