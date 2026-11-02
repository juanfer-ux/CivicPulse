# 0035: Brand primary and brand secondary
**Status:** Accepted   **Date:** 2026-11-02   **Replaces:** [0034](0034-primary-button-color.md)

## Context
Decision 0034 gave the primary button a mint color. The owner changed his mind the same day: the primary button goes back to a light neutral, and the colors get brand names so that one change in the variable changes the button.

## Decision
- Two brand colors in the Figma **Colors** collection and in `src/index.css`: `brand-primary` = `#E3E3E7` (the primary button's background) and `brand-secondary` = `#87DBC7` (the primary button's hover). Code syntax `var(--brand-primary)` and `var(--brand-secondary)`. They are palette colors like the others, not aliases (57 colors in total).
- `brand-primary` is the variable that was called `primary-button` in 0034: it was renamed in Figma, so every binding followed.
- The hover stays exactly the same color it had: `#87DBC7`. It is now a flat `brand-secondary` fill on the five primary hover variants; the white 50 % state layer that produced it before is **hidden** in those variants (not deleted). A white layer over `#E3E3E7` would turn the hover gray.
- In Figma both are bound to every primary button: the 20 `variant=default` variants of the Button component (default, focus and disabled use `brand-primary`, hover uses `brand-secondary`; disabled stays at 50 %) and the two agent-composer send buttons. Some default-state variants had been set by hand (a typed `#E3E3E7`, or `white`); they are bound now.
- In code only the default Button variant uses them (`bg-(--brand-primary) hover:bg-(--brand-secondary)`). The derived `--primary-button-hover` token from 0034 was removed. `primary` was **not** changed: it also colors link text and the default Badge fill.
- The label and icon stay `neutral-900`: 15.1:1 on `brand-primary` and 11.9:1 on `brand-secondary`.
- The mint `#22C9A0` (and its earlier tries `#36E2B8` and `#1FD6A9`) is not in the palette.

## Consequences
- ✅ One place to change the primary button's colors, with names that say what they are.
- 🟨 `brand-primary` is almost the same as `neutral-100` / `white`; the button no longer shares its color with the text, which was the point of 0034.
- 🟨 Focus (the ring) and disabled (50 % opacity) are unchanged.
- 🟨 The earlier-concept archive page in Figma holds three primary buttons that follow the component, so they show the new colors too.
- 🟨 The two hand-built Sign in buttons on the Figma `Code to Figma` page are captures of an older version of the code and were left as they are.
