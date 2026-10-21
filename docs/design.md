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

| | Desktop (**1,440 px and wider**) | Mobile (**under 1,440 px**) |
|---|---|---|
| Layout | **Sidebar menu on the left**; to its right the map with filters on the left and the agent on the right, floating over it | Slim top bar; map below; **bottom sheet** with tabs **Explore / Investigate** and a collapse button |
| Menu | Sidebar (see below) | Top bar with logo and a menu button; the menu slides in from the left |
| Detail | Card under the agent panel | Appears in the sheet; closing returns to the tab |

Reference sizes in Figma: desktop **1440×900**, mobile **390×844**.

> **The switch is at 1,440 px** (owner's decision): the desktop layout needs that much room for the sidebar, filters, map and agent. Any window narrower than that, including tablets and a laptop browser that is not full width, gets the mobile layout. In code it is the `desk:` breakpoint (`--breakpoint-desk: 90rem` in `src/index.css`); the shadcn components keep Tailwind's own `md:`.

## 🧭 Navigation (sidebar)
- **Desktop:** full-height column on the left, **expanded (224 px)** or **collapsed to icons (56 px)** with a Collapse button; the choice is remembered per browser. Top: logo. Middle: **Map**, **Users** (only with the `manage_users` permission). Bottom: Synthetic data note, name and role, Sign out.
- **Phones:** a 49 px top bar (logo, menu button). The menu opens over the screen with a dimmed backdrop; it closes on a menu choice, backdrop tap or Escape. The bottom sheet is unchanged.
- Code: `src/components/Sidebar.tsx` (one menu used by both); layout in `src/App.tsx`.

## 👥 Users screens
- **Users** (Super Admin): table (cards on phones) and a side panel for one person. **Create user** opens a form in the same side panel position (full screen on phones): name, email, role, zones (a dropdown with a checkbox per locality; the same control in the user panel), and for Specialists a checkbox list of categories grouped by specialty. Not captured to Figma yet.
- **Set up your account**: card like the sign-in card; name and email read-only, then password and repeat. Shown to an invited person until a password is set, and after a "forgot password" link. The sign-in page has a **Forgot password?** link.

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
| 🟥 | The sidebar layout, Users, Create user and Set up your account screens are not captured to Figma yet. |
| 🟥 | Captures are not linked to design-system components. |
| 🟥 | Logo is not used in the app header yet (still plain text). |
