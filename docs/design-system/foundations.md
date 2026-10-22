# 🧱 Foundations

> Typeface, text styles, colors, spacing and controls. Part of the [design system](README.md); components are in [components.md](components.md).

## 🔤 Typeface
**Inter** (Google Fonts), served from our own site by `@fontsource-variable/inter`, so nothing is requested from Google ([decision 0014](../decisions/0014-inter-font.md)). Optical size is automatic. For sharp text the page uses `antialiased`, `text-rendering: optimizeLegibility` and no fractional letter-spacing. Code: `--font-sans` and the base layer in `src/index.css`.

## 🔠 Text styles
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

## 🎨 Colors (dark theme): 13 in total
Every other token name (`primary`, `muted`, `accent`, `border`…) is only an alias of one of these 13, because shadcn components expect those names ([decision 0015](../decisions/0015-thirteen-color-palette.md)). Add a color only if none of these can do the job.

| # | Color | Token (aliases) | Used for |
|---|---|---|---|
| 1 | `#18181B` | `background` | Page; text on the main button |
| 2 | `#1C1C1E` | `card` (`popover`) | Cards, inputs, panels, dropdowns |
| 3 | `#0F0F10` | `sidebar` (`inset`) | Sidebar, outline buttons, deepest surface |
| 4 | `#313135` | `secondary` (`muted`, `accent`, `border`) | Borders, dividers, hover, secondary fills |
| 5 | `#404040` | `input` | Borders of inputs and dropdowns |
| 6 | `#7A7A7A` | `closed` (`ring`) | Closed incidents, focus ring |
| 7 | `#A5A5A5` | `muted-foreground` | Supporting text, table headers, placeholders |
| 8 | `#DCDCDC` | `foreground` (`primary`, `accent-foreground`, `secondary-foreground`, `destructive-foreground`) | Normal text, main button, "white" |
| 9 | `#111113` | `ai` | Agent surfaces |
| 10 | `#6D74E2` | `ai-border` | Agent accents, map highlight rings |
| 11 | `#EA6C6E` | `destructive` | Fill of dangerous buttons and badges |
| 12 | `#EDC57F` | `warning` | Needs review |
| 13 | `#FFA08F` | `incident` | Validated / in progress, invalid fields, **all error text** |

- Error text is always `text-incident` (contrast 8.7:1); `text-destructive` on dark is 5.6:1.
- Code that cannot use a CSS variable (map paint settings) reads the token with `token('--name')` from `src/lib/tokens.ts`. No color literals in `.ts` / `.tsx`.
- Status dots: 🟧 `warning` needs review, 🩷 `incident` validated or in progress, ⬜ `closed`. See `GROUPS` in `src/lib/incidents.ts`.
- **Gradient** `--ai-gradient` (Figma paint style `ai_gradient`): `ai-border`, `incident`, `warning`, top to bottom at 10 %, 64 %, 105 %. Built from three of the 13, so not a 14th color. Not used in the UI yet.
- In Figma the **Colors** collection holds exactly these 13 variables (same names, values and one mode); swatches are on the Foundations page (`Colors · 13`). The alias names (`primary`, `muted`, `accent`, `border`, `popover`, `inset`…) exist only in code. The old Primitives and Theme (Dark and Light) collections were removed on 2026-10-22; their values are kept as text on the Archive page.

## 📏 Spacing, radius, controls
| | Value |
|---|---|
| Spacing | 4 px scale: `p-4` = 16, `gap-3` = 12, `gap-2` = 8 |
| Radius | xs 2 (badges) · **sm 4 (buttons, inputs, selects, dropdowns)** · md 6 · **lg 8 (cards)** · xl 12 · 2xl 16 · full |
| Control height, desktop | sm 32 · default 36 · lg 44 · icon 36 · icon-lg 44 |
| Control height, mobile | sm 40 · **default 44 (touch)** · lg 48 · icon 44 · icon-lg 48 |
| Border | **0.5 px**, one token `--border-width` (Figma variable `border-width` in Spacing) for every border and divider; color `border`, inputs use `input`. A hairline on retina screens, drawn as 1 px on standard screens. The 3 px focus ring and map dots are not borders. |
| Breakpoint | **1,440 px** (`desk`, `--breakpoint-desk: 90rem`): at and above, sidebar and floating panels; below, top bar and bottom sheet |

Control heights use `h-(--control-sm)`, `h-(--control-default)`, `h-(--control-lg)`, `size-(--control-icon)`, `size-(--control-icon-lg)`; the variables switch at 1,440 px.
