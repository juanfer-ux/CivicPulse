# 🧩 Components and patterns

> Every component with its Figma name and code file, then the patterns that combine them. Values (colors, text styles, sizes) are in [foundations.md](foundations.md); accessibility rules in [accessibility.md](accessibility.md). Part of the [design system](README.md).

"Figma" names are component sets on the Figma **Components** page; each has a documentation frame.

### shadcn components (`src/components/ui/`)
| Component | Variants and sizes | States | Code |
|---|---|---|---|
| **Button** | default, secondary, destructive, outline, ghost, link · sm, default, lg, icon, icon-lg; text is `text-button` (14 / 20, semi-bold), `text-button-sm` on sm (13.5 / 24) | default, hover, focus (3 px ring), disabled (50 %) | `button.tsx` |
| **Badge** | default, secondary, destructive, outline · default (20 px, caption), lg (30 px, meta) | n/a | `badge.tsx` |
| **Input** | control height, bg `card`, border `input`, radius sm, body text, px 12 | default, focus, filled, disabled, invalid | `input.tsx` |
| **Card** | bg `card`, border, radius lg, padding 16, gap 12; subtitle title, body description | n/a | `card.tsx` |
| **Separator** | horizontal, vertical; a 0.5 px line (`--border-width`) in `neutral-500` (`border`) | n/a | `separator.tsx` |

Textarea, Skeleton and Alert exist in Figma only (🟨 not in code).

