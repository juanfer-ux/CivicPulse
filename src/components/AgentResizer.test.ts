import { describe, expect, it } from 'vitest'
import { AGENT_DEFAULT, AGENT_MIN, agentMaxFor } from '@/components/AgentResizer'

describe('agent panel limits', () => {
  it('the maximum follows the viewport: 920, 1,100, 1,250', () => {
    expect(agentMaxFor(1440)).toBe(920)
    expect(agentMaxFor(1600)).toBe(920)
    expect(agentMaxFor(1601)).toBe(1100)
    expect(agentMaxFor(1921)).toBe(1100)
    expect(agentMaxFor(2100)).toBe(1100)
    expect(agentMaxFor(2101)).toBe(1250)
  })
  it('opens at 920, between the minimum and every maximum', () => {
    expect(AGENT_DEFAULT).toBe(920)
    expect(AGENT_DEFAULT).toBeGreaterThan(AGENT_MIN)
  })
})
