# 🧱 Foundations

> Typeface, text styles, colors, spacing and controls. Part of the [design system](README.md); components are in [components.md](components.md).

## 🔤 Typeface
**Manrope** (Google Fonts), served from our own site by `@fontsource-variable/manrope`, so nothing is requested from Google ([decision 0019](../decisions/0019-manrope-font.md)). Variable font, weights 200 to 800. Font smoothing is the browser default (`antialiased` was removed on 2026-10-23, the owner's choice after comparing), with `text-rendering: optimizeLegibility` and a universal letter-spacing of 0.02em. Code: `--font-sans` and the base layer in `src/index.css`.

## 🔠 Text styles
Each class sets size, line height and weight together, so a component never needs its own `font-medium`. Letter-spacing is one universal **0.02em** on every element; only the sidebar wordmark and the small uppercase labels keep their own wider spacing. Text on a light fill (main button, default badge, dangerous button) uses the `sidebar` color.

| Style | Desktop | Mobile | Weight | Use | Class |
|---|---|---|---|---|---|
| display | 32 / 32 | 32 / 32 | 400 | Big numbers | `text-display` |
| stat | 24 / 32 | 24 / 32 | 400 | Counts in stat cards | `text-stat` |
| heading | 20 / 28 | 20 / 28 | 400 | Page title | `text-heading` |
| title | 18 / 28 | 18 / 28 | 400 | Panel and section titles | `text-title` |
| subtitle | 16 / 24 | 16 / 24 | 360 | Card titles | `text-subtitle` |
| label | 14 / 22 | **16 / 24** | 360 | Buttons, field names, menu items, tabs | `text-label` |
| button | 14 / 20 (spacing 2.2%) | **16 / 24** | 400 | Text in Button (default, lg, icon-lg) | `text-button` |
| button-sm | 13.5 / 24 (spacing 2.2%) | **16 / 24** | 400 | Text in small Button | `text-button-sm` |
| body | 14 / 22 (spacing 2.2%) | **16 / 24** | 300 | Default paragraph text (new; not used by a screen yet) | `text-body` |
| body-medium | 14 / 22 (spacing 2%) | **16 / 24** | 360 | Default body, medium | `text-body-medium` |
| body-strong | 14 / 22 (spacing 2%) | **16 / 24** | 400 | Default body, strong | `text-body-strong` |
| body-sm | 13.5 / 22 (spacing 2.2%) | **16 / 24** | 300 | Paragraphs, inputs, table cells (this was `body` until 2026-10-23) | `text-body-sm` |
| body-sm-medium | 13.5 / 22 (spacing 2%) | **16 / 24** | 360 | Small body, medium | `text-body-sm-medium` |
| body-sm-strong | 13.5 / 22 (spacing 2%) | **16 / 24** | 400 | Small body, strong | `text-body-sm-strong` |
| meta | 13 / 21 | **14 / 20** | 300 | Secondary info | `text-meta` |
| caption | 12.5 / 16 | **12 / 16** | 360 | Small tags and badges | `text-caption` |

- **Desktop = 1,440 px and wider; Mobile = anything narrower** (the `desk` breakpoint). The sizes come from Figma's Device collection and switch through CSS variables in `src/index.css` (`--fs-body`, `--lh-body`…); class names do not change.
- **Weights** (Manrope is a variable font, so any number from 200 to 800 works; the owner chose these on 2026-10-23 by looking at the result): **Regular 300** for reading text, typed text, placeholders and secondary text; **Medium 360** for anything that labels something (field names, menu items, subtitles, badges, captions); **SemiBold 400** for headings, numbers, titles and button text.
- Figma also has `meta-medium` (12 / 16, 500) for table headers; the code uses `text-meta` plus `font-medium`.
- ⚙️ `cn()` in `src/lib/utils.ts` knows these names are font sizes; without that, the class merger dropped `text-label` from colored buttons (test in `utils.test.ts`).

## 🎨 Colors (dark theme): 14 in total
Every other token name (`primary`, `muted`, `accent`, `border`…) is only an alias of one of these 14, because shadcn components expect those names ([decision 0015](../decisions/0015-thirteen-color-palette.md)). Add a color only if none of these can do the job.

| # | Name (Figma and `index.css`) | Color | Usage name (aliases) | Used for |
|---|---|---|---|---|
| 1 | `neutral-950` | `#0F0F10` | `sidebar` (`inset`) | Map header, outline buttons, deepest surface; text on a light fill |
| 2 | `neutral-900` | `#111113` | `ai` | Agent surfaces |
| 3 | `neutral-850` | `#18181B` | `background` | Page |
| 4 | `neutral-800` | `#1C1C1E` | `card` (`popover`) | Cards, inputs, panels, dropdowns, sidebar |
| 5 | `neutral-700` | `#313135` | `secondary` (`muted`, `accent`, `border`) | Borders, dividers, hover, secondary fills |
| 6 | `neutral-600` | `#404040` | `input` | Borders of inputs and dropdowns |
| 7 | `neutral-500` | `#7A7A7A` | `closed` (`ring`) | Closed incidents, focus ring |
| 8 | `neutral-400` | `#94949A` | (none now) | Not used by a component right now (it was secondary text until 2026-10-23) |
| 9 | `neutral-300` | `#ABABB0` | `muted-foreground` | Supporting text, table headers, placeholders |
| 10 | `neutral-200` | `#C2C2C7` | `foreground` (`primary`, `accent-foreground`, `secondary-foreground`) | Normal text, main button fill, "white" |
| 11 | `indigo-400` | `#6D74E2` | `ai-border` | Agent accents, map highlight rings |
| 12 | `red-400` | `#EE8688` | `destructive` | Fill of dangerous buttons and badges |
| 13 | `amber-400` | `#D0AC6B` | `warning` | Needs review |
| 14 | `coral-400` | `#E58C7D` | `incident` | Validated / in progress, invalid fields, **all error text** |

Names say what a color is (family and lightness: lower number = darker for neutrals), not where it is used ([decision 0020](../decisions/0020-generic-color-names.md)). Components keep using the usage names; each one points at one of the 13.

- Error text is always `text-incident` (contrast 6.8:1); `text-destructive` on dark is 6.8:1.
- Code that cannot use a CSS variable (map paint settings) reads the token with `token('--name')` from `src/lib/tokens.ts`. No color literals in `.ts` / `.tsx`.
- Status dots: 🟧 `warning` needs review, 🩷 `incident` validated or in progress, ⬜ `closed`. See `GROUPS` in `src/lib/incidents.ts`.
- **Gradient** `--ai-gradient` (Figma paint style `ai_gradient`): `ai-border`, `incident`, `warning`, top to bottom at 10 %, 64 %, 105 %. Built from three of the 13, so not a 14th color. Used on the border of the Agent Panel (`gradient-border` utility in `src/index.css`).
- In Figma the **Colors** collection holds exactly these 14 variables (same names, values and one mode); swatches are on the Foundations page (`Colors · 13`). The alias names (`primary`, `muted`, `accent`, `border`, `popover`, `inset`…) exist only in code. The old Primitives and Theme (Dark and Light) collections were removed on 2026-10-22; their values are kept as text on the Archive page.

## 🔣 Icons
Iconoir (`iconoir-react`, [decision 0017](../decisions/0017-iconoir-icons.md)): the line is always 1.5 px, at any icon size (`vector-effect: non-scaling-stroke` in `index.css`), so small icons stay crisp. Sidebar items 20 px (collapsed too), 16 px elsewhere. Colour follows the text (`currentColor`).

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
