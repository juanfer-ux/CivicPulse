-- Controlled SQL tools for the Civic Operations Agent ("Investigate and Ask").
-- The agent (mock router today, LLM Edge Function later) can ONLY read data through these functions.
-- They are SECURITY INVOKER: they run as the signed-in user, so RLS on incidents/localities applies
-- and a user can never receive rows outside their locality and category scope.
-- Counting policy: duplicates and rejected reports are excluded. Counts and incident ids come from SQL only.

create function public.tool_incidents_by_locality(
  p_from timestamptz default null, p_to timestamptz default null)
returns table (locality_code smallint, locality_name text, incident_count bigint,
               first_at timestamptz, last_at timestamptz, incident_ids uuid[])
language sql stable set search_path = '' as $$
  select l.code, l.name, count(*), min(i.occurred_at), max(i.occurred_at),
         array_agg(i.id order by i.occurred_at desc)
  from public.incidents i
  join public.localities l on l.code = i.locality_code
  where i.status not in ('duplicate', 'rejected')
    and (p_from is null or i.occurred_at >= p_from)
    and (p_to is null or i.occurred_at < p_to)
  group by l.code, l.name
  order by count(*) desc, l.name
$$;

-- Day of week (ISO, 1 = Monday) and hour of day in Bogotá local time.
create function public.tool_time_distribution(
  p_locality smallint default null, p_from timestamptz default null, p_to timestamptz default null)
returns table (dow smallint, hour smallint, incident_count bigint,
               first_at timestamptz, last_at timestamptz, incident_ids uuid[])
language sql stable set search_path = '' as $$
  select x.dow, x.hr, count(*),
         min(min(x.occurred_at)) over (), max(max(x.occurred_at)) over (),
         array_agg(x.id order by x.occurred_at desc)
  from (
    select i.id, i.occurred_at,
           extract(isodow from i.occurred_at at time zone 'America/Bogota')::smallint as dow,
           extract(hour from i.occurred_at at time zone 'America/Bogota')::smallint as hr
    from public.incidents i
    where i.status not in ('duplicate', 'rejected')
      and (p_locality is null or i.locality_code = p_locality)
      and (p_from is null or i.occurred_at >= p_from)
      and (p_to is null or i.occurred_at < p_to)
  ) x
  group by x.dow, x.hr
  order by x.dow, x.hr
$$;

-- Always returns two rows, 'current' then 'previous', even when a period is empty.
create function public.tool_period_comparison(
  p_locality smallint, p_current_from timestamptz, p_current_to timestamptz,
  p_previous_from timestamptz, p_previous_to timestamptz)
returns table (period text, incident_count bigint, first_at timestamptz, last_at timestamptz, incident_ids uuid[])
language sql stable set search_path = '' as $$
  select p.period, count(i.id), min(i.occurred_at), max(i.occurred_at),
         coalesce(array_agg(i.id order by i.occurred_at desc) filter (where i.id is not null), '{}')
  from (values (1, 'current', p_current_from, p_current_to),
               (2, 'previous', p_previous_from, p_previous_to)) as p(ord, period, f, t)
  left join public.incidents i
    on i.occurred_at >= p.f and i.occurred_at < p.t
   and i.status not in ('duplicate', 'rejected')
   and (p_locality is null or i.locality_code = p_locality)
  group by p.ord, p.period
  order by p.ord
$$;

revoke execute on function
  public.tool_incidents_by_locality(timestamptz, timestamptz),
  public.tool_time_distribution(smallint, timestamptz, timestamptz),
  public.tool_period_comparison(smallint, timestamptz, timestamptz, timestamptz, timestamptz)
  from public, anon;
grant execute on function
  public.tool_incidents_by_locality(timestamptz, timestamptz),
  public.tool_time_distribution(smallint, timestamptz, timestamptz),
  public.tool_period_comparison(smallint, timestamptz, timestamptz, timestamptz, timestamptz)
  to authenticated;
