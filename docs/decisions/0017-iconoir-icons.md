# 0017: Icons are Iconoir
**Status:** ✅ Accepted   **Date:** 2026-10-22

## Context
Lucide, the shadcn default, looked too generic. We compared Phosphor (duotone), Iconoir and Hugeicons on the sidebar and the owner chose Iconoir.

## Decision
All icons come from `iconoir-react` (MIT, 1.5 px line, 24 px grid). `lucide-react` is removed. Sidebar item icons are 20 px; other icons are 16 px (Button default) unless a component says otherwise. The Figma Icons page follows.

## Consequences
- ✅ One icon family with a more distinctive line.
- 🟨 `components.json` still says `lucide`: that only matters if a shadcn component is added with the CLI, which will then bring a Lucide icon to swap.
