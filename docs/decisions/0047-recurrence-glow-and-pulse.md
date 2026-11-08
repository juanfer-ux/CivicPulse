# 0047: glows and a pulse on the recurrences and the selected incident

**Status:** Accepted   **Date:** 2026-11-07

## Context
The owner explored glows in a gallery (`/#glow`, plain CSS and SVG, no map cost) and then on the real map, and tuned the values live.

## Decision
- **Inner glow** on every recurrence ring: 16 thin static circle bands inside the ring, easing in toward the edge, in the status color; edge opacity **0.05** (it started at 0.34).
- **Selected incident:** a soft halo (two blurred circles) at **0.06**; the selected recurrence marker has no glow.
- **Pulse:** a very subtle 1 px ring around **Active** recurrences, growing 30 % and fading every 5 s (CSS transform and opacity on DOM markers, so the map is not redrawn); off with reduced motion.
- **Marker:** the disc is `neutral-900` and its inner outline uses the 600 step of its status color; the triangle, ring, fill, glow and pulse keep the 300 steps.

## Consequences
- ✅ Recurrences read as areas without adding weight; the selected incident is still marked.
- 🟨 At 0.05 and 0.06 the glows are faint on a dark map; the values are constants (`PROBLEM_GLOW_ALPHA`, `INCIDENT_GLOW_ALPHA`) to change.
- 🟨 Not drawn in Figma (it is code only).
