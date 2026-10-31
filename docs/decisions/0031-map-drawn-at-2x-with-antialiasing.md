# 0031: The map is drawn at 2x with antialiasing; one crisp image per marker size
**Status:** Accepted   **Date:** 2026-10-31

## Context
On a 1x screen (devicePixelRatio 1, the owner's 3440×1440 monitor) circles, badges and outlines looked crackled: edges landed between pixels and images were shrunk by a fraction.

## Decision
- `IncidentMap.tsx` creates the map with `canvasContextAttributes: { antialias: true }` and `pixelRatio: Math.max(2, window.devicePixelRatio)`.
- Every marker image (`markerIcons.ts`) is drawn at twice its screen size and added with `{ pixelRatio: 2 }`; there is one image per size and zoom switches between them. `icon-size` stays 1, so no image is ever scaled by a fraction.
- No half-pixel strokes: the problem ring is 1 px at 20 % (same brightness as the Figma 0.5 px at 35 %).

## Consequences
- ✅ Measured on a test map: problem-circle edge roughness fell from about 0.55 px to 0.15 to 0.35 px; plain and icon squares read back identical at five sub-pixel offsets.
- 🟨 The 2x canvas costs more GPU on 1x screens; fine at this data size.
- 🟨 A new marker size needs its own image, not a scale factor.
