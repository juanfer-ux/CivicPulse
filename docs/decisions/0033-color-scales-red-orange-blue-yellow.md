# 0033: Red, orange, blue and yellow get 100–900 scales (55 colors)
**Status:** Accepted   **Date:** 2026-10-31

## Context
Indigo already had a 100–900 scale (decision 0028). The owner asked for the same for the other four hues, keeping each color's existing 400.

## Decision
- `red`, `orange`, `blue` and `yellow` each get nine steps, 900 (darkest) down to 100 (lightest). The **400s are unchanged**: red `#EE8688`, orange `#FF9F50`, blue `#495C8B`, yellow `#FFEE6C`.
- The other steps keep each hue and are made around the 400 (lightness from near-white at 100 to near-black at 900, chroma easing at both ends).
- `amber-400` and `coral-400` were removed on 2026-11-01 (owner): everything that used coral now uses `red-300` and everything that used amber uses `yellow-300`. The palette is now 55 colors, in the Figma **Colors** collection and in `src/index.css`.
- On the Foundations page, the Colors frame has one section each for Indigo, Red, Orange, Blue and Yellow.

## Consequences
- ✅ Every hue has room for borders, fills and text steps when needed.
- 🟨 The new steps are not used on screen yet.
- ✅ In Figma every scale runs 900 down to 100 in one block (checked 2026-11-01). The plugin cannot reorder variables, so the four 400s were dragged into place by hand in the Variables panel.
