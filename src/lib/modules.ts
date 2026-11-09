/**
 * Modules (decision 0049, proposed; owner 2026-11-09): read-only panels (a recurrence's timeline, its numbers) the operator drags from the sidebar's Modules section into docking zones on the map. Pure data and rules, no Supabase and no React, so tests can import it. Behind the `?modules=1` switch until the owner approves.
 */
export type ModuleType = 'timeline' | 'numbers'
export type Shape = '4:4' | '4:3' | '4:2'
/** A zone's height is its shape's ratio of its width. */
export const RATIO: Record<Shape, number> = { '4:4': 1, '4:3': 0.75, '4:2': 0.5 }

/** Which shapes a module can be drawn in, first choice first, and what it shows (`about`: a recurrence). */
export const MODULES: Record<ModuleType, { title: string; shapes: Shape[]; about: 'recurrence' }> = {
  timeline: { title: 'Recurrence timeline', shapes: ['4:2', '4:3', '4:4'], about: 'recurrence' },
  numbers: { title: 'Numbers', shapes: ['4:3', '4:4'], about: 'recurrence' },
}

/** The docking zones (layout 2 of the dock-zones gallery, chosen by the owner 2026-11-09): two taller zones in a right column and a wide strip along the bottom of the map. */
export type Zone = { id: string; shape: Shape; w: number; place: 'right' | 'bottom'; top?: number }
export const RIGHT_W = 200
export const ZONES: Zone[] = [
  { id: 'r1', shape: '4:3', w: RIGHT_W, place: 'right', top: 0 },
  { id: 'r2', shape: '4:4', w: RIGHT_W, place: 'right', top: 162 },
  { id: 'b1', shape: '4:2', w: 360, place: 'bottom' },
]
export const DOCK_GAP = 12
export const zoneHeight = (z: Zone) => Math.round(z.w * RATIO[z.shape])
/** The right column's height (to the bottom of its last zone). */
export const RIGHT_H = Math.max(...ZONES.filter((z) => z.place === 'right').map((z) => (z.top ?? 0) + zoneHeight(z)))

export type Placed = { zone: string; type: ModuleType; target: string | null }

export const fitsZone = (type: ModuleType, zone: Zone) => MODULES[type].shapes.includes(zone.shape)
/** The suggested zone while dragging: the zone with the module's first-choice shape, else the first one it fits. */
export const suggestedZone = (type: ModuleType, zones: Zone[] = ZONES) => (zones.find((z) => z.shape === MODULES[type].shapes[0]) ?? zones.find((z) => fitsZone(type, z)))?.id ?? null
/** A recurrence module docks while a recurrence is open or nothing is open; not while an incident is. */
export const canDock = (type: ModuleType, open: 'recurrence' | 'incident' | null) => MODULES[type].about !== 'recurrence' || open !== 'incident'

/** Docks a module: it takes the zone (replacing what was there) and leaves any other zone where the same module was. */
export const place = (list: Placed[], zone: Zone, type: ModuleType, target: string | null): Placed[] =>
  fitsZone(type, zone) ? [...list.filter((p) => p.zone !== zone.id && p.type !== type), { zone: zone.id, type, target }] : list

/** What shows: with `follow` every placed module shows the open case; without it a module shows only while the case it was placed on is open. */
export const isVisible = (p: Placed, follow: boolean, openId: string | null) => follow || p.target === openId
export const rightUsed = (list: Placed[], follow: boolean, openId: string | null) => list.some((p) => isVisible(p, follow, openId) && ZONES.find((z) => z.id === p.zone)?.place === 'right')

/** The switch (owner's test, 2026-11-09): /?modules=1. */
export const MODULES_ON = typeof location !== 'undefined' && new URLSearchParams(location.search).has('modules')
