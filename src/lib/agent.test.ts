import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Locality } from '@/lib/incidents'

// The agent talks to Postgres only through supabase.rpc (controlled tools) and one references lookup.
const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    from: () => ({ select: () => ({ in: async () => ({ data: [{ reference: 'CP-00001' }] }) }) }),
  },
}))

const { SUGGESTIONS, WORTH_INVESTIGATING, answer, plan, rankForAttention } = await import('@/lib/agent')

const localities: Locality[] = [
  { code: 1, name: 'Usaquén' },
  { code: 2, name: 'Chapinero' },
  { code: 3, name: 'Santa Fe' },
  { code: 15, name: 'Antonio Nariño' },
]
const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

describe('plan (mock planner)', () => {
  it('routes the suggested questions to the right investigation', () => {
    expect(SUGGESTIONS.map((q) => plan(q, localities)?.kind)).toEqual([
      'attention',
      'ranking',
      'time',
      'recurring',
      'candidates',
    ])
  })

  it('sends a question about recurrences that need attention to the ranking of recurrences, and a timeline request to the timeline', () => {
    expect(plan('Which parking obstruction recurrences need the most attention?', localities)).toEqual({ kind: 'attention', category: 'parking' })
    expect(plan('I would like to see the occurrences in a different way', localities)?.kind).toBe('timeline')
    expect(plan('Show me a timeline of this recurrence', localities)?.kind).toBe('timeline')
    expect(plan('Which locations have repeated parking obstruction reports?', localities)?.kind).toBe('recurring') // unchanged
  })

  it('routes the two Worth investigating cards to the recurring investigation, each with its category', () => {
    expect(WORTH_INVESTIGATING.map((c) => plan(c.question, localities))).toMatchObject([
      { kind: 'recurring', category: 'illegal_dumping' },
      { kind: 'recurring', category: 'parking' },
    ])
  })

  it('finds a locality regardless of accents and case', () => {
    expect(plan('when do incidents happen in USAQUEN', localities)).toMatchObject({ kind: 'time', locality: { code: 1 } })
    expect(plan('has antonio narino changed in the last 7 days', localities)).toMatchObject({
      kind: 'compare',
      locality: { code: 15 },
      days: 7,
    })
  })

  it('defaults a comparison to 30 days and clamps absurd periods', () => {
    expect(plan('did it increase in Chapinero', localities)).toMatchObject({ kind: 'compare', days: 30 })
    expect(plan('did it increase over the last 9999 days', localities)).toMatchObject({ days: 365 })
  })

  it('sends "tomorrow evening" to recommendations, not the time-of-day tool', () => {
    expect(plan('what should we look at tomorrow evening?', localities)?.kind).toBe('candidates')
  })

  it('reads the category from the question, or uses all categories when none is named', () => {
    expect(plan('Which localities have the most illegal dumping incidents?', localities)).toMatchObject({
      kind: 'ranking',
      category: 'illegal_dumping',
    })
    expect(plan('most parking obstruction incidents?', localities)).toMatchObject({ category: 'parking' })
    expect(plan('Which localities have the most incidents?', localities)).toMatchObject({ category: null })
    expect(plan('most parking and dumping reports', localities)).toMatchObject({ category: null })
  })

  it('returns null for questions it cannot answer instead of guessing', () => {
    expect(plan('Should we send a tow truck?', localities)).toBeNull()
    expect(plan('hello', localities)).toBeNull()
  })
})

