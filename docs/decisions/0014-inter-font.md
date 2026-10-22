# 0014: Inter from Google Fonts, served from our own site
**Status:** ✅ Accepted   **Date:** 2026-10-21   Replaces [0012](0012-dm-sans-self-hosted.md).

## Context
DM Sans was the first font after leaving Gilroy. The owner did not like it for a dashboard. Inter was tried live, the weights and text sharpness were checked with it, and the owner kept it.

## Decision
Use **Inter** (Google Fonts, open licence), served from our own site with the `@fontsource-variable/inter` package, so no request goes to Google when a page loads. Optical size is automatic; letter-spacing is 0; weights follow the rule in [design-system/foundations.md](../design-system/foundations.md#-text-styles).

## Consequences
- ✅ A font built for dense interfaces, with aligned digits for counts and tables.
- 🟥 Figma still uses DM Sans: the Figma text styles change to Inter, weight and letter-spacing 0 in the Figma step, otherwise code and Figma drift again.
