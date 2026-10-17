import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
const { diffCodes, statusOf } = await import('@/lib/users')

describe('diffCodes', () => {
  it('returns only what to add and what to remove', () => {
    expect(diffCodes([1, 2, 3], [2, 3, 4])).toEqual({ add: [4], remove: [1] })
  })
  it('does nothing when nothing changed', () => {
    expect(diffCodes(['parking'], ['parking'])).toEqual({ add: [], remove: [] })
  })
  it('handles starting from nothing and clearing everything', () => {
    expect(diffCodes([], [8, 9])).toEqual({ add: [8, 9], remove: [] })
    expect(diffCodes([8, 9], [])).toEqual({ add: [], remove: [8, 9] })
  })
})

describe('statusOf', () => {
  it('treats a user without a role as pending, even though the account is active', () => {
    expect(statusOf({ role: null, is_active: true })).toBe('pending')
  })
  it('distinguishes active from switched off', () => {
    expect(statusOf({ role: 'specialist_operator', is_active: true })).toBe('active')
    expect(statusOf({ role: 'locality_admin', is_active: false })).toBe('off')
  })
})
