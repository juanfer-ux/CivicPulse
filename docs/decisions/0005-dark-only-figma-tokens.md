# 0005: Dark theme only, tokens from Figma
**Status:** ✅ Accepted   **Date:** 2026-10-14

## Context
The product is an operations dashboard in the style of the "Designing AI Products" wireframes (dark screens).

## Decision
One dark theme. Colors, radius and type come from the CivicPulse Figma design system and are mirrored in `src/index.css` with shadcn names plus `ai`, `warning`, `incident`, `inset`.

## Consequences
- ✅ One look to maintain; Figma and code share names.
- ⚠️ No light mode. If needed later, it needs a Figma light theme first.
- ⚠️ Mobile layout is required for every screen (see [design.md](../design.md)).
