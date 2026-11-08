# 0044: a zoom control with a home button and a slider, like Google's

**Status:** Accepted   **Date:** 2026-11-07

## Context
The map had MapLibre's two buttons. Returning to the default zoom took many clicks for people without a middle mouse. MapLibre has no slider control.

## Decision
- A custom control (`MapZoomControl.tsx`): a **home** button that flies back to the default view (Bogotá, zoom 12), **plus**, a **vertical slider** (zoom 11 to 18, native range input, a tick at the default) and **minus**. The slider is hidden on phones, where pinch does it.
- Same look and place as the old control (Figma Map Zoom: `neutral-500` fill, 4 px radius, 29 px buttons); it rides above the history cards.
- Built on the map's zoom calls and zoom event, so there is nothing new to install.

## Consequences
- ✅ One click back to the default view; a visible ruler for the zoom.
- ✅ Figma's Map Zoom component was redrawn on 2026-11-08: a Home group (the new `icon/house`, Phosphor House bold) and a Zoom group (plus, a 112 px slider with track, thumb and a tick at the default, minus), in the four states (default, hover, pressed, disabled).
