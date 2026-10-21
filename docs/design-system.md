# 🎨 Design system

> **Status:** 🟨 Draft (2026-10-21). 🔐 This repo is public: the Figma link is kept out. Ask the owner for it.
> Where this fits: [design.md](design.md) is the short index (brand, mobile rule, workflow); this document is the **detailed spec**.

## 🗝️ Legend
✅ matches Figma · 🟨 differs or partly done · ⬜ missing in Figma · 🟥 gap to fix · 🟩 working

---

## 1. 🧭 Principles and source of truth
1. **Figma wins.** The Figma file "CivicPulse · shadcn Design System" is the reference. If code and Figma disagree, change the code to match Figma, or change Figma first and then say so here. (Decision [0013](decisions/0013-figma-is-the-source-of-truth.md).)
2. **Built on shadcn/ui.** The Figma components mirror shadcn's structure and the code uses shadcn components (`src/components/ui/`) with Figma's values. Token names are shared on purpose (`--background`, `--card`, `--ring`…).
3. **Dark only.** The Light theme in Figma is a derived check, not shipped ([decision 0005](decisions/0005-dark-only-figma-tokens.md)).
4. **Every screen has a desktop and a mobile version.** Desktop from **1,440 px**, mobile below it; reference frames **1440×900** and **390×844**.
5. **No hard-coded values.** Use the tokens below (`text-body`, `bg-card`, `rounded-sm`…), never a loose `13px` or `#1c1c1e`.

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

| Style | Size / line | Letter-spacing | Weight | Use | Class | Figma |
|---|---|---|---|---|---|---|
| display | 32 / 32 | 0 | 600 | Big numbers on empty or hero states | `text-display` | 🟨 size ✅, weight 400 |
| stat | 24 / 32 | 0 | 600 | Counts in stat cards | `text-stat` | 🟨 |
| heading | 20 / 28 | 0 | 600 | Page title ("Users") | `text-heading` | 🟨 |
| title | 18 / 28 | 0 | 600 | Panel and section titles | `text-title` | 🟨 |
| subtitle | 16 / 24 | 0 | 500 | Card titles | `text-subtitle` | 🟨 |
| label | 14 / 20 | 0 | **500** | **Buttons, field names, menu items, tabs** | `text-label` | 🟨 |
| body | 13 / 22 | 0 | 400 | Paragraphs, inputs, table cells | `text-body` | 🟨 |
| meta | 12 / 16 | 0 | 400 | Secondary info | `text-meta` | 🟨 |
| caption | 11 / 16 | 0 | 500 | Small tags and badges | `text-caption` | 🟨 |

**Letter-spacing is 0 on purpose** (decided 2026-10-21). Figma's 0.2 and 0.3 px make letters look blurry or uneven on screens without a Retina display; Figma gets 0 in the Figma step. The brand wordmark in the sidebar keeps its wide spacing.

**Weight rule (decided 2026-10-21):** 600 for headings and numbers, **500 for anything you act on or that labels something** (buttons, links, field names, menu items, badges, table headers, names in a table), 400 for reading text and what you type. Placeholder text is 400.

> 🟥 In Figma **every style is weight 400** (and the Button matrix labels are underlined). The code deliberately differs; Figma gets the weights above in the Figma step, and then this column is ✅.
> ⚙️ `cn()` in `src/lib/utils.ts` knows these names are font sizes. Without that, the class merger dropped `text-label` from every colored button (a silent bug fixed on 2026-10-21, with a test).

### 2.3 🎨 Colors (dark theme)
All values are identical in Figma and `src/index.css` (checked token by token, 2026-10-21).

| Token | Value | Use |
|---|---|---|
| `background` | `#151517` | Page |
| `foreground` | `#DCDCDC` | Main text |
| `card` / `card-foreground` | `#1C1C1E` / `#DCDCDC` | Cards, inputs, panels |
| `popover` | `#0F0F0F` | Dropdown surfaces |
| `primary` / `primary-foreground` | `#D3D3D3` / `#151517` | Main action |
| `secondary`, `muted` | `#323232` | Secondary surfaces |
| `secondary-foreground` | `#DCDCDC` | Text on secondary |
| `muted-foreground` | `#A5A5A5` | Supporting text |
| `accent` / `accent-foreground` | `#383838` / `#EBEBEB` | Hover |
| `destructive` / `destructive-foreground` | `#8B0F0F` / `#FFFFFF` | Dangerous action, error badge |
| `border` | `#323232` | Dividers and card borders |
| `input` | `#404040` | Input and outline-button borders |
| `ring` | `#909090` | Focus ring (3 px, 50 %) |
| `inset` | `#000000` | Outline buttons, deepest surface |
| `sidebar` family | `#000000` / `#7A7A7A` / `#404040`… | Sidebar |
| `ai`, `ai-foreground`, `ai-border` | `#22253F` / `#EBEBEB` / `#6D79E2` | Agent surfaces |
| `warning` | `#EF9700` | Needs review |
| `incident` | `#FFA08F` | Incidents, invalid fields |
| `chart-1…5` | `#6D79E2` `#FFA08F` `#EF9700` `#D3D3D3` `#7A7A7A` | Map and charts |

Map status colors: 🟧 needs review (`#EF9700`), 🩷 validated or in progress (`#FFA08F`), ⬜ closed (`#7A7A7A`). See `GROUPS` in `src/lib/incidents.ts`.

