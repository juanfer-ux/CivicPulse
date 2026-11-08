# 0042: every floating card has the agent panel's look

**Status:** Accepted   **Date:** 2026-11-07

## Context
The Incident Panel was `neutral-700`, the Recurrence Panel and the two history cards `neutral-800`, the recurrence hover card `neutral-800`; each had a 0.5 px outline. The Agent Panel (decision 0039 and the floating layout of 2026-11-06) is `neutral-900` at 90 % with a 16 px background blur and no outline. The owner asked for one look.

## Decision
- The Incident Panel, the Recurrence Panel, the Timeline card, the Occurrences History card and the recurrence hover card use `neutral-900` at 90 %, a 16 px background blur (Figma blur 32) and **no outline**, on desktop. Phones keep the bottom sheet.
- Not part of it: stat cards, filters, chips and the answer banner (controls with their own looks).
- The titles of the two history cards use the sidebar section title style (`caption-medium`, `neutral-200`, sentence case) and the cards are 12 px apart (24 before).
- With an agent answer on the map, the banner keeps the whole top row and an open detail panel sits below it (`--banner-offset`).

## Consequences
- ✅ One look for everything that floats over the map; the map shows through the blur.
- 🟨 Blur costs a little GPU per card; there are at most four on screen at once.
- 🟨 Replaces the fills in decision 0039; its layout (corner, 360 and 400 px) stands.
