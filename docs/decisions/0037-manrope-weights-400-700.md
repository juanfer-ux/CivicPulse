# 0037. Manrope weights follow the Figma names: 400 / 500 / 600 / 700

**Status:** Accepted   **Date:** 2026-11-03

## Context
Manrope glowed on dark screens, so on 2026-10-23 the weights were set below the usual scale (Regular 300, Medium 360, SemiBold 400, Bold 450). The glow was mostly macOS font smoothing; grayscale smoothing is now on (`html` in `index.css`), and the owner saw every font bolder than Figma.

## Decision
Figma name to code weight for Manrope: Regular 400, Medium 500, SemiBold 600, Bold 700 (owner, 2026-11-03). Science Gothic is unchanged (ExtraLight 200, Light 300). Buttons are SemiBold (600).

## Consequences
Code and Figma use the same numbers, so no translation table is needed. Every Manrope text style got heavier on the page; if it feels too heavy on a Retina Mac, change the numbers in `index.css` only (one place).

**Update 2026-11-05:** the grayscale smoothing mentioned above was removed again (text looked soft); the weights stay 400 / 500 / 600 / 700.
