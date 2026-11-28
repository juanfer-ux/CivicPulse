# 0050: icon weight follows the job, informing (solid) or acting (regular)

**Status:** Accepted   **Date:** 2026-11-28

## Context
The app used the regular Phosphor weight almost everywhere. Comparing regular, bold and solid on the Overview card's rows (`/#overview-icons`), the owner preferred solid there.

## Decision
- An icon that only **informs** (nothing happens when you click it) may be **solid** (`fill`).
- An icon that is part of an **action or interaction** (a button, a link, a menu item, anything clickable) is **regular**.
- The icon rows of both Overview cards are solid, 20 px, in `neutral-300` (one step darker than before).
- Bold stays limited to the send arrow and the Stat Trend icons.

## Consequences
- The weight now tells people whether something can be clicked.
- Older places that do not follow the rule yet (solid icons inside some buttons and on the selected sidebar row, listed in [foundations](../design-system/foundations.md)) are unchanged until the owner decides.
- Figma's Overview rows use the same solid icons since 2026-11-28 (`icon/calendar-fill`, `calendar-check-fill`, `user-check-fill`, `motorcycle-fill` on the Icons page).
