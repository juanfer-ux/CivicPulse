// Marker sizes by map zoom, in screen px (owner, 2026-10-30). Kept in a file with no imports so a test can read them without loading Supabase.
/** Square marker sizes by zoom (owner, 2026-10-30), in screen px: step 0 from zoom 13, step 1 from zoom 14. The icon is its own size in each, so each step is its own image. */
export const BADGE_STEPS = [
  { square: 24, icon: 12 },
  { square: 30, icon: 16 },
]
/** Plain squares by zoom, in screen px (owner, 2026-10-30): step 0 at zoom 11 and below, step 1 at zoom 12 (up to 13, where the icon squares start). */
export const PLAIN_PX = [8, 10]
/** The selected incident's ring is this much bigger than its square marker. */
export const RING_EXTRA = 10

/** The marker is drawn once at its biggest size, in screen px: circle, category icon, badge. */
export const PROBLEM_SIZE = { circle: 42, icon: 24, badge: 28 }
/** The circle's size by map zoom (owner, 2026-10-30): the one image is scaled smoothly between these, so there is no jump (the icon and the badge scale with it). 12 and below stays at the first, 14 and above at the last. */
export const PROBLEM_CIRCLE_BY_ZOOM: [number, number][] = [[12, 28], [13, 32], [14, 42]]
