# 0048: display typeface is Zalando Sans Expanded

**Status:** Accepted   **Date:** 2026-11-08

## Context
The owner changed the display styles in Figma: display-lg and display moved from Michroma to Zalando Sans Expanded, and asked for display-sm and display-xs to follow.

## Decision
- All four `display-*` styles use **Zalando Sans Expanded** (Google Fonts, OFL-1.1): display-lg ExtraLight 56 / 56 (the owner raised it from 48 in Figma the same day), display ExtraLight 24 / 42, display-sm ExtraLight 20 / 32, display-xs ExtraLight 14 / 20 (Figma names). Letter spacing as before.
- Served from our own site by `@fontsource-variable/zalando-sans-expanded` (variable, weights 200 to 900, about 0.15 MB), the same route as Manrope. `@fontsource/michroma` is removed.
- Display weights have their own offset, `--display-weight-offset: -300` (Manrope keeps `--weight-offset`; -100 and -200 first): the display styles ask for weight 100 and the font starts at 200, so all four draw as ExtraLight, its thinnest. A thinner look needs another font.
- Figma: the four text styles `display-lg`, `display`, `display-sm`, `display-xs` use the family; nothing else in the file needed changes.

## Consequences
Supersedes the font part of [0038](0038-display-typeface-michroma.md) (its Sign in colors and logo decisions stand).
