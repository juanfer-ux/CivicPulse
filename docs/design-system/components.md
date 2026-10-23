# 🧩 Components and patterns

> Every component with its Figma name and code file, then the patterns that combine them. Values (colors, text styles, sizes) are in [foundations.md](foundations.md); accessibility rules in [accessibility.md](accessibility.md). Part of the [design system](README.md).

"Figma" names are component sets on the Figma **Components** page; each has a documentation frame.

### shadcn components (`src/components/ui/`)
| Component | Variants and sizes | States | Code |
|---|---|---|---|
| **Button** | default, secondary, destructive, outline, ghost, link · sm, default, lg, icon, icon-lg | default, hover, focus (3 px ring), disabled (50 %) | `button.tsx` |
| **Badge** | default, secondary, destructive, outline · default (20 px, caption), lg (30 px, meta) | n/a | `badge.tsx` |
| **Input** | control height, bg `card`, border `input`, radius sm, body text, px 12 | default, focus, filled, disabled, invalid | `input.tsx` |
| **Card** | bg `card`, border, radius lg, padding 16, gap 12; subtitle title, body description | n/a | `card.tsx` |
| **Separator** | horizontal, vertical | n/a | `separator.tsx` |

Textarea, Skeleton and Alert exist in Figma only (🟨 not in code).

### App components
| Figma component | What it is | Code |
|---|---|---|
| **Select** | Dropdown for one value, styled like Input. Own chevron (16 px, muted) **12 px from the right edge**, 40 px reserved on the right; never the browser's chevron | `selectClass` in `src/lib/ui.ts`, `select-chevron` in `index.css` |
| **Multi-select** | Dropdown with a checkbox per option, Select all, Clear; same chevron | `MultiSelect.tsx` |
| **Checkbox** | 16 px box, radius xs, with label | native input |
| **Form Field** | Label above a swappable control; error line in `incident` | inline in `UsersAdmin.tsx`, `AuthPage.tsx` |
| **Status Badge** | Pending, Active, Off; "Invited" is a small text tag | `Badge` variants in `UsersAdmin.tsx` |
| **Sidebar**, **Sidebar Item** | Desktop menu, 216 px expanded or 64.5 px collapsed, padding 16 / 12, 32 px between sections, 12 px between items, 16 px in the footer; order: logo, Collapse, Map, Users, then name and role and Sign out at the bottom; logo = 38 px ring mark + wordmark image (ring only when collapsed and on phones); one row = 20 px icon + label (icon only when collapsed) | `Sidebar.tsx` (`NavItem`) |
| **Map Header** | Desktop header: 72 px, across the whole width next to the sidebar, above the agent panel and the map; title and incident count | `header` (`data-slot="map-header"`) in `Dashboard.tsx` |
| **Mobile Top Bar** | 49 px bar with logo and menu button | `header` in `Sidebar.tsx` |
| **Logo** | 64 px ring mark + wordmark | `Logo.tsx` |
| **Table Row** | Users table on desktop (header, row, selected; Show invited); columns flexible | `UsersAdmin.tsx` |
| **User Card** | One person on phones | `max-desk` layout in `UsersAdmin.tsx` |
| **Side Panel** | 420 px (full screen on phones): person editor or invitation form | `UserPanel`, `InvitePanel` in `UsersAdmin.tsx` |
| **Auth Card** | Centered card: logo, title, form (sign in; set up your account) | `AuthPage.tsx`, `SetPassword.tsx` |
| **Filters Card**, **Summary Card**, **Sheet Tabs** | Map filters; count, legend, top localities; phone sheet tabs | `Dashboard.tsx` |
| **Suggestion**, **Agent Panel** | Suggested question; the Investigate and Ask panel (docked on desktop: 543.5 px wide by default at 1,440 px; it is a share of the space next to the sidebar (39.5 %), so it **scales with the window**, and is **draggable on its right edge** (always kept between 424 and 800 px; remembered per browser, double-click resets), full height, square, 12 px padding, solid `ai` fill, flat border; the input has the `ai_gradient` border. Full width with a gradient ring on phones) | `InvestigatePanel.tsx` |

Figma also keeps components from the earlier concept that no screen uses now (Stat Card, Incident Row, Nav Item rail, Panel Header, Message, Action Card, Map Marker, Incident Radius, Tab Bar, Drawer); prune when sure.

## 🧰 Patterns
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