### App components
| Figma component | What it is | Code |
|---|---|---|
| **Avatar** | Round user picture, 3 sizes: sm 24, default 32, lg 40 px (`secondary` fill, semi-bold initials: 10 / 13 with no extra spacing on sm, 12 / 21 on default and 13 / 20 on lg, both with 2.2% spacing). Shows the photo when there is one, otherwise up to two initials (first name + first surname). There is no photo storage yet, so today it is always initials. The signed-in user is a Role Badge and the default (32 px) avatar at the right of the Map Header on desktop (12 px gap; hovering the avatar shows the short name); on phones the avatar, short name (first name + first surname) and role stay at the bottom of the slide-out menu. Sign out has no side padding when expanded | `ui/avatar.tsx`, `shortName` and `initials` in `lib/utils.ts` |
| **Role Badge** | A person's role as a small outline badge: height from its content (12.5 px line + 4 px above and below, about 20 px), `sidebar` fill, 0.5 px `input` border, radius-xs, 8 px side padding, 11 px medium text (`caption` size). Super Admin, Locality (Zone) Admin and Specialist Operator in `foreground`; no role yet shows "Pending" in `muted-foreground`. Used left of the avatar in the Map Header | `ui/role-badge.tsx` |
| **Select**, **Select Menu** | Dropdown for one value. The trigger is styled like Input (36 px, chevron 16 px muted, border turns to ring while open). The list is ours, never the browser's: card surface, 0.5 px secondary border, radius-sm, 4 px padding, 32 px options, 4 px under the trigger and as wide as it; highlighted option = secondary fill, selected option = check on the right, disabled = 50 %. Keyboard, typing to jump and screen readers come from Base UI. Same on phones | `ui/select.tsx` (Base UI Select, [decision 0018](../decisions/0018-base-ui-select.md)) |
| **Multi-select** | Dropdown with a checkbox per option, Select all, Clear; same chevron | `MultiSelect.tsx` |
| **Checkbox** | 16 px box, radius xs, with label | native input |
| **Form Field** | Label above a swappable control; error line in `incident` | inline in `UsersAdmin.tsx`, `AuthPage.tsx` |
| **Status Badge** | Pending, Active, Off; "Invited" is a small text tag | `Badge` variants in `UsersAdmin.tsx` |
| **Sidebar**, **Sidebar Item** | Desktop menu, 216 px expanded or 64.5 px collapsed, padding 16 / 12, 32 px between sections, 12 px between items, 16 px in the footer; order: logo, a divider line (0.5 px, `border` color), Collapse, Map, Users, then name and role and Sign out at the bottom; logo = 38 px ring mark + wordmark image (ring only when collapsed and on phones); one row = 20 px icon + label (icon only when collapsed) | `Sidebar.tsx` (`NavItem`) |
| **Map Header** | Desktop header: 70 px (`--map-header-h`), across the whole width next to the sidebar, above the agent panel and the map; title and incident count on the left, the signed-in user's role badge and avatar on the right | `header` (`data-slot="map-header"`) in `Dashboard.tsx` |
| **Mobile Top Bar** | 49 px solid bar: 32 px ring plus the "CIVIC PULSE" text wordmark (13 px), and the menu button | `header` in `Sidebar.tsx` |
| **Logo** | 72 px ring mark + 266.6 x 20.25 wordmark, 7.6 px gap | `Logo.tsx` |
| **Table Row** | Users table on desktop (header, row, selected; Show invited); columns flexible | `UsersAdmin.tsx` |
| **User Card** | One person on phones | `max-desk` layout in `UsersAdmin.tsx` |
| **Side Panel** | 420 px (full screen on phones): person editor or invitation form | `UserPanel`, `InvitePanel` in `UsersAdmin.tsx` |
| **Auth Card** | Centered 384 px card, 16 px padding: logo, title and description, fields, then actions, 40 px apart; fields and actions are 12 px apart inside. Sign in: Email, Password, then Sign in, Create an account and Forgot password. Set up your account: name and email read-only, Password and Repeat password (placeholders, no labels), then Save and continue | `AuthPage.tsx`, `SetPassword.tsx` |
| **Filters Card**, **Summary Card**, **Sheet Tabs** | Map filters; count, legend, top localities; phone sheet tabs | `Dashboard.tsx` |
| **Suggestion**, **Agent Panel** | Suggested question (`sidebar` surface, `neutral-400` border, radius-sm, 12 px side and 8 px vertical padding, `button-sm` text 13.5 / 24 in `foreground`, wraps); the Investigate and Ask panel (docked on desktop: 543.5 px wide by default at 1,440 px; it is a share of the space next to the sidebar (39.5 %), so it **scales with the window**, and is **draggable on its right edge** (always kept between 424 and 800 px; remembered per browser, double-click resets), full height, square, 12 px padding, solid `ai` fill, flat border; the input has the `ai_gradient` border. Full width with a gradient ring on phones). The conversation (header, suggestions, messages) and the composer are each at most 664 px wide and centered in the panel, so a wide panel gets empty side space instead of stretched lines. Conversation (Figma Message): your question is a right-aligned bubble (foreground at 10 %, radius 8); the answer is plain muted text with the bars, evidence and limits below it, then 12 px thumbs up and down (they only mark your choice on screen for now); 32 px between the header and the messages; the panel title is `label` text (14 / 20) and the send button is a 36 px icon button (default variant, up-arrow icon, `ArrowUp` from Iconoir) that stays at 50 % and disabled until something is typed, as in Figma Agent Panel · Conversation; the intro line is `meta` text | `InvestigatePanel.tsx` |

Figma also keeps components from the earlier concept that no screen uses now (Stat Card, Incident Row, Nav Item rail, Panel Header, Message, Action Card, Map Marker, Incident Radius, Tab Bar, Drawer); prune when sure.

## 🧰 Patterns
| Pattern | Rule |
|---|---|
| **Forms** | Field name (`text-label`) above the control; error line below in `incident`; one primary button at the bottom. |
| **Saving** | Changes save immediately; a status line (`role="status"`) says what happened or why it failed, in plain words. |
| **Tables** | Header `text-meta` muted, rows `text-body-sm`, whole row clickable; on phones each row becomes a card. |
| **Side panels** | One at a time; 420 px on desktop, full screen with a Close button on phones. |
| **Menus** | Desktop: sidebar, remembered as expanded or collapsed per browser; **Users** only with `manage_users`. Phones: top bar with a menu button and a slide-out that closes on a choice, backdrop tap or Escape. |
| **Users flow** | Table (cards on phones) plus a side panel for one person; **Create user** opens the invitation form in the same place. An invited person sees **Set up your account** until a password is set; sign-in has **Forgot password?**. |
| **Status** | Pending (waiting for a role or an accepted invitation), Active, Off. |
| **Empty and error states** | Say what is missing and what to do, in one or two sentences; never a blank screen (without WebGL the map shows a list). |
