import { describe, expect, it } from 'vitest'
import { isAllowedRedirect } from './redirect'

// Regression test for today's security audit: the invite-user edge function used to trust the
// client-supplied redirect_to URL unchecked, which let a stolen Super Admin token point an
// invitation email at a phishing domain. Locks in the fix (supabase/functions/invite-user/index.ts).
describe('isAllowedRedirect', () => {
  it('allows the deployed app origin', () => {
    expect(isAllowedRedirect('https://civicpulse-bogota.vercel.app')).toBe(true)
    expect(isAllowedRedirect('https://civicpulse-bogota.vercel.app/some/path?x=1')).toBe(true)
    expect(isAllowedRedirect('https://civic-pulse-oct-8.vercel.app')).toBe(true)
    expect(isAllowedRedirect('https://civic-pulse-oct-8.vercel.app/some/path?x=1')).toBe(true)
  })

  it('allows localhost and 127.0.0.1 at any port, for development', () => {
    expect(isAllowedRedirect('http://localhost:5173')).toBe(true)
    expect(isAllowedRedirect('http://localhost:5175/')).toBe(true)
    expect(isAllowedRedirect('http://127.0.0.1:4000')).toBe(true)
  })

  it('rejects an attacker-controlled domain (the open-redirect this fix closes)', () => {
    expect(isAllowedRedirect('https://evil.example.com')).toBe(false)
    expect(isAllowedRedirect('https://civic-pulse-oct-8.vercel.app.evil.com')).toBe(false)
    expect(isAllowedRedirect('https://civicpulse-bogota.vercel.app.evil.com')).toBe(false)
    expect(isAllowedRedirect('https://evil.com/?redirect=civic-pulse-oct-8.vercel.app')).toBe(false)
  })

  it('rejects a lookalike scheme or host (https on localhost, http on the real app)', () => {
    expect(isAllowedRedirect('https://localhost:5173')).toBe(false)
    expect(isAllowedRedirect('http://civic-pulse-oct-8.vercel.app')).toBe(false)
  })

  it('rejects garbage input instead of throwing', () => {
    expect(isAllowedRedirect('not a url')).toBe(false)
    expect(isAllowedRedirect('')).toBe(false)
    expect(isAllowedRedirect('javascript:alert(1)')).toBe(false)
  })
})
