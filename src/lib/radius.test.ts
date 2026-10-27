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

  it('a small group far from a wide one is absorbed: every point ends up inside a circle', () => {
    const wide = [{ lng: -74.08, lat: 4.65 }, { lng: -74.0745, lat: 4.65 }, { lng: -74.077, lat: 4.652 }]
    const lone = { lng: -74.04, lat: 4.65 } // about 4.4 km east, no link to the wide group
    const circles = radiusGroups([...wide, lone])
    expect(circles).toHaveLength(1)
    const mLng = 111_320 * Math.cos((4.65 * Math.PI) / 180)
    const [c] = circles
    for (const p of [...wide, lone]) expect(Math.hypot((p.lng - c.lng) * mLng, (p.lat - c.lat) * 110_574)).toBeLessThanOrEqual(c.radius)
  })

  it('no circles at all when there is no wide group', () => {
    expect(radiusGroups([{ lng: -74.08, lat: 4.65 }, { lng: -74.04, lat: 4.65 }])).toEqual([])
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
