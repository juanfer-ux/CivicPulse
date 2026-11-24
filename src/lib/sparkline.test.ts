import { describe, expect, it } from 'vitest'
import { buckets, sparkPoints } from '@/lib/sparkline'

const DAY = 86_400_000
describe('sparkline', () => {
  it('counts reports per 12-day bucket back from the newest, oldest first, ignoring older ones', () => {
    const end = 100 * DAY
    expect(buckets([end, end - 1 * DAY, end - 13 * DAY, end - 59 * DAY, end - 61 * DAY], end)).toEqual([1, 0, 0, 1, 2])
  })
  it('puts the peak at the top and finds it', () => {
    const { pts, peak } = sparkPoints([1, 4, 2, 4, 0], 100, 40)
    expect(peak).toBe(3)
    expect(pts[3][1]).toBe(1)
    expect(pts[4][1]).toBe(39)
    expect(sparkPoints([3, 5, 9], 10, 32).pts[0][1]).toBe(31) // the lowest value touches the bottom even when it is not zero
    expect(sparkPoints([0, 0], 10, 10).pts[0][1]).toBe(9) // flat: at the bottom, no NaN
  })
})

describe('smoothPath', () => {
  it('goes through every point and keeps a peak as the highest point (no overshoot)', async () => {
    const { smoothPath } = await import('@/lib/sparkline')
    const d = smoothPath([[0, 10], [10, 0], [20, 10]] as const)
    expect(d.startsWith('M0,10C')).toBe(true)
    expect(d.endsWith(' 20,10')).toBe(true)
    expect(d).toContain(' 10,0C') // the middle point is an anchor
    expect(smoothPath([[1, 2]] as const)).toBe('M1,2')
  })
})
