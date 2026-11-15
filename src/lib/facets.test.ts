import { describe, expect, it } from 'vitest'
import { facetCounts, type FacetFilters, type FacetRow } from '@/lib/facets'

const NOW = Date.parse('2026-11-15')
const D = 86_400_000
const rows: FacetRow[] = [
  { problem: false, locality: 1, category: 'parking', at: NOW - 2 * D, group: 'pending' },
  { problem: false, locality: 1, category: 'illegal_dumping', at: NOW - 40 * D, group: 'approved' },
  { problem: true, locality: 2, category: 'parking', at: NOW - 5 * D, status: 'active' },
]
const none: FacetFilters = { locality: '', categories: [], statuses: [], problemStatuses: [], days: 0 }

describe('facetCounts', () => {
  it('counts each option against every other filter', () => {
    const c = facetCounts(rows, { ...none, categories: ['parking'] }, NOW, [1, 2], ['parking', 'illegal_dumping'], [7, 30, 0])
    expect(c.locality).toEqual({ 1: 1, 2: 1 })
    expect(c.category).toEqual({ parking: 2, illegal_dumping: 1 }) // its own filter is replaced, not added
    expect(c.days).toEqual({ 7: 2, 30: 2, 0: 2 })
  })
  it('gives 0 to a combination that leaves nothing', () => {
    const c = facetCounts(rows, { ...none, locality: '2' }, NOW, [1, 2], ['parking', 'illegal_dumping'], [7, 0])
    expect(c.category.illegal_dumping).toBe(0)
  })
  it('a status filter of one kind does not hide the other kind', () => {
    const c = facetCounts(rows, { ...none, statuses: ['approved'] }, NOW, [1, 2], ['parking'], [0])
    expect(c.category.parking).toBe(1) // only the recurrence: the pending incident is not approved
  })
})
