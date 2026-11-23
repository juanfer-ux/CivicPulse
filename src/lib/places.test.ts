import { describe, expect, it } from 'vitest'
import { kindOf, metres, niceLabel, orderPlaces, shownCount, type Place } from '@/lib/places'

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

  it('says what a place is in plain words', () => {
    expect(niceLabel('track')).toBe('Running or racing track')
    expect(niceLabel('bakery')).toBe('Bakery')
    expect(niceLabel('')).toBe('Place')
  })

  it('puts low-value places last and keeps them out of the first block', () => {
    const p = (label: string, dist: number): Place => ({ id: label + dist, lat: 0, lng: 0, kind: 'other', name: '', label, dist })
    const ordered = orderPlaces([p('pitch', 5), p('pharmacy', 40), p('track', 10), p('bank', 60)])
    expect(ordered.map((x) => x.label)).toEqual(['pharmacy', 'bank', 'pitch', 'track'])
    expect(shownCount(ordered)).toBe(4) // nothing useful within 20 m: the nearest 5 (all 4 here)
    expect(shownCount(orderPlaces([p('pitch', 5), p('bank', 12), p('pharmacy', 40)]))).toBe(1) // only the bank is useful and close
  })
})
