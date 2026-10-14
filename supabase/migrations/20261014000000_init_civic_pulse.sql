-- Civic Pulse 2.0: initial schema, roles, permissions (RLS) and audit trail.
-- Run once in the Supabase SQL editor. All incident data is SYNTHETIC (see is_synthetic).
-- Permissions are enforced here in the database, not in the UI.

-- ───────── Types ─────────
create type public.app_role as enum
  ('super_admin', 'locality_admin', 'sector_admin', 'specialist_operator', 'general_operator');
create type public.incident_status as enum
  ('received', 'under_review', 'validated', 'rejected', 'duplicate',
   'intervention_proposed', 'intervention_approved', 'intervention_rejected', 'resolved');
create type public.obstruction_subtype as enum
  ('sidewalk', 'pedestrian_access', 'prohibited_zone', 'access_ramp', 'intersection', 'other_public_space');
create type public.vehicle_type as enum ('car', 'motorcycle', 'van', 'truck', 'bus', 'other');
create type public.recommendation_status as enum ('proposed', 'approved', 'rejected');

-- ───────── Reference data ─────────
-- Bogotá's 20 official localities (names and numbers). Boundaries are added later
-- from the official open-data portal; until then maps use markers only.
create table public.localities (
  code smallint primary key check (code between 1 and 20),
  name text not null unique
);
insert into public.localities (code, name) values
  (1, 'Usaquén'), (2, 'Chapinero'), (3, 'Santa Fe'), (4, 'San Cristóbal'), (5, 'Usme'),
  (6, 'Tunjuelito'), (7, 'Bosa'), (8, 'Kennedy'), (9, 'Fontibón'), (10, 'Engativá'),
  (11, 'Suba'), (12, 'Barrios Unidos'), (13, 'Teusaquillo'), (14, 'Los Mártires'),
  (15, 'Antonio Nariño'), (16, 'Puente Aranda'), (17, 'La Candelaria'),
  (18, 'Rafael Uribe Uribe'), (19, 'Ciudad Bolívar'), (20, 'Sumapaz');

-- ───────── Users and permissions ─────────
-- role is NULL until an administrator assigns one: least privilege by default.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_locality_access (
  user_id uuid not null references public.profiles (id) on delete cascade,
  locality_code smallint not null references public.localities (code),
  primary key (user_id, locality_code)
);

-- Only 'parking' is active in the MVP; the column keeps the model extensible.
create table public.user_incident_type_access (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('parking')),
  primary key (user_id, category)
);

-- ───────── Incidents (synthetic) ─────────
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  category text not null default 'parking' check (category in ('parking')),
  title text not null,
  description text not null,
  locality_code smallint not null references public.localities (code),
  lat double precision not null check (lat between 4.4 and 4.9),
  lng double precision not null check (lng between -74.3 and -73.9),
  location_description text not null,
  occurred_at timestamptz not null,
  reported_at timestamptz not null check (reported_at >= occurred_at),
  vehicle_type public.vehicle_type not null,
  license_plate text,                       -- clearly fictional plates only
  obstruction_subtype public.obstruction_subtype not null,
  evidence_metadata jsonb not null default '{}'::jsonb,  -- placeholder metadata, not real photos
  ai_classification text,
  ai_confidence numeric(3, 2) check (ai_confidence between 0 and 1),
  uncertainty_flags text[] not null default '{}',
  validation_status text not null default 'pending'
    check (validation_status in ('pending', 'human_validated', 'human_rejected')),
  status public.incident_status not null default 'received',
  assigned_to uuid references public.profiles (id),
  outcome text,
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now()
);
create index incidents_locality_time_idx on public.incidents (locality_code, occurred_at desc);
create index incidents_status_idx on public.incidents (status);
create index incidents_geo_idx on public.incidents (lat, lng);

create table public.incident_relations (
  incident_id uuid not null references public.incidents (id) on delete cascade,
  related_incident_id uuid not null references public.incidents (id) on delete cascade,
  relation_type text not null check (relation_type in ('duplicate', 'possibly_related', 'same_location')),
  primary key (incident_id, related_incident_id),
  check (incident_id <> related_incident_id)
);

-- ───────── Recommendations, decisions, audit ─────────
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  locality_code smallint not null references public.localities (code),
  title text not null,
  problem text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  evidence jsonb not null,                  -- counts and incident ids from SQL, never from the LLM
  limitations text not null,
  proposed_intervention text not null,
  status public.recommendation_status not null default 'proposed',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Append-only: no update or delete policies exist.
create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations (id),
  decided_by uuid not null default auth.uid() references public.profiles (id),
  decision text not null check (decision in ('approved', 'rejected')),
  explanation text,
  decided_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor uuid default auth.uid(),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ───────── Permission helpers (security definer, fixed search_path) ─────────
create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid()) and is_active
$$;

create function public.can_access_locality(p_code smallint) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    public.current_app_role() = 'super_admin'
    or (
      public.current_app_role() in ('locality_admin', 'specialist_operator', 'general_operator')
      and exists (
        select 1 from public.user_locality_access a
        where a.user_id = (select auth.uid()) and a.locality_code = p_code)
    ), false)
