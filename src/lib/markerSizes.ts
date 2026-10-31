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

/** The problem circle is drawn as one crisp image per size, because an image shrunk by a fraction looks crackled on the map (owner, 2026-10-30). These are the sizes, 2 px apart: a jump between two of them is under 1 px of radius. */
export const PROBLEM_CIRCLE_PX = [28, 30, 32, 34, 36, 38, 40, 42]
/** The zoom where a circle size is reached on the smooth curve through PROBLEM_CIRCLE_BY_ZOOM. */
export function zoomForCircle(px: number): number {
  for (let i = 0; i < PROBLEM_CIRCLE_BY_ZOOM.length - 1; i++) {
    const [z0, s0] = PROBLEM_CIRCLE_BY_ZOOM[i]
    const [z1, s1] = PROBLEM_CIRCLE_BY_ZOOM[i + 1]
    if (px >= s0 && px <= s1) return z0 + ((px - s0) / (s1 - s0)) * (z1 - z0)
  }
  return px < PROBLEM_CIRCLE_BY_ZOOM[0][1] ? PROBLEM_CIRCLE_BY_ZOOM[0][0] : PROBLEM_CIRCLE_BY_ZOOM[PROBLEM_CIRCLE_BY_ZOOM.length - 1][0]
}
/** The zoom where each image takes over from the previous one: halfway between two sizes. */
export const PROBLEM_SWITCH_ZOOMS = PROBLEM_CIRCLE_PX.slice(0, -1).map((px, i) => +zoomForCircle((px + PROBLEM_CIRCLE_PX[i + 1]) / 2).toFixed(3))
