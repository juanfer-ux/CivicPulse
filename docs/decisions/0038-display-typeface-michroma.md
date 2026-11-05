# 0038: display-lg and display use Michroma; Sign in colors and logo follow Figma

**Status:** Accepted (partly replaces [0036](0036-display-typeface-science-gothic.md))   **Date:** 2026-11-03

## Context
The owner changed the display styles in Figma: `display-lg` is now Michroma Regular 48 / 56 (spacing 0) and `display` is Michroma Regular 20 / 42 (spacing +2 %). `display-sm` followed on 2026-11-05 (Michroma 20 / 32, +2 %); no screen uses it. The Sign in screen changed with them.

## Decision
- Michroma (Google Fonts, OFL-1.1) comes from `@fontsource/michroma`, one weight (400). `--font-display` is Michroma for all three display styles. Science Gothic and its package were removed on 2026-11-05.
- Sign in: headline `foreground` (was `brand-primary`) in two lines as in Figma, subtitle `title-regular` (was `title` at 500), card title `display` in `brand-primary` (Set up your account: `foreground`).
- Logo: 48 px mark with a 13.24 px gap and a 196.1 x 14.9 wordmark on desktop, 43.5 / 12 / 177.8 x 13.5 on phones; rings, disc and wordmark `brand-primary`, star `neutral-700`. One logo component in Figma and one mark file in code (`logo-mark.svg`, cropped to the ring), used at every size, the sidebar and the phone top bar included.

## Consequences
One more font file loads on the auth screens (Michroma is wide, so long titles take more room). Science Gothic is gone, so nothing unused loads.
