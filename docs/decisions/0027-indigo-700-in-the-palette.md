# 0027: indigo-700 joins the palette (17 colors)
**Status:** ✅ Accepted   **Date:** 2026-10-27   Extends [0024](0024-sixteen-colors-map-statuses.md).

## Context
The conversation banner and the answer rings used a loose map color (`#272A68`, `--ai-banner`) that was not a variable in the Figma Colors collection, so the owner could not find it on Foundations. The agent's other purple, `indigo-400`, was also hard to find: its Foundations swatch shows the `ai_gradient` (whose first stop it is), not a flat color.

## Decision
- `indigo-700` (`#272A68`) is a palette color: Figma Colors collection, `src/index.css` (`--indigo-700`) and the Foundations sheet (now "Colors · 17").
- `--ai-banner` is an alias of `indigo-700`; in Figma `map/banner` is an alias too, and `map/answer-ring` points at it. Looks do not change.
- The `indigo-400` swatch keeps the `ai_gradient` (owner's choice); its description now lists its uses: answer bars, agent input ring, panel resize line (`ai-border`).
- Map-only colors stay outside the palette (now "outside the 17").

## Consequences
- ✅ Every color in the agent UI is a named variable in Figma.
- 🟨 Figma cannot reorder variables from the API, so `indigo-700` sits last in the Colors list, not next to `indigo-400`.
