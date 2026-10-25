# 0023: Every input has a visible label above it
**Status:** ✅ Accepted   **Date:** 2026-10-24

## Context
On Sign in and Set up your account the placeholder was the only label, and it disappeared while typing (WCAG 3.3.2). The Create user form already had labels above its fields.

## Decision
Every text input gets a visible label above it: a wrapping `<label className="flex flex-col gap-1.5 text-label">`, which also names the field for assistive technology (no separate `aria-label`). The placeholder stays, but only as an example hint (`you@example.com`, `At least 8 characters`), never as the name. Applied to Sign in, Set up your account, Create user, the Users search box and the filter dropdowns (Locality, Category, Status, Period, Role). **The agent's message box is the exception**: a label above a chat box eats space and reads oddly, so it keeps its hint as the instruction and its hidden accessible name ("Investigate and Ask").

## Consequences
- ✅ The name stays on screen while typing; the rule "at least 8 characters" is visible before typing.
- 🟨 Each field is about 24 px taller, so the Sign in and Set up your account cards grow.
- ✅ Figma follows (2026-10-24): both Auth Card variants (`sign-in`, `set-up`) use the existing **Form Field** component (label above, 6 px gap) instead of bare Inputs, with 16 px between fields and the example hints; the Sign in desktop and phone frames and the Set up your account phone frame update through the component. The Form Field component now hugs its height (it was a fixed 60 px that clipped the control). The Set up your account desktop frame in Figma is still empty.
