# 0038: display-lg and display use Michroma; Sign in colors and logo follow Figma

**Status:** Accepted (partly replaces [0036](0036-display-typeface-science-gothic.md))   **Date:** 2026-11-03

## Context
The owner changed the display styles in Figma: `display-lg` is now Michroma Regular 48 / 56 (spacing 0) and `display` is Michroma Regular 20 / 42 (spacing +2 %). `display-sm` is unchanged (Science Gothic Light 24 / 32) but no screen uses it. The Sign in screen changed with them.

## Decision
- Michroma (Google Fonts, OFL-1.1) comes from `@fontsource/michroma`, one weight (400). `--font-display` is Michroma; `--font-display-alt` is Science Gothic, for `display-sm` only.
- Sign in: headline `foreground` (was `brand-primary`) in two lines as in Figma, subtitle `title-regular` (was `title` at 500), card title `display` in `brand-primary` (Set up your account: `foreground`).
- Logo: 50.8 px mark with a 14 px gap and a 207.4 x 15.75 wordmark on desktop, 43.5 / 12 / 177.8 x 13.5 on phones; rings, disc and wordmark `brand-primary`, star `neutral-700`. The lockup mark art is cropped to the ring (`logo-mark-lockup.svg`).

## Consequences
One more font file loads on the auth screens (Michroma is wide, so long titles take more room). Science Gothic stays installed for a style nothing uses; remove it when Figma drops `display-sm`.
