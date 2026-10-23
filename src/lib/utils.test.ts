import { describe, expect, it } from 'vitest'
import { cn, initials, shortName } from '@/lib/utils'

describe('cn', () => {
  it('keeps a text style when a text color follows it', () => {
    expect(cn('text-label', 'text-primary-foreground')).toBe('text-label text-primary-foreground')
  })
  it('lets the small button text replace the default button text', () => {
    expect(cn('text-button', 'text-button-sm')).toBe('text-button-sm')
  })
  it('still lets a later text style replace an earlier one', () => {
    expect(cn('text-body', 'text-label')).toBe('text-label')
  })
})

describe('shortName and initials', () => {
  it('keeps first name and first surname', () => {
    expect(shortName('Juan Fernando Pérez Gómez')).toBe('Juan Pérez')
    expect(shortName('Juan Fernando Murcia')).toBe('Juan Murcia')
    expect(shortName('Juan Pérez Gómez')).toBe('Juan Gómez')
    expect(shortName('Juan Pérez')).toBe('Juan Pérez')
    expect(shortName('Juan')).toBe('Juan')
    expect(shortName(null)).toBe('')
  })
  it('makes initials', () => {
    expect(initials('juan Fernando Pérez Gómez')).toBe('JP')
    expect(initials('')).toBe('')
  })
})
