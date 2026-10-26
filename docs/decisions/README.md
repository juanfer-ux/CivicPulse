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
| [0017](0017-iconoir-icons.md) | Icons are Iconoir | ✅ Accepted |
| [0018](0018-base-ui-select.md) | Select uses Base UI, not the browser list | ✅ Accepted |
| [0019](0019-manrope-font.md) | The product font is Manrope | ✅ Accepted |
| [0020](0020-generic-color-names.md) | Color tokens are named by color, not by use | ✅ Accepted |
| [0021](0021-auth-picture-is-a-video.md) | The Sign in picture is a looping video | ✅ Accepted |
| [0022](0022-input-border-neutral-300.md) | Input borders use neutral-300 | ✅ Accepted |
| [0023](0023-labels-above-inputs.md) | Every input has a visible label above it | ✅ Accepted |
| [0024](0024-sixteen-colors-map-statuses.md) | The palette is 16 colors; the map shows four statuses | ✅ Accepted |

## ✍️ Template
```
# NNNN: Title
**Status:** Accepted / Replaced by NNNN   **Date:** YYYY-MM-DD
## Context      (what problem, in two or three lines)
## Decision     (what we chose)
## Consequences (what gets easier, what gets harder)
```
