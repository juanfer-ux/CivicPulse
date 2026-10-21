# 🎨 Design system

> **Status:** 🟩 In use. Figma and code reconciled on 2026-10-21. 🔐 The repo is public: the Figma link is kept out, ask the owner for it.
> Brand, mobile rule and workflow: [design.md](design.md). This page is the detailed spec.

✅ done · 🟨 differs or partly done · 🟥 gap · ⬜ not built

---

## 1. 🧭 Principles
1. **Figma wins** ([decision 0013](decisions/0013-figma-is-the-source-of-truth.md)). If code and Figma disagree, change the code, or change Figma first and say so here.
2. **Built on shadcn/ui.** Code uses the shadcn components in `src/components/ui/` with Figma's values; token names match on purpose (`--background`, `--card`, `--ring`…).
3. **Dark only** ([decision 0005](decisions/0005-dark-only-figma-tokens.md)). Figma's Light theme is not shipped.
4. **No hard-coded values.** Use tokens (`text-body`, `bg-card`, `rounded-sm`), never a loose `13px` or `#1c1c1e`. **13 colors, no more.**

---

## 2. 🧱 Foundations

### 2.1 🔤 Typeface
**Inter** (Google Fonts), served from our own site by `@fontsource-variable/inter`, so nothing is requested from Google ([decision 0014](decisions/0014-inter-font.md)). Optical size is automatic. For sharp text the page uses `antialiased`, `text-rendering: optimizeLegibility` and no fractional letter-spacing. Code: `--font-sans` and the base layer in `src/index.css`.

### 2.2 🔠 Text styles
Each class sets size, line height and weight together, so a component never needs its own `font-medium`. Letter-spacing is **0** everywhere (fractional spacing blurs letters on non-Retina screens); only the sidebar wordmark keeps its wide spacing.

| Style | Desktop | Mobile | Weight | Use | Class |
|---|---|---|---|---|---|
| display | 32 / 32 | 32 / 32 | 600 | Big numbers | `text-display` |
| stat | 24 / 32 | 24 / 32 | 600 | Counts in stat cards | `text-stat` |
| heading | 20 / 28 | 20 / 28 | 600 | Page title | `text-heading` |
| title | 18 / 28 | 18 / 28 | 600 | Panel and section titles | `text-title` |
| subtitle | 16 / 24 | 16 / 24 | 500 | Card titles | `text-subtitle` |
| label | 14 / 20 | **16 / 24** | 500 | Buttons, field names, menu items, tabs | `text-label` |
| body | 13 / 22 | **16 / 24** | 400 | Paragraphs, inputs, table cells | `text-body` |
| meta | 12 / 16 | **14 / 20** | 400 | Secondary info | `text-meta` |
| caption | 11 / 16 | **12 / 16** | 500 | Small tags and badges | `text-caption` |

- **Desktop = 1,440 px and wider; Mobile = anything narrower** (the `desk` breakpoint). The sizes come from Figma's Device collection and switch through CSS variables in `src/index.css` (`--fs-body`, `--lh-body`…); class names do not change.
- **Weights:** 600 for headings and numbers; **500 for anything you act on or that labels something** (buttons, links, field names, menu items, badges, table headers, names in a table); 400 for reading text, typed text and placeholders.
- Figma also has `meta-medium` (12 / 16, 500) for table headers; the code uses `text-meta` plus `font-medium`.
- ⚙️ `cn()` in `src/lib/utils.ts` knows these names are font sizes; without that, the class merger dropped `text-label` from colored buttons (test in `utils.test.ts`).

### 2.3 🎨 Colors (dark theme): 13 in total
Every other token name (`primary`, `muted`, `accent`, `border`…) is only an alias of one of these 13, because shadcn components expect those names ([decision 0015](decisions/0015-thirteen-color-palette.md)). Add a color only if none of these can do the job.

