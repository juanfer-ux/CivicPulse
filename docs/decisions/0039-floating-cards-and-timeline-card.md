# 0039: detail panels float over the map; the problem's history is its own card

**Status:** Accepted   **Date:** 2026-11-05

## Context
The Incident Panel and the Problem Panel were full-height side panels that slid out from under the Investigate and Ask panel, and the map was padded by the camera so the target stayed centered in the part that showed. The Problem Panel also held the whole history (the lanes timeline and the occurrences log), which made it long.

## Decision
- Both panels are **floating cards** over the map's top-left corner (360 px incident, 400 px problem; 24 px from the top and from the Investigate and Ask panel). No slide-out, no camera padding, the map never shifts. The camera flight to the target stays, and the problem card appears when it ends.
- The Problem Panel keeps only the location, status, occurrences, recurrence, reports, interventions and last reported.
- The history is two separate floating cards (the **Problem Timeline Card**, 24 px apart) across the bottom of the map, each always 360 px tall on desktop: the **lanes timeline on the left (60 %)** and the **occurrences history on the right (40 %)**, percentages of the width without the gap. The timeline shows only the chart and is the anchor: a click on an occurrence, intervention or event there scrolls the history to it and outlines it, so nothing is shown twice. The lanes timeline is option A of the Timeline options. On phones the cards stack in the bottom sheet, timeline first.

## Consequences
Less code (the slide hook and the camera padding were removed) and a shorter panel; the timeline can use the whole map width. A card in the corner covers part of the map, but the camera still centers the target in the whole map. Figma has the cards on the desktop screens; the phone screens are not drawn yet.
