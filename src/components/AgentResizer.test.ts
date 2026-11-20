import { describe, expect, it } from 'vitest'
import { AGENT_FLOOR, AGENT_MIN, MAP_MIN_SHARE, agentDefaultFor, agentMaxFor } from '@/components/AgentResizer'

describe('agent panel limits', () => {
  it('the table by viewport, 920 / 1,100 / 1,250, when the map has room', () => {
    expect(agentMaxFor(2560)).toBe(1250)
    expect(agentMaxFor(2101 + 400)).toBe(1250)
    expect(agentMaxFor(2100)).toBe(1100)
    expect(agentMaxFor(1920)).toBe(1017) // 53 % of 1,920, under the table's 1,100
  })
  it('never leaves the map under 47 % of the viewport (down to the floor)', () => {
    for (const [w, s] of [[1440, 0], [1600, 0], [1601, 0], [1920, 320], [2100, 0], [2560, 320]]) {
      const panel = agentMaxFor(w, s)
      expect(w - s - panel).toBeGreaterThanOrEqual(w * MAP_MIN_SHARE - 1)
    }
    expect(agentMaxFor(1440, 320)).toBe(AGENT_FLOOR) // 443 left: the floor holds, the sidebar has to give way
    expect(agentMaxFor(1600, 0)).toBe(848)
  })
  it('it opens at 920, 1,000 or 1,100 by viewport (the app then caps it at the maximum)', () => {
    expect(agentDefaultFor(1600)).toBe(920)
    expect(agentDefaultFor(1601)).toBe(1000)
    expect(agentDefaultFor(2100)).toBe(1000)
    expect(agentDefaultFor(2101)).toBe(1100)
    expect(AGENT_FLOOR).toBeLessThan(AGENT_MIN)
  })
})