$$;

create function public.can_access_category(p_category text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    public.current_app_role() = 'super_admin'
    or (
      public.current_app_role() in ('locality_admin', 'specialist_operator', 'general_operator')
      and exists (
        select 1 from public.user_incident_type_access a
        where a.user_id = (select auth.uid()) and a.category = p_category)
    ), false)
$$;

create function public.can_decide() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_app_role() in
    ('super_admin', 'locality_admin', 'specialist_operator', 'general_operator'), false)
$$;

-- ───────── Triggers ─────────
-- New sign-ups get a profile with NO role.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nobody can change their own role or activation. Only a super admin, or the SQL
-- editor / service context (auth.uid() is null), may.
create function public.guard_profile_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null
     and public.current_app_role() is distinct from 'super_admin'
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'Only a super admin can change role or activation';
  end if;
  return new;
end $$;
create trigger guard_profile_changes before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- A decision updates the recommendation and records an audit event, atomically.
create function public.apply_decision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.recommendations set status = new.decision::public.recommendation_status
  where id = new.recommendation_id;
  insert into public.audit_events (actor, action, entity, entity_id, details)
  values (new.decided_by, 'decision_' || new.decision, 'recommendation',
          new.recommendation_id::text, jsonb_build_object('explanation', new.explanation));
  return new;
end $$;
create trigger apply_decision after insert on public.decisions
  for each row execute function public.apply_decision();

-- ───────── Row Level Security ─────────
alter table public.localities enable row level security;
alter table public.profiles enable row level security;
alter table public.user_locality_access enable row level security;
alter table public.user_incident_type_access enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_relations enable row level security;
alter table public.recommendations enable row level security;
alter table public.decisions enable row level security;
alter table public.audit_events enable row level security;

create policy "localities readable by signed-in users" on public.localities
  for select to authenticated using (true);

create policy "read own profile or all as super admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.current_app_role() = 'super_admin');
create policy "update own profile name; super admin updates any" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.current_app_role() = 'super_admin')
  with check (id = (select auth.uid()) or public.current_app_role() = 'super_admin');

create policy "read own locality access or all as super admin" on public.user_locality_access
  for select to authenticated
  using (user_id = (select auth.uid()) or public.current_app_role() = 'super_admin');
create policy "super admin manages locality access" on public.user_locality_access
  for all to authenticated
  using (public.current_app_role() = 'super_admin')
  with check (public.current_app_role() = 'super_admin');

create policy "read own type access or all as super admin" on public.user_incident_type_access
  for select to authenticated
  using (user_id = (select auth.uid()) or public.current_app_role() = 'super_admin');
create policy "super admin manages type access" on public.user_incident_type_access
  for all to authenticated
  using (public.current_app_role() = 'super_admin')
  with check (public.current_app_role() = 'super_admin');

-- Incidents are readable only inside the user's locality and category scope.
-- Inserts come from the seed script / future Citizen Agent (service context), never the browser.
create policy "read incidents in scope" on public.incidents
  for select to authenticated
  using (public.can_access_locality(locality_code) and public.can_access_category(category));
create policy "update incidents in scope" on public.incidents
  for update to authenticated
  using (public.can_decide() and public.can_access_locality(locality_code) and public.can_access_category(category))
  with check (public.can_decide() and public.can_access_locality(locality_code) and public.can_access_category(category));

create policy "read relations in scope" on public.incident_relations
  for select to authenticated
  using (exists (select 1 from public.incidents i where i.id = incident_id
    and public.can_access_locality(i.locality_code) and public.can_access_category(i.category))
    and exists (select 1 from public.incidents r where r.id = related_incident_id
    and public.can_access_locality(r.locality_code) and public.can_access_category(r.category)));

create policy "read recommendations in scope" on public.recommendations
  for select to authenticated using (public.can_access_locality(locality_code));
create policy "propose recommendations in scope" on public.recommendations
  for insert to authenticated
  with check (public.can_decide() and public.can_access_locality(locality_code)
              and created_by = (select auth.uid()));

create policy "read decisions in scope" on public.decisions
  for select to authenticated
  using (exists (select 1 from public.recommendations r where r.id = recommendation_id
                 and public.can_access_locality(r.locality_code)));
create policy "decide in scope as yourself" on public.decisions
  for insert to authenticated
  with check (decided_by = (select auth.uid()) and public.can_decide()
              and exists (select 1 from public.recommendations r where r.id = recommendation_id
                          and r.status = 'proposed' and public.can_access_locality(r.locality_code)));

create policy "read own audit events or all as super admin" on public.audit_events
  for select to authenticated
  using (actor = (select auth.uid()) or public.current_app_role() = 'super_admin');
create policy "write own audit events" on public.audit_events
  for insert to authenticated with check (actor = (select auth.uid()));

-- ───────── Bootstrap the first super admin (run manually, once) ─────────
-- 1. Register in the app. 2. In the SQL editor:
--   update public.profiles set role = 'super_admin'
--   where id = (select id from auth.users where email = 'YOUR_EMAIL');
