# 0043: the Stat Card shows the outline of its locality

**Status:** Accepted   **Date:** 2026-11-07

## Context
A Stat Card gives a locality's count but not how big the locality is. The owner proposed a tiny outline of the locality, only its shape (no names, no streets), on the right of each card, and chose the look in a gallery (`/#locality`) from four looks, three scales and several sizes.

## Decision
- **Look:** a `neutral-300` line with a 10 % `neutral-100` fill (the indigo map look is the other option). **Scale:** Fit (each shape fills its box, so the shape shows, not the relative size). **Size:** 72 px, centered on the right, 8 px from the edge.
- **Data:** `public/bogota-localities.geojson` (OpenStreetMap, ODbL), turned into tiny paths in the browser (`src/lib/localityShape.ts`: flat projection, Douglas-Peucker).
- **Width rule:** the outline shows from about 162 px of card width up; narrower cards keep the whole label (a container query).
- **Figma:** the component set Locality Outline (20 variants) and the Stat Card properties `Outline` and `Show outline`.

## Consequences
- ✅ Each card tells its locality's shape at a glance, with no extra request (the file is cached).
- 🟨 Fit does not show relative size; the gallery has same-scale and same-height modes if that is wanted later.
- 🟨 A long name such as Ciudad Bolívar is cut in a 165 px card.
