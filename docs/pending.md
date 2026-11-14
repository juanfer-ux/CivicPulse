# ⏳ Pending: what is still missing

The one list of what is not done yet, grouped by area. [handoff.md](handoff.md) says where we stopped and records every change; this file is only the open work. Update it when something is finished or added (move done items out, do not keep them here). Last review: 2026-11-09, after PR 70 (production on `a229a6b`).

## 🧩 Modules (decision [0049](decisions/0049-agent-modules-dock-and-library.md), behind `/?modules=1`)
- [ ] **Answer chart module:** a module that pins an agent answer's chart (needs the answer's data; the agent offers only the timeline today).
- [x] **Docked layout saved (2026-11-12):** the docked modules and the follow / stay choice save themselves in the browser per user (`modules:v1:<user id>`) and come back on reload.
- [ ] **Save button and library:** named saved modules listed in the sidebar's Modules section (the layout above is automatic; this is the manual library).
- [ ] **Drag a saved module onto a case later** (a recurrence or incident) without the agent: depends on saving.
- [ ] **Timeline module sizing:** it reuses the full chart, so in a short area it scrolls instead of resizing.
- [x] The `?modules=1` switch is off: modules are on for everyone (2026-11-09); `/?modules=0` hides them.
- [ ] **Check the whole flow on the signed-in map** (Quick question, pick a recurrence, timeline offer, dock): only throwaway pages with made-up data were measured.

## 🎨 Figma
- [ ] **Screens page:** the Map · Recurrence selected · Desktop 1440 screen has the new layout (2026-11-09); the Incident selected screen is unchanged (the Mobile versions were removed from Figma, 2026-11-12), and no screen shows docked modules yet.
- [ ] **Not in Figma yet:** the sidebar limits (5 incidents, 2 investigations) in the Sidebar component. Done 2026-11-09: the numbered notes rows (`Answer Notes`), the agent panel width and the rail (`Agent Panel · Collapsed`), the 1,400 px max width (`Map Column`) and the zoom control at the bottom (`Map Zoom` note).
- [x] **Stat Card sizing (2026-11-12):** Fixed 154 px with the 1 px border drawn outside (156 px in all), Value column and Graph both Fill; the code matches.
- [x] **Category photos removed (2026-11-12):** the Recurrences to investigate cards keep a flat 80 px block until the owner adds icons.
- [x] **Agent panel resizable (2026-11-12):** handle inside the panel; minimum from Figma (650 px), maximum the exact middle of the window (right edge at half the window width). Not yet checked in a visible browser pane (the check ran in a hidden one, where the size observer does not fire): drag it once and collapse the sidebar to confirm the maximum follows.
- [ ] **Sidebar collapses under 1,800 px and expands at 1,800 px or more (owner, 2026-11-13):** done in code; Figma has no narrow-window screen yet, and it is not checked in the signed-in app (the test browser was signed out): resize below 1,800 px once to see it.
- [ ] **Active parking marker test (2026-11-13):** the circle shows on hover and while the recurrence is open (code only). If kept, draw those two states in Figma (Recurrence Marker: hover and selected variants).
- [x] **Figma brought up to the code (2026-11-14):** the nine Desktop 1880 screens' background gradient now has `neutral-700` as its middle stop (bound to the variable), and the three category cards in Worth-Investigating_Module read Illegal Dumping (trash), Obstructive Parking (simple car) and Damaged Infrastructure (wrench).
- [ ] **Not in Figma yet (the code is ahead, 2026-11-14):** the Filters side panel (use the Side Panel component, 420 px, as the base) and the Filters / Clear filters buttons on the map; the Recurrences and Incidents chips at the top left of the map screens; the Active parking recurrence hover circle and the Pending parking diagonal car are drawn, the tap-room rule is not a visual. Decide too whether the Filters panel pushes the map (the code's `FILTERS_PUSH`, true) or overlays it.
- [ ] **Road fill color (2026-11-14):** in the map crop the owner measured the road fill is about `#1A1A1D`, close to the background, not the `#2B2B36` of `--map-main-roads`; find which layer paints it (hover helper or the place and zoom) before changing it.
- [x] **display-xs** is 16 / 20 (the owner's Figma, 2026-11-12); code and docs follow.
- [ ] **Agent panel, still placeholders (2026-11-12):** the Data overview numbers and the two small Data cards' charts are Figma placeholders (no real data yet), the third category card (Damaged Infrastructure) has no matching category in the data yet, and the Quick questions row has no arrow buttons (it scrolls sideways).

- [ ] **Phone is out, tablet is not designed (owner, 2026-11-12):** no phone work of any kind. The screens' code is untouched until the owner says; when they do, decide the tablet layout (and whether the 1,440 px `desk:` breakpoint moves), then remove the phone-only code (bottom sheet, mobile top bar, `max-desk` classes, phone sizes in `index.css`) and the Mobile parts of [design-system/components.md](design-system/components.md).

- [x] **Older Figma screens resized to 1880 × 1000 (2026-11-12),** names updated to "Desktop 1880".

- [x] **Auto layout on every Screens frame (owner's rule, 2026-11-12):** all screens now have an auto-layout root and are 1880 × 1000; the only frames left outside auto layout are the map placeholders (decorative roads and dots, an illustration). On the two Map screens that were 1440 (earlier layout, Incident selected), only the map background is absolute; the sidebar, agent panel, cards and the Incident Panel sit in auto-layout boxes. Users, Create user and the two converted Map screens now use the current Sidebar (260 px, collapsed 64 px on Incident selected). The Sidebar instance is 976 to 1000 px high and clips its last section (Investigations); the Figma Sidebar component is 1,100 px, so show it at that height if the full list should be visible. "Map · Desktop 1880 · earlier layout" may duplicate the newer Map · Desktop 1880 screens; delete it if so.

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
- [ ] Open questions in [handoff.md](handoff.md) (Open items): sidebar logos, Safari cursor over markers.
