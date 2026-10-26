import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
const { NO_FILTERS, isFiltered } = await import('@/components/FilterBar')

describe('isFiltered', () => {
  it('is false with no filters and true as soon as one is set', () => {
    expect(isFiltered(NO_FILTERS)).toBe(false)
    expect(isFiltered({ ...NO_FILTERS, statuses: ['pending'] })).toBe(true)
    expect(isFiltered({ ...NO_FILTERS, days: 7 })).toBe(true)
    expect(isFiltered({ ...NO_FILTERS, locality: '8' })).toBe(true)
    expect(isFiltered({ ...NO_FILTERS, categories: ['parking'] })).toBe(true)
  })
})
