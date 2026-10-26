# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Civic Pulse

Civic Operations Agent prototype for synthetic parking/dumping incidents in Bogotá. All incident data is synthetic — see [README.md](README.md) for setup and current status.

Documentation index: [docs/README.md](docs/README.md). Each topic has one document; read the relevant one before changing that area, and update it first.

## Commands

```bash
npm run dev      # Vite dev server (port 5173, or next free one)
npm test         # Vitest unit tests — run once, no watch
npm run lint     # oxlint
npm run build    # tsc -b (type-check) then vite build
```

Run a single test file: `npx vitest run src/lib/agent.test.ts`. Tests live beside the code they cover (`src/lib/*.test.ts`).

After any permission change, also run `supabase/tests/rls_smoke.sql` in the Supabase SQL editor (expect `RESULT PASS 35/35`) — see [docs/testing.md](docs/testing.md).

## Architecture (big picture)

The app is **static**: nothing runs server-side except the build. The browser talks to Supabase directly with the signed-in user's own token; Postgres row-level security is the actual access boundary, never the UI. Full diagram and stack table: [docs/architecture.md](docs/architecture.md).

- `src/components/AuthGate.tsx` gates the whole app on `src/lib/auth.tsx` session state: signed out → sign-in/sign-up, signed in with no role yet → "Access pending". Roles are assigned by a Super Admin, enforced by RLS.
- `src/components/Dashboard.tsx` composes the main screen: `IncidentMap.tsx` (MapLibre + CARTO dark basemap, falls back to a list without WebGL2), `InvestigatePanel.tsx`, `Sidebar.tsx`, `UsersAdmin.tsx`.
- `src/lib/agent.ts` is a **deterministic, rule-based planner** for "Investigate and Ask" — no LLM yet. It maps a question to exactly one SQL tool function (defined in `supabase/migrations/20261014010000_investigation_tools.sql`), then templates the answer from the returned numbers. Those tool functions are `SECURITY INVOKER`, so they run as the calling user and RLS limits what comes back — same scope rules as the dashboard queries. Rules for what the agent may/may not do: [docs/ai-agent.md](docs/ai-agent.md).
- Recommendations/decisions are append-only: an operator action creates a `recommendations` row (always `proposed`); approval/rejection is written by a database trigger that also writes the audit event — the browser cannot forge either. See [docs/incident-lifecycle.md](docs/incident-lifecycle.md).
- `supabase/functions/invite-user/` is the **only** server-side code; it's the one place a Supabase admin key is used, invoked by the browser and checked server-side.
- `supabase/migrations/` is the schema, applied in filename order — read [docs/data-model.md](docs/data-model.md) before adding or changing a table.
- Path alias `@/*` → `src/*` (see `tsconfig.app.json`, mirrored in `vite.config.ts`).

- Roles, permissions, scope (localities, incident categories), who may approve, escalate or manage users: [docs/roles-and-permissions.md](docs/roles-and-permissions.md). Source of truth for access.
- Tables and migrations: [docs/data-model.md](docs/data-model.md). AI agent tools and rules: [docs/ai-agent.md](docs/ai-agent.md). States: [docs/incident-lifecycle.md](docs/incident-lifecycle.md).
- Publishing and troubleshooting: [docs/deploy.md](docs/deploy.md). Tests: [docs/testing.md](docs/testing.md). Design rules and mobile rule: [docs/design.md](docs/design.md). Design values (tokens, text styles, components, accessibility): [docs/design-system/](docs/design-system/README.md); Figma is the source of truth.

Rules:
- If code and a document disagree, say so and ask the owner. Do not silently pick one.
- Run `supabase/tests/rls_smoke.sql` after any permission change.
- The repository is public: never put keys, passwords, emails or private links in code or docs.
- Every screen must also have a mobile version (about 390x844); see docs/design.md.
- Coding follows the **ponytail** rule (the `ponytail` plugin, level `full`, is on in every session). Climb the ladder and stop at the first rung that holds: does it need to exist, is it already in this codebase, standard library, native platform feature, an installed dependency, one line, and only then the minimum new code. No new dependency for what a few lines can do, no abstraction with one user, no speculative extras. Non-trivial logic leaves one small runnable check. Never lazy about input validation, security, data-loss handling, accessibility or anything explicitly asked for. Say "stop ponytail" to turn it off.

## Figma component pages (this project)
- Components live on the five `Components · …` pages (index in [docs/design-system/README.md](docs/design-system/README.md)); frames are laid out in one horizontal row.
- **Every `Components · …` page has the background `#3D3D43`**, existing and any new one. When creating a components page, set it right away.

## Color rules (every project)
- Neutrals are always `neutral-100` … `neutral-900`, 900 = darkest. Never 950, 850 or other in-between steps.
- Color variables are always ordered from the biggest to the smallest (neutral-900, 800, 700 … 100, then accents). On every color change, re-check this order in code, docs and Figma (`collection.variableIds`).
