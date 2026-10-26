# 0022: Input borders use neutral-300
**Status:** 🔁 Superseded by [0026](0026-control-border-neutral-400.md)   **Date:** 2026-10-24   Refines [0020](0020-generic-color-names.md).

## Context
The accessibility audit of Sign in ([accessibility.md](../design-system/accessibility.md)) found the field border `#3C3C44` (`neutral-400`) only 1.6 : 1 against the panel; WCAG 1.4.11 asks for 3 : 1 on the edge of a control.

## Decision
The `input` token points at `neutral-300` (`#737381`, 3.8 : 1 on the panel) instead of `neutral-400`. It applies everywhere the token is used: Input, the dropdown triggers, the outline Button and the Role Badge. Because the resting border is now the same color as `ring`, the **focus border** becomes `foreground` (`#C1C1C8`) on inputs, dropdowns and the outline button, and the open-dropdown border too; otherwise focus would show only the 3 px halo (about 1.9 : 1). Other buttons keep the `ring` focus border.

## Consequences
- ✅ Every field edge passes 1.4.11, on Sign in and on the signed-in screens.
- 🟨 `neutral-400` has no usage name in code any more; it stays in the palette and in Figma (the Suggestion border still uses it there).
- ✅ Figma follows (2026-10-24): the Input, Select, outline Button (all states) and Role Badge components use `neutral-300` for the border, and their focus variants use `neutral-100`. Still `neutral-400` in Figma on purpose: the Suggestion border and the Checkbox box. The generic Badge outline variants were left alone (not an `input` use in code).
