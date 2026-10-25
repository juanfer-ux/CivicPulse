# 0021: The Sign in picture is a looping video
**Status:** ✅ Accepted   **Date:** 2026-10-24

## Context
The Auth_Image container in Figma is a still: a dotted "AI aura". The owner wanted it to move, with Bogotá streets and soft light pulses, in black and white only, and nothing that blinks (motion sickness, WCAG 2.3.1 and 2.2.2).

## Decision
The still is the video's own first frame (`src/assets/auth-aura-still.jpg`, about 200 KB): it shows before the video loads, so nothing jumps when it starts, and it is the picture when the system asks for reduced motion. In code the picture is a muted, looping 9 s video (`src/assets/auth-aura.mp4`, 2880 × 2674, about 1.7 MB; rendered large on purpose, the first 1800 px version looked soft on retina screens): a fine flat grid of small dots (11 px apart) lies under the picture but is invisible at rest (the owner found the resting texture too visible): dots show only where one of five small, soft groups passes (about 10 × 5 dots each), glowing in turn, each sweeping across the grid in its own direction and fading in and out (the glow is dim: it tops out at a grey close to `neutral-300`, never white); real main roads of Bogotá (OpenStreetMap) sit behind it, and 14 pulses travel along them, each visible for part of the loop and fading in and out softly. The first version had a waving dotted ribbon; the owner preferred a grid. It does not autoplay when the system asks for reduced motion, and a small pause button lets anyone stop it. It shows at every screen width: the same video, scaled to cover the screen and cropped from the top centre, like a resized desktop window (owner's decision, 2026-10-24; the Figma phone frames show the panel over the flat page because Figma has no video). If autoplay is blocked (iPhone Low Power Mode) the still stays and the button says Play.

## Consequences
- ✅ Motion without flashing; the page works the same with the video off.
- 🟨 Figma still shows the old wave picture; the video and its first-frame still are code-only until the owner wants them there.
- 🟨 The street lines come from OpenStreetMap: keep "© OpenStreetMap contributors" visible somewhere (the pause button's neighbor is too small, so it goes in the page footer or About when we have one).
- 🟨 Phones play the same 2880 px video (1.7 MB). Not tested on a real iPhone yet: if it stutters on older models, render a smaller phone version.
- 🟨 The generator script is not in the repo. To change the video, re-render it and replace the file.
