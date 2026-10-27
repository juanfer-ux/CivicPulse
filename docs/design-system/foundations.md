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

## 🎨 Colors (dark theme): 17 in total
Every other token name (`primary`, `muted`, `accent`, `border`…) is only an alias of one of these 16, because shadcn components expect those names ([decision 0015](../decisions/0015-thirteen-color-palette.md)). Add a color only if none of these can do the job.

| # | Name (Figma and `index.css`) | Color | Usage name (aliases) | Used for |
|---|---|---|---|---|
| 1 | `neutral-900` | `#0E0E10` | `sidebar` (`inset`) | Outline buttons, suggestions, role badge, agent panel, mobile bars, deepest surface; text on a light fill |
| 2 | `neutral-800` | `#111113` | `ai` | Agent surfaces, Side Panel, section header (Figma 2026-10-26) |
| 3 | `neutral-700` | `#18181B` | `background` | Page (Figma 2026-10-26) |
| 4 | `neutral-600` | `#1B1B1F` | `card` (`popover`) | Cards, inputs, panels, dropdowns, desktop sidebar (since 2026-10-27) |
| 5 | `neutral-500` | `#303036` | `secondary` (`muted`, `accent`, `border`) | Borders, dividers, hover, secondary fills |
| 6 | `neutral-400` | `#3C3C44` | `input` | `input` (borders of every control: inputs, dropdowns, chips, suggestions, outline buttons; since 2026-10-26, [decision 0026](../decisions/0026-control-border-neutral-400.md)); divider before the count in the section header |
| 7 | `neutral-300` | `#737381` | `closed` (`ring`) | Focus ring, border of an active or pressed chip. Until 2026-10-26 it was also `input` (see [Borders](#borders)) |
| 8 | `neutral-200` | `#A9A9B2` | `muted-foreground` | Supporting text, table headers, placeholders |
| 9 | `neutral-100` | `#C1C1C8` | `foreground` (`primary`, `accent-foreground`, `secondary-foreground`) | Normal text, main button fill, "white" |
| 10 | `indigo-700` | `#272A68` | `ai-banner` | Conversation banner background (since 2026-10-27; was a loose map color). The answer rings that also used it were replaced by incident radii. Light text on it |
| 11 | `indigo-400` | `#5C59FF` | `ai-border` | Agent accents: the bars of an answer, the agent input ring, the panel resize line on hover. Changed from `#6D74E2` to `#524FFB`, then `#5C59FF`, on 2026-10-27 (Figma). 3.9 : 1 on the agent panel, so **graphics only, never text** |
| 12 | `red-400` | `#EE8688` | `destructive` | Fill of dangerous buttons and badges |
| 13 | `amber-400` | `#D0AC6B` | `warning` | Warning border (map list fallback), end of the AI gradient |
| 14 | `coral-400` | `#E58C7D` | `incident` | Invalid fields, **all error text** |
| 15 | `orange-400` | `#FF9F50` | none (map only, `--map-reviewing`) | Reviewing dots (added 2026-10-26, [decision 0024](../decisions/0024-sixteen-colors-map-statuses.md)) |
| 16 | `blue-400` | `#495C8B` | none (map only, `--map-approved`) | Approved dots (same decision) |
| 17 | `yellow-400` | `#FFEE6C` | none (map only, `--map-pending`) | Pending dots (same decision) |

Names say what a color is (family and lightness: neutrals are always 100–900 and listed 900 first; higher number = darker), not where it is used ([decision 0020](../decisions/0020-generic-color-names.md)). Components keep using the usage names; each one points at one of the 16.

- Error text is always `text-incident` (contrast 6.9:1); `text-destructive` on dark is 6.9:1.
- Code that cannot use a CSS variable (map paint settings) reads the token with `token('--name')` from `src/lib/tokens.ts`. No color literals in `.ts` / `.tsx`.
- **Conversation banner** (Figma Answer Banner, 2026-10-26): 38 px high (`--answer-banner-h`), fill `--ai-banner` (`#272A68`, = `indigo-700`), 20 px side padding, 8 px gap; a 16 px `Car` icon, the message (`meta`, left, fills the row) and an outline small button "Clear agent results". It sits under the map header while an answer is on the map; the filters and the stats card move down by its height. The answer rings on the map used the same color at 60 % opacity until 2026-10-27, when they were replaced by incident radii (`--map-answer-radius` (`#545EFF`) as a radial gradient fill (clear to half the radius, 6 % at the edge) with a 1 px `#4C49C1` ring (`--map-answer-radius-ring`): one circle per wide group of incidents (reaching 320 m or more from its center) behind an answer; tight hotspots show only pins). Figma variable `map/banner`.
- **Bogotá outline** (`--map-bogota-border`, alias of `neutral-200`, 1.5 px, softened like the roads; not in Figma yet): the city's limit as one line, from `public/bogota-boundary.geojson` (OpenStreetMap relation 7426387, ODbL, downloaded 2026-10-26 via Nominatim, 19 KB; the basemap already credits OpenStreetMap). The 20 localidades are not in it.
- **Map colors** (Figma `Map` collection, 2026-10-25): the map reads its own tokens, each an alias of a base color: the four statuses `--map-pending` (yellow-400), `--map-reviewing` (orange-400), `--map-approved` (blue-400), `--map-rejected` (red-400), `--map-dot-outline` (neutral-700), `--map-answer-ring` (`--ai-banner`), `--map-selected-ring` (neutral-100), `--map-roads` (`#363644`, minor and secondary streets, CARTO's is #414758) and `--map-main-roads` (`#2B2B36`, primary roads, CARTO's is #535666), both map-only colors outside the 17 (owner 2026-10-26), outline and line tokens, all map-only and starting at CARTO's own colors so you set them in the Figma sheet (sizes stay CARTO's and are written next to each swatch): `--map-road-outlines` (about 1 px each side from zoom 14), `--map-road-outlines-minor` (`#1A1A1A`, tunnels, minor roads, bridges), `--map-building-outlines` (`#0E0E0E`, 1 px), `--map-label-halo` (`#222222`, 1 px; before it CARTO used #222, #111 and #181818), `--map-paths` (`#262626`), `--map-boundary-county` (`#222222`), `--map-boundary-country` (`#2C353C`), `--map-rail` (`#1A1A1A`) and `--map-airport` (`#111111`); and `--map-buildings` (`#3F4550`, building tops, they fade in over the land from zoom 13 to 16 so in between they look like a blend, map-only), `--map-road-outlines` (`#363644`, the thin outline under roads, CARTO's is #232323, map-only), `--map-boundary` (`#32323E`, state borders, CARTO's is #676772, map-only), `--map-water` (`#2C353C`, rivers and lakes, CARTO's own color made a token) and `--map-waterway` (`#21303B`, the thin river lines, CARTO's is `#3F5A6D`; owner 2026-10-27, both map-only and outside the 17), `--map-background-gradient` (a subtle radial gradient, neutral-700 near the top left fading to neutral-900 at the edges, laid out over the whole screen so the map shows the part under it: what shows behind the map while the land is off; owner 2026-10-26; Figma paint style `map_background`; CSS cannot reproduce Figma's slight tilt) and `--map-background` (its start color, neutral-800, which dimmed pins blend toward), `--map-land` (OFF for now: the land layers are hidden, as if invisible, and the page color shows through; `LAND_ON` in `IncidentMap.tsx` turns it back on, with the Figma color `#19191F`, a map-only color outside the 17: land, parks and the map background, overriding CARTO's #0E0E0E; owner 2026-10-26). Recolor the map by re-pointing these; the UI (warning badges, error text, focus rings) is untouched. Dots show four statuses: 🟨 Pending, 🟧 Reviewing, 🟦 Approved, 🟥 Rejected (`GROUPS` and `groupOf` in `src/lib/incidents.ts`; the nine database states are grouped as listed in [incident-lifecycle.md](../incident-lifecycle.md#-incident-status-9-values)). The other basemap (CARTO Dark Matter) colors are listed in the Figma sheet `Map colors` but are not tokens.
- **Gradient** `--ai-gradient` (Figma paint style `ai_gradient`): `ai-border`, `incident`, `warning`, top to bottom at 10 %, 64 %, 105 %. Built from three of the 16, so not a new color. Used on the border of the Agent Panel (`gradient-border` utility in `src/index.css`).
- In Figma the **Colors** collection holds exactly these 17 variables (same names, values and one mode); swatches are on the Foundations page (`Colors · 16`). The alias names (`primary`, `muted`, `accent`, `border`, `popover`, `inset`…) exist only in code. The old Primitives and Theme (Dark and Light) collections were removed on 2026-10-22; their values are kept as text on the Archive page.

### Borders
Every border and divider in one place. Width is always `--border-width` (0.5 px). A border that is the only thing marking a control must keep **3:1 contrast** against what is next to it (WCAG 1.4.11); decorative dividers need not.

| Border | Color | Contrast | Used for |
|---|---|---|---|
| Default and dividers | `border` = `neutral-500` | decorative | Cards, tables, section header line, agent panel right line, map zoom buttons |
| **Controls** | `input` = `neutral-400` (owner's choice 2026-10-26, one border for every control) | 1.6:1 on `neutral-600` (input fill), 1.7:1 on `neutral-800` | Inputs, dropdowns, filter chips, suggestions, outline buttons. ⚠️ Below the 3:1 that WCAG 1.4.11 asks for text inputs (the darkest palette step that passes is `neutral-300`, 3.7:1 to 4.0:1; a custom `#666672` also passes at 3.03:1). Accepted by the owner for look and consistency. Chips, suggestions and buttons are identified by their text, so they are not affected |
| Focus ring | `ring` = `neutral-300` | 4.0:1 on `neutral-800` | Keyboard focus (3 px ring, not a border) |
| Section header divider | `neutral-400` | decorative | Line before the count |
| Agent accent | `ai-border` = `indigo-400` | | Gradient ring around the agent input (`ai_gradient`) |
| Answer banner | `--ai-banner` (`#272A68`) | | Banner under the map header while an answer is shown |
| Locality outline (agent) | fill `--map-locality-fill` (alias of `--map-answer-radius`, `#545EFF`) at a flat 4 % for every locality (Figma; set in `LOCALITY_FILL`), 1.4 px line in `--map-locality-line` (`#343193`, map only, its own color), names in `neutral-100` with a `neutral-900` halo, each written once (on one point inside the locality; the basemap's own "Localidad X" labels are hidden while localities are shown) | | An answer about localities outlines them instead of drawing circles, the fill is drawn above the roads and under the names, so it tints everything under it evenly and each locality reads as one shade (roads stay visible through it); the outline is on top of the whole basemap so nothing cuts it; buildings stay visible (they are under the fill and tint it a little in dense blocks); boundaries from `public/bogota-localities.geojson` (OpenStreetMap, ODbL, 20 localidades, 174 KB, downloaded 2026-10-27, simplified) |
| Incident radius (agent) | fill: radial gradient, clear up to half the radius and `--map-answer-radius` (`#545EFF`) at the edge, shown at 6 %; ring: 1 px `--map-answer-radius-ring` (`#4C49C1`). Both map only, outside the 17 | | One circle per wide group (reaching 320 m or more from its center) of incidents behind an agent answer; tight hotspots show only pins (replaced the ring on each incident, 2026-10-27). The coral Incident Radius stays for incident areas |
| Map outlines | `--map-road-outlines`, `--map-road-outlines-minor`, `--map-building-outlines`, `--map-boundary*`, `--map-bogota-border` (off) | | See Map colors below |

Figma follows this: Suggestion, Filter Chip, Input and the other controls all use `neutral-400`.

## 🔣 Icons
Phosphor (`@phosphor-icons/react`, [decision 0025](../decisions/0025-phosphor-icons.md)): the **regular** weight everywhere, 1em by default, sized with `size-*` (sidebar items 20 px, 16 px elsewhere). The **fill** weight only on the map badges (car for parking, trash can for illegal dumping). Colour follows the text (`currentColor`). Phosphor icons are filled shapes, so no stroke tricks are needed. Mapping from the old Iconoir names: Group→UsersThree, LogOut→SignOut, Map→MapTrifold, MediaImage→Image, Menu→List, NavArrow→Caret, Sparks→Sparkle, Xmark→X, SidebarCollapse/Expand→SidebarSimple (mirrored when collapsed).

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
