# 📜 Decision records

Short notes on **why** we chose something, so nobody (including future us) re-argues it. One file per decision, numbered, never rewritten: if we change our mind we add a new record that replaces the old one.

Role and permission decisions have their own dated log in [../roles-and-permissions.md](../roles-and-permissions.md#-11-decision-log).

| # | Decision | Status |
|---|---|---|
| [0001](0001-agent-mock-first.md) | The agent starts as rules plus SQL tools, no LLM yet | ✅ Accepted |
| [0002](0002-sql-tools-run-as-user.md) | Agent tools run as the signed-in user | ✅ Accepted |
| [0003](0003-database-is-the-security-boundary.md) | The database, not the screen, enforces access | ✅ Accepted |
| [0004](0004-synthetic-data.md) | All data is synthetic and flagged | ✅ Accepted |
| [0005](0005-dark-only-figma-tokens.md) | Dark theme only, tokens from Figma | ✅ Accepted |
| [0006](0006-gilroy-fonts-in-repo.md) | Gilroy font files live in the public repo | ⚪ Replaced by 0012, then 0014 |
| [0007](0007-permissions-as-data.md) | Permissions are stored as data and checked by one function | ✅ Accepted |
| [0008](0008-categories-and-specializations-tables.md) | Incident categories and specializations are tables | ✅ Accepted |
| [0009](0009-recommendations-screens-removed.md) | Recommendation screens removed for now; backend kept | ✅ Accepted |
| [0010](0010-users-screen-uses-access-rules.md) | The Users screen writes through the existing access rules; no admin key in the browser | ✅ Accepted |
| [0011](0011-invite-users-by-edge-function.md) | Users are invited by an Edge Function; the admin key stays on the server | ✅ Accepted |
| [0012](0012-dm-sans-self-hosted.md) | DM Sans from Google Fonts, served from our own site | ⚪ Replaced by 0014 |
| [0013](0013-figma-is-the-source-of-truth.md) | Figma is the source of truth for the design | ✅ Accepted |
| [0014](0014-inter-font.md) | Inter from Google Fonts, served from our own site | ⚪ Replaced by 0019 |
| [0015](0015-thirteen-color-palette.md) | The palette is 13 colors | ✅ Accepted |
| [0016](0016-auth-stays-simple-on-free-plan.md) | Authentication stays simple on the Free plan | ✅ Accepted |
| [0017](0017-iconoir-icons.md) | Icons are Iconoir | Replaced by 0025 |
| [0018](0018-base-ui-select.md) | Select uses Base UI, not the browser list | ✅ Accepted |
| [0019](0019-manrope-font.md) | The product font is Manrope | ✅ Accepted |
| [0020](0020-generic-color-names.md) | Color tokens are named by color, not by use | ✅ Accepted |
| [0021](0021-auth-picture-is-a-video.md) | The Sign in picture is a looping video | ✅ Accepted |
| [0022](0022-input-border-neutral-300.md) | Input borders use neutral-300 | Superseded by 0026 |
| [0023](0023-labels-above-inputs.md) | Every input has a visible label above it | ✅ Accepted |
| [0024](0024-sixteen-colors-map-statuses.md) | The palette is 16 colors; the map shows four statuses | ✅ Accepted |
| [0025](0025-phosphor-icons.md) | Icons are Phosphor (regular, fill for map badges) | ✅ Accepted |
| [0026](0026-control-border-neutral-400.md) | Control borders use neutral-400 again (below 3:1, owner's choice) | ✅ Accepted |
| [0027](0027-indigo-700-in-the-palette.md) | indigo-700 joins the palette (17 colors) | ✅ Accepted |
| [0028](0028-indigo-scale.md) | An indigo scale like the neutrals (24 colors) | ✅ Accepted |
| [0029](0029-icons-bold.md) | Phosphor icons are the bold weight | ✅ Accepted |
| [0030](0030-problems-above-incidents.md) | Persistent problems sit above incidents (report, occurrence, problem) | 🟨 Proposed |
| [0031](0031-map-drawn-at-2x-with-antialiasing.md) | The map is drawn at 2x with antialiasing; one crisp image per marker size | ✅ Accepted |
| [0032](0032-problem-marker-option-f.md) | The problem marker is option F (neutral circle, status outline, warning triangle) | ✅ Accepted |
| [0033](0033-color-scales-red-orange-blue-yellow.md) | Red, orange, blue and yellow get 100–900 scales (57 colors) | ✅ Accepted |
| [0034](0034-primary-button-color.md) | The primary button gets its own color (a mint, tried the same day) | ⚪ Replaced by 0035 |
| [0035](0035-brand-primary-and-secondary.md) | Brand primary `#E3E3E7` (the primary button) and brand secondary `#87DBC7` (its hover) | ✅ Accepted |
| [0036](0036-display-typeface-science-gothic.md) | Display styles use Science Gothic; text styles brought in line with Figma | ✅ Accepted |
| [0037](0037-manrope-weights-400-700.md) | Manrope weights follow the Figma names: 400 / 500 / 600 / 700 | ✅ Accepted |
| [0038](0038-display-typeface-michroma.md) | display-lg and display use Michroma; Sign in colors and logo follow Figma | ♻️ Font superseded by 0048 |
| [0048](0048-display-typeface-zalando-sans-expanded.md) | All four display styles use Zalando Sans Expanded (ExtraLight for display-lg, Regular for the others) | ✅ Accepted |
| [0039](0039-floating-cards-and-timeline-card.md) | Detail panels float over the map; the problem's history is its own bottom card (occurrences 40 % / timeline 60 %) | ✅ Accepted |
| [0040](0040-scrollbar-style-g.md) | One scrollbar style for the whole platform: style G (round 4 px thumb, 6 px on hover, neutral-300, always visible) | ✅ Accepted |
| [0041](0041-problems-are-called-recurrences.md) | What the screen called a problem is now a recurrence (code and database keep the old name) | ✅ Accepted |
| [0042](0042-floating-cards-agent-panel-look.md) | every floating card has the agent panel's look | ✅ Accepted |
| [0043](0043-locality-outline-on-stat-card.md) | the Stat Card shows the outline of its locality | ✅ Accepted |
| [0044](0044-map-zoom-control-with-home-and-slider.md) | a zoom control with a home button and a slider, like Google's | ✅ Accepted |
| [0045](0045-occurrences-history-rows-three-columns.md) | Occurrences History rows have three columns | ✅ Accepted |
| [0046](0046-stat-card-state-variants-and-stat-trend.md) | Stat Card in two states, the trend as its own component | ✅ Accepted |
| [0047](0047-recurrence-glow-and-pulse.md) | glows and a pulse on the recurrences and the selected incident | ✅ Accepted |
| [0049](0049-agent-modules-dock-and-library.md) | agent-offered modules, a right-side dock and a Modules library (browser-only, no database change) | 🟡 Proposed |

## ✍️ Template
```
# NNNN: Title
**Status:** Accepted / Replaced by NNNN   **Date:** YYYY-MM-DD
## Context      (what problem, in two or three lines)
## Decision     (what we chose)
## Consequences (what gets easier, what gets harder)
```