### 2.4 📏 Spacing, radius, controls
| | Value | Class |
|---|---|---|
| Spacing | 4 px scale (`spacing × N`) | `p-4` = 16, `gap-3` = 12, `gap-2` = 8 |
| Radius | xs **2**, sm **4**, md 6, lg **8**, xl 12, 2xl 16, full | `rounded-xs` … |
| Control radius | **sm (4 px)** for buttons, inputs, selects, dropdowns | `rounded-sm` |
| Card radius | **lg (8 px)** | `rounded-lg` |
| Badge radius | **xs (2 px)** | `rounded-xs` |
| Control heights | sm **32**, default **36**, lg **44** (touch size) | `h-8`, `h-9`, `h-11` |
| Borders | 1 px, `border` color; inputs use `input` | `border`, `border-input` |

### 2.5 📱 Breakpoint
One switch: **1,440 px** (`desk`, `--breakpoint-desk: 90rem`). At 1,440 and wider: sidebar, floating filters and agent over the map. Narrower: top bar with menu, bottom sheet.

---

## 3. 🧩 Components
Code is in `src/components/ui/` (shadcn) or `src/components/`. "Figma" is the component set name in the Figma file.

### 3.1 shadcn components
| Component | Variants and sizes (Figma) | States | Code | Status |
|---|---|---|---|---|
| **Button** | variant: default, secondary, destructive, outline, ghost, link · size: sm 32, default 36, lg 44, icon 36, icon-lg 44 | default, hover, focus (3 px ring), disabled (50 %) | `ui/button.tsx` | ✅ |
| **Badge** | variant: default, secondary, destructive, outline · size: default 20 px (caption text), lg 30 px (meta text) | n/a | `ui/badge.tsx` | ✅ |
| **Input** | h 36, bg `card`, border `input`, radius sm, body text, px 12 | default, focus, filled, disabled, invalid (`incident`) | `ui/input.tsx` | ✅ |
| **Card** | bg `card`, border, radius lg, padding 16, gap 12; title subtitle, description body; footer actions | n/a | `ui/card.tsx` | ✅ |
| **Separator** | horizontal, vertical | n/a | `ui/separator.tsx` | ✅ |
| **Textarea** | like Input, h 72 | default, focus, filled, disabled, invalid | not in code yet (agent uses an Input) | 🟨 |
| **Skeleton**, **Alert** (default, destructive, ai) | see Figma | n/a | not in code yet | 🟨 |

### 3.2 Hand-built components (in code, not shadcn)
| Component | What it is | Code | Figma |
|---|---|---|---|
| **Select (native)** | Dropdown for one value, styled like Input. Own chevron (16 px, muted) **12 px from the right edge**, 40 px reserved on the right so text never runs under it; the browser's own chevron is turned off | `src/lib/ui.ts` (`selectClass`), `select-chevron` in `src/index.css` | ⬜ |
| **MultiSelect** | Dropdown with a checkbox per option, Select all, Clear. Same chevron icon and position as the Select | `MultiSelect.tsx` | ⬜ |
| **Checkbox** | Native checkbox with a label | inline | ⬜ |
| **Sidebar** | Left menu: logo, Map, Users, role and Sign out. Expanded 224 px or icons 56 px; slide-out on phones | `Sidebar.tsx` | ⬜ (Figma has a 64 px icon rail, "Nav Item", from the earlier concept) |
| **Status badge** | Pending, Active, Off, plus an "Invited" tag | `UsersAdmin.tsx` (Badge variants) | ⬜ |
| **Users table / card** | Table on desktop, card per person on phones | `UsersAdmin.tsx` | ⬜ |
| **Side panel** | User panel and Create user form; full screen on phones | `UsersAdmin.tsx` | ⬜ |
| **Form field** | Label above an input, error line below | inline | ⬜ |
| **Sign-in and Set-up-your-account cards** | Centered card with the logo | `AuthPage.tsx`, `SetPassword.tsx` | 🟨 (Sign in is captured flat, not built from components) |
| **Filters card, incident detail, media gallery** | Map side panels | `Dashboard.tsx`, `MediaGallery.tsx` | 🟨 |

### 3.3 In Figma, from the earlier concept
Stat Card, Incident Row, Nav Item, Panel Header, Message, Action Card, Map Marker, Incident Radius, Tab Bar, Drawer. Some are still useful (Message and Action Card for the agent, Map Marker, Drawer for the phone bottom sheet); others are not used by the current app. To be sorted in the Figma step (section 7).

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
| Screen | Desktop 1,440 | Mobile 390 | In Figma |
|---|---|---|---|
| Sign in | ✅ | ✅ | Captured flat |
| Set up your account | ✅ | ✅ | ⬜ |
| Map (filters, agent, incident detail) | ✅ | ✅ (bottom sheet) | Old concept only |
| Users | ✅ | ✅ (cards) | ⬜ |
| Create user / user panel | ✅ | ✅ | ⬜ |

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
| 🟥 | **Figma needs the components in section 3.2** (Select, MultiSelect, Checkbox, Sidebar, status badges, table row and card, side panel, form field, auth cards), and the real screens rebuilt from them at 1,440 and 390. This is the next step. |
| 🟥 | **Archive the old Preview screens** (Incident Queue, Alerts/Cases rail, Light mode check) on an "Archive" page. |
| 🟥 | In the Figma Button matrix **every button label is underlined**, not only the Link variant. Looks like a leftover; the code does not underline. Fix in Figma. |
| 🟥 | Button `xs` is not in Figma and not in code any more; the zone dropdown's Select all and Clear use `sm`. |
| 🟨 | Figma text styles are all weight 400. If a bold weight is wanted later, add it to Figma first. |
| 🟨 | The Light theme exists in Figma but is not shipped. |
| 🟩 | Font: Inter (decision 0014). Colors: identical. Heights and radius: match. |
| 🟥 | Figma text styles still use **DM Sans**, weight 400 and letter-spacing 0.2 / 0.3 px: change them to Inter with the weights and 0 spacing above. |
| ⬜ | Code Connect mapping between Figma components and code components. |
