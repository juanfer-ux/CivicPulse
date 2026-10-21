# 0012: DM Sans from Google Fonts, served from our own site
**Status:** ⚪ Replaced by [0014](0014-inter-font.md) (2026-10-21)   Replaced [0006](0006-gilroy-fonts-in-repo.md).

## Context
The brand font was Gilroy, a licensed font whose files sat in the public repo with the licence unconfirmed. The owner switched the brand font to **DM Sans**, which is open source (Google Fonts) and is already the font in the Figma file.

## Decision
Use DM Sans, regular weight, optical size pinned at 14 (as in Figma). Install it with the `@fontsource-variable/dm-sans` package so the browser loads the font files from our own site, not from Google, at runtime. Delete the Gilroy files from the repo.

## Consequences
- ✅ No licence risk and no more "licensed font in a public repo" warning.
- ✅ Code and Figma use the same font; no request to Google when a page loads.
- ⚠️ The Gilroy files remain in the git history of the public repo. Removing them from history would need a history rewrite; not done.