| # | Color | Token (aliases) | Used for |
|---|---|---|---|
| 1 | `#151517` | `background` | Page; text on the main button |
| 2 | `#1C1C1E` | `card` (`popover`) | Cards, inputs, panels, dropdowns |
| 3 | `#000000` | `sidebar` (`inset`) | Sidebar, outline buttons, deepest surface |
| 4 | `#323232` | `secondary` (`muted`, `accent`, `border`) | Borders, dividers, hover, secondary fills |
| 5 | `#404040` | `input` | Borders of inputs and dropdowns |
| 6 | `#7A7A7A` | `closed` (`ring`) | Closed incidents, focus ring |
| 7 | `#A5A5A5` | `muted-foreground` | Supporting text, table headers, placeholders |
| 8 | `#DCDCDC` | `foreground` (`primary`, `accent-foreground`, `secondary-foreground`, `destructive-foreground`) | Normal text, main button, "white" |
| 9 | `#22253F` | `ai` | Agent surfaces |
| 10 | `#6D79E2` | `ai-border` | Agent accents, map highlight rings |
| 11 | `#8B0F0F` | `destructive` | **Fill** of dangerous buttons and badges only (too dark for text) |
| 12 | `#EF9700` | `warning` | Needs review |
| 13 | `#FFA08F` | `incident` | Validated / in progress, invalid fields, **all error text** |

- Error text is always `text-incident` (contrast 8.7:1); `text-destructive` on dark is 1.8:1.
- Code that cannot use a CSS variable (map paint settings) reads the token with `token('--name')` from `src/lib/tokens.ts`. No color literals in `.ts` / `.tsx`.
- Status dots: 🟧 `warning` needs review, 🩷 `incident` validated or in progress, ⬜ `closed`. See `GROUPS` in `src/lib/incidents.ts`.
- In Figma the Dark theme resolves to these same 13 colors; unused variables remain there as aliases, plus a `closed` variable to match the code.

### 2.4 📏 Spacing, radius, controls
| | Value |
|---|---|
| Spacing | 4 px scale: `p-4` = 16, `gap-3` = 12, `gap-2` = 8 |
| Radius | xs 2 (badges) · **sm 4 (buttons, inputs, selects, dropdowns)** · md 6 · **lg 8 (cards)** · xl 12 · 2xl 16 · full |
| Control height, desktop | sm 32 · default 36 · lg 44 · icon 36 · icon-lg 44 |
| Control height, mobile | sm 40 · **default 44 (touch)** · lg 48 · icon 44 · icon-lg 48 |
| Border | 1 px `border`; inputs use `input` |
| Breakpoint | **1,440 px** (`desk`, `--breakpoint-desk: 90rem`): at and above, sidebar and floating panels; below, top bar and bottom sheet |

Control heights use `h-(--control-sm)`, `h-(--control-default)`, `h-(--control-lg)`, `size-(--control-icon)`, `size-(--control-icon-lg)`; the variables switch at 1,440 px.

---

## 3. 🧩 Components
"Figma" names are component sets on the Figma **Components** page; each has a documentation frame.

### 3.1 shadcn components (`src/components/ui/`)
| Component | Variants and sizes | States | Code |
|---|---|---|---|
| **Button** | default, secondary, destructive, outline, ghost, link · sm, default, lg, icon, icon-lg | default, hover, focus (3 px ring), disabled (50 %) | `button.tsx` |
| **Badge** | default, secondary, destructive, outline · default (20 px, caption), lg (30 px, meta) | n/a | `badge.tsx` |
| **Input** | control height, bg `card`, border `input`, radius sm, body text, px 12 | default, focus, filled, disabled, invalid | `input.tsx` |
| **Card** | bg `card`, border, radius lg, padding 16, gap 12; subtitle title, body description | n/a | `card.tsx` |
| **Separator** | horizontal, vertical | n/a | `separator.tsx` |

Textarea, Skeleton and Alert exist in Figma only (🟨 not in code).

