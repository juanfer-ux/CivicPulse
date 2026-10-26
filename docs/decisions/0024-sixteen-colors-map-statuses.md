# 0024: The palette is 16 colors; the map shows four statuses
**Status:** ✅ Accepted   **Date:** 2026-10-26   Extends [0015](0015-thirteen-color-palette.md)

## Context
Map dots had three groups (Needs review, Validated / in progress, Closed). The owner chose four plain statuses in Figma: Pending, Reviewing, Approved, Rejected. "Community validation" (seen in the city's ATULAA map) is not a status for us: finding patterns across reports is the agent's job.

## Decision
Four statuses, one word each, grouped from the nine database states (see [incident-lifecycle.md](../incident-lifecycle.md)). Colors: Pending new `yellow-400` `#FFEE6C`, Reviewing new `orange-400` `#FF9F50`, Approved new `blue-400` `#487CFF`, Rejected `red-400` (the colors the owner has in Figma, 2026-10-26). The palette goes from 13 to 16 colors. Map tokens are `--map-pending`, `--map-reviewing`, `--map-approved`, `--map-rejected`.

## Consequences
- ✅ Simpler legend; the database is untouched.
- Yellow, orange and blue are used only by the map, so they have no usage alias. `amber-400` and `coral-400` stay for the UI (`warning`, `incident`).
- ⚠️ Resolved incidents now show as Approved (blue), not gray; duplicates show as Rejected.
