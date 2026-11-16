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
- [ ] **Code ahead of Figma (2026-11-15):** the screen gradient's first stop is `neutral-300` (Figma's nine screens still have `neutral-400`); the answer banner sits under the filters row and the stat cards no longer move down for it (the Map Answer note says otherwise); Clear filters on the map; the two small data cards side by side in the narrow panel (CatchUp is drawn stacked); the collapsed agent panel opening from the sidebar and recurrences dimming while an incident is open (behaviours, no drawing).
- [ ] **Decide (2026-11-15):** the Filter Chip lines are 0.5 px inside in Figma and 1 px in the code (kept at 1 px so far); whether the Count Badge should show in every Filter Chip state, not only the active one.
- [x] **Done in Figma (2026-11-15):** the `Count Badge` component and its use in the chips and the Status Menu rows; the old Filter Chip count and its properties are removed.
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

- **Hover states not in Figma yet (2026-11-15):** the category cards' rollover (neutral-600, filled icon) and the Quick suggestions rows' rollover (icon indigo-200) exist only in code; Figma's `Category_Card2` and `Quick Questions` have no hover state. The key hints are not ⌘ in code (browser keeps ⌘1–5).

- **Tablet (owner, 2026-11-15):** the stat cards are now one row of four with a 28 px number over the map (see the handoff). The rest of the tablet layout is still the mobile column and not designed; Figma has no tablet screen yet.

- **Tablet is in code, not in Figma (2026-11-15):** floating stat cards in one row, the 50 % Explore sheet without tabs (title and chevron on one row), no gradient stroke, 800 px content and composer width. Figma still has no tablet screen; draw one before changing more.

- **Map rotate and tilt buttons not in Figma (2026-11-15):** the compass and tilt buttons under the home button of the map zoom control exist only in code (a try); decide whether to keep them, then draw them in Figma Map Zoom.

- **Modules in Figma (2026-11-15):** done: the Sidebar no longer has the Modules section, and `Recurrence Panel · Header` has the menu row with a Modules button. Not done: Figma has no Incident Panel header (draw it with the same header), the open Modules menu (the drag-or-click list with the follow / stay choice) is not drawn, the old `Sidebar Modules` and `Module Settings Menu` components are now unused (delete when the menu is drawn), and the Numbers module for an incident.

- **Collapsed sidebar width mismatch (2026-11-16):** the owner said the collapsed sidebar is 56 px wide and the code was set to 56 (`COLLAPSED_W` in `Sidebar.tsx`), but the Figma file read at that time still draws 64 px (component variant `collapsed=true`, 665:989, and the sidebar instance on `Map · Incident selected`, 489:2326). Either the owner's Figma edits are not saved in this file, or Figma needs 56. Then: the logo block, avatar and badge offsets for 56 are unverified.
- **Docs and Figma batch of 2026-11-16 (done: items 1 and 2 are in Figma and in components.md; item 3 is code only because Figma has no 3D markers):** (1) the agent panel has a 1 px right border (`neutral-400`) and drops its left border while the sidebar is collapsed (the rail keeps its own 1 px right border, `neutral-700`; no gap between them; the left-border removal is not drawn in Figma); (2) the collapsed sidebar is filled `neutral-900`, like the agent panel (it was `neutral-800`, and the rail's brand block was black); (3) the dumping marker is three objects (concrete bin, trash container, unnamed heap) in a triangle, the cars 1.875x and the pile 1.35x of the original sizes, the report-dot stems 30 % to 0 % and the warning line 0 % to 30 % opacity; (4) the agent-width and chart-cap rules already written above. Not in Figma yet.

- **Not in Figma yet (2026-11-15):** (in Figma now: the sidebar and agent panel flush to the window edges with square corners, the Stat Card without its default outline, the quick-question rows with Shift+number badges, and the dotted agent background) scrollbars shown only while scrolling, the map's entry view (zoom 11, 60°, bearing -28.56°) and the answer view's stems with open pins per location. (The place-name colors are in Figma since 2026-11-15, see below.)

- **3D parking cars (2026-11-15, a try):** if kept: a heading per recurrence, the hover circle back (or gone for good), removing the unused flat car images, a license note for the model in the credits, and the tilt buttons in Figma. If dropped: remove `three`, `carLayer.ts` and `public/models`.

- **Before deploying the 3D markers (2026-11-15):** (1) the dumping model `day_183_garbage` (Sketchfab) has no credit yet: the owner must give its link for the author and license, then add it next to the HR-V credit (map ⓘ and account menu). (2) The Sketchfab page of the HR-V marks it as a reupload: check the original author. (3) Figma has none of this yet: the map rotate/tilt buttons, the 3D car and dumping bag, the floating warning with its 2 px line, the report-dot stems, the flat dots, the Filters counts and disabled options; draw them (Map & agent page) before changing more.