### 3.2 App components
| Figma component | What it is | Code |
|---|---|---|
| **Select** | Dropdown for one value, styled like Input. Own chevron (16 px, muted) **12 px from the right edge**, 40 px reserved on the right; never the browser's chevron | `selectClass` in `src/lib/ui.ts`, `select-chevron` in `index.css` |
| **Multi-select** | Dropdown with a checkbox per option, Select all, Clear; same chevron | `MultiSelect.tsx` |
| **Checkbox** | 16 px box, radius xs, with label | native input |
| **Form Field** | Label above a swappable control; error line in `incident` | inline in `UsersAdmin.tsx`, `AuthPage.tsx` |
| **Status Badge** | Pending, Active, Off; "Invited" is a small text tag | `Badge` variants in `UsersAdmin.tsx` |
| **Sidebar**, **Sidebar Item** | Desktop menu, 224 px expanded or 56 px collapsed; one row = icon + label | `Sidebar.tsx` (`NavItem`) |
| **Mobile Top Bar** | 49 px bar with logo and menu button | `header` in `Sidebar.tsx` |
| **Logo** | 64 px ring mark + wordmark | `Logo.tsx` |
| **Table Row** | Users table on desktop (header, row, selected; Show invited); columns flexible | `UsersAdmin.tsx` |
| **User Card** | One person on phones | `max-desk` layout in `UsersAdmin.tsx` |
| **Side Panel** | 420 px (full screen on phones): person editor or invitation form | `UserPanel`, `InvitePanel` in `UsersAdmin.tsx` |
| **Auth Card** | Centered card: logo, title, form (sign in; set up your account) | `AuthPage.tsx`, `SetPassword.tsx` |
| **Filters Card**, **Summary Card**, **Sheet Tabs** | Map filters; count, legend, top localities; phone sheet tabs | `Dashboard.tsx` |
| **Suggestion**, **Agent Panel** | Suggested question; the Investigate and Ask panel | `InvestigatePanel.tsx` |

Figma also keeps components from the earlier concept that no screen uses now (Stat Card, Incident Row, Nav Item rail, Panel Header, Message, Action Card, Map Marker, Incident Radius, Tab Bar, Drawer); prune when sure.

---

## 4. 🧰 Patterns
| Pattern | Rule |
|---|---|
| **Forms** | Field name (`text-label`) above the control; error line below in `incident`; one primary button at the bottom. |
| **Saving** | Changes save immediately; a status line (`role="status"`) says what happened or why it failed, in plain words. |
| **Tables** | Header `text-meta` muted, rows `text-body`, whole row clickable; on phones each row becomes a card. |
| **Side panels** | One at a time; 420 px on desktop, full screen with a Close button on phones. |
| **Menus** | Desktop: sidebar, remembered as expanded or collapsed per browser; **Users** only with `manage_users`. Phones: top bar with a menu button and a slide-out that closes on a choice, backdrop tap or Escape. |
| **Users flow** | Table (cards on phones) plus a side panel for one person; **Create user** opens the invitation form in the same place. An invited person sees **Set up your account** until a password is set; sign-in has **Forgot password?**. |
| **Status** | Pending (waiting for a role or an accepted invitation), Active, Off. |
| **Empty and error states** | Say what is missing and what to do, in one or two sentences; never a blank screen (without WebGL the map shows a list). |

---

## 5. 🖼️ Screens and the Figma file
Ten screens on the Figma **Screens** page, built only from the components above: Sign in, Set up your account, Map, Users (person panel open), Create user (form open), each at desktop **1440×900** and mobile **390×844** (Device **Mobile** mode).

Figma pages: Cover, Foundations, Components, Screens, Icons, Archive · earlier concept, Code to Figma (flat captures). Variable collections: Primitives, Theme (Dark, Light), Radius, Spacing, Typography, Device (Desktop, Mobile).

---

## 6. 🟥 Gaps and decisions
| | Item |
|---|---|
| 🟥 | **Code Connect** is not available: Figma allows it only on Organization or Enterprise plans. The "Code" columns above are the mapping until then. |
| 🟨 | Table Row columns share the width equally in Figma; the code table lays columns out automatically. |
| 🟨 | Unused color variables remain in Figma as aliases; the Light theme is not shipped. |
| 🟨 | Earlier-concept components remain in Figma (section 3.2). |
| ⬜ | Textarea in code (the agent composer is an Input today). |
