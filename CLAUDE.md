# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Civic Pulse

Civic Operations Agent prototype for synthetic parking/dumping incidents in Bogotá. All incident data is synthetic — see [README.md](README.md) for setup and current status.

**New session? Read [docs/handoff.md](docs/handoff.md) first** (where we stopped, open items, how we work). Documentation index: [docs/README.md](docs/README.md). Each topic has one document; read the relevant one before changing that area, and update it first.

## Commands

```bash
npm run dev      # Vite dev server (port 5173, or next free one)
npm test         # Vitest unit tests — run once, no watch
npm run lint     # oxlint
npm run build    # tsc -b (type-check) then vite build
```

Run a single test file: `npx vitest run src/lib/agent.test.ts`. Tests live beside the code they cover (`src/lib/*.test.ts`).

After any permission change, also run `supabase/tests/rls_smoke.sql` in the Supabase SQL editor (expect `RESULT PASS 50/50`) — see [docs/testing.md](docs/testing.md).

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
- Publishing and troubleshooting: [docs/deploy.md](docs/deploy.md). Tests: [docs/testing.md](docs/testing.md). Design rules and screen sizes: [docs/design.md](docs/design.md). Design values (tokens, text styles, components, accessibility): [docs/design-system/](docs/design-system/README.md); Figma is the source of truth.

Rules:
- If code and a document disagree, say so and ask the owner. Do not silently pick one.
- Run `supabase/tests/rls_smoke.sql` after any permission change.
- Modules that tests import stay import-free of Supabase/env (CI has no `.env`); see [docs/testing.md](docs/testing.md).
- The repository is public: never put keys, passwords, emails or private links in code or docs.
- **Desktop screens in Figma are always 1880 × 1000 (owner, 2026-11-12).** The platform is mostly used on very large screens, so "desktop" means 1,880 px wide and above, and the other size is tablet (not designed yet; do not touch it until the owner says). Every new or changed desktop screen, frame, mock-up and screen documentation uses 1880 × 1000, never 1440 × 900. Frame names that still say "Desktop 1440" are old names. The code's `desk:` breakpoint (1,440 px) is unchanged for now.
- **No phone, tablet and desktop only (owner, 2026-11-12).** Do not design, build, test or document phone layouts or 390 px checks, and do not change the screens' layout code until the owner says. The existing phone code (bottom sheet, mobile top bar, `max-desk` classes) stays as it is for now; nothing new goes there. How a tablet should look is not designed yet; see docs/design.md.
- Coding follows the **ponytail** rule (the `ponytail` plugin, level `full`, is on in every session). Climb the ladder and stop at the first rung that holds: does it need to exist, is it already in this codebase, standard library, native platform feature, an installed dependency, one line, and only then the minimum new code. No new dependency for what a few lines can do, no abstraction with one user, no speculative extras. Non-trivial logic leaves one small runnable check. Never lazy about input validation, security, data-loss handling, accessibility or anything explicitly asked for. Say "stop ponytail" to turn it off.

