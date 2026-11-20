-- Places around a recurrence (experiment, owner 2026-11-20): what OpenStreetMap lists within 100 m, precomputed so the app never asks a public server.
-- ADDITIVE ONLY: one new table. Read access follows the recurrence (a row is visible if its problem is, the same rule as interventions).
-- NOBODY writes it from the browser (no write policy, no grants); rows come from supabase/seed/recurrence_places.sql, run in the SQL editor.
-- Run in the Supabase SQL editor as postgres, after 20261030000000_problems_layer.sql. Rollback: 20261120000000_recurrence_places_rollback.sql.
begin;

create table public.recurrence_places (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems (id) on delete cascade,
  source text not null default 'osm',
  source_ref text not null,
  kind text not null check (kind in ('shop', 'food', 'education', 'bus', 'other')),
  name text not null default '',
  label text not null default '',
  lat double precision not null,
  lng double precision not null,
  dist_m integer not null check (dist_m between 0 and 500),
  snapshot_at date not null,
  unique (problem_id, source, source_ref)
);
create index recurrence_places_problem_idx on public.recurrence_places (problem_id, dist_m);

alter table public.recurrence_places enable row level security;
create policy "read places in scope" on public.recurrence_places for select to authenticated
  using (exists (select 1 from public.problems p where p.id = problem_id));

-- Supabase grants new tables to anon and authenticated by default: take writes (and everything for anon) away.
revoke all on public.recurrence_places from anon, authenticated;
grant select on public.recurrence_places to authenticated;

commit;
