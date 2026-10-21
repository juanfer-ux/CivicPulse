# 🎨 Design system

> **Status:** 🟩 In use. Figma and code reconciled on 2026-10-21. 🔐 This repo is public: the Figma link is kept out. Ask the owner for it.
> Where this fits: [design.md](design.md) is the short index (brand, mobile rule, workflow); this document is the **detailed spec**.

## 🗝️ Legend
✅ matches Figma · 🟨 differs or partly done · ⬜ missing in Figma · 🟥 gap to fix · 🟩 working

---

## 1. 🧭 Principles and source of truth
1. **Figma wins.** The Figma file "CivicPulse · shadcn Design System" is the reference. If code and Figma disagree, change the code to match Figma, or change Figma first and then say so here. (Decision [0013](decisions/0013-figma-is-the-source-of-truth.md).)
2. **Built on shadcn/ui.** The Figma components mirror shadcn's structure and the code uses shadcn components (`src/components/ui/`) with Figma's values. Token names are shared on purpose (`--background`, `--card`, `--ring`…).
3. **Dark only.** The Light theme in Figma is a derived check, not shipped ([decision 0005](decisions/0005-dark-only-figma-tokens.md)).
4. **Every screen has a desktop and a mobile version.** Desktop from **1,440 px**, mobile below it; reference frames **1440×900** and **390×844**.
5. **No hard-coded values.** Use the tokens below (`text-body`, `bg-card`, `rounded-sm`…), never a loose `13px` or `#1c1c1e`. **13 colors, no more** (section 2.3).

---

## 2. 🧱 Foundations

### 2.1 🔤 Typeface
| | |
|---|---|
| Family | **Inter** (Google Fonts, open licence); weights per text style (section 2.2) |
| How it is served | From our own site by the `@fontsource-variable/inter` package, so there is no request to Google when the page loads ([decision 0014](decisions/0014-inter-font.md)) |
| Optical size | Automatic: the browser picks the right cut for each size (not pinned) |
| Sharpness | `antialiased` (smooth on Mac), `text-rendering: optimizeLegibility`, `-moz-osx-font-smoothing: grayscale` on the page; no fractional letter-spacing |
| Code | `--font-sans` and the base layer in `src/index.css` |

### 2.2 🔠 Text styles
Use the class in the last column. Each sets size, line height **and weight** together, so a component never needs its own `font-medium`.

| Style | Desktop size / line | Mobile size / line | Letter-spacing | Weight | Use | Class | Figma |
|---|---|---|---|---|---|---|---|
| display | 32 / 32 | 32 / 32 | 0 | 600 | Big numbers on empty or hero states | `text-display` | ✅ |
| stat | 24 / 32 | 24 / 32 | 0 | 600 | Counts in stat cards | `text-stat` | ✅ |
| heading | 20 / 28 | 20 / 28 | 0 | 600 | Page title ("Users") | `text-heading` | ✅ |
| title | 18 / 28 | 18 / 28 | 0 | 600 | Panel and section titles | `text-title` | ✅ |
| subtitle | 16 / 24 | 16 / 24 | 0 | 500 | Card titles | `text-subtitle` | ✅ |
| label | 14 / 20 | **16 / 24** | 0 | **500** | **Buttons, field names, menu items, tabs** | `text-label` | ✅ |
| body | 13 / 22 | **16 / 24** | 0 | 400 | Paragraphs, inputs, table cells | `text-body` | ✅ |
| meta | 12 / 16 | **14 / 20** | 0 | 400 | Secondary info | `text-meta` | ✅ |
| caption | 11 / 16 | **12 / 16** | 0 | 500 | Small tags and badges | `text-caption` | ✅ |

**Desktop is 1,440 px and wider; Mobile is every window narrower than that** (the `desk` breakpoint). The sizes come from Figma's Device collection (Desktop and Mobile modes) and switch through CSS variables in `src/index.css` (`--fs-body`, `--lh-body`, …); the class names do not change. Display, stat, heading, title and subtitle are the same on both.

