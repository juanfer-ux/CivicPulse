import { describe, expect, it } from 'vitest'
import { radiusGroups } from '@/lib/radius'

describe('radiusGroups', () => {
  it('returns nothing for no points', () => {
    expect(radiusGroups([])).toEqual([])
  })

  it('one circle for points that are close, covering all of them', () => {
    const pts = [
      { lng: -74.08, lat: 4.65 },
      { lng: -74.0785, lat: 4.65 }, // about 165 m east
      { lng: -74.08, lat: 4.6515 }, // about 165 m north
    ]
    const [c, ...rest] = radiusGroups(pts, 1200, 150, 80, 0)
    expect(rest).toHaveLength(0)
    expect(c.radius).toBeGreaterThan(150)
  })

  it('no circle for a tight hotspot, a circle once the group is wide (400 m by default)', () => {
    const tight = Array.from({ length: 12 }, (_, i) => ({ lng: -74.08 + i * 0.00005, lat: 4.65 })) // about 60 m across
    expect(radiusGroups(tight)).toEqual([])
    const wide = [{ lng: -74.08, lat: 4.65 }, { lng: -74.0745, lat: 4.65 }, { lng: -74.077, lat: 4.652 }] // about 600 m across
    expect(radiusGroups(wide)).toHaveLength(1)
  })

  it('separate circles for far apart groups, and a bigger group gets a bigger circle', () => {
    const near = [{ lng: -74.1, lat: 4.6 }]
    const spread = [
      { lng: -74.05, lat: 4.7 },
      { lng: -74.0485, lat: 4.7 },
      { lng: -74.047, lat: 4.7 },
      { lng: -74.0455, lat: 4.7 },
    ]
    const circles = radiusGroups([...near, ...spread], 1200, 150, 80, 0)
    expect(circles).toHaveLength(2)
    const [single, wide] = circles.sort((a, b) => a.radius - b.radius)
    expect(single.radius).toBe(150) // the minimum
    expect(wide.radius).toBeGreaterThan(single.radius)
  })
})
