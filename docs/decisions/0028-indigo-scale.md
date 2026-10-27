# 0028: An indigo scale like the neutrals (24 colors)
**Status:** ✅ Accepted   **Date:** 2026-10-28   Extends [0027](0027-indigo-700-in-the-palette.md).

## Context
The agent's indigo had only two steps, `indigo-400` and `indigo-700`, and two loose map colors (`#4C49C1`, `#343193`) that sit between them. The owner asked for an indigo palette with levels like the neutrals.

## Decision
- `indigo-100` to `indigo-900`, 100 lightest and 900 darkest (like the neutrals), in the Figma Colors collection, `src/index.css` and the Foundations sheet. The two existing steps keep their values (`indigo-400` `#5C59FF`, `indigo-700` `#272A68`).
- The two loose colors became steps: `#4C49C1` is `indigo-500` and `#343193` is `indigo-600`. `--map-answer-radius-ring` and `--map-locality-line` are aliases of them.
- The new steps (900, 800, 300, 200, 100) were generated: 300 to 100 mix `indigo-400` with white (35 %, 62 %, 85 %), 800 and 900 darken `indigo-700` (65 % and 40 %). They are not used on screen yet; adjust them in Figma and tell the code.

## Consequences
- ✅ One named scale for every agent purple.
- 🟨 Figma cannot reorder variables from the API, so the new steps sit after `yellow-400` in the Colors list, not next to the other indigos.

## Update 2026-10-28
The owner linked the map to existing indigos: `--map-answer-radius` is `indigo-400` (was the loose `#545EFF`) and `--map-locality-line` is `indigo-700` (was `indigo-600`). `indigo-600` is kept in the scale but not used on screen.
