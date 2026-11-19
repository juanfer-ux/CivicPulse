import { describe, expect, it, vi } from 'vitest'
import { take, warm } from '@/lib/warm'

describe('warm and take', () => {
  it('a warmed call is answered once from the early request, then asks again', async () => {
    const load = vi.fn().mockResolvedValue(1)
    warm('k', load)
    expect(await take('k', load)).toBe(1)
    expect(load).toHaveBeenCalledTimes(1)
    expect(await take('k', load)).toBe(1)
    expect(load).toHaveBeenCalledTimes(2)
  })
  it('the latest warm wins', async () => {
    warm('u', () => Promise.resolve('first'))
    warm('u', () => Promise.resolve('second'))
    expect(await take('u', () => Promise.resolve('none'))).toBe('second')
  })
})
