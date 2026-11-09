# ⏳ Pending: what is still missing

The one list of what is not done yet, grouped by area. [handoff.md](handoff.md) says where we stopped and records every change; this file is only the open work. Update it when something is finished or added (move done items out, do not keep them here). Last review: 2026-11-09, after PR 70 (production on `a229a6b`).

## 🧩 Modules (decision [0049](decisions/0049-agent-modules-dock-and-library.md), behind `/?modules=1`)
- [ ] **Answer chart module:** a module that pins an agent answer's chart (needs the answer's data; the agent offers only the timeline today).
- [ ] **Save modules:** a Save button and a browser-only library per user (`modules:v1:<user id>`); docked modules are in memory now, so a reload clears them.
- [ ] **Drag a saved module onto a case later** (a recurrence or incident) without the agent: depends on saving.
- [ ] **Phone version** of the dock, the areas and the Modules section (the mobile rule: about 390 x 844). Proposal: modules stacked as cards in the bottom sheet, the library as a list with "Add".
- [ ] **Timeline module sizing:** it reuses the full chart, so in a short area it scrolls instead of resizing.
- [x] The `?modules=1` switch is off: modules are on for everyone (2026-11-09); `/?modules=0` hides them.
- [ ] **Check the whole flow on the signed-in map** (Quick question, pick a recurrence, timeline offer, dock): only throwaway pages with made-up data were measured.

## 🎨 Figma
- [ ] **Screens page:** the Map · Recurrence selected · Desktop 1440 screen has the new layout (2026-11-09); the Mobile version and the Incident selected screen are unchanged, and no screen shows docked modules yet.
- [ ] **Not in Figma yet:** the sidebar limits (5 incidents, 2 investigations) in the Sidebar component. Done 2026-11-09: the numbered notes rows (`Answer Notes`), the agent panel width and the rail (`Agent Panel · Collapsed`), the 1,400 px max width (`Map Column`) and the zoom control at the bottom (`Map Zoom` note).
- [ ] **display-xs:** Figma says 16 / 20, the code and docs say 14 / 20. Ask the owner which is right.
- [ ] **Agent panel Conversation variant:** Figma's (solid `neutral-800`, outlined) differs from the code's conversation panel.

## 🗄️ Data and database (nothing changed without the owner's word)
- [ ] **Seed variety:** the reports of one occurrence are all on the same day. Options discussed: spread the times over the 24 h gap, let some occurrences span two days, add a few reports 25 to 40 h later (the "Needs review" cases, which also changes `matching_smoke.sql`). The seed is `supabase/seed/synthetic_problems.sql`; re-running it is an owner action in Supabase.
- [ ] **Photos:** the carousel shows prototype placeholder tiles (`PROTOTYPE_PLACEHOLDERS` in `MediaGallery.tsx`); real files need the future Storage bucket.
- [ ] **Stale migration notes:** [data-model.md](data-model.md) (lines about `20261029000000` and `20261030000000`) says they may not be applied in the shared project; confirm and fix the text.

## 🤖 Agent
- [ ] Follow-ups on a previous answer beyond "show the timeline" (the agent keeps no memory between turns).
- [ ] Mocked conversations (`src/lib/mockChats.ts`) go away when conversations are saved for real; conversations are in memory only.
- [ ] A Quick question for illegal dumping recurrences (only parking has one).

## 🧹 Housekeeping
- [ ] **Local-only files** (not in the repository): the dev galleries (`/#header`, `/#notes`, `/#agent-collapse`, `/#modules`, `/#dock-zones`, `/#module-options`, `/#report-expand`, `/#photo-carousel`) and the Storybook files. Decide what stays local and what becomes a story.
- [ ] **Old merged branches** on GitHub can be deleted on the owner's word.
- [ ] **Docs of the local galleries:** `/#dock-zones` and `/#modules` still show the old fixed-zone layout; redraw with the three areas or retire them.
- [ ] Open questions in [handoff.md](handoff.md) (Open items): sidebar logos, Safari cursor over markers, the real mobile screens signed in.
