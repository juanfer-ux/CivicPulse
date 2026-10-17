-- Aligns the database with docs/roles-and-permissions.md (approved 2026-10-17).
--   * 3 roles: super_admin, locality_admin, specialist_operator
--   * specializations -> incident categories (traffic: parking, environmental: illegal dumping, infrastructure: none yet)
--   * permissions stored as data (role_permissions) and checked with has_permission()
--   * category scope on recommendations and decisions; escalation (needs_second_approval)
--   * agent tools get an optional category filter and require the 'ask_agent' permission
-- One transaction: if anything fails, nothing changes. Requires 20261017000000_escalation_status.sql first.

-- ───────── 1. Drop what depends on the old role type ─────────
drop policy "read own profile or all as super admin" on public.profiles;
drop policy "update own profile name; super admin updates any" on public.profiles;
drop policy "read own locality access or all as super admin" on public.user_locality_access;
drop policy "super admin manages locality access" on public.user_locality_access;
drop policy "read own type access or all as super admin" on public.user_incident_type_access;
drop policy "super admin manages type access" on public.user_incident_type_access;
drop policy "read incidents in scope" on public.incidents;
drop policy "update incidents in scope" on public.incidents;
drop policy "read relations in scope" on public.incident_relations;
drop policy "read media of incidents in scope" on public.incident_media;
drop policy "read recommendations in scope" on public.recommendations;
drop policy "propose recommendations in scope" on public.recommendations;
drop policy "read decisions in scope" on public.decisions;
drop policy "decide in scope as yourself" on public.decisions;
drop policy "read own audit events or all as super admin" on public.audit_events;

drop function public.can_decide();
drop function public.can_access_category(text);
drop function public.can_access_locality(smallint);
drop function public.current_app_role();

drop function public.tool_incidents_by_locality(timestamptz, timestamptz);
drop function public.tool_time_distribution(smallint, timestamptz, timestamptz);
drop function public.tool_period_comparison(smallint, timestamptz, timestamptz, timestamptz, timestamptz);
drop function public.tool_recurring_locations(timestamptz, timestamptz, int);
drop function public.tool_candidate_areas(timestamptz, timestamptz, smallint, int);

-- ───────── 2. Roles: recreate the type with 3 values ─────────
-- Removed roles (general_operator, sector_admin) become null = no access (least privilege).
create type public.app_role_new as enum ('super_admin', 'locality_admin', 'specialist_operator');
alter table public.profiles alter column role type public.app_role_new using (
  case when role::text in ('super_admin', 'locality_admin', 'specialist_operator')
       then role::text::public.app_role_new end);
drop type public.app_role;
alter type public.app_role_new rename to app_role;

-- ───────── 3. Specializations and incident categories ─────────
create table public.specializations (
  code text primary key,
  name text not null,
  sort smallint not null default 0
);
create table public.incident_categories (
  code text primary key,
  name text not null,
  specialization text not null references public.specializations (code),
  active boolean not null default true
);
insert into public.specializations (code, name, sort) values
  ('traffic', 'Traffic', 1), ('environmental', 'Environmental', 2), ('infrastructure', 'Infrastructure', 3);
insert into public.incident_categories (code, name, specialization) values
  ('parking', 'Obstructive parking', 'traffic'),
  ('illegal_dumping', 'Illegal dumping', 'environmental');
-- Infrastructure exists with no categories yet.

-- Replace the hard-coded 'parking' checks with foreign keys.
do $$
declare c record;
begin
  for c in
    select conrelid::regclass as tbl, conname from pg_constraint
    where contype = 'c' and conrelid in ('public.incidents'::regclass, 'public.user_incident_type_access'::regclass)
      and pg_get_constraintdef(oid) like '%parking%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;
alter table public.incidents add constraint incidents_category_fk
  foreign key (category) references public.incident_categories (code);
alter table public.user_incident_type_access add constraint user_incident_type_access_category_fk
  foreign key (category) references public.incident_categories (code);

-- Recommendations are now scoped by category too.
alter table public.recommendations add column category text;
update public.recommendations set category = 'parking' where category is null;
alter table public.recommendations alter column category set not null;
alter table public.recommendations add constraint recommendations_category_fk
  foreign key (category) references public.incident_categories (code);

-- Incident type: obstruction_subtype is parking-specific; other categories use a free subtype.
alter table public.incidents alter column obstruction_subtype drop not null;
alter table public.incidents add column subtype text;
alter table public.incidents add constraint incidents_parking_needs_obstruction_subtype
  check (category <> 'parking' or obstruction_subtype is not null);

alter table public.specializations enable row level security;
alter table public.incident_categories enable row level security;

