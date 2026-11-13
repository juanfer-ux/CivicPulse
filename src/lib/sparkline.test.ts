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
    expect(pts[3][1]).toBe(0)
    expect(pts[4][1]).toBe(40)
    expect(sparkPoints([0, 0], 10, 10).pts[0][1]).toBe(10) // all zero: flat at the bottom, no NaN
  })
})
