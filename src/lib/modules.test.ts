import { describe, expect, it } from 'vitest'
import { ZONES, canDock, fitsZone, isVisible, place, rightUsed, suggestedZone, zoneHeight, type Placed } from '@/lib/modules'

const zone = (id: string) => ZONES.find((z) => z.id === id)!

describe('modules', () => {
  it('lights only the zones a module supports and suggests its first choice', () => {
    expect(ZONES.filter((z) => fitsZone('numbers', z)).map((z) => z.id)).toEqual(['r1', 'r2'])
    expect(ZONES.filter((z) => fitsZone('timeline', z)).map((z) => z.id)).toEqual(['r1', 'r2', 'b1'])
    expect(suggestedZone('timeline')).toBe('b1') // the wide strip
    expect(suggestedZone('numbers')).toBe('r1')
  })

  it('sizes a zone by its ratio', () => {
    expect([zoneHeight(zone('r1')), zoneHeight(zone('r2')), zoneHeight(zone('b1'))]).toEqual([150, 200, 180])
  })

  it('docks into a fitting zone, replaces what was there and moves a module that was docked elsewhere', () => {
    let list: Placed[] = []
    list = place(list, zone('b1'), 'timeline', 'pr1')
    list = place(list, zone('r1'), 'numbers', 'pr1')
    expect(list.map((p) => p.zone)).toEqual(['b1', 'r1'])
    list = place(list, zone('r1'), 'timeline', 'pr1') // timeline moves to r1, numbers there is replaced
    expect(list).toEqual([{ zone: 'r1', type: 'timeline', target: 'pr1' }])
    expect(place(list, zone('b1'), 'numbers', null)).toBe(list) // numbers does not fit the wide strip
  })

  it('refuses a recurrence module while an incident is open', () => {
    expect(canDock('timeline', 'incident')).toBe(false)
    expect(canDock('timeline', 'recurrence')).toBe(true)
    expect(canDock('timeline', null)).toBe(true)
  })

  it('follows the open case or stays with the one it was placed on', () => {
    const p: Placed = { zone: 'r1', type: 'numbers', target: 'pr1' }
    expect(isVisible(p, true, 'pr2')).toBe(true)
    expect(isVisible(p, false, 'pr2')).toBe(false)
    expect(isVisible(p, false, 'pr1')).toBe(true)
    expect(rightUsed([p], false, 'pr2')).toBe(false)
    expect(rightUsed([p], true, 'pr2')).toBe(true)
  })
})
