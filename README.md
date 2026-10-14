# Civic Pulse 2.0

Civic Operations Agent prototype for synthetic parking incidents in Bogotá. All incident data is synthetic.

## Stack
React 19, TypeScript (strict), Vite, Tailwind v4, shadcn/ui (Radix, Nova preset), lucide-react. Planned: Supabase (auth, Postgres, RLS), MapLibre, an Edge Function agent.

## Setup
```bash
npm install
npm run dev
npm run build
```

## Auth and roles
Email + password via Supabase Auth. `AuthGate` (`src/components/AuthGate.tsx`) guards the whole app: signed out shows login/sign-up, signed in without an active role shows "Access pending". New sign-ups get a profile with **no role**; only a Super Admin (or the SQL editor) can assign one. Permissions are enforced by RLS, not the UI.

Bootstrap the first Super Admin once: register in the app, then in the Supabase SQL editor:
```sql
update public.profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```
Turn "Confirm email" back on in Supabase Auth settings before deploying.

## Design system
Dark-only. Tokens in `src/index.css` come from the CivicPulse Figma file (Theme, Dark) with shadcn token names plus extensions `ai`, `warning`, `incident`, `inset`. Font: Gilroy (licensed; web files copied from the owner's Portfolio_2026 project).

## Status
Phase 2 foundation done: scaffold, shadcn/ui, tokens, Supabase schema + RLS applied, auth gate. Synthetic seed: `supabase/seed/synthetic_incidents.sql` (500 incidents, re-runnable, run in the SQL editor). Dashboard: MapLibre map (CARTO dark basemap, no key) with status-coloured incident points, locality/status/type/period filters, metrics and an incident detail panel; data comes through RLS. 

## Investigate and Ask (mock mode)
`src/lib/agent.ts` is a deterministic planner: it maps a question to one controlled SQL tool, then templates the answer from the returned numbers (no LLM, nothing invented). Tools are Postgres functions in `supabase/migrations/20261014010000_investigation_tools.sql` (`tool_incidents_by_locality`, `tool_time_distribution`, `tool_period_comparison`). They are `SECURITY INVOKER`, so they run as the signed-in user and RLS limits what comes back. Supported: Investigation A (locality ranking), B (time of day), C (recurring locations, exact vs approximate), D (period comparison), E (candidate area for tomorrow evening). Planned: an LLM Edge Function that replaces only the planner. Every answer shows evidence, limitations and highlights its incidents on the map.

## Recommendations, decisions and audit
Investigation E proposes a candidate area; **Send for human review** creates a `recommendations` row (always `proposed`; the evidence is copied from SQL tool output). Operators approve or reject in the Recommendations tab (a rejection needs an explanation). A decision is append-only and a database trigger atomically updates the status and writes the audit event; audit events are written only by triggers, so the browser cannot forge them. Migration: `supabase/migrations/20261014020000_recurring_and_recommendations.sql`. Nothing is dispatched.

Verified in SQL as the real Super Admin (rolled back): propose, approve, 2 audit events; blocked: forged audit event, insert with status `approved`, insert by a user with no role.

## Before deploying
Turn "Confirm email" on and enable leaked-password protection in Supabase Auth settings. The four remaining Supabase advisor warnings (permission helpers callable by signed-in users) are intentional.

## Evidence media
Each incident has photo and video rows in `incident_media` (`supabase/migrations/20261014030000_incident_media.sql`). Files will live in a private Supabase Storage bucket (`incident-evidence`) and `storage_path` points to them; the future Citizen Agent inserts rows from a service context, the web app only reads (RLS follows the incident's scope). Today every row is a placeholder (no file), shown as a placeholder tile in the incident panel, and the UI says nothing has been visually inspected. To show real files later: create the bucket with read policies mirroring the incident scope, then render signed URLs in `MediaGallery`.
