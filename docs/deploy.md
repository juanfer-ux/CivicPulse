# 🚀 Deploying Civic Pulse (Vercel + Supabase)

> **Status:** 🟩 In use. Live at https://civicpulse-bogota.vercel.app (auto-deploys on every push to `main`).
> How the pieces fit: [architecture.md](architecture.md).
> The GitHub repository is `juanfer-ux/CivicPulse` (renamed from `CivicPulse-Oct-8` on 2026-10-30; the old address redirects). If a push stops deploying after a rename, reconnect the repo in Vercel: Settings, Git.

Static Vite app + Supabase. Nothing runs on Vercel except the build. All data access goes browser → Supabase with the signed-in user's token, so row-level security is the security boundary ([decision 0003](decisions/0003-database-is-the-security-boundary.md)).

## 🗄️ 1. Supabase (once per environment)
1. Run the migrations in order in the SQL editor: `supabase/migrations/*.sql` ([list](data-model.md#-migrations-run-in-this-order)).
   > 💡 When you copy SQL to the clipboard with `pbcopy`, use `LC_ALL=en_US.UTF-8 pbcopy < file.sql`: without it the accents (á, é, ñ, ·) are pasted as garbage and end up in the database.
2. Seed, both re-runnable: `supabase/seed/synthetic_incidents.sql` (500 parking incidents) and `supabase/seed/synthetic_illegal_dumping.sql` (150 illegal dumping incidents), each with placeholder media, street-based positions, and safe to re-run once the problems layer exists (they skip the `problems_v1` dataset). Run `supabase/seed/synthetic_problems.sql` after them.
3. Auth settings: set **Site URL** and **Redirect URLs** to the Vercel address (keep `http://localhost:5173` for local work).
4. Register in the deployed app, then make the first Super Admin (once):
   ```sql
   update public.profiles set role = 'super_admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```
5. **Deploy the invite function** (once, and after any change to it): Supabase → Edge Functions → create `invite-user`, paste `supabase/functions/invite-user/index.ts`, keep **Verify JWT** on, deploy. Or with the Supabase CLI: `supabase login`, then `supabase functions deploy invite-user`. Supabase supplies the admin key to the function itself; do not copy it anywhere.
6. Run `supabase/tests/rls_smoke.sql` ([how](testing.md)).
7. Check Dashboard → Advisors: only the "permission helper callable by signed-in users" warnings should remain (7 functions: the permission helpers and the escalation function, all intentional), plus the leaked-password warning, which stays while we are on the Free plan ([decision 0016](decisions/0016-auth-stays-simple-on-free-plan.md)).

## ▲ 2. Vercel
1. Import the GitHub repo. `vercel.json` already sets the Vite framework, build command and security headers.
2. **Environment variables** (Production and Preview). Name them exactly:
   | Name | Value | Type |
   |---|---|---|
   | `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Config |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | the full publishable key: `sb_publishable_` followed by letters and numbers | Config |

   - 🔑 Only the **publishable** key belongs in the browser. Never put a secret or service-role key in any `VITE_` variable: those end up in public JavaScript.
   - 🏷️ Choose type **Config**, not Secret. Vercel refuses to save a `VITE_` variable as Secret.
   - 🔁 **Redeploy after any change** to a variable. The values are baked in at build time.
3. Deploy, then run the manual checklist in [testing.md](testing.md).

## 🩺 3. Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Sign-in shows *"String contains non ISO-8859-1 code point"* | The key variable contains a non-ASCII character, usually a literal **"…"** copied from an example | Replace the value with the real key, redeploy. The app now says this in plain words at load time. |
| Page fails with *"Missing VITE_SUPABASE_URL or …"* | A variable is missing in Vercel | Add it, redeploy |
| Saved the variable but nothing changed | No redeploy, or the save did not apply | Check the row says "Added/Updated just now", then **Redeploy** (build cache off) |
| Vercel says *"Remove the public framework prefix…"* | Type is Secret | Delete the variable and add it again as **Config** |
| Blank page after sign-in on one computer | Browser has no WebGL2 (hardware acceleration off) | Turn on "Use graphical acceleration when available" in the browser, restart it. The app shows a list meanwhile. |
| Invitation email does not arrive or *"rate limit"* | Supabase's built-in email sender allows only a few emails per hour | Wait, or connect your own email service (Auth → SMTP settings) |
| Invitation link says it is invalid or expired, or sign-in fails with "Invalid login credentials" right after accepting | The link works only once and the person never set a password | On the sign-in page click **Forgot password?** with that email, and choose a password from the new email |
| Invitation link opens a *"localhost can't be reached"* page, or the sign-in page instead of "Choose your password" | Site URL is still Supabase's default `http://localhost:3000`, or the Vercel address is not in Redirect URLs, so Supabase ignores the app's redirect | Auth → URL Configuration: Site URL = the Vercel address, add it (and `http://localhost:5173`) to Redirect URLs, then send a **new** invitation. Already-sent links keep the old address. An email that was already invited cannot be invited again: use another address or delete the pending user in Auth → Users. |
| Another app answers on `localhost:5173` | A different project's dev server uses the same port | Run this one on another port, for example `npx vite --port 5180` |

## ✅ 4. Checks before every deploy
```bash
npm test         # unit tests
npm run lint
npm run build    # type-checks, then bundles
```

## ⚠️ 5. Known limits and decisions
- 🗺️ **Basemap:** CARTO dark-matter (OpenStreetMap data), no key. Fine for a prototype; for production traffic use a keyed provider (for example MapTiler) by changing `STYLE` in `src/components/IncidentMap.tsx`, and keep the attribution.
- 🔤 **Font:** Manrope is served from our own site by an npm package; nothing to configure ([decision 0019](decisions/0019-manrope-font.md)).
- 🤖 **Mock agent:** no LLM key to configure. A future LLM Edge Function will need its key as a Supabase secret, never in a `VITE_` variable ([ai-agent.md](ai-agent.md)).
- 🛡️ **No Content-Security-Policy header yet:** MapLibre uses blob workers and external tiles, so it needs careful tuning first.
- 🧪 **Data is synthetic**; photos and videos are placeholders.
