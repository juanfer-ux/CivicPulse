# ♿ Accessibility

> What we already do, the contrast numbers, and what has **not** been audited yet. Part of the [design system](README.md). Colors are in [foundations.md](foundations.md).

✅ done · 🟨 partly · 🟥 not done yet

## ✅ What we already do
| Area | Rule | Where |
|---|---|---|
| Language | Page is `lang="en"` | `index.html` |
| Touch size | Controls are **44 px** tall below 1,440 px (36 px on desktop with a mouse) | Mobile sizes in [foundations.md](foundations.md#-spacing-radius-controls) |
| Focus | Visible focus ring on buttons and inputs (`focus-visible`: 3 px ring plus a border change) | `ui/button.tsx`, `ui/input.tsx`, `src/lib/ui.ts` |
| Names | Icon-only buttons and bare selects have an `aria-label` (menu, close, collapse, filters); decorative icons and the ring mark are hidden from screen readers | `Sidebar.tsx`, `Dashboard.tsx`, `UsersAdmin.tsx`, `Logo.tsx` |
| Current page | The active menu item has `aria-current="page"` | `Sidebar.tsx` |
| Messages | Save feedback is `role="status"`; form errors are `role="alert"` | `UsersAdmin.tsx`, `AuthPage.tsx`, `SetPassword.tsx` |
| Dropdown | The zone dropdown exposes `aria-haspopup` and `aria-expanded` and closes on Escape or an outside click | `MultiSelect.tsx` |
| Phone menu | Closes on Escape, on a backdrop tap or after a choice | `Sidebar.tsx` |
| Not only color | Status is always written (Pending, Active, Off); the map legend names each color | `UsersAdmin.tsx`, `Dashboard.tsx` |

## 🎨 Contrast (checked with the WCAG formula)
AA needs **4.5 : 1** for normal text and **3 : 1** for large text and interface graphics.

| Pair | Ratio | Use |
|---|---|---|
| `foreground` `#C1C1C8` on `background` `#18181B` | 9.9 | Normal text |
| `foreground` on `card` `#1B1B1F` | 9.6 | Text in cards and inputs |
| `muted-foreground` `#A9A9B2` on page / on card | 7.6 / 7.4 | Supporting text |
| `incident` `#E58C7D` on card | 6.9 | **All error text** |
| `sidebar` on `primary` `#C1C1C8` | 10.8 | Text on the main button (rule: text on a light fill uses the `sidebar` color) |
| `sidebar` on `destructive` `#EE8688` | 7.7 | Dangerous buttons and badges now use dark `sidebar` text (light text on it was 1.7 and failed 4.5) |
| `yellow-400` `#FFEE6C` on page / on card | 14.9 / 14.5 | Pending dots |
| `orange-400` `#FF9F50` on page / on card | 8.7 / 8.4 | Reviewing dots |
| `blue-400` `#495C8B` on page / on card | 2.7 / 2.6 | Approved dots (graphics only). 🟨 Below the 3:1 that WCAG 1.4.11 asks of graphics on the dark page; the owner chose this color on 2026-10-26 |
| `red-400` `#EE8688` on page / on card | 7.1 / 6.9 | Rejected dots |
| `closed` / `ring` `#737381` on page / on card | 3.8 / 3.7 | Focus ring: **graphics only, never text** |
| `destructive` `#EE8688` as text on card | 6.9 | OK as text, but error text stays `incident` |

## 🔎 Sign in audit (desktop 1440 × 900, WCAG 2.2 AA, 2026-10-24)
Method: keyboard walk, computed styles and the real page in a browser, contrast math on the real video frames behind the text (27 samples over the 9 s loop), text-spacing and 320 px reflow tests. **Not done:** screen reader (VoiceOver, NVDA), other browsers, an automated tool (axe).

**Passes (measured)**
| Check | Result |
|---|---|
| 1.4.3 Text over the moving video | Worst case over the whole loop: headline 7.9 : 1 (needs 3), subtitle 6.5 (needs 4.5), card description 7.2, Forgot password 10.0. The glow never gets close to a fail. |
| 1.4.3 Other text | Button text 10.8, errors 6.9, placeholders 7.4 |
| 2.4.7 Focus visible | On focus the field border becomes `foreground` `#C1C1C8` (it was `ring` `#737381` until the `input` token moved to the same color, see decision 0022): more than 9 : 1 against the field. The 3 px halo alone is only about 1.9 : 1, so **keep the border change**. |
| 2.2.2, 2.3.1 Motion | Pause button (36 px, labelled, toggles); autoplay is off with reduced motion; nothing flashes (pulses fade over seconds); video and still are hidden from screen readers |
| 1.3.5, 3.3.8 Inputs | `autocomplete` on email and password, paste allowed, no puzzle or memory test |
| 1.4.10, 1.4.12 Reflow, text spacing | No horizontal scroll at 320 px; no clipping with line height 1.5, letter spacing 0.12 em, word spacing 0.16 em |
| 2.5.8, 2.5.3 | Targets 32–36 px (needs 24); accessible names equal the visible text |
| 3.1.1, 1.1.1, 2.1.1 | `lang="en"`, logo alt text, everything reachable by keyboard, no traps |

**Fixed in code (this audit)**
| Issue | WCAG | Fix |
|---|---|---|
| The "check your email" notice was not announced | 4.1.3 | `role="status"` |
| Errors were not tied to their fields | 3.3.1, 1.3.1 | `aria-invalid` and `aria-describedby` on the fields, `id` on the error |
| "Sign in" / "Set up your account" were not headings, and the only heading was the tagline | 1.3.1, 2.4.6 | The card title is now the page's `h1` (`CardTitle asChild`); the tagline is a paragraph |
| First Tab stop was the pause button, away from the form | 2.4.3 | The form comes first in the page order, the picture column (and its pause button) after it; the look is unchanged |
| The placeholder was the only label and disappeared while typing | 3.3.2 | A visible label above every input; the placeholder is now only an example hint ([decision 0023](../decisions/0023-labels-above-inputs.md)) |
| Field edges were almost invisible when not focused (border 1.6 : 1) | 1.4.11 | The `input` token now points at `neutral-300` `#737381` (3.8 : 1 on the panel) for every input, dropdown, outline button and role badge; focus border `foreground` ([decision 0022](../decisions/0022-input-border-neutral-300.md)) |

**Open: needs a design decision (owner)**
| Issue | WCAG | Evidence | Option |
|---|---|---|---|
| Thin body text: description at weight 300, 13.5 px | advisory | Passes contrast | Heavier weight or 14 px and up |

See the weight options on localhost: `/#components` → "Description text · weight decision" (delete that section once decided).

## 🟥 Not audited yet
| Area | What is missing |
|---|---|
| **Map** | Incidents are color-only dots on a canvas: not reachable by keyboard and no text alternative beyond the counts. The list fallback only appears when WebGL is off. Needs a decision (always offer a list view?). |
| **Zone dropdown** | The open list uses `role="listbox"` but holds checkboxes (not options); focus is not returned to the button on close and arrow keys do nothing. Should follow a checkbox-group or dialog pattern. |
| **Side panels** | Focus does not move into a panel when it opens, and is not returned to the row or button on close. |
| **Tables** | Check header cells are announced as headers (`scope`) and rows are operable by keyboard (the row click has no key handler today). |
| **Motion** | The slide-out menu and sidebar width transitions ignore `prefers-reduced-motion`. The Sign in video does follow it (no autoplay) and has a pause button; it never flashes (pulses fade in and out over seconds). |
| **Zoom and text size** | 200 % zoom and larger system text are untested (a zoomed desktop falls back to the mobile layout, which helps). |
| **Automated and manual checks** | No axe or Lighthouse run, no screen-reader pass (VoiceOver) yet. |

## ✔️ Before a release
1. Run an automated check (axe or Lighthouse) on the five screens, desktop and phone.
2. Walk each screen with the keyboard only: every control reachable, focus visible, no traps.
3. One VoiceOver pass over Sign in, Users and Create user.
4. Re-check contrast whenever a color changes.
