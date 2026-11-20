import { describe, expect, it } from 'vitest'
import { kindOf, metres } from '@/lib/places'

describe('kindOf', () => {
  it('sorts OSM tags into the four kinds', () => {
    expect(kindOf({ highway: 'bus_stop' })).toBe('bus')
    expect(kindOf({ amenity: 'university' })).toBe('education')
    expect(kindOf({ amenity: 'cafe' })).toBe('food')
    expect(kindOf({ shop: 'bakery' })).toBe('shop')
    expect(kindOf({ amenity: 'pharmacy' })).toBe('other')
    expect(kindOf({ building: 'yes' })).toBeNull()
  })

  it('measures metres', () => expect(Math.round(metres(4.65, -74.08, 4.65009, -74.08))).toBe(10))
})
