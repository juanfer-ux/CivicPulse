# 0015: The palette is 13 colors
**Status:** ✅ Accepted   **Date:** 2026-10-21

## Context
The design tokens held 39 colors that came to 20 distinct values, 15 of them greys. Fourteen tokens were never used (chart, most sidebar variants, a few foregrounds). Several greys differed by 1.1:1 contrast or less (for example `#D3D3D3` and `#DCDCDC`), and the map and status dots repeated hex values in code. Error text used two colors; one of them, dark red `#8B0F0F`, has a 1.8:1 contrast on our dark surfaces.

## Decision
Keep **13 colors** (8 neutrals and 5 colored, listed in [design-system.md](../design-system.md#23--colors-dark-theme-13-in-total)). Token names stay because shadcn expects them, but they alias the 13. Unused tokens are deleted. All error text uses `incident`. Code reads colors from tokens (`token()` helper), never from hex literals. The main button changes from `#D3D3D3` to `#DCDCDC` (barely visible).

## Consequences
- ✅ Simpler to maintain; one place to change a color; errors readable everywhere.
- 🟥 Figma still has the old variables; they are reduced in the Figma step, since Figma is the source of truth ([0013](0013-figma-is-the-source-of-truth.md)).
