# 0006: Gilroy font files live in the public repo
**Status:** ⚪ Replaced by [0012](0012-dm-sans-self-hosted.md) (2026-10-21)   **Date:** 2026-10-15

## Context
Gilroy is the brand font and is licensed. The app loads it from four `.woff` files in `src/assets/fonts/`. The GitHub repository was made **public** on 2026-10-15.

## Decision
Keep the font files in the repo so the app builds and looks right everywhere.

## Consequences
- ⚠️ Publishing licensed font files may break the font's licence terms. The owner has been warned; no confirmation yet.
- 🔄 If the licence does not allow it: remove the files from the repo, keep them local or on Vercel only, and fall back to another font for anyone building from GitHub.
