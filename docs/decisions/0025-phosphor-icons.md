# 0025: Icons are Phosphor
**Status:** ✅ Accepted   **Date:** 2026-10-26   Replaces [0017](0017-iconoir-icons.md)

## Context
The map badges need a solid car and a solid trash can. Iconoir's solid set has 288 icons, includes Trash, and has no vehicle at all. Phosphor (already compared in 0017) has every icon in six weights, including fill, under the same name.

## Decision
All icons come from `@phosphor-icons/react`, **regular** weight; **fill** weight for the map badges (car, trash). `iconoir-react` is removed, and so is the non-scaling-stroke rule in `index.css`.

## Consequences
- ✅ One family with an outline and a solid version of everything, so a future "selected" or badge state is a prop (`weight="fill"`), not a new icon.
- 🟨 Phosphor regular is a bit heavier than Iconoir's 1.5 px line; the owner chose it after seeing both side by side (2026-10-26). `light` is available if it feels heavy.
- Figma's Icons page follows.
