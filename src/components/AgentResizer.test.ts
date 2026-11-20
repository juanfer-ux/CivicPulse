import { describe, expect, it } from 'vitest'
import { AGENT_FLOOR, MAP_MIN_SHARE, agentDefaultFor, agentMaxFor } from '@/components/AgentResizer'

describe('agent panel limits', () => {
  it('the table by viewport, 920 / 1,100 / 1,250, when the map has room', () => {
    expect(agentMaxFor(1600)).toBe(920)
    expect(agentMaxFor(1920)).toBe(1100)
    expect(agentMaxFor(2100)).toBe(1100)
    expect(agentMaxFor(2560)).toBe(1250)
  })
  it('never leaves the map under 40 % of the viewport (down to the floor), whatever the 900 minimum says', () => {
    for (const [w, s] of [[1440, 0], [1440, 320], [1600, 0], [1920, 320], [2560, 320]]) {
      const panel = agentMaxFor(w, s)
      expect(w - s - panel).toBeGreaterThanOrEqual(w * MAP_MIN_SHARE - 1)
    }
    expect(agentMaxFor(1440, 0)).toBe(864) // 60 % of 1,440, under the table's 920
    expect(agentMaxFor(1440, 320)).toBe(544) // the sidebar's 320 comes out of the panel
    expect(agentMaxFor(1200, 320)).toBe(AGENT_FLOOR) // 400 left: the floor holds, the sidebar has to give way
  })
  it('it opens at 920, 1,000 or 1,100 by viewport (the app then caps it at the maximum)', () => {
    expect(agentDefaultFor(1600)).toBe(920)
    expect(agentDefaultFor(1601)).toBe(1000)
    expect(agentDefaultFor(2100)).toBe(1000)
    expect(agentDefaultFor(2101)).toBe(1100)
  })
})
