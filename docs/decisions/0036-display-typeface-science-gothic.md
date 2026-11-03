# 0036: Display styles use Science Gothic; text styles brought in line with Figma

> Partly replaced by [0038](0038-display-typeface-michroma.md) (2026-11-03): `display-lg` and `display` are Michroma now; `display-sm` stays Science Gothic.
**Status:** Accepted   **Date:** 2026-11-02

## Context
The owner added and changed text styles in Figma (2026-11-02). Compared with the docs and the code (22 styles in Figma):
- **display** is now a different typeface, **Science Gothic**, in three sizes (Regular at first, **Light** (300) after the owner's second pass, and the 64 px one **ExtraLight** (200) in the third pass; 32 and 24 stay Light) (64 / 60 at -8 % since the third pass, -7 % before, 32 / 42 at -6 %, 24 / 32 at -4 %). Figma now names them `display-lg`, `display` and `display-sm` like the code (renamed 2026-11-02).
- **stat** has tracking **-2 %** (it was -4 %).
- New styles: **label-regular** (14 / 22, Regular), **caption-strong** (12.5 / 16, SemiBold). **meta-medium** is now 13 / 21 Medium (it was documented as 12 / 16, 500).
- Letter-spacing in Figma: `body-sm-medium` 4 % (was 2 %), `caption` and `caption-strong` 2.4 %, `label` 2.2 %.
- In Figma the new styles are used by: Sign in desktop headline (display 64), Auth Card titles (display 24), table headers and the agent's suggested questions (meta-medium), Badge text (caption-strong). Display 32 is not used yet.

## Decision
- **Science Gothic** (Google Fonts, OFL-1.1) is the display typeface, served from our own site like Manrope by `@fontsource-variable/science-gothic` (weight axis only). `--font-display` in `src/index.css`; a display style is used as `font-display text-display-sm`.
- Code names for the three display styles, by size: `display-lg` (64), `display` (32), `display-sm` (24).
- New tokens `label-regular`, `meta-medium`, `caption-strong`, and the letter-spacing values above, as in Figma. `cn()` knows the new names and treats `font-heading` and `font-display` as alternatives.
- Applied where Figma uses them: the Sign in headline (`display-lg`, it was a literal Manrope ExtraLight 64 / 68), the Auth Card titles (`display-sm`, they were `stat`), table headers and suggested questions (`meta-medium`, they were `text-meta font-medium` and `button-sm`), the default Badge (`caption-strong`).
- The Figma weight names map as before: Regular 300, Medium 360, SemiBold 400, Bold 450 for Manrope (changed to 400 / 500 / 600 / 700 on 2026-11-03, [decision 0037](0037-manrope-weights-400-700.md)); Science Gothic uses its real weights: ExtraLight 200 for display-lg, Light 300 for display and display-sm.

## Consequences
- ✅ Code and docs match the 22 Figma text styles; each style was measured in a browser (desktop and phone).
- 🟨 One new dependency. The font files are 14 to 41 KB each and load only for the characters on the page (Latin 41 KB).
- ⚠️ Three styles share the name `display` in Figma; renaming them `display-lg`, `display` and `display-sm` there would match the code.
- ⚠️ The Foundations page's "Typography" sheet in Figma is out of date (it still says Inter and shows `stat` at 24 / 32) and the `font-sans` variable's description still talks about Gilroy; the styles themselves are right.
- 🟨 The Sign in frames in Figma `Sign in · Desktop 1442` and `1443` carry unstyled font experiments (Zalando Sans, Orbitron); they are not text styles and were not applied.
