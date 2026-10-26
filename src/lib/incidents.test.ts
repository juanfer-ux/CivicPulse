import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
const { STATUSES, groupOf } = await import('@/lib/incidents')

describe('groupOf', () => {
  it('maps the nine states to the four statuses', () => {
    expect(STATUSES.map((s) => [s, groupOf(s)])).toEqual([
      ['received', 'pending'],
      ['under_review', 'reviewing'],
      ['validated', 'approved'],
      ['intervention_proposed', 'approved'],
      ['intervention_approved', 'approved'],
      ['intervention_rejected', 'rejected'],
      ['resolved', 'approved'],
      ['rejected', 'rejected'],
      ['duplicate', 'rejected'],
    ])
  })
})
