# 🎨 Design

> **Status:** 🟩 In use (2026-10-21). 🔐 The repo is public: the Figma link is kept out, ask the owner for it.

**Figma is the source of truth** ([decision 0013](decisions/0013-figma-is-the-source-of-truth.md)). Every value (colors, text styles, sizes, components, screens) is in **[design-system.md](design-system.md)**. This page only keeps the rules and the workflow.

## 🔤 Brand
- **Logo:** ring mark plus wordmark (`src/assets/logo-*.svg`, `src/components/Logo.tsx`).
- **Font:** Inter, served from our own site ([decision 0014](decisions/0014-inter-font.md)).
- **Theme:** dark only ([decision 0005](decisions/0005-dark-only-figma-tokens.md)).
- **Basemap:** dark CARTO (OpenStreetMap data); keep the attribution visible.

## 📱 Mobile rule
> **Every screen exists in a desktop and a mobile version** (owner's standing rule). Figma frames: desktop **1440×900**, mobile **390×844**.

| | Desktop (1,440 px and wider) | Mobile (under 1,440 px) |
|---|---|---|
| Layout | Sidebar on the left; map with filters on the left and the agent on the right, floating over it | Top bar with a menu button; map with a bottom sheet (Explore / Investigate) |
| Sizes | Body 13, label 14, controls 36 | Body 16, label 16, controls 44 (touch) |

The switch is at **1,440 px** (owner's decision): any narrower window, including a half-width laptop browser, gets the mobile layout. In code it is the `desk:` breakpoint in `src/index.css`.

## 🖼️ Figma ↔ code workflow
1. Change the design in Figma (a token, a component, or a screen built from components).
2. Update the code (`src/index.css`, `src/components/ui/*`, then screens) and [design-system.md](design-system.md) in the same change.
3. Check at **1,440** and **390** by **measuring** (heights, radius, text size), not only by eye.

## 🟥 Gaps
Listed in [design-system.md, section 6](design-system.md#6--gaps-and-decisions).
