# 🎨 Design

> **Status:** 🟩 In use (2026-10-21). 🔐 The repo is public: the Figma link is kept out, ask the owner for it.

**Figma is the source of truth** ([decision 0013](decisions/0013-figma-is-the-source-of-truth.md)). The detailed spec is in **[design-system/](design-system/README.md)**: [foundations](design-system/foundations.md) (colors, text styles, sizes), [components and patterns](design-system/components.md), and [accessibility](design-system/accessibility.md). This page only keeps the rules and the workflow.

## 🔤 Brand
- **Logo:** ring mark plus wordmark (`src/assets/logo-*.svg`, `src/components/Logo.tsx`).
- **Font:** Manrope, served from our own site ([decision 0019](decisions/0019-manrope-font.md)).
- **Theme:** dark only ([decision 0005](decisions/0005-dark-only-figma-tokens.md)).
- **Incident markers:** (rule, owner 2026-10-26: **the selected incident always shows its pin with the category icon, at any zoom**, even fully zoomed out; layer `incident-selected-pin`, its ring wraps the pin's circle.)
- **Incident markers, detail:** small colored circles up to zoom 14 (a flat 6 px across at every zoom below 12, a flat 10 px from zoom 12; the map opens at zoom 12, owner's choice 2026-10-26); from zoom 14 (`BADGE_ZOOM` in `IncidentMap.tsx`) they become map pins (a circle with a short 8 px point whose tip marks the exact spot; 26 px circle growing to 51 px at zoom 18) with the category's icon inside, like Waze: a car for parking, a trash can for illegal dumping (Phosphor, fill weight). Same four status colors; the icons are Phosphor `fill` (Car, Trash), dark, light on Approved. Rings for the agent's answer and the selected incident grow with them. Built in `src/lib/markerIcons.ts`; a new category needs one icon there.
- **Focus:** while an incident is selected, every other dot or pin is toned down toward the land color (40 % of its own color, `KEEP` in `tokens.ts`; same hue, so the status stays readable) and the selected one keeps its full color and is drawn on top; when the agent shows an answer (and nothing is selected) only the answer's incidents stay bright. Clicking an empty part of the map, or pressing Escape, clears the selection and restores everything. (`useEffect` with `fade` in `IncidentMap.tsx`; owner's idea, 2026-10-26.)
- **Basemap:** dark CARTO (OpenStreetMap data). Place and street names are shown in Spanish (the local names, not the English ones CARTO asks for first; owner, 2026-10-25). The credit is required by their licenses, so it stays on the map as a small dark ⓘ that opens on tap (compact MapLibre control, styled in `src/index.css`). Never remove it.

## 📱 Mobile rule
> **Every screen exists in a desktop and a mobile version** (owner's standing rule). Figma frames: desktop **1440×900**, mobile **390×844**.

| | Desktop (1,440 px and wider) | Mobile (under 1,440 px) |
|---|---|---|
| Layout | Sidebar on the left; the agent panel docked next to the sidebar at full height (543.5 px), and the map to its right with the section header (70 px) on top and filters on the right (288 px) floating over it; the sidebar starts collapsed | Top bar with a menu button; map with a bottom sheet (Explore / Investigate) |
| Sizes | Body 13, label 14, controls 36 | Body 16, label 16, controls 44 (touch) |

On the sign-in screen the desktop version adds the picture, logo and headline on the left; mobile is the card alone.

The switch is at **1,440 px** (owner's decision): any narrower window, including a half-width laptop browser, gets the mobile layout. In code it is the `desk:` breakpoint in `src/index.css`.

## 🖼️ Figma ↔ code workflow
1. Change the design in Figma (a token, a component, or a screen built from components).
2. Update the code (`src/index.css`, `src/components/ui/*`, then screens) and the [design system](design-system/README.md) in the same change.
3. Check at **1,440** and **390** by **measuring** (heights, radius, text size), not only by eye.

## 🖼️ Component gallery
Open `/#components` (no sign-in) to see real components on their own, with their measured height and text style. Resize under 1,440 px for the phone sizes. Code: `src/components/Gallery.tsx`. It only has the Button so far; add a component by adding a section there.

## 🟥 Gaps
Listed in the [design system README](design-system/README.md#-gaps-and-decisions); accessibility gaps in [accessibility.md](design-system/accessibility.md).
