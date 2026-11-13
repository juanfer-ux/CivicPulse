import { describe, expect, it } from 'vitest'
import { activeRow } from '@/lib/sidebarActive'

describe('sidebar active row', () => {
  const base = { selected: null, pick: null, exploring: false, activeId: 3 }
  it('is the open recurrence or incident when nothing was clicked after it', () => {
    expect(activeRow({ ...base, selected: { kind: 'recurrence', id: 'pr1' }, exploring: true })).toEqual({ kind: 'recurrence', id: 'pr1' })
    expect(activeRow({ ...base, selected: { kind: 'incident', id: 'cp1' } })).toEqual({ kind: 'incident', id: 'cp1' })
  })
  it('is the row clicked after the recurrence or incident was opened (Explore, an investigation, a new recurrence)', () => {
    const selected = { kind: 'recurrence' as const, id: 'pr1' }
    expect(activeRow({ ...base, selected, pick: { kind: 'explore' } })).toEqual({ kind: 'explore' })
    expect(activeRow({ ...base, selected, pick: { kind: 'chat', id: 7 } })).toEqual({ kind: 'chat', id: 7 })
    expect(activeRow({ ...base, selected, pick: { kind: 'case', id: 2 } })).toEqual({ kind: 'case', id: 2 })
  })
  it('falls back to Explore, then the open investigation', () => {
    expect(activeRow({ ...base, exploring: true })).toEqual({ kind: 'explore' })
    expect(activeRow(base)).toEqual({ kind: 'chat', id: 3 })
  })
})
