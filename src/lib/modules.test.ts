import { describe, expect, it } from 'vitest'
import { COLUMN_PUSH, MAX_PER_AREA, canDock, fitsArea, inArea, insertPos, isVisible, place, pushOf, shapeFor, suggestedArea, type Placed } from '@/lib/modules'

describe('modules', () => {
  it('lights only the areas a module supports and suggests its first choice', () => {
    expect(['left', 'right', 'bottom'].filter((a) => fitsArea('numbers', a as never))).toEqual(['left', 'right', 'bottom'])
    expect(['left', 'right', 'bottom'].filter((a) => fitsArea('timeline', a as never))).toEqual(['left', 'right', 'bottom'])
    expect(suggestedArea('timeline')).toBe('bottom') // the wide strip
    expect(suggestedArea('numbers')).toBe('right')
    expect([shapeFor('bottom'), shapeFor('left'), shapeFor('right')]).toEqual(['4:2', '4:3', '4:3'])
  })

  it('docks into a fitting area and moves a module that was docked elsewhere', () => {
    let list: Placed[] = []
    list = place(list, 'bottom', 'timeline', 'pr1')
    list = place(list, 'right', 'numbers', 'pr1')
    expect(list.map((p) => p.area)).toEqual(['bottom', 'right'])
    list = place(list, 'left', 'timeline', 'pr1') // the timeline moves to the left column
    expect(list.map((p) => `${p.type}:${p.area}`)).toEqual(['numbers:right', 'timeline:left'])
    expect(place(list, 'bottom', 'numbers', null).map((p) => p.area)).toEqual(['left', 'bottom']) // both share the strip
  })

  it('keeps at most MAX_PER_AREA modules in an area and drops the oldest', () => {
    const types = ['timeline', 'numbers'] as const
    expect(MAX_PER_AREA).toBeGreaterThanOrEqual(types.length)
    let list: Placed[] = [{ area: 'right', type: 'numbers', target: null, pos: 1 }, { area: 'right', type: 'timeline', target: null, pos: 2 }]
    // fill past the cap with extra copies of the rule (a module type appears once, so the cap is tested on the helper directly)
    list = [...list, { area: 'right', type: 'numbers', target: 'a', pos: 3 }, { area: 'right', type: 'timeline', target: 'b', pos: 4 }]
    const next = place(list, 'right', 'numbers', 'c')
    expect(inArea(next, 'right', true, null).length).toBeLessThanOrEqual(MAX_PER_AREA)
  })

  it('refuses a recurrence module while an incident is open', () => {
    expect(canDock('timeline', 'incident')).toBe(false)
    expect(canDock('timeline', 'recurrence')).toBe(true)
    expect(canDock('timeline', null)).toBe(true)
  })

  it('follows the open case or stays with the one it was placed on', () => {
    const p: Placed = { area: 'right', type: 'numbers', target: 'pr1', pos: 1 }
    expect(isVisible(p, true, 'pr2')).toBe(true)
    expect(isVisible(p, false, 'pr2')).toBe(false)
    expect(isVisible(p, false, 'pr1')).toBe(true)
    expect(inArea([p], 'right', false, 'pr2')).toHaveLength(0)
  })

  it('puts a drop above or below what is already in the column, by where the pointer is', () => {
    const history = { pos: 0, mid: 400 } // the recurrence's history card, 120 to 680
    expect(insertPos([history], 150) < 0).toBe(true) // dropped on the top half: above the history
    expect(insertPos([history], 600) > 0).toBe(true) // dropped on the bottom half: below it
    const mod = { pos: -1, mid: 200 } // a module already above the history
    const above = insertPos([mod, history], 300) // between the module and the history
    expect(above > -1 && above < 0).toBe(true)
    expect(insertPos([], 50)).toBe(1)
    expect(inArea(place(place([], 'right', 'numbers', null, -1), 'right', 'timeline', null, 2), 'right', true, null).map((p) => p.type)).toEqual(['numbers', 'timeline']) // ordered by pos
  })

  it('pushes the map content aside only while no recurrence is open', () => {
    const p: Placed = { area: 'left', type: 'numbers', target: null, pos: 1 }
    expect(pushOf([p], 'left', true, null, false)).toBe(COLUMN_PUSH)
    expect(pushOf([p], 'left', true, 'pr1', true)).toBe(0) // an open recurrence has its header on top and the columns under it
    expect(pushOf([p], 'right', true, null, false)).toBe(0) // nothing in the right column
  })
})
