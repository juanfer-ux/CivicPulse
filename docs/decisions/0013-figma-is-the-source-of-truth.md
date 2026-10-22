# 0013: Figma is the source of truth for the design
**Status:** ✅ Accepted   **Date:** 2026-10-21

## Context
Code and Figma had drifted: the code kept stock shadcn sizes (32 px controls, large radius, Tailwind text sizes) while Figma specifies 36 px controls, 4 px radius and nine named text styles.

## Decision
When code and Figma disagree, **Figma wins**. Values are read from Figma into `src/index.css` and `src/components/ui/*`, and [design-system/](../design-system/README.md) records them with a status per component. The Figma file mirrors shadcn/ui's structure and token names, so the mapping is one to one.

## Consequences
- ✅ One reference for designers and developers; the app can be checked by measuring against Figma.
- 🟥 Figma is missing components the code already has (sidebar, selects, users table, side panels); they are added to Figma next, so for now those follow the same tokens and are marked ⬜ in the document.
- 🟥 Any change starts in Figma, or is announced in the design document at the same time.