-- ───────── 4. Permissions as data ─────────
create table public.role_permissions (
  role public.app_role not null,
  action text not null,
  primary key (role, action)
);
insert into public.role_permissions (role, action) values
  -- Super Admin: everything except escalating (they are the escalation target)
  ('super_admin', 'view_incidents'), ('super_admin', 'view_media'), ('super_admin', 'ask_agent'),
  ('super_admin', 'propose_recommendation'), ('super_admin', 'decide_recommendation'),
  ('super_admin', 'review_escalations'), ('super_admin', 'assign_incidents'), ('super_admin', 'view_team'),
  ('super_admin', 'view_audit_own'), ('super_admin', 'view_audit_all'),
  ('super_admin', 'manage_users'), ('super_admin', 'manage_settings'),
  -- Locality (Zone) Admin
  ('locality_admin', 'view_incidents'), ('locality_admin', 'view_media'), ('locality_admin', 'ask_agent'),
  ('locality_admin', 'propose_recommendation'), ('locality_admin', 'decide_recommendation'),
  ('locality_admin', 'review_escalations'), ('locality_admin', 'assign_incidents'),
  ('locality_admin', 'view_team'), ('locality_admin', 'view_audit_own'),
  -- Specialist Operator
  ('specialist_operator', 'view_incidents'), ('specialist_operator', 'view_media'),
  ('specialist_operator', 'ask_agent'), ('specialist_operator', 'propose_recommendation'),
  ('specialist_operator', 'decide_recommendation'), ('specialist_operator', 'escalate_recommendation'),
  ('specialist_operator', 'view_audit_own');
alter table public.role_permissions enable row level security;

-- ───────── 5. Helper functions (security definer, fixed search_path) ─────────
create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid()) and is_active
$$;

create function public.has_permission(p_action text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.role_permissions rp
    where rp.role = public.current_app_role() and rp.action = p_action)
$$;

create function public.can_access_locality(p_code smallint) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    public.current_app_role() = 'super_admin'
    or (public.current_app_role() in ('locality_admin', 'specialist_operator')
        and exists (select 1 from public.user_locality_access a
                    where a.user_id = (select auth.uid()) and a.locality_code = p_code)), false)
$$;

-- Locality Admin sees every category in their localities; a Specialist only the categories assigned to them.
create function public.can_access_category(p_category text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    public.current_app_role() in ('super_admin', 'locality_admin')
    or (public.current_app_role() = 'specialist_operator'
        and exists (select 1 from public.user_incident_type_access a
                    where a.user_id = (select auth.uid()) and a.category = p_category)), false)
$$;

create function public.can_access(p_locality smallint, p_category text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.can_access_locality(p_locality) and public.can_access_category(p_category)
$$;

-- Does the signed-in user share at least one locality with p_user? (team view; avoids policy recursion)
create function public.shares_locality_with(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_locality_access a
    join public.user_locality_access b on b.locality_code = a.locality_code
    where a.user_id = (select auth.uid()) and b.user_id = p_user)
$$;

-- Nobody changes their own role or activation; only users with 'manage_users' may.
create or replace function public.guard_profile_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null
     and not public.has_permission('manage_users')
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'Only a Super Admin can change role or activation';
  end if;
  return new;
end $$;

-- ───────── 6. Policies, from the permission matrix ─────────
create policy "read reference: specializations" on public.specializations
  for select to authenticated using (true);
create policy "manage specializations" on public.specializations
  for all to authenticated
  using (public.has_permission('manage_settings')) with check (public.has_permission('manage_settings'));
create policy "read reference: categories" on public.incident_categories
  for select to authenticated using (true);
create policy "manage categories" on public.incident_categories
  for all to authenticated
  using (public.has_permission('manage_settings')) with check (public.has_permission('manage_settings'));
create policy "read permissions" on public.role_permissions
  for select to authenticated using (true);

create policy "read profiles: own, managed, or team" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.has_permission('manage_users')
         or (public.has_permission('view_team') and public.shares_locality_with(id)));
create policy "update profiles: own name, or manage users" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.has_permission('manage_users'))
  with check (id = (select auth.uid()) or public.has_permission('manage_users'));

create policy "read locality access: own, managed, or team" on public.user_locality_access
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('manage_users')
         or (public.has_permission('view_team') and public.shares_locality_with(user_id)));
create policy "manage locality access" on public.user_locality_access
  for all to authenticated
  using (public.has_permission('manage_users')) with check (public.has_permission('manage_users'));

create policy "read category access: own, managed, or team" on public.user_incident_type_access
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('manage_users')
         or (public.has_permission('view_team') and public.shares_locality_with(user_id)));
create policy "manage category access" on public.user_incident_type_access
  for all to authenticated
  using (public.has_permission('manage_users')) with check (public.has_permission('manage_users'));

