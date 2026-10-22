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
| `foreground` `#DCDCDC` on `background` `#18181B` | 12.9 | Normal text |
| `foreground` on `card` `#1C1C1E` | 12.4 | Text in cards and inputs |
| `muted-foreground` `#A5A5A5` on page / on card | 7.2 / 6.9 | Supporting text |
| `incident` `#FFA08F` on card | 8.7 | **All error text** |
| `background` on `primary` `#DCDCDC` | 12.9 | Text on the main button |
| `foreground` `#DCDCDC` on `destructive` `#ED4C4E` | **2.7** ❌ | Dangerous buttons and badges: fails 4.5. Dark text (`background`) on it is 4.9. |
| `warning` `#EDB24C` on page | 9.3 | Needs-review dots |
| `closed` / `ring` `#7A7A7A` on page / on card | 4.1 / 4.0 | Closed dots, focus ring: **graphics only, never text** |
| `destructive` `#ED4C4E` as text on card | 4.65 | OK as text, but error text stays `incident` |

## 🟥 Not audited yet
| Area | What is missing |
|---|---|
| **Map** | Incidents are color-only dots on a canvas: not reachable by keyboard and no text alternative beyond the counts. The list fallback only appears when WebGL is off. Needs a decision (always offer a list view?). |
| **Zone dropdown** | The open list uses `role="listbox"` but holds checkboxes (not options); focus is not returned to the button on close and arrow keys do nothing. Should follow a checkbox-group or dialog pattern. |
| **Focus ring contrast** | The ring is `ring` at 50 %, probably under 3 : 1 against the page; the border change helps. Needs measuring against WCAG 2.2 (3 : 1). |
| **Side panels** | Focus does not move into a panel when it opens, and is not returned to the row or button on close. |
| **Tables** | Check header cells are announced as headers (`scope`) and rows are operable by keyboard (the row click has no key handler today). |
| **Motion** | The slide-out menu and sidebar width transitions ignore `prefers-reduced-motion`. |
| **Zoom and text size** | 200 % zoom and larger system text are untested (a zoomed desktop falls back to the mobile layout, which helps). |
| **Automated and manual checks** | No axe or Lighthouse run, no screen-reader pass (VoiceOver) yet. |

## ✔️ Before a release
1. Run an automated check (axe or Lighthouse) on the five screens, desktop and phone.
2. Walk each screen with the keyboard only: every control reachable, focus visible, no traps.
3. One VoiceOver pass over Sign in, Users and Create user.
4. Re-check contrast whenever a color changes.
