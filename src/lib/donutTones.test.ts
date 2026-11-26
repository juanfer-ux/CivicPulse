import { describe, expect, it } from 'vitest'
import { donutTone } from '@/lib/donutTones'

describe('donutTone', () => {
  it('goes from the brightest shade to the dimmest and keeps it past the fifth slice', () => {
    expect(donutTone(0)).toEqual({ color: 'var(--cobalt-200)', opacity: 1 })
    expect(donutTone(2)).toEqual({ color: 'var(--cobalt-300)', opacity: 0.7 })
    expect(donutTone(7)).toEqual(donutTone(4))
  })
})
