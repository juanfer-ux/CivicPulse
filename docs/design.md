# 🎨 Design

> **Status:** 🟨 Draft (2026-10-21). 🔐 This repo is public: the Figma link is kept out. Ask the owner for it.

## 🧩 Design system
> 📘 **The detailed spec (tokens, text styles, components, patterns, screens) is [design-system.md](design-system.md).** This page keeps the brand, the rules and the workflow. **Figma is the source of truth** ([decision 0013](decisions/0013-figma-is-the-source-of-truth.md)).

- 🎨 Figma file: **"CivicPulse · shadcn Design System"** (pages: Cover, Foundations, Components, **Screens**, Icons, Archive · earlier concept, Code to Figma).
- Tokens live in `src/index.css` and use shadcn names plus a few extras: `ai`, `warning`, `incident`, `inset`.
- **Dark only.** Main surfaces: background `#151517`, cards `#1C1C1E`, muted text `#A5A5A5`.
- Map point colors: 🟧 needs review, 🩷 validated or in progress, ⬜ closed (grey). See `GROUPS` in `src/lib/incidents.ts`.

## 🔤 Brand
- **Logo lockup:** ring mark plus wordmark, from the Figma sign-in frame. Files: `src/assets/logo-mark.svg`, `logo-wordmark.svg`; component `src/components/Logo.tsx`.
- **Font:** Inter (Google Fonts), served from our own site. See [decisions/0014](decisions/0014-inter-font.md).
- **Basemap:** dark CARTO (OpenStreetMap data); keep the attribution visible.

## 📱 Mobile rule
> **Every screen is designed and captured in both desktop and mobile versions.** (Owner's standing rule.)

| | Desktop (**1,440 px and wider**) | Mobile (**under 1,440 px**) |
|---|---|---|
| Layout | **Sidebar menu on the left**; to its right the map with filters on the left and the agent on the right, floating over it | Slim top bar; map below; **bottom sheet** with tabs **Explore / Investigate** and a collapse button |
| Menu | Sidebar (see below) | Top bar with logo and a menu button; the menu slides in from the left |
| Sizes | Body 13, label 14, controls 36 | **Larger for touch:** body 16, label 16, controls 44 (Figma's Device Mobile mode); see [design-system.md](design-system.md#22--text-styles) |
| Detail | Card under the agent panel | Appears in the sheet; closing returns to the tab |

Reference sizes in Figma: desktop **1440×900**, mobile **390×844**.

> **The switch is at 1,440 px** (owner's decision): the desktop layout needs that much room for the sidebar, filters, map and agent. Any window narrower than that, including tablets and a laptop browser that is not full width, gets the mobile layout. In code it is the `desk:` breakpoint (`--breakpoint-desk: 90rem` in `src/index.css`); the shadcn components keep Tailwind's own `md:`.

## 🧭 Navigation (sidebar)
- **Desktop:** full-height column on the left, **expanded (224 px)** or **collapsed to icons (56 px)** with a Collapse button; the choice is remembered per browser. Top: logo. Middle: **Map**, **Users** (only with the `manage_users` permission). Bottom: Synthetic data note, name and role, Sign out.
- **Phones:** a 49 px top bar (logo, menu button). The menu opens over the screen with a dimmed backdrop; it closes on a menu choice, backdrop tap or Escape. The bottom sheet is unchanged.
- Code: `src/components/Sidebar.tsx` (one menu used by both); layout in `src/App.tsx`.

## 👥 Users screens
- **Users** (Super Admin): table (cards on phones) and a side panel for one person. **Create user** opens a form in the same side panel position (full screen on phones): name, email, role, zones (a dropdown with a checkbox per locality; the same control in the user panel), and for Specialists a checkbox list of categories grouped by specialty. Built in Figma (Screens page).
- **Set up your account**: card like the sign-in card; name and email read-only, then password and repeat. Shown to an invited person until a password is set, and after a "forgot password" link. The sign-in page has a **Forgot password?** link.

## 🧭 Matching Figma exactly
When a Figma frame is the reference, **measure it** (positions and heights relative to the card) and compare with the running app, not just the look. Example: the sign-in card is 362 px tall, with the logo row 40 px above the title.

## 🖼️ Figma ↔ code workflow
1. Change the design in Figma (tokens, a component, or a screen built from components).
2. Read it into code (`src/index.css`, `src/components/ui/*`, then screens) and update [design-system.md](design-system.md) in the same change.
3. Check at 1,440 and 390 by measuring, not only by eye.
4. All ten screens (Sign in, Set up your account, Map, Users, Create user; desktop and mobile) are on the Figma **Screens** page. The **Code to Figma** page keeps flat captures from earlier.

## 🟥 Gaps
See [design-system.md, section 7](design-system.md#7--gaps-and-decisions). Main ones: Figma's Mobile sizes are not in the code, and Code Connect is not available on the current Figma plan.
