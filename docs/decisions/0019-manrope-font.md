# 0019: The product font is Manrope
**Status:** ✅ Accepted   **Date:** 2026-10-23   Replaces [0014](0014-inter-font.md).

## Context
The owner did not like Inter for a SaaS platform. We compared Inter, Plus Jakarta Sans, Manrope and Geist on real Civic Pulse screens (Map Header, agent panel, Users table, big numbers) in the gallery, and the owner chose Manrope.

## Decision
Use **Manrope** (Google Fonts, open licence), served from our own site with `@fontsource-variable/manrope`, so no request goes to Google. The `@fontsource-variable/inter` package is removed. Text styles keep their sizes and weights; Figma text styles use Manrope too.

## Consequences
- ✅ A rounder, more distinctive look; Figma has the font built in, so the Gilroy gap closes.
- 🟨 Manrope is a little wider than Inter, so tight spots (badges, table columns, phone widths) need a look.