describe('answers', () => {
  beforeEach(() => rpc.mockReset())

  it('says it cannot answer unsupported questions and calls no tool', async () => {
    const a = await answer('Should we fine the owner of the car?', localities)
    expect(a.text).toMatch(/cannot answer/i)
    expect(a.evidence).toEqual([])
    expect(rpc).not.toHaveBeenCalled()
  })

  it('sends the category to the SQL tool and states it in the answer', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    const a = await answer('Which localities have the most illegal dumping incidents?', localities)
    expect(rpc).toHaveBeenCalledWith('tool_incidents_by_locality', expect.objectContaining({ p_category: 'illegal_dumping' }))
    expect(a.text).toMatch(/illegal dumping/i)
    rpc.mockResolvedValue({ data: [{ locality_code: 2, locality_name: 'Chapinero', incident_count: 3, first_at: ago(5), last_at: ago(1), incident_ids: ['a'] }], error: null })
    const all = await answer('Which localities have the most incidents?', localities)
    expect(rpc).toHaveBeenLastCalledWith('tool_incidents_by_locality', expect.objectContaining({ p_category: null }))
    expect(all.text).toMatch(/Category: all categories you can see/)
  })

  it('reports ties in a ranking instead of inventing a winner', async () => {
    const row = (code: number, name: string, n: number) => ({
      locality_code: code, locality_name: name, incident_count: n, first_at: ago(40), last_at: ago(1), incident_ids: ['a', 'b'],
    })
    rpc.mockResolvedValue({ data: [row(2, 'Chapinero', 10), row(1, 'Usaquén', 10), row(3, 'Santa Fe', 4)], error: null })
    const a = await answer('Which localities have the most incidents?', localities)
    expect(a.text).toContain('Chapinero and Usaquén are tied')
    expect(a.bars.map((b) => b.value)).toEqual([10, 10, 4])
  })

  describe('period comparison', () => {
    const periods = (cur: number, prev: number) => ({
      data: [
        { period: 'current', incident_count: cur, incident_ids: ['a'] },
        { period: 'previous', incident_count: prev, incident_ids: ['b'] },
      ],
      error: null,
    })
    const coverage = (firstDaysAgo: number) => ({
      data: [{ locality_code: 2, locality_name: 'Chapinero', incident_count: 1, first_at: ago(firstDaysAgo), last_at: ago(1), incident_ids: [] }],
      error: null,
    })
    const run = (cur: number, prev: number, firstDaysAgo = 200) => {
      rpc.mockImplementation(async (fn: string) =>
        fn === 'tool_period_comparison' ? periods(cur, prev) : coverage(firstDaysAgo),
      )
      return answer('Have incidents increased in Chapinero over the last 30 days?', localities)
    }

    it('computes the percentage change from SQL counts', async () => {
      const a = await run(30, 20)
      expect(a.text).toContain('increase of 50% (+10)')
    })

    it('refuses a percentage when the previous period is empty', async () => {
      const a = await run(5, 0)
      expect(a.text).toContain('percentage change cannot be calculated')
      expect(a.text).not.toMatch(/%/)
    })

    it('flags a small base and an incomplete previous period', async () => {
      const a = await run(8, 4, 40)
      expect(a.limitations.join(' ')).toMatch(/Small base/)
      expect(a.limitations.join(' ')).toMatch(/may be incomplete/)
    })

    it('does not flag a healthy sample with full coverage', async () => {
      const a = await run(40, 30, 200)
      expect(a.limitations.join(' ')).not.toMatch(/Small base|incomplete/)
    })
  })

  it('builds a human-review proposal from SQL numbers only, with no dispatch', async () => {
    rpc.mockResolvedValue({
      data: [{
        label: 'Synthetic hotspot 8-1, Kennedy', locality_code: 8, locality_name: 'Kennedy', category: 'parking', total_count: 10,
        evening_count: 8, weekday_evening_count: 1, recent_count: 4, lat: 4.6, lng: -74.1, last_at: ago(1), incident_ids: ['x', 'y'],
      }],
      error: null,
    })
    const a = await answer('Which area might deserve further investigation tomorrow evening?', localities)
    expect(a.proposal).toMatchObject({ locality_code: 8, category: 'parking', evidence: { incident_ids: ['x', 'y'] } })
    expect(a.proposal?.evidence).toMatchObject({ candidate: { evening_count: 8, total_count: 10 } })
    expect(a.proposal?.proposed_intervention).toMatch(/no dispatch/i)
    expect(a.text).toMatch(/not a prediction/)
    expect(a.limitations.join(' ')).toMatch(/No legal violation is asserted/)
  })

  it('declines to recommend when the data is empty', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    const a = await answer('Which area deserves attention tomorrow evening?', localities)
    expect(a.proposal).toBeUndefined()
    expect(a.text).toMatch(/cannot support a recommendation/)
  })

  it('surfaces tool errors rather than swallowing them', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    await expect(answer('Which localities have the most incidents?', localities)).rejects.toThrow('permission denied')
  })
})

describe('titleCase', () => {
  it('capitalizes the lowercase part after the comma and keeps short Spanish words and addresses', async () => {
    const { titleCase } = await import('@/lib/agent')
    expect(titleCase('Cra 13 #62-40, entrada del edificio Aurora')).toBe('Cra 13 #62-40, Entrada del Edificio Aurora')
    expect(titleCase('Cra 72 con Cl 80, cruce peatonal')).toBe('Cra 72 con Cl 80, Cruce Peatonal')
  })
})

describe('text casing', () => {
  it('title-cases codes and sentence-cases free text, also after a colon', async () => {
    const { titleCase, sentenceCase } = await import('@/lib/titleCase')
    expect(titleCase('human rejected')).toBe('Human Rejected')
    expect(titleCase('Access Ramp blocked by a parked vehicle')).toBe('Access Ramp Blocked by a Parked Vehicle')
    expect(sentenceCase('synthetic report: car blocking access ramp. second one')).toBe('Synthetic report: Car blocking access ramp. Second one')
  })
})

describe('recurrences that need attention', () => {
  const row = (id: string, status: string, recurrences_n: number, last_seen: string, category = 'parking') =>
    ({ id, status, recurrences_n, last_seen, category, reference: id, title: id, occurrences_n: recurrences_n + 1, reports_n: 5, interventions_n: 0 }) as never
  it('ranks Active before Monitoring, then by returns, then by the latest report, and skips the rest', () => {
    const rows = [row('m-many', 'monitoring', 9, '2026-10-30'), row('a-few', 'active', 1, '2026-10-01'), row('a-many-old', 'active', 4, '2026-08-01'), row('a-many-new', 'active', 4, '2026-10-20'), row('resolved', 'resolved', 20, '2026-10-31'), row('dump', 'active', 30, '2026-10-31', 'illegal_dumping')]
    expect(rankForAttention(rows, 'parking', 10).map((r) => r.id)).toEqual(['a-many-new', 'a-many-old', 'a-few', 'm-many'])
    expect(rankForAttention(rows, 'parking')).toHaveLength(3) // the top three by default
    expect(rankForAttention(rows, null, 1)[0].id).toBe('dump') // no category: every category
  })

  it('asks for a recurrence first when none is open', async () => {
    const a = await answer('I would like to see a timeline', localities)
    expect(a.offers).toBeUndefined()
    expect(a.text).toMatch(/Pick a recurrence first/)
  })
})