**Letter-spacing is 0 on purpose** (decided 2026-10-21). Figma's 0.2 and 0.3 px make letters look blurry or uneven on screens without a Retina display; Figma uses 0 too. The brand wordmark in the sidebar keeps its wide spacing.

**Weight rule (decided 2026-10-21):** 600 for headings and numbers, **500 for anything you act on or that labels something** (buttons, links, field names, menu items, badges, table headers, names in a table), 400 for reading text and what you type. Placeholder text is 400.

> ✅ Figma text styles now use Inter with these weights and 0 letter-spacing (updated 2026-10-21), plus an extra style `meta-medium` (12 / 16, weight 500) for table headers.
> ⚙️ `cn()` in `src/lib/utils.ts` knows these names are font sizes. Without that, the class merger dropped `text-label` from every colored button (a silent bug fixed on 2026-10-21, with a test).

### 2.3 🎨 Colors (dark theme): 13 in total
The whole palette is **13 colors** (decision [0015](decisions/0015-thirteen-color-palette.md), 2026-10-21). Every other token name (`primary`, `muted`, `accent`, `border`…) is only an alias that points at one of them, because shadcn components expect those names. Add a new color only if none of these can do the job.

| # | Color | Token (source) | Used for |
|---|---|---|---|
| 1 | `#151517` | `background` | Page; text on the main button |
| 2 | `#1C1C1E` | `card` (also `popover`) | Cards, inputs, panels, dropdown surfaces |
| 3 | `#000000` | `sidebar` (also `inset`) | Sidebar, outline buttons, deepest surface |
| 4 | `#323232` | `secondary` (also `muted`, `accent`, `border`) | Borders, dividers, hover, secondary fills |
| 5 | `#404040` | `input` | Borders of inputs and dropdowns |
| 6 | `#7A7A7A` | `closed` (also `ring`) | Closed incidents, focus ring |
| 7 | `#A5A5A5` | `muted-foreground` | Supporting text, table headers, placeholders |
| 8 | `#DCDCDC` | `foreground` (also `primary`, `accent-foreground`, `secondary-foreground`, `destructive-foreground`) | All normal text, the main button, "white" |
| 9 | `#22253F` | `ai` | Agent surfaces |
| 10 | `#6D79E2` | `ai-border` | Agent accents; map highlight rings |
| 11 | `#8B0F0F` | `destructive` | **Fill** of dangerous buttons and badges only (too dark for text) |
| 12 | `#EF9700` | `warning` | Needs review |
| 13 | `#FFA08F` | `incident` | Validated / in progress, invalid fields and **all error text** |

