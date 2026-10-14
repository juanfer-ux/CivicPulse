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
Phase 2 foundation done: scaffold, shadcn/ui, tokens, Supabase schema + RLS applied, auth gate. Synthetic seed: `supabase/seed/synthetic_incidents.sql` (500 incidents, re-runnable, run in the SQL editor). Next: MapLibre dashboard.
