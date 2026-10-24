# 0021: The Sign in picture is a looping video
**Status:** ✅ Accepted   **Date:** 2026-10-24

## Context
The Auth_Image container in Figma is a still: a dotted "AI aura". The owner wanted it to move, with Bogotá streets and soft light pulses, in black and white only, and nothing that blinks (motion sickness, WCAG 2.3.1 and 2.2.2).

## Decision
The still stays the Figma frame and the fallback. In code the picture is a muted, looping 9 s video (`src/assets/auth-aura.mp4`, 1800 × 1672, about 3 MB): a fine flat grid of small dots (11 px apart) lies under the picture but is invisible at rest (the owner found the resting texture too visible): dots show only where one of five small, soft groups passes (about 10 × 5 dots each), glowing in turn, each sweeping across the grid in its own direction and fading in and out (the glow is dim: it tops out at a grey close to `neutral-300`, never white); real main roads of Bogotá (OpenStreetMap) sit behind it, and 14 pulses travel along them, each visible for part of the loop and fading in and out softly. The first version had a waving dotted ribbon; the owner preferred a grid. It does not autoplay when the system asks for reduced motion, and a small pause button lets anyone stop it. Desktop only, like the still.

## Consequences
- ✅ Motion without flashing; the page works the same with the video off.
- 🟨 Figma still shows the still picture; the video is code-only until the owner wants it there.
- 🟨 The street lines come from OpenStreetMap: keep "© OpenStreetMap contributors" visible somewhere (the pause button's neighbor is too small, so it goes in the page footer or About when we have one).
- 🟨 The generator script is not in the repo. To change the video, re-render it and replace the file.
