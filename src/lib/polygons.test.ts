import { describe, expect, it } from 'vitest'
import { labelPoint } from '@/lib/polygons'

describe('labelPoint', () => {
  it('puts the point in the middle of a square', () => {
    const [x, y] = labelPoint('Polygon', [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]])
    expect(Math.abs(x - 5)).toBeLessThan(0.6)
    expect(Math.abs(y - 5)).toBeLessThan(0.6)
  })

  it('stays inside a C shape, where the middle of the box is outside', () => {
    // a C opening to the right: the box center (5, 5) is in the gap
    const c = [[[0, 0], [10, 0], [10, 3], [3, 3], [3, 7], [10, 7], [10, 10], [0, 10], [0, 0]]]
    const [x, y] = labelPoint('Polygon', c)
    expect(x).toBeLessThan(3) // in the spine, not in the gap
    expect(y).toBeGreaterThan(0)
    expect(y).toBeLessThan(10)
  })

  it('uses the largest polygon of a MultiPolygon', () => {
    const small = [[[100, 100], [101, 100], [101, 101], [100, 101], [100, 100]]]
    const big = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
    const [x] = labelPoint('MultiPolygon', [small, big])
    expect(x).toBeLessThan(11)
  })
})
