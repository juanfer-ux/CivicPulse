# 0045: Occurrences History rows have three columns

**Status:** Accepted   **Date:** 2026-11-07

## Context
The rows were one line of text ("PRK-0027 Community reporting channel · 21 Aug, 19:18"). The owner asked for more air, dividers and a clearer structure, and chose from a gallery (`/#history`).

## Decision
- Three columns: a 32 px square tile with the source's **initials** (placeholder), the **source** with its **reference** below, and the **date** with the **24 h time** below (no AM or PM), left aligned in a 52 px column.
- Roomy rows (16 px above and below) with a full-width `neutral-600` divider between rows (none after the last of an occurrence).
- Initials: an acronym gives its first two letters (UAESP is UA), otherwise the first letters of the first two words, skipping te, la, en, de (Bogotá te Escucha is BE).

## Consequences
- ✅ Easier to scan; the reference and the time have fixed places.
- 🟨 Real logos are an open question (public repository, third-party trademarks, mostly wide lockups). The Salvajes en la Vía logo exists (owl icon); nothing is downloaded or used yet.