create policy "read incidents in scope" on public.incidents
  for select to authenticated
  using (public.has_permission('view_incidents') and public.can_access(locality_code, category));
create policy "assign incidents in scope" on public.incidents
  for update to authenticated
  using (public.has_permission('assign_incidents') and public.can_access(locality_code, category))
  with check (public.has_permission('assign_incidents') and public.can_access(locality_code, category));

create policy "read relations in scope" on public.incident_relations
  for select to authenticated
  using (public.has_permission('view_incidents')
    and exists (select 1 from public.incidents i where i.id = incident_id
                and public.can_access(i.locality_code, i.category))
    and exists (select 1 from public.incidents r where r.id = related_incident_id
                and public.can_access(r.locality_code, r.category)));

create policy "read media of incidents in scope" on public.incident_media
  for select to authenticated
  using (public.has_permission('view_media')
    and exists (select 1 from public.incidents i where i.id = incident_id
                and public.can_access(i.locality_code, i.category)));

create policy "read recommendations in scope" on public.recommendations
  for select to authenticated
  using (public.has_permission('view_incidents') and public.can_access(locality_code, category));
create policy "propose recommendations in scope" on public.recommendations
  for insert to authenticated
  with check (public.has_permission('propose_recommendation') and public.can_access(locality_code, category)
              and created_by = (select auth.uid()) and status = 'proposed');

create policy "read decisions in scope" on public.decisions
  for select to authenticated
  using (public.has_permission('view_incidents')
    and exists (select 1 from public.recommendations r where r.id = recommendation_id
                and public.can_access(r.locality_code, r.category)));
-- A proposed recommendation needs 'decide_recommendation'; an escalated one needs 'review_escalations'.
create policy "decide in scope as yourself" on public.decisions
  for insert to authenticated
  with check (decided_by = (select auth.uid())
    and exists (select 1 from public.recommendations r
                where r.id = recommendation_id and public.can_access(r.locality_code, r.category)
                  and ((r.status = 'proposed' and public.has_permission('decide_recommendation'))
                    or (r.status = 'needs_second_approval' and public.has_permission('review_escalations')))));

create policy "read audit events: own, or all" on public.audit_events
  for select to authenticated
  using ((actor = (select auth.uid()) and public.has_permission('view_audit_own'))
         or public.has_permission('view_audit_all'));

-- ───────── 7. Escalation (no screen yet) ─────────
create function public.escalate_recommendation(p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.recommendations;
begin
  select * into r from public.recommendations where id = p_id;
  if not found then raise exception 'Recommendation not found'; end if;
  if not public.has_permission('escalate_recommendation') or not public.can_access(r.locality_code, r.category) then
    raise exception 'Not allowed to escalate this recommendation';
  end if;
  if r.status <> 'proposed' then raise exception 'Only a proposed recommendation can be escalated'; end if;
  update public.recommendations set status = 'needs_second_approval' where id = p_id;
  insert into public.audit_events (actor, action, entity, entity_id, details)
  values ((select auth.uid()), 'recommendation_escalated', 'recommendation', p_id::text,
          jsonb_build_object('note', p_note));
end $$;

-- ───────── 8. Agent tools (security invoker: RLS applies; optional category; needs 'ask_agent') ─────────
create function public.tool_incidents_by_locality(
  p_from timestamptz default null, p_to timestamptz default null, p_category text default null)
returns table (locality_code smallint, locality_name text, incident_count bigint,
               first_at timestamptz, last_at timestamptz, incident_ids uuid[])
language sql stable set search_path = '' as $$
  select l.code, l.name, count(*), min(i.occurred_at), max(i.occurred_at),
         array_agg(i.id order by i.occurred_at desc)
  from public.incidents i
  join public.localities l on l.code = i.locality_code
  where public.has_permission('ask_agent')
    and i.status not in ('duplicate', 'rejected')
    and (p_category is null or i.category = p_category)
    and (p_from is null or i.occurred_at >= p_from)
    and (p_to is null or i.occurred_at < p_to)
  group by l.code, l.name
  order by count(*) desc, l.name
$$;

create function public.tool_time_distribution(
  p_locality smallint default null, p_from timestamptz default null, p_to timestamptz default null,
  p_category text default null)
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
    where public.has_permission('ask_agent')
      and i.status not in ('duplicate', 'rejected')
      and (p_locality is null or i.locality_code = p_locality)
      and (p_category is null or i.category = p_category)
      and (p_from is null or i.occurred_at >= p_from)
      and (p_to is null or i.occurred_at < p_to)
  ) x
  group by x.dow, x.hr
  order by x.dow, x.hr
$$;

