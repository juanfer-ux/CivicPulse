# 0032: The problem marker is option F (neutral circle, status outline, warning triangle)
**Status:** Accepted   **Date:** 2026-11-01

## Context
The first problem marker (decision 0030) was a status-colored circle with a round dark badge. The owner explored four variants side by side (an exploration page, then a temporary `?pv=` switch on the real map) and chose "option F".

## Decision
- A **neutral-700 circle** with a **1 px outline in the problem's status color**, softened by 2 px of blur, and the category icon in **neutral-100**.
- The badge is a **warning triangle** (Phosphor Warning fill, no disc) in the status color with a **4 px neutral-900 outline**; its center sits 6 px outside the circle's edge on the diagonal and is lifted a further 4.5 px, so it overlaps the circle less vertically.
- Sizes are set **in pixels at the farthest zoom** (circle 38, icon 18, triangle 26 at zoom 12.25 and below) and **scaled in proportion** for every closer zoom, to 57 / 27 / 39 from zoom 13.9 (`PROBLEM_FAR`). The 1 px outline and the 6 px gap do not scale.
- The marker is drawn as **29 images, half a base pixel apart**, so the circle grows by at most 1 px at a time; the radius ring gets `circle-blur` 0.01.
- The Problems chip's warning icon is 18 px. Opening or closing an incident or problem flies the whole trip (no jump), and the sidebar changes 1 s later.

## Consequences
- ✅ The marker reads as a warning at a glance and the status is carried by the outline and the triangle; the circle is calm.
- ✅ Zooming no longer pops: the circle never jumps more than 1 px.
- 🟨 More images to build (232 instead of 64); measured at about 0.3 s.
- 🟨 neutral-700 is close to the map background, so the circle mostly shows through its outline and icon.
- 🟨 A 1 px line stays 1 px at every zoom, so it is relatively thicker at the farthest zoom.
