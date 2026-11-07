import { describe, expect, it } from 'vitest'
import { initials } from '@/lib/sourceInitials'

describe('initials', () => {
  it('takes the first two letters of an acronym', () => {
    expect(initials('UAESP operational records')).toBe('UA')
    expect(initials('SIMUR (Yo reporto tránsito)')).toBe('SI')
  })
  it('takes the first letters of the first two meaningful words', () => {
    expect(initials('Community reporting channel')).toBe('CR')
    expect(initials('Bogotá te Escucha')).toBe('BE')
    expect(initials('Salvajes en la Vía')).toBe('SV')
    expect(initials('Civic Pulse direct report')).toBe('CP')
  })
  it('never returns an empty tile', () => {
    expect(initials('')).toBe('?')
    expect(initials('Unknown source')).toBe('US')
  })
})
