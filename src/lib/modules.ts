/**
 * Modules (decision 0049; owner 2026-11-09): read-only panels (a recurrence's timeline, its numbers) the operator drags from the sidebar's Modules section, or accepts from the agent's offer, into one of three docking areas on the map: a column on the left, a column on the right and a strip along the bottom. Pure data and rules, no Supabase and no React, so tests can import it. Behind the `?modules=1` switch until the owner approves.
 *
 * How an area lays its modules out (owner's drawing, 2026-11-09): the bottom strip divides its width equally (one module fills it, two share it 50 / 50); a column keeps each module at its natural height and, when they do not fit, the modules already there shrink to make room (the right column also holds the recurrence's history, which shrinks first).
 */
export type ModuleType = 'timeline' | 'numbers'
export type Area = 'left' | 'right' | 'bottom'
export type Shape = '4:4' | '4:3' | '4:2'

/** Which areas a module can dock in (first choice first) and what it shows. */
export const MODULES: Record<ModuleType, { title: string; areas: Area[]; about: 'recurrence' }> = {
  timeline: { title: 'Recurrence timeline', areas: ['bottom', 'right', 'left'], about: 'recurrence' },
  numbers: { title: 'Numbers', areas: ['right', 'left', 'bottom'], about: 'recurrence' },
}

export const COLUMN_W = 360 // px: a column's width (the recurrence's right column is 360 too)
export const DOCK_GAP = 12
export const BOTTOM_H = 200 // px: the bottom strip's height
export const COLUMN_NATURAL_H = 270 // px: a module's height in a column before anything has to shrink
export const COLUMN_MIN_H = 120
export const MAX_PER_AREA = 3
/** What a column pushes the map content by (its width plus the gap). */
export const COLUMN_PUSH = COLUMN_W + DOCK_GAP

/** `pos` orders the modules of an area (a column top to bottom, the strip left to right); the recurrence's history card in the right column is an item with pos 0, so a module with a smaller pos sits above it. */
export type Placed = { area: Area; type: ModuleType; target: string | null; pos: number }

export const fitsArea = (type: ModuleType, area: Area) => MODULES[type].areas.includes(area)
/** The suggested area while dragging: the module's first choice (the wide timeline goes to the bottom strip). */
export const suggestedArea = (type: ModuleType): Area => MODULES[type].areas[0]
/** The shape a module's content is drawn in for an area: wide and short along the bottom, 4:3 in a column. */
export const shapeFor = (area: Area): Shape => (area === 'bottom' ? '4:2' : '4:3')
/** A recurrence module docks while a recurrence is open or nothing is open; not while an incident is. */
export const canDock = (type: ModuleType, open: 'recurrence' | 'incident' | null) => MODULES[type].about !== 'recurrence' || open !== 'incident'

/** Where a drop lands among the items already in an area: `items` are the area's items with their pos and the middle of each on screen (the pointer's axis), `pointer` is where the drop happened. It goes before the first item whose middle is past the pointer, else last. */
export const insertPos = (items: { pos: number; mid: number }[], pointer: number): number => {
  const sorted = [...items].sort((a, b) => a.pos - b.pos)
  const i = sorted.findIndex((it) => it.mid > pointer)
  if (!sorted.length) return 1
  if (i === -1) return sorted[sorted.length - 1].pos + 1
  return i === 0 ? sorted[0].pos - 1 : (sorted[i - 1].pos + sorted[i].pos) / 2
}

/** Docks a module into an area at `pos`; a module that was docked elsewhere moves, and an area holds at most MAX_PER_AREA (the oldest goes). */
export const place = (list: Placed[], area: Area, type: ModuleType, target: string | null, pos = Date.now()): Placed[] => {
  if (!fitsArea(type, area)) return list
  const next = [...list.filter((p) => p.type !== type), { area, type, target, pos }]
  const inArea = next.filter((p) => p.area === area)
  return inArea.length > MAX_PER_AREA ? next.filter((p) => p !== inArea[0]) : next
}

/** What shows: with `follow` every placed module shows the open case; without it a module shows only while the case it was placed on is open. */
export const isVisible = (p: Placed, follow: boolean, openId: string | null) => follow || p.target === openId
export const inArea = (list: Placed[], area: Area, follow: boolean, openId: string | null) => list.filter((p) => p.area === area && isVisible(p, follow, openId)).sort((a, b) => a.pos - b.pos)

/** How much a column pushes the map content aside: only while no recurrence is open (an open recurrence has its header across the top and the columns below it). */
export const pushOf = (list: Placed[], area: 'left' | 'right', follow: boolean, openId: string | null, recurrenceOpen: boolean) => (!recurrenceOpen && inArea(list, area, follow, openId).length ? COLUMN_PUSH : 0)

/** The switch (owner's test, 2026-11-09): /?modules=1. */
export const MODULES_ON = typeof location !== 'undefined' && new URLSearchParams(location.search).has('modules')