## Map column (every floating panel on the map)
- **Everything that floats on the map sits inside one column, at most 2,000 px wide and centered** (owner, 2026-11-09): stat cards, filters, chips, answer banner, Incident and Recurrence panels, history cards, the Recurrence header and left column. One rule in `src/index.css` (`.map-col`, on Dashboard's root) sets `--col-left` and `--col-right`; position a floating panel with `desk:left-(--col-left)` / `desk:right-(--col-right)` and never give it its own max width or centering. The map tools (home, compass, tilt, zoom) and the attribution button follow the column's right edge too (owner, 2026-11-15; before, they stayed 14 px from the map's edge): they line up with the stat cards and the Filters button, also while the Filters panel is open. Details: [docs/design.md](docs/design.md) (Layout).

## Viewports of 1,600 px or below (owner, 2026-11-17)
- The agent panel's maximum is 920 px at 1,600 px or below, 1,100 up to 2,100 and 1,250 above 2,100 (`agentMaxFor`), the elements inside the panel are 720, 760 and 800 px wide at the same three sizes (`--agent-content-w`), and it opens at 920, 1,000 and 1,100 px on every load (`agentDefaultFor`); and the sidebar rule for the filters is no longer tied to this width (see below). Details: [docs/handoff.md](docs/handoff.md).

## Resizing the window (owner, 2026-11-23)
- **Filters collapse the sidebar at any width (owner, 2026-11-23):** opening the filters collapses an expanded sidebar; closing or applying them brings it back, only if the filters were what collapsed it (`Sidebar.tsx`, `stepped`). Before: only at 1,600 px or below with the agent panel open.
- **The sidebar follows the window both ways:** dropping under 1,800 px collapses an open sidebar, and growing back to 1,800 px or more opens it again at its own width (`Sidebar.tsx`, `NARROW` and `auto`). It only reopens if the resize collapsed it: one the person collapsed (or expanded) with the toggle stays as they left it. Details: [docs/handoff.md](docs/handoff.md).

## Charts in the conversation
- **Every chart or graph the agent shows in the conversation is at most `--chart-max-w` wide (480 px, owner 2026-11-15; the text column is 720 px)**, left-aligned under the answer text. One wrapper in `InvestigatePanel.tsx` (`AnswerView`) applies it to every chart type, so a new chart gets it for free; change the number only in `src/index.css`. Details: [docs/design.md](docs/design.md).

## Scrollbars (every scrolling area in the platform)
- One style, **G** (owner, 2026-11-05): a 12 px grab area (owner, 2026-11-12: it was 10 px; the thumb sits 4 px from the edge, not 3) with a round **4 px thumb that grows to 6 px on hover**, `neutral-400` (`neutral-300` on hover), no track, **shown only while that area scrolls** (owner, 2026-11-15; it was always visible): it appears when the wheel or a drag starts in that panel and fades out 0.6 s after the last movement (Radix `type="scroll"`; native scrollbars via `data-scrolling` set in `main.tsx`). Never a different color, width or radius, in any panel, card, list or menu.
- New scrolling areas use the shadcn `ScrollArea` (`src/components/ui/scroll-area.tsx`, G is its default; use `viewportRef` for scroll code and `horizontal` for sideways). **The scrollbar always sits on the edge of its container (the panel or card), never inside a narrower centered column: make the scroll area full width and center the content inside it.** A plain native `overflow-*` area is allowed because `index.css` gives every native scrollbar the same look, but then check it in Chrome and Safari.
- Styles and the reasons: [docs/design.md](docs/design.md) (Scrollbars) and the gallery at `/#scroll`. If you change the style, change `ScrollArea`, the CSS rule in `index.css`, the docs and the gallery together.

## Figma component pages (this project)
- **No hover on the active item (owner, 2026-11-17).** An item that is already active or selected (sidebar row, tab, menu item, list row) never changes on hover: give it the active fill and keep the same fill on hover (`hover:bg-<active>`). Hover applies only to inactive items. Check it on every selectable list you build or touch, in code and in Figma (no hover variant for the active state).
- **Check strokes in detail (owner, 2026-11-27).** Whenever there is a stroke, read **Inside stroke: Included / Excluded** (`strokesIncludedInLayout`), stroke align and weight, on the instance being implemented (it can override the component). Included = CSS border plus the same padding; Excluded = subtract the border width from the padding (or use an inset ring). Compare the sizes.
- Components live on the five family pages (Actions & inputs, Data display, Navigation & layout, Map & agent, Auth & brand), grouped under the separator page `——— Components ———` (index in [docs/design-system/README.md](docs/design-system/README.md)); frames are laid out in one horizontal row.
- **Every component family page has the background `#3D3D43`** (the pages between the `——— Components ———` separator and Screens), existing and any new one. When creating a components page, set it right away.

- **Every screen is auto layout from the root to the deepest frame** (global rule, owner 2026-11-12; see `~/.claude/CLAUDE.md`). When you touch a Figma screen, make it so in the same change, and size desktop screens 1880 × 1000. When a screen changes size, fill the new space everywhere (see the global rule): no empty strips, no overlaps, backgrounds extended. "Ignore auto layout" only for background layers like the map placeholder; foreground panels go inside auto-layout boxes.

## Agent panel changes (this project)
- **Whenever the owner mentions adjustments to the agent panel (owner, 2026-11-23), check its whole subtree in Figma, not only the panel frame:** Alert and Summary row, Dashboard, the modules (Welcome_Module, CatchUp, Worth-Investigating), **the Suggestion cards and the Suggestion modules (they are children of the agent panel)**, Chat Area and Composer. Compare alignment and sizing too (auto layout primary axis MIN / CENTER / MAX, Fill / Hug / Fixed), not only sizes and padding: the Dashboard is bottom-aligned, which was missed once. Code: `AgentHome.tsx`, `InvestigatePanel.tsx`, `Composer.tsx`, `ui/alert.tsx`; write the result in docs/handoff.md.

## Figma text styles (every project)
- **Keep style families together, in order.** The text styles list is grouped by family, biggest to smallest, and each variant sits right next to its base: `title`, `title-regular`, `subtitle`, `subtitle-regular`, `subtitle-strong`, `label`, `label-regular`, `meta`, `meta-medium`, `caption`, `caption-medium`, `caption-strong`. When creating a style, put it next to its family right away (`figma.moveLocalTextStyleAfter(style, base)`), never leave it at the end of the list. Re-check the order after every style change, in Figma and in the docs table.

## Color rules (every project)
- Neutrals are always `neutral-100` … `neutral-900`, 900 = darkest. Never 950, 850 or other in-between steps.
- Color variables are always ordered from the biggest to the smallest (neutral-900, 800, 700 … 100, then accents). On every color change, re-check this order in code, docs and Figma (`collection.variableIds`).
