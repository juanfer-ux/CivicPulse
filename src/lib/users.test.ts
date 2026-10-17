import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
const { diffCodes, statusOf, validateInvite, specialtyOf } = await import('@/lib/users')

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
  it('keeps an invited person pending until they accept, then active', () => {
    expect(statusOf({ role: 'specialist_operator', is_active: true, invitation_pending: true })).toBe('pending')
    expect(statusOf({ role: 'specialist_operator', is_active: true, invitation_pending: false })).toBe('active')
  })
  it('distinguishes active from switched off', () => {
    expect(statusOf({ role: 'specialist_operator', is_active: true })).toBe('active')
    expect(statusOf({ role: 'locality_admin', is_active: false })).toBe('off')
  })
})

const form = { full_name: 'Ana', email: 'ana@example.test', role: 'specialist_operator' as const, localities: [8], categories: ['parking'] }
const cats = [{ code: 'parking', name: 'Parking', specialization: 'traffic' }]
const specs = [
  { code: 'traffic', name: 'Traffic', sort: 1 },
  { code: 'infrastructure', name: 'Infrastructure', sort: 2 },
]

describe('validateInvite', () => {
  it('accepts a complete specialist', () => expect(validateInvite(form)).toBeNull())
  it('needs a name, a valid email and a role', () => {
    expect(validateInvite({ ...form, full_name: ' ' })).toMatch(/name/)
    expect(validateInvite({ ...form, email: 'nope' })).toMatch(/email/)
    expect(validateInvite({ ...form, role: '' })).toMatch(/role/)
  })
  it('needs localities for everyone except a Super Admin', () => {
    expect(validateInvite({ ...form, localities: [] })).toMatch(/locality/)
    expect(validateInvite({ ...form, role: 'locality_admin', localities: [] })).toMatch(/locality/)
    expect(validateInvite({ ...form, role: 'super_admin', localities: [], categories: [] })).toBeNull()
  })
  it('needs at least one category for a specialist', () => {
    expect(validateInvite({ ...form, categories: [] })).toMatch(/category/)
  })
  it('does not ask a Zone Admin for categories', () => {
    expect(validateInvite({ ...form, role: 'locality_admin', categories: [] })).toBeNull()
  })
})

describe('specialtyOf', () => {
  it('names the specialty from the categories a specialist holds', () => {
    expect(specialtyOf({ role: 'specialist_operator', categories: ['parking'] }, { categories: cats, specializations: specs })).toEqual(['Traffic'])
  })
  it('is empty for other roles and for specialists without categories', () => {
    expect(specialtyOf({ role: 'locality_admin', categories: ['parking'] }, { categories: cats, specializations: specs })).toEqual([])
    expect(specialtyOf({ role: 'specialist_operator', categories: [] }, { categories: cats, specializations: specs })).toEqual([])
  })
})
