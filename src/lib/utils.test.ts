import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('keeps a text style when a text color follows it', () => {
    expect(cn('text-label', 'text-primary-foreground')).toBe('text-label text-primary-foreground')
  })
  it('still lets a later text style replace an earlier one', () => {
    expect(cn('text-body', 'text-label')).toBe('text-label')
  })
})
