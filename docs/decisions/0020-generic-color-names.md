# 0020: Color tokens are named by color, not by use
**Status:** ✅ Accepted   **Date:** 2026-10-23   Refines [0015](0015-thirteen-color-palette.md).

## Context
The 13 colors were named after where they were used (`card`, `sidebar`, `closed`, `incident`…). The names kept drifting from the uses, and the owner wanted universal names.

## Decision
The 13 colors are named by family and lightness in both Figma (Colors collection) and `src/index.css`: `neutral-950 … neutral-300` (darkest to lightest), `indigo-400`, `red-400`, `amber-400`, `coral-400`. The usage names (`background`, `card`, `sidebar`, `foreground`, `incident`…) stay in code as aliases pointing at them, so components, shadcn and the map code do not change. The mapping table is in [foundations.md](../design-system/foundations.md#-colors-dark-theme-13-in-total).

## Update (2026-10-23)
The old `neutral-300` (`#C2C2C7`, `foreground`) became `neutral-200`, and a new `neutral-300` (`#ABABB0`) was added between it and `neutral-400`, so the palette is 14 colors. No component uses the new one yet.

## Consequences
- ✅ A color can change its job without a rename; new work picks a color by lightness.
- 🟨 Figma shows only the generic names; the usage names exist only in code and in the table.
