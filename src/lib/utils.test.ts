import { describe, expect, it } from 'vitest'
import { cn, initials, shortName, timeBlockLabel } from '@/lib/utils'

describe('cn', () => {
  it('keeps a text style when a text color follows it', () => {
    expect(cn('text-label', 'text-primary-foreground')).toBe('text-label text-primary-foreground')
    expect(cn('text-section-label', 'text-primary-foreground')).toBe('text-section-label text-primary-foreground')
  })
  it('lets the small button text replace the default button text', () => {
    expect(cn('text-button', 'text-button-sm')).toBe('text-button-sm')
  })
  it('still lets a later text style replace an earlier one', () => {
    expect(cn('text-body', 'text-label')).toBe('text-label')
  })
  it('knows the display, medium and strong styles (2026-11-02)', () => {
    expect(cn('text-meta-medium', 'text-foreground')).toBe('text-meta-medium text-foreground')
    expect(cn('text-caption-strong', 'text-foreground')).toBe('text-caption-strong text-foreground')
    expect(cn('text-display-sm', 'text-foreground')).toBe('text-display-sm text-foreground')
    expect(cn('text-meta', 'text-meta-medium')).toBe('text-meta-medium')
    expect(cn('text-title-regular', 'text-foreground')).toBe('text-title-regular text-foreground')
    expect(cn('text-subtitle', 'text-subtitle-regular')).toBe('text-subtitle-regular')
  })
  it('treats the two display fonts as one group', () => {
    expect(cn('font-display', 'font-display-alt')).toBe('font-display-alt')
  })
  it('lets the display font replace the heading font on a card title', () => {
    expect(cn('font-heading text-subtitle', 'font-display text-display')).toBe('font-display text-display')
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

describe('timeBlockLabel', () => {
  it('writes the six 4-hour blocks with AM and PM', () => {
    expect([0, 1, 2, 3, 4, 5].map(timeBlockLabel)).toEqual(['12–4 AM', '4–8 AM', '8 AM–12 PM', '12–4 PM', '4–8 PM', '8 PM–12 AM'])
  })
})