**Rules**
- Error text is **always** `text-incident` (contrast 8.7:1). Never `text-destructive`: dark red on our dark surfaces is 1.8:1.
- Code that cannot use a CSS variable (the map's paint settings) reads the token with `token('--name')` from `src/lib/tokens.ts`. No color literals in `.ts` / `.tsx` files.
- Map and status colors: 🟧 `warning` needs review, 🩷 `incident` validated or in progress, ⬜ `closed`. See `GROUPS` in `src/lib/incidents.ts`.

> ✅ In Figma, the Dark theme variables were re-pointed so only these 13 colors remain (2026-10-21). The unused variables (`chart-*`, most `sidebar-*`, `*-foreground` extras) still exist there as aliases of these colors, and a `closed` variable was added to match the code. The Light theme is untouched.

### 2.4 📏 Spacing, radius, controls
| | Value | Class |
|---|---|---|
| Spacing | 4 px scale (`spacing × N`) | `p-4` = 16, `gap-3` = 12, `gap-2` = 8 |
| Radius | xs **2**, sm **4**, md 6, lg **8**, xl 12, 2xl 16, full | `rounded-xs` … |
| Control radius | **sm (4 px)** for buttons, inputs, selects, dropdowns | `rounded-sm` |
| Card radius | **lg (8 px)** | `rounded-lg` |
| Badge radius | **xs (2 px)** | `rounded-xs` |
| Control heights, desktop | sm **32**, default **36**, lg **44**; icon 36, icon-lg 44 | `h-(--control-sm)`, `h-(--control-default)`, `h-(--control-lg)`, `size-(--control-icon)`, `size-(--control-icon-lg)` |
| Control heights, mobile (under 1,440 px) | sm **40**, default **44** (touch size), lg **48**; icon 44, icon-lg 48 | same classes: the variables switch at 1,440 px |
| Borders | 1 px, `border` color; inputs use `input` | `border`, `border-input` |

### 2.5 📱 Breakpoint
One switch: **1,440 px** (`desk`, `--breakpoint-desk: 90rem`). At 1,440 and wider: sidebar, floating filters and agent over the map. Narrower: top bar with menu, bottom sheet.

---

## 3. 🧩 Components
Code is in `src/components/ui/` (shadcn) or `src/components/`. "Figma" is the component set name on the Figma **Components** page; every component has a documentation frame with a description and the code file.

### 3.1 shadcn components
| Component | Variants and sizes (Figma) | States | Code | Status |
|---|---|---|---|---|
| **Button** | variant: default, secondary, destructive, outline, ghost, link · size: sm 32, default 36, lg 44, icon 36, icon-lg 44 | default, hover, focus (3 px ring), disabled (50 %) | `ui/button.tsx` | ✅ |
| **Badge** | variant: default, secondary, destructive, outline · size: default 20 px (caption text), lg 30 px (meta text) | n/a | `ui/badge.tsx` | ✅ |
| **Input** | h 36, bg `card`, border `input`, radius sm, body text, px 12 | default, focus, filled, disabled, invalid (`incident`) | `ui/input.tsx` | ✅ |
| **Card** | bg `card`, border, radius lg, padding 16, gap 12; title subtitle, description body; footer actions | n/a | `ui/card.tsx` | ✅ |
| **Separator** | horizontal, vertical | n/a | `ui/separator.tsx` | ✅ |
| **Textarea**, **Skeleton**, **Alert** (default, destructive, ai) | see Figma | n/a | not in code yet | 🟨 |

### 3.2 Components built for the app (all in Figma since 2026-10-21)
| Figma component | What it is | Code |
|---|---|---|
| **Select** (default, focus, filled, disabled, invalid) | Dropdown for one value, styled like Input. Own chevron 16 px, muted, **12 px from the right edge**, 40 px reserved on the right | `selectClass` in `src/lib/ui.ts`, `select-chevron` in `src/index.css` |
| **Multi-select** (closed, open) | Dropdown with a checkbox per option, Select all, Clear. Same chevron as Select | `MultiSelect.tsx` |
| **Checkbox** (checked, state) | 16 px box, radius-xs, with label | native input in `UsersAdmin.tsx`, `MultiSelect.tsx` |
| **Form Field** (default, error) | Label above a swappable control, optional error line in `incident` | inline in `UsersAdmin.tsx`, `AuthPage.tsx` |
| **Status Badge** (pending, active, off, invited) | Person status; Invited is a small text tag | `Badge` variants in `UsersAdmin.tsx` |
| **Sidebar Item** (collapsed, state) | One menu row: icon and label | `NavItem` in `Sidebar.tsx` |
| **Sidebar** (expanded 224, collapsed 56) | Left menu on desktop | `Sidebar.tsx` |
| **Mobile Top Bar** | 49 px bar with logo and menu button on phones | `header` in `Sidebar.tsx` |
| **Logo** | 64 px ring mark + wordmark lockup | `Logo.tsx` |
| **Table Row** (header, row, row-selected; Show invited) | Users table on desktop; columns flexible, Status 150 px | table in `UsersAdmin.tsx` |
| **User Card** | One person on phones | `max-desk` layout in `UsersAdmin.tsx` |
| **Side Panel** (user, create) | 420 px panel (full screen on phones): person editor, invitation form | `UserPanel`, `InvitePanel` in `UsersAdmin.tsx` |
| **Auth Card** (sign-in, set-up) | Centered card: logo, title, form | `AuthPage.tsx`, `SetPassword.tsx` |
| **Filters Card**, **Summary Card** | Map filters; incident count, status legend, top localities | `Dashboard.tsx` |
| **Sheet Tabs** (explore, investigate) | Tab row of the phone bottom sheet | `Dashboard.tsx` |
| **Suggestion**, **Agent Panel** | Suggested question; the Investigate and Ask panel | `InvestigatePanel.tsx` |

Icons added to the Icons page: `icon/map`, `users`, `log-out`, `panel-left`, `menu`, `flask`, and `logo/mark`.

### 3.3 In Figma from the earlier concept (not used by the current screens)
Stat Card, Incident Row, Nav Item (64 px icon rail), Panel Header, Message, Action Card, Map Marker, Incident Radius, Tab Bar, Drawer. Kept for now; prune when you are sure they are not needed.

### 3.4 The Figma file
Pages: **Cover**, **Foundations** (colors, type, radius, spacing, states), **Components**, **Screens**, **Icons**, **Archive · earlier concept** (the old Preview screens), **Code to Figma** (flat captures). Variable collections: Primitives, Theme (Dark and Light), Radius, Spacing, Typography, Device (Desktop and Mobile).

---

## 4. 🧰 Patterns
| Pattern | Rule |
|---|---|
| **Dropdowns** | Same height (36), radius (4) and chevron position (12 px from the right edge) for every dropdown, native or custom. Never use the browser's default chevron: it sits against the border. |
| **Forms** | Field name (`text-label`) above the control; control h 36; error line below in `incident` color; one primary button at the bottom. |
| **Saving feedback** | Changes save immediately; a status line (`role="status"`) says what happened or why it failed in plain words. |
| **Tables** | Header `text-meta` muted, rows `text-body`, whole row clickable; on phones each row becomes a card. |
| **Side panels** | 420 px on desktop, full screen on phones with a Close button. One panel at a time. |
| **Menus** | Sidebar on desktop; on phones a top bar with a menu button and a slide-out that closes on choice, backdrop tap or Escape. |
| **Empty and error states** | Say what is missing and what to do, in one or two sentences; never a blank screen (map without WebGL shows a list). |
| **Status** | Pending (waiting for a role or an invitation to be accepted), Active, Off. |

---

## 5. 🖼️ Screens
All ten are on the Figma **Screens** page, built only from the components above. Mobile frames use the Device collection's **Mobile** mode.

| Screen | Desktop 1,440 × 900 | Mobile 390 × 844 | Figma |
|---|---|---|---|
| Sign in | ✅ | ✅ | ✅ |
| Set up your account | ✅ | ✅ | ✅ |
| Map (filters, summary, agent) | ✅ | ✅ (bottom sheet) | ✅ |
| Users (list, with the person panel open) | ✅ | ✅ (cards) | ✅ |
| Create user (list, with the invitation form open) | ✅ | ✅ (full-screen form) | ✅ |

---

## 6. 🔁 Figma ↔ code workflow
1. Change the design in Figma (tokens, component, screen).
2. Read it into code: tokens go to `src/index.css`, component values to `src/components/ui/*`, then screens use them.
3. Update this document (status columns) in the same change.
4. Check at **1,440** and **390**: measure heights (32 / 36 / 44), radius (4), text sizes, not only the look.
5. Never edit Figma and code at the same time for the same thing; say which one moved first.

---

## 7. 🟥 Gaps and decisions
| | Item |
|---|---|
| 🟩 | Done 2026-10-21: font Inter; weights and zero letter-spacing in Figma; 13-color Dark theme in Figma; underlined Button labels fixed; old Preview screens archived; all components in section 3.2 and the ten screens built in Figma. |
| 🟩 | Mobile sizes from Figma's Device collection are implemented (2026-10-21): text and controls grow below 1,440 px. |
| 🟥 | **Code Connect** is not available: Figma only allows it on Organization or Enterprise plans. The "Code" columns above are the mapping until then. |
| 🟨 | Table headers use `text-meta` plus `font-medium` in code; Figma has a `meta-medium` text style. Add a matching code token if headers are reused. |
| 🟨 | Table Row columns share the width equally in Figma; the code table lays columns out automatically. |
| 🟨 | Unused color variables still exist in Figma as aliases of the 13 colors; the Light theme is not shipped. |
| 🟨 | Earlier-concept components (section 3.3) remain in Figma. |
| ⬜ | A Textarea in code (the agent composer is an Input today). |
