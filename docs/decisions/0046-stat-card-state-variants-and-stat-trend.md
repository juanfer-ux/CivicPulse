# 0046: Stat Card in two states, the trend as its own component

**Status:** Accepted   **Date:** 2026-11-07

## Context
The Figma Stat Card had 8 variants: 4 trends x selected on and off. The two axes are independent, one variant was shorter than the rest, and every new option would multiply the count.

## Decision
- **Stat Card:** variants `state=default` and `state=hover` (a selected card looks like hover) and an instance-swap property `Trend`, plus `Outline` and `Show outline` (decision 0043).
- **Stat Trend:** its own component set (`trend=above|about|low|below`), the strip with the icon and text.
- All 30 existing instances were re-pointed and kept their label, value and trend. In code `trend` and `selected` stay separate props and hover is CSS.

## Consequences
- ✅ 6 variants instead of 8, and nothing multiplies; one place to fix the strip.
- 🟨 Moving variants has a cost: every instance had to be re-pointed (the steps are in the vault note Design System Rules, section 5).
