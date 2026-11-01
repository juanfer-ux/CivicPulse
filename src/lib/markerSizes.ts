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

/** The biggest image size, the top of the zoom scale below. */
export const PROBLEM_SIZE = { circle: 42 }
/** The problem marker's sizes in screen px at the farthest zoom (12.25 and below), the owner's option F (2026-11-01). Every closer zoom scales them in proportion, so the full size, from zoom 13.9, is 1.5 times these: circle 57, icon 27, triangle 39, triangle outline 4. The circle's outline (1 px, in the status color, 2 px of blur) and the triangle's gap are the same at every zoom: a scaled 1 px line would fall below a whole pixel. */
export const PROBLEM_FAR = { circle: 38, icon: 18, badge: 26, alertOutline: 8 / 3, outline: 1, outlineBlur: 2, badgeGap: 6, triangleUp: 3 }
/** The circle's size by map zoom (owner, 2026-10-30): the one image is scaled smoothly between these, so there is no jump (the icon and the badge scale with it). 12 and below stays at the first, 14 and above at the last. */
export const PROBLEM_CIRCLE_BY_ZOOM: [number, number][] = [[12, 28], [13, 32], [14, 42]]

/** The problem circle is drawn as one crisp image per size, because an image shrunk by a fraction looks crackled on the map (owner, 2026-10-30). These are the sizes, half a base pixel apart, so even the biggest circle (57 px) grows by 1 px at a time: a jump between two of them is under 1 px of radius. */
export const PROBLEM_CIRCLE_PX = Array.from({ length: 29 }, (_, i) => 28 + i / 2)
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

/** The marker's sizes in screen px for one image size: PROBLEM_FAR scaled in proportion; the circle in whole pixels and the rest in half pixels (a whole number in the 2x image). `up` lifts the triangle above the diagonal so it overlaps the circle less vertically. */
export function problemSizes(size: number) {
  const k = size / PROBLEM_CIRCLE_PX[0] // 1 at the farthest zoom, 1.5 at the closest
  const half2 = (n: number) => Math.round(n * 2) / 2
  return { circle: Math.round(PROBLEM_FAR.circle * k), iconPx: half2(PROBLEM_FAR.icon * k), badgeD: half2(PROBLEM_FAR.badge * k), alertOutline: half2(PROBLEM_FAR.alertOutline * k), up: PROBLEM_FAR.triangleUp * k }
}
