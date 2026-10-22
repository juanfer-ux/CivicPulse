# 🎨 Design system

> **Status:** 🟩 In use. Figma and code reconciled on 2026-10-21. 🔐 The repo is public: the Figma link is kept out, ask the owner for it.
> Brand, mobile rule and workflow: [../design.md](../design.md). This folder is the detailed spec.

✅ done · 🟨 differs or partly done · 🟥 gap · ⬜ not built

## 📚 Files
| File | What is in it |
|---|---|
| [foundations.md](foundations.md) | Typeface, text styles, the 13 colors, spacing, radius, control sizes, breakpoint |
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

Figma pages: Cover, Foundations, Components, Screens, Icons, Archive · earlier concept, Code to Figma (flat captures). Variable collections: Colors (13), Radius, Spacing, Typography, Device (Desktop, Mobile).

---

---

## 🟥 Gaps and decisions
| | Item |
|---|---|
| 🟥 | **Code Connect** is not available: Figma allows it only on Organization or Enterprise plans. The "Code" columns above are the mapping until then. |
| 🟨 | Table Row columns share the width equally in Figma; the code table lays columns out automatically. |
| 🟥 | Figma's 14 text styles still use the font Gilroy, which Figma does not have; they should use Inter. Cover and a few old frames also still use Gilroy text. |
| 🟨 | Earlier-concept components remain in Figma (see components.md). |
| ⬜ | Textarea in code (the agent composer is an Input today). |
