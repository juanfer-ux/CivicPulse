# 0049: agent-offered modules, a right-side dock and a Modules library

**Status:** Accepted, first build behind `/?modules=1` (2026-11-09): dock, zones, sidebar Modules section, Numbers and Timeline modules; the agent's offer, the Answer chart module, saving and phones are still to build   **Date:** 2026-11-09

## Context
While investigating (for example recurring parking obstruction) the owner wants the agent to offer a ready-made panel, such as a timeline of the occurrences, that the operator drags to the side of the map to decide with it, and later saves and reuses without the agent. It is like a mod in Claude, offered by the agent from the case. The front end and the database must not break.

## Decision
- **The agent picks a prebuilt module; it never generates UI or numbers.** A module is a type plus settings (which recurrence, which answer), rendered by a registered component made from the design system (first three: Recurrence timeline, Numbers, Answer chart). The offer is a deterministic suggestion the person accepts (`docs/ai-agent.md`: the agent recommends, a person decides; all numbers come from SQL).
- **Read-only.** A module shows data, evidence and the synthetic-data note. It makes no decision, link or status change.
- **Docking zones, not a stack (owner, 2026-11-09, layout 2 of `/#dock-zones`):** while a module is dragged the screen shows docking zones of different ratios and places: two taller zones in a **right column** (4:3 and 4:4) and a wide **4:2 strip along the bottom** of the map. Only the zones the module supports light up; its first-choice zone is marked **Suggested** (the agent's offer uses the same hint: a busy recurrence's timeline goes to the wide strip). A module takes the shape of the zone it is dropped in; the operator does not pick a ratio afterwards. The right column pushes the map content through `--dock-w` inside the shared `.map-col` rule (like the agent rail); every floating panel moves together and none gets its own width.
- **Drag and drop with pointer events** (no new dependency, works on touch), plus an "Add to side panel" button as the keyboard and phone path.
- **Saved modules live in the browser only, per user** (`modules:v1:<user id>`), as type + settings. **No database change, no migration, no RLS change.** A later owner-only table is an additive upgrade.
- A **Modules** section in the sidebar sits **right below the Explore row**, above Recurrences (owner, 2026-11-09), and lists the saved and the built-in modules; dragging one onto the open recurrence or incident docks it, without the AI. A module only docks on a target it accepts (a recurrence module does not dock on an incident).
- **Shapes:** 4:4 (square), 4:3 and 4:2 (wide and short) are ratios of a zone's width. Each module lists the shapes it supports (timeline 4:2, 4:3, 4:4; numbers 4:3, 4:4; answer chart 4:3, 4:2) and its content re-lays out for the zone it gets (the timeline: 4:2 thin lanes; 4:3 labelled lanes with counts; 4:4 the same plus the list of occurrences), with container queries on the same components. A zone holds one module; dropping on an occupied zone replaces it.
- **A module shows the data of the case it is on** (recurrence or incident). A recurrence module only docks on a recurrence.
- **Follow or stay (owner, 2026-11-09):** a gear in the sidebar's Modules title row opens a small menu (the look of the view menu) with two choices: **Follow the open case** (the dock stays and shows whichever case is open; the default) or **Stay with each case** (each module keeps the case it was placed on and shows only there). Chosen from `/#module-options` (a gallery kept local).
- Built behind a `?modules=1` switch, in phases, Figma first.
- **Open:** with a recurrence open, the bottom of the map already holds its own history cards (the timeline card and the left column); the 4:2 strip has to share or move above them. To settle in Figma before building.

## Consequences
Everything is additive and reversible. The browser-only library does not sync across devices and is per user on a shared computer. Phones need their own design (modules stacked in the bottom sheet, the library as a list with "Add"), to be agreed before building.
