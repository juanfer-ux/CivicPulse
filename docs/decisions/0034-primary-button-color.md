# 0034: The primary button gets its own color, #22C9A0
**Status:** Replaced by [0035](0035-brand-primary-and-secondary.md) (the same day)   **Date:** 2026-11-02

## Context
The primary button was filled with `neutral-100` (`#C1C1C8`), the same color as normal text, so it could not change without changing the text. The owner wants a color that belongs to the primary button alone. The first pick, `#36E2B8`, was too bright, so it became `#1FD6A9`, and then `#22C9A0`, all on the same day.

## Decision
- A new color `primary-button` = `#22C9A0` in the Figma **Colors** collection (the 56th, last in the collection) and in `src/index.css` as `--primary-button`. Its Figma scopes are frame and shape fills only, so it cannot be picked for text, strokes or effects. Code syntax: `var(--primary-button)`.
- **Hover** is a **white state layer at 50 %** over the fill (Figma `State layer`, on all five sizes of the primary hover): `#87DBC7`. In code it is the derived token `--primary-button-hover: color-mix(in srgb, var(--white) 50%, var(--primary-button))`; it is not a palette color.
- In Figma it is bound to every primary button: the 20 `variant=default` variants of the Button component (every size and state; disabled stays at 50 %) and the two agent-composer send buttons, which had overridden the fill with `white`. Two small variants had hand-typed fills (the new color and a leftover `#33CEA8`); they are bound now. Every instance on the screens follows the component.
- In code only the default Button variant uses it (`bg-(--primary-button) hover:bg-(--primary-button-hover)` in `button.tsx`). `primary` was **not** changed: it also colors link text, and the default Badge uses it as a fill.
- The label and icon on it stay `neutral-900`: 9.1:1 on the fill and 11.9:1 on the hover (white on it would fail).
- The palette page shows it as a last section, "Primary button", and the count is 56. The "main button" wording was removed from the descriptions of `neutral-100` and `white`.

## Consequences
- ✅ The primary button can change color without touching text or anything else.
- ✅ The code now follows Figma's hover (before it was `hover:bg-primary/90`, a rough guess).
- 🟨 Focus (the ring) and disabled (50 % opacity) are unchanged.
- 🟨 The earlier-concept archive page in Figma holds three primary buttons that follow the component, so they show the new color too.
- 🟨 The two hand-built Sign in buttons on the Figma `Code to Figma` page are captures of the old code and were left as they are.
