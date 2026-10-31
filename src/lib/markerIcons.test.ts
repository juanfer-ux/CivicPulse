import { describe, expect, it } from 'vitest'
import { BADGE_STEPS, PLAIN_PX, PROBLEM_CIRCLE_BY_ZOOM, PROBLEM_SIZE, RING_EXTRA } from '@/lib/markerSizes'

// The owner's sizes for the incident squares (2026-10-30), by map zoom: 11 and below plain 8 px, 12 plain 10 px,
// 13 square 24 px with a 12 px icon, 14 and above square 30 px with a 16 px icon. The selected ring is 10 px bigger.
describe('incident square sizes', () => {
  it('plain squares', () => expect(PLAIN_PX).toEqual([8, 10]))
  it('squares with an icon', () => expect(BADGE_STEPS).toEqual([{ square: 24, icon: 12 }, { square: 30, icon: 16 }]))
  it('selected ring', () => expect(BADGE_STEPS.map((s) => s.square + RING_EXTRA)).toEqual([34, 40]))
})

// Problem circles (owner, 2026-10-30): 28 px at zoom 12 and below, 32 at 13, 42 from 14, scaled smoothly from one image (no jump).
describe('problem marker sizes', () => {
  it('anchors', () => expect(PROBLEM_CIRCLE_BY_ZOOM).toEqual([[12, 28], [13, 32], [14, 42]]))
  it('the image is the biggest size', () => expect(PROBLEM_SIZE.circle).toBe(Math.max(...PROBLEM_CIRCLE_BY_ZOOM.map(([, px]) => px))))
})
