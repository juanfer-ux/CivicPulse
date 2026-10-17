# 🚀 Deploying Civic Pulse (Vercel + Supabase)

> **Status:** 🟩 In use. Live at https://civic-pulse-oct-8.vercel.app (auto-deploys on every push to `main`).
> How the pieces fit: [architecture.md](architecture.md).

Static Vite app + Supabase. Nothing runs on Vercel except the build. All data access goes browser → Supabase with the signed-in user's token, so row-level security is the security boundary ([decision 0003](decisions/0003-database-is-the-security-boundary.md)).

## 🗄️ 1. Supabase (once per environment)
1. Run the migrations in order in the SQL editor: `supabase/migrations/*.sql` ([list](data-model.md#-migrations-run-in-this-order)).
2. Seed, both re-runnable: `supabase/seed/synthetic_incidents.sql` (500 parking incidents) and `supabase/seed/synthetic_illegal_dumping.sql` (150 illegal dumping incidents), each with placeholder media.
3. Auth settings: turn **Confirm email** on, enable **leaked password protection**, and set **Site URL** and **Redirect URLs** to the Vercel address (keep `http://localhost:5173` for local work).
4. Register in the deployed app, then make the first Super Admin (once):
   ```sql
   update public.profiles set role = 'super_admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```
5. Run `supabase/tests/rls_smoke.sql` ([how](testing.md)).
6. Check Dashboard → Advisors: only the "permission helper callable by signed-in users" warnings should remain (7 functions: the permission helpers and the escalation function, all intentional), plus leaked-password protection until you enable it.

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
| Another app answers on `localhost:5173` | A different project's dev server uses the same port | Run this one on another port, for example `npx vite --port 5180` |

## ✅ 4. Checks before every deploy
```bash
npm test         # unit tests
npm run lint
npm run build    # type-checks, then bundles
```

## ⚠️ 5. Known limits and decisions
- 🗺️ **Basemap:** CARTO dark-matter (OpenStreetMap data), no key. Fine for a prototype; for production traffic use a keyed provider (for example MapTiler) by changing `STYLE` in `src/components/IncidentMap.tsx`, and keep the attribution.
- 🔤 **Licensed font:** Gilroy `.woff` files are in a **public** repo. See [decision 0006](decisions/0006-gilroy-fonts-in-repo.md).
- 🤖 **Mock agent:** no LLM key to configure. A future LLM Edge Function will need its key as a Supabase secret, never in a `VITE_` variable ([ai-agent.md](ai-agent.md)).
- 🛡️ **No Content-Security-Policy header yet:** MapLibre uses blob workers and external tiles, so it needs careful tuning first.
- 🧪 **Data is synthetic**; photos and videos are placeholders.
