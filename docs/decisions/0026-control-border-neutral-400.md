# 0026: Control borders use neutral-400 again
**Status:** ✅ Accepted   **Date:** 2026-10-26   Supersedes [0022](0022-input-border-neutral-300.md).

## Context
0022 moved the `input` token to `neutral-300` so field edges reach the 3 : 1 that WCAG 1.4.11 asks for. On 2026-10-26 the owner found the result too bright next to the rest of the dark UI and the map filters. The check showed no passing step darker than `neutral-300` in the palette (`neutral-400` is 1.6 : 1 on the input fill; a custom `#666672` would pass at 3.03 : 1 but is a new color outside the 16).

## Decision
The `input` token points at `neutral-400` (`#3C3C44`) again, for every control: Input, dropdown triggers, outline Button, Suggestion, filter chips and Role Badge. One border color for all controls. The focus border stays `foreground` (see 0022), so focus is still clear. An active or pressed chip keeps its `neutral-300` border.

## Consequences
- 🟨 Text-input edges are below 3 : 1 again (1.6 : 1 on `neutral-600`, 1.7 : 1 on `neutral-800`), a known and owner-accepted gap, listed in [accessibility.md](../design-system/accessibility.md). Buttons, chips and suggestions are identified by their text (8 : 1 or more), so they are not affected.
- ✅ To pass again later: point `input` at `neutral-300`, or at a custom grey around `#666672`.
- ✅ Figma follows: every control border uses `neutral-400`.
