-- Evidence media (photos and videos) per incident.
-- One row per file. The file itself will live in a private Supabase Storage bucket ('incident-evidence');
-- storage_path points to it. While no file exists the row is a placeholder (is_placeholder = true,
-- storage_path null) and the UI shows a placeholder tile.
-- The future Citizen Agent inserts rows from a service context (never the browser); the web app only reads.
-- Access follows the incident: you see media only for incidents you may see (RLS).

create type public.media_kind as enum ('photo', 'video');

create table public.incident_media (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  kind public.media_kind not null,
  storage_path text,
  mime_type text,
  duration_seconds int check (duration_seconds > 0),   -- videos only
  captured_at timestamptz,
  is_placeholder boolean not null default true,
  created_at timestamptz not null default now(),
  check (is_placeholder or storage_path is not null)
);
create index incident_media_incident_idx on public.incident_media (incident_id);

alter table public.incident_media enable row level security;

create policy "read media of incidents in scope" on public.incident_media
  for select to authenticated
  using (exists (select 1 from public.incidents i
                 where i.id = incident_id
                   and public.can_access_locality(i.locality_code)
                   and public.can_access_category(i.category)));
