# 0018: Select uses Base UI, not the browser list
**Status:** ✅ Accepted   **Date:** 2026-10-23

## Context
The native `<select>` opens the operating system's list (blue highlight on macOS) that CSS cannot style. The owner wants our own list. shadcn offers Select for Radix, Base UI and React Aria; the owner chose Base UI and designed it in Figma (Components, Select Menu).

## Decision
`src/components/ui/select.tsx` wraps `@base-ui/react` Select with our tokens. It replaces all 7 native selects (4 dashboard filters, 3 on the users screen) on desktop and phones. `selectClass` and the `select-chevron` utility are removed.

## Consequences
- ✅ The list looks the same on every system and follows Figma.
- ✅ Keyboard, type-to-jump and screen reader behaviour come from Base UI.
- 🟨 One more dependency (`@base-ui/react`) next to `radix-ui`.
- 🟨 On phones the OS picker wheel is gone; the custom list is used instead.
