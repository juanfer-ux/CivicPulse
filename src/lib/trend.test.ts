import { describe, expect, it } from 'vitest'
import { trendOf } from '@/lib/trend'

describe('trendOf', () => {
  it('says low when there are too few reports to judge', () => {
    expect(trendOf(2, 2)).toBe('low')
    expect(trendOf(0, 0)).toBe('low')
  })
  it('compares the last 30 days with the 30 before', () => {
    expect(trendOf(12, 8)).toBe('above')
    expect(trendOf(8, 12)).toBe('below')
    expect(trendOf(10, 10)).toBe('about')
    expect(trendOf(11, 10)).toBe('about') // +10 %, inside the usual range
  })
})
