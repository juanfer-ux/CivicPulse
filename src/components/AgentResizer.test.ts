import { describe, expect, it } from 'vitest'
import { AGENT_MIN, agentMax } from '@/components/AgentResizer'

describe('agentMax (the panel you see ends at the middle of the window)', () => {
  it('is half the window minus the sidebar', () => {
    expect(agentMax(1880, 260)).toBe(680)
    expect(agentMax(1880, 64)).toBe(876)
    expect(agentMax(2560, 260)).toBe(1020)
  })
  it('never goes under the minimum', () => {
    expect(agentMax(1200, 260)).toBe(AGENT_MIN)
  })
})
