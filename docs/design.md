# 🎨 Design

> **Status:** 🟨 Draft (2026-10-17). 🔐 This repo is public: the Figma link is kept out. Ask the owner for it.

## 🧩 Design system
- 🎨 Figma file: **"CivicPulse · shadcn Design System"** (pages: Cover, Foundations, Components, Icons, Preview, **Code to Figma**).
- Tokens live in `src/index.css` and use shadcn names plus a few extras: `ai`, `warning`, `incident`, `inset`.
- **Dark only.** Main surfaces: background `#151517`, cards `#1C1C1E`, muted text `#A5A5A5`.
- Map point colors: 🟧 needs review, 🩷 validated or in progress, ⬜ closed (grey). See `GROUPS` in `src/lib/incidents.ts`.

## 🔤 Brand
- **Logo lockup:** ring mark plus wordmark, from the Figma sign-in frame. Files: `src/assets/logo-mark.svg`, `logo-wordmark.svg`; component `src/components/Logo.tsx`.
- **Font:** Gilroy (licensed). See [decisions/0006](decisions/0006-gilroy-fonts-in-repo.md).
- **Basemap:** dark CARTO (OpenStreetMap data); keep the attribution visible.

## 📱 Mobile rule
> **Every screen is designed and captured in both desktop and mobile versions.** (Owner's standing rule.)

| | Desktop (768 px and wider) | Mobile (under 768 px) |
|---|---|---|
| Layout | Filters on the left, the agent on the right, floating over the map | Map on top; **bottom sheet** with tabs **Explore / Investigate** and a collapse button |
| Header | Logo text, "Synthetic data", role, Sign out | Role badge hidden to save space |
| Detail | Card under the agent panel | Appears in the sheet; closing returns to the tab |

Reference sizes in Figma: desktop **1440×900**, mobile **390×844**.

## 👥 Users screens
- **Users** (Super Admin): table (cards on phones) and a side panel for one person. **Create user** opens a form in the same side panel position (full screen on phones): name, email, role, zones, and for Specialists a checkbox list of categories grouped by specialty. Not captured to Figma yet.
- **Choose your password**: card like the sign-in card, shown once after an invitation link.

## 🧭 Matching Figma exactly
When a Figma frame is the reference, **measure it** (positions and heights relative to the card) and compare with the running app, not just the look. Example: the sign-in card is 362 px tall, with the logo row 40 px above the title.

## 🖼️ Figma ↔ code workflow
1. Capture the running app into the **Code to Figma** page (desktop and mobile).
2. Edit in Figma; send me the frame; I measure it and update the code.
3. Captured layers are raw frames, not yet linked to design-system components.

## 🟥 Gaps
| | Gap |
|---|---|
| 🟥 | Signed-in screens (dashboard, Investigate) are **not captured to Figma yet**, desktop or mobile. |
| 🟥 | Users, Create user and Choose-password screens are not captured to Figma yet. |
| 🟥 | Captures are not linked to design-system components. |
| 🟥 | Logo is not used in the app header yet (still plain text). |
