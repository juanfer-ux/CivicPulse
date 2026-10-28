# 🎨 Design system

> **Status:** 🟩 In use. Figma and code reconciled on 2026-10-21. 🔐 The repo is public: the Figma link is kept out, ask the owner for it.
> Brand, mobile rule and workflow: [../design.md](../design.md). This folder is the detailed spec.

✅ done · 🟨 differs or partly done · 🟥 gap · ⬜ not built

## 📚 Files
| File | What is in it |
|---|---|
| [foundations.md](foundations.md) | Typeface, text styles, the 14 colors, spacing, radius, control sizes, breakpoint |
| [components.md](components.md) | shadcn and app components (Figma name and code file), and the patterns |
| [accessibility.md](accessibility.md) | Rules we follow, contrast numbers, and what is not audited yet |

Split `components.md` by group (forms, navigation, data display, overlays) once it passes about 300 lines.

---

## 🧭 Principles
1. **Figma wins** ([decision 0013](../decisions/0013-figma-is-the-source-of-truth.md)). If code and Figma disagree, change the code, or change Figma first and say so here.
2. **Built on shadcn/ui.** Code uses the shadcn components in `src/components/ui/` with Figma's values; token names match on purpose (`--background`, `--card`, `--ring`…).
3. **Dark only** ([decision 0005](../decisions/0005-dark-only-figma-tokens.md)). Figma's Light theme was removed (2026-10-22).
4. **No hard-coded values.** Use tokens (`text-body`, `bg-card`, `rounded-sm`), never a loose `13px` or `#1c1c1e`. **13 colors, no more.**

---

## 🖼️ Screens and the Figma file
Ten screens on the Figma **Screens** page, built only from the components in [components.md](components.md): Sign in, Set up your account, Map, Users (person panel open), Create user (form open), each at desktop **1440×900** and mobile **390×844** (Device **Mobile** mode).

Figma pages: Cover, Foundations, a separator page `——— Components ———` followed by five **component family** pages (below), Screens, Icons, Archive · earlier concept, Code to Figma (flat captures). Variable collections: Colors (16), Radius, Spacing, Typography, Device (Desktop, Mobile), Map.

Which page holds which component (the "Components · " prefix was replaced by the separator page on 2026-10-27; moving a component between pages keeps its instances):

| Page | Components |
|---|---|
| Actions & inputs | Button, Input, Textarea, Select, Select Menu, Checkbox, Multi-select, Form Field |
| Data display | Badge, Status Badge, Role Badge, Avatar, Card, Stat Card (with its no-trend variant), Table Row, User Card, Incident Row, Incident Card (with Media Tile, Video Player, Detail Row), Alert, Skeleton, Separator |
| Navigation & layout | Sidebar, Sidebar Item, Nav Item, Tab Bar, Sheet Tabs, Mobile Top Bar, Section Header, Panel Header, Side Panel, Drawer |
| Map & agent | Map Marker, Incident Radius, Filters Card (replaced by Filter Chip and Filter Bar, with Status Dot), Map Pin (default, selected, dimmed; the selected one shows at any zoom), Agent Panel, Suggestion, Message, Action Card, Answer Chart, Answer Banner, Map Zoom, Map Legend |
| Auth & brand | Auth Card, Logo |

Rules (also in `CLAUDE.md` and the owner's Obsidian note *Design System Rules - Figma Pages and Layout*): frames on each page sit in **one horizontal row** (left to right, 100 px apart, same y), and every Components page has the background **`#3D3D43`**, including pages created later.

---

---

## 🟥 Gaps and decisions
| | Item |
|---|---|
| 🟥 | **Code Connect** is not available: Figma allows it only on Organization or Enterprise plans. The "Code" columns above are the mapping until then. |
| 🟨 | Table Row columns share the width equally in Figma; the code table lays columns out automatically. |
| 🟥 | Cover and a few old frames still use Gilroy text, a font Figma does not have; they should use Manrope. |
| 🟨 | Earlier-concept components remain in Figma (see components.md). |
| 🟨 | The Sign in picture is a looping video in code; Figma still shows the old wave picture ([decision 0021](../decisions/0021-auth-picture-is-a-video.md)). |
| ⬜ | Textarea in code (the agent composer is an Input today). |
