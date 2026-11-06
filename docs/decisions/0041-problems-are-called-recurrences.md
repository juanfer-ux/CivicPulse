# 0041: what the screen called a "problem" is now a "recurrence"

**Status:** Accepted   **Date:** 2026-11-06

## Context
A "problem" ([decision 0030](0030-problems-above-incidents.md)) is a set of incidents at one place that keep coming back, even after an intervention. The word "problem" read as generic and negative, and the owner wanted one plural word close to "persistent". Issues, patterns and disruptions were compared: patterns clashes with what the agent finds, disruptions sounds like a single event. Hotspots and recurrences were the single-word candidates; the owner chose **recurrences** ("I love it").

## Decision
- **Everywhere a person sees it** the word is *recurrence* / *recurrences*: the map chip ("Recurrences 16"), the Status menu group, the Recurrence Panel, Recurrence Card, Recurrence Marker, Recurrence Radius, Recurrence Timeline Card and Recurrence Occurrences Card, the screens, the Figma pages and layers, and the design docs.
- **Code and database names stay** (`problems` table, `ProblemRow`, `ProblemDetail.tsx`, `--map-problem-*`, `PROBLEM_STATUS`, `fetchProblems`): renaming them would touch migrations and RLS for no visible gain. This document is the dictionary: *problem* in code or the data model = *recurrence* on screen. Decision records 0030 to 0039 keep the old word as history.
- The detail row that was called "Recurrence" (it shows "Came back n times", the count of returns) is now **Returns**, so a recurrence does not have a "Recurrence" field. The database column `recurrences_n` is unchanged.
- The sidebar section that was called **Persistent** is now **Recurrences**, and the item set is **Sidebar Item Recurrence** (owner, 2026-11-06). Its plus button says "New recurrence" (the new rows are "New recurrence n"). In Figma, no text or layer says problem or persistent any more, on any page, including the Archive page.

## Consequences
- ✅ One short, specific word that carries the "keeps coming back" idea.
- 🟨 Two words for one thing in the code (problem) and on screen (recurrence); this record is the place to look.
- 🟨 `recurrences_n` now sits next to a thing called a recurrence; read it as "returns of the recurrence".
