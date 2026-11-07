import { describe, expect, it } from 'vitest'
import { localityShapes, localityShapesByHeight, simplify, type LocalityFeature } from '@/lib/localityShape'

const square = (code: number, side: number): LocalityFeature => ({
  properties: { code },
  geometry: { type: 'Polygon', coordinates: [[[0, 0], [side, 0], [side, side], [0, side], [0, 0]]] },
})

describe('localityShapes', () => {
  const features = [square(1, 2), square(2, 1)]
  it('fit mode fills the box for every locality', () => {
    const s = localityShapes(features, 40, false)
    expect(Math.max(s.get(1)!.w, s.get(1)!.h)).toBeCloseTo(40, 0)
    expect(Math.max(s.get(2)!.w, s.get(2)!.h)).toBeCloseTo(40, 0)
  })
  it('shared mode draws the smaller locality smaller, and never past the box', () => {
    const s = localityShapes(features, 40, true)
    expect(s.get(2)!.h).toBeCloseTo(s.get(1)!.h / 2, 0)
    expect(localityShapes(features, 40, true, [2]).get(1)!.h).toBeLessThanOrEqual(40.01) // a locality bigger than the reference still fits the box
  })
  it('keeps a closed ring as a shape', () => {
    const s = localityShapes([square(1, 1)], 40, false).get(1)!
    expect(s.d.split('L').length).toBeGreaterThanOrEqual(4) // a square has 4 corners
  })
  it('same height: every outline is as tall as asked and keeps its proportion', () => {
    const wide: LocalityFeature = { properties: { code: 3 }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [4, 0], [4, 1], [0, 1], [0, 0]]] } }
    const s = localityShapesByHeight([wide, square(1, 1)], 30)
    expect(s.get(3)!.h).toBeCloseTo(30, 0)
    expect(s.get(1)!.h).toBeCloseTo(30, 0)
    expect(s.get(3)!.w / s.get(1)!.w).toBeCloseTo(4, 0)
  })
  it('drops points on a straight line', () => {
    expect(simplify([[0, 0], [1, 0.01], [2, 0], [3, 0]], 0.3)).toEqual([[0, 0], [3, 0]])
  })
})
