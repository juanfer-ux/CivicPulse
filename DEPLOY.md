# Deploying Civic Pulse to Vercel

Static Vite app + Supabase. Nothing runs on Vercel except the build; all data access goes browser → Supabase with the signed-in user's token, so RLS is the security boundary.

## 1. Supabase (once per environment)
1. Run the migrations in order in the SQL editor: `supabase/migrations/*.sql` (filename order).
2. Seed: `supabase/seed/synthetic_incidents.sql` (500 synthetic incidents + placeholder media; re-runnable).
3. Auth settings: turn **Confirm email** on, enable **leaked password protection**, and set **Site URL** and **Redirect URLs** to the Vercel domain (and `http://localhost:5173` for dev).
4. Register in the deployed app, then bootstrap the first Super Admin (once):
   ```sql
   update public.profiles set role = 'super_admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```
5. Run `supabase/tests/rls_smoke.sql`; the RESULT line must match the expectations in its header.
6. Check Dashboard → Advisors: only the 4 "permission helper callable by signed-in users" warnings should remain (intentional).

## 2. Vercel
1. Push the repo to GitHub (private; see "Licensed font" below) and import it in Vercel. `vercel.json` already sets the Vite framework, build command and security headers.
2. Environment variables (Production and Preview):
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | the `sb_publishable_…` key |

   Only the **publishable** key belongs in the browser. Never add the secret / service-role key to any `VITE_` variable: those are bundled into public JavaScript. If either variable is missing the app fails at load with "Missing Supabase env vars".
3. Deploy. Smoke test: sign up, get a role, open the map, ask the three suggested questions, send a recommendation for review, approve it, check the audit trail.

## 3. Checks before every deploy
```bash
npm test         # planner and answer unit tests
npm run lint
npm run build    # type-checks, then bundles
```

## Known limits and decisions
- **Basemap:** CARTO dark-matter (OpenStreetMap data), no key. Fine for a prototype; for production traffic switch to a keyed provider (e.g. MapTiler) by changing `STYLE` in `src/components/IncidentMap.tsx`, and keep the attribution.
- **Licensed font:** the Gilroy `.woff` files are committed in `src/assets/fonts`. Keep the repository private, or confirm your licence covers web embedding before making it public.
- **Mock agent:** answers come from deterministic SQL tools and templates; there is no LLM key to configure. The planned LLM Edge Function will need its key stored as a Supabase secret, never in a `VITE_` variable.
- **No CSP header yet:** MapLibre uses blob workers and external tiles, so a Content-Security-Policy needs tuning and testing first.
- **Data is synthetic**; incident photos and videos are placeholders until the Citizen Agent integration (see "Evidence media" in the README).