create function public.tool_period_comparison(
  p_locality smallint, p_current_from timestamptz, p_current_to timestamptz,
  p_previous_from timestamptz, p_previous_to timestamptz, p_category text default null)
returns table (period text, incident_count bigint, first_at timestamptz, last_at timestamptz, incident_ids uuid[])
language sql stable set search_path = '' as $$
  select p.period, count(i.id), min(i.occurred_at), max(i.occurred_at),
         coalesce(array_agg(i.id order by i.occurred_at desc) filter (where i.id is not null), '{}')
  from (values (1, 'current', p_current_from, p_current_to),
               (2, 'previous', p_previous_from, p_previous_to)) as p(ord, period, f, t)
  left join public.incidents i
    on public.has_permission('ask_agent')
   and i.occurred_at >= p.f and i.occurred_at < p.t
   and i.status not in ('duplicate', 'rejected')
   and (p_locality is null or i.locality_code = p_locality)
   and (p_category is null or i.category = p_category)
  group by p.ord, p.period
  order by p.ord
$$;

create function public.tool_recurring_locations(
  p_from timestamptz default null, p_to timestamptz default null, p_min int default 3,
  p_category text default null)
returns table (match_type text, label text, locality_code smallint, locality_name text, incident_count bigint,
               lat double precision, lng double precision, first_at timestamptz, last_at timestamptz,
               incident_ids uuid[])
language sql stable set search_path = '' as $$
  with base as (
    select i.id, i.locality_code, i.location_description as descr, i.lat, i.lng, i.occurred_at
    from public.incidents i
    where public.has_permission('ask_agent')
      and i.status not in ('duplicate', 'rejected')
      and (p_category is null or i.category = p_category)
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

-- Also returns the category so a proposal carries it.
create function public.tool_candidate_areas(
  p_from timestamptz, p_to timestamptz, p_dow smallint, p_min int default 3, p_category text default null)
returns table (label text, locality_code smallint, locality_name text, category text, total_count bigint,
               evening_count bigint, weekday_evening_count bigint, recent_count bigint,
               lat double precision, lng double precision, last_at timestamptz, incident_ids uuid[])
language sql stable set search_path = '' as $$
  select x.descr, x.locality_code, l.name, x.category, count(*),
         count(*) filter (where x.hr between 16 and 19),
         count(*) filter (where x.hr between 16 and 19 and x.dow = p_dow),
         count(*) filter (where x.occurred_at >= p_to - interval '30 days'),
         avg(x.lat), avg(x.lng), max(x.occurred_at), array_agg(x.id order by x.occurred_at desc)
  from (
    select i.id, i.locality_code, i.category, i.location_description as descr, i.lat, i.lng, i.occurred_at,
           extract(hour from i.occurred_at at time zone 'America/Bogota')::int as hr,
           extract(isodow from i.occurred_at at time zone 'America/Bogota')::int as dow
    from public.incidents i
    where public.has_permission('ask_agent')
      and i.status not in ('duplicate', 'rejected') and i.occurred_at >= p_from and i.occurred_at < p_to
      and (p_category is null or i.category = p_category)
  ) x
  join public.localities l on l.code = x.locality_code
  group by x.descr, x.locality_code, l.name, x.category
  having count(*) >= p_min
  order by 6 desc, 5 desc, 8 desc, 1
  limit 5
$$;

-- ───────── 9. Privileges ─────────
revoke execute on function
  public.current_app_role(), public.has_permission(text), public.can_access_locality(smallint),
  public.can_access_category(text), public.can_access(smallint, text), public.shares_locality_with(uuid),
  public.escalate_recommendation(uuid, text),
  public.tool_incidents_by_locality(timestamptz, timestamptz, text),
  public.tool_time_distribution(smallint, timestamptz, timestamptz, text),
  public.tool_period_comparison(smallint, timestamptz, timestamptz, timestamptz, timestamptz, text),
  public.tool_recurring_locations(timestamptz, timestamptz, int, text),
  public.tool_candidate_areas(timestamptz, timestamptz, smallint, int, text)
  from public, anon;
grant execute on function
  public.current_app_role(), public.has_permission(text), public.can_access_locality(smallint),
  public.can_access_category(text), public.can_access(smallint, text), public.shares_locality_with(uuid),
  public.escalate_recommendation(uuid, text),
  public.tool_incidents_by_locality(timestamptz, timestamptz, text),
  public.tool_time_distribution(smallint, timestamptz, timestamptz, text),
  public.tool_period_comparison(smallint, timestamptz, timestamptz, timestamptz, timestamptz, text),
  public.tool_recurring_locations(timestamptz, timestamptz, int, text),
  public.tool_candidate_areas(timestamptz, timestamptz, smallint, int, text)
  to authenticated;
