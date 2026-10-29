# 0029: Phosphor icons are the bold weight
**Status:** ✅ Accepted   **Date:** 2026-10-30   Updates [0025](0025-phosphor-icons.md).

## Context
0025 chose the regular weight (fill on the map badges). In use, the small icons (16 to 20 px, lines about 1 px) looked light on the dark surfaces. The owner tried bold on the sidebar plus buttons and the vertical dots and liked it better, then asked for the rest.

## Decision
- Every Phosphor icon is the **bold** weight. It is set once for the whole app with Phosphor's `IconContext.Provider` in `src/main.tsx`, so a new icon is bold without anything extra.
- An icon that asks for another weight keeps it: **fill** on the map badges, the buttons' sparkle and chevron, the "Investigate and Ask" sparkle, the answer banner's chat bubble and the sidebar bullet.
- Figma follows: every Phosphor icon in the Icon grid is rebuilt as the bold shape (the fill ones stay fill). The component names did not change, so every use updated.

## Consequences
- ✅ One consistent, heavier icon weight; one line to change it back.
- 🟨 Bold shapes have a little less empty room inside, so very small icons (12 px in the Stat Card trend strip) look dense.
