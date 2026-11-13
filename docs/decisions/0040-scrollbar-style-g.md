# 0040: one scrollbar style for the whole platform (style G)

**Status:** Accepted   **Date:** 2026-11-05

## Context
The history cards needed scrolling, and the browser's own bars looked different in every browser and panel. The owner compared eight styles on the occurrences history (gallery `/#scroll`), first liked a 4 px square thumb (E), then chose **G** and asked for it to be always visible, in `neutral-300`, as a rule for every scroll in the platform.

## Decision
- Style G: a 12 px grab area (owner, 2026-11-12: it was 10 px; the thumb sits 4 px from the edge, not 3) with a **round 4 px thumb that grows to 6 px on hover**, `neutral-400` (`neutral-300` on hover), **always visible**, no track.
- The shadcn `ScrollArea` (Radix) has G as its default (it takes `barClassName`, `thumbClassName`, `viewportClassName`, `viewportRef` and `horizontal`). The history cards and the timeline chart use it.
- Every other native scrollbar gets the same look from one CSS rule in `index.css` (`::-webkit-scrollbar` with a 3 px transparent border for the 4 px thumb; Firefox gets `scrollbar-width: thin` in the same color).
- The rule is in the project `CLAUDE.md`. A change to the style changes `ScrollArea`, the CSS rule, the docs, the gallery and Figma together.
- Figma: the `Scroll Bar` component set on Navigation & layout.

## Consequences
One look everywhere. Firefox cannot grow the thumb and shows a thin bar; Safari and Chrome match. The gallery keeps the rejected styles for reference.
