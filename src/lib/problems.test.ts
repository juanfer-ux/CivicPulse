import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSupabaseMock } from '@/test/mockSupabase'

const mock = vi.hoisted(() => ({ supabase: null as unknown }))
vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return mock.supabase
  },
}))
import { PROBLEM_STATUS, PROBLEM_STATUSES } from '@/lib/statusColors'
const { fetchProblemDetail, fetchProblems } = await import('@/lib/problems')

const ok = (data: unknown) => ({ data, error: null })

describe('problem statuses', () => {
  it('has its own four statuses, each with a label and a color token', () => {
    expect(PROBLEM_STATUSES).toEqual(['active', 'monitoring', 'resolved', 'archived'])
    for (const s of PROBLEM_STATUSES) {
      expect(PROBLEM_STATUS[s].label).toBeTruthy()
      expect(PROBLEM_STATUS[s].token).toMatch(/^--map-problem-/)
    }
  })
})

describe('fetchProblems', () => {
  beforeEach(() => {
    mock.supabase = makeSupabaseMock({
      problems: ok([{ id: 'p1', reference: 'PR-00001', title: 't', category: 'parking', locality_code: 2, lat: 4.6, lng: -74.0, location_description: 'x', status: 'active' }]),
      problem_stats: ok([{ problem_id: 'p1', occurrences_n: 4, recurrences_n: 3, reports_n: 22, interventions_n: 3, uncertain_n: 0, first_seen: null, last_seen: '2026-10-01T00:00:00Z', quiet: false }]),
    })
  })

  it('joins each problem with its stats, and recurrence counts occurrences, not reports', async () => {
    const [p] = await fetchProblems()
    expect(p).toMatchObject({ id: 'p1', occurrences_n: 4, recurrences_n: 3, reports_n: 22 })
    expect(p.recurrences_n).toBeLessThan(p.reports_n)
  })

  it('rejects when the layer is not in the database yet, so the caller can fall back to incidents', async () => {
    mock.supabase = makeSupabaseMock({ problems: { data: null, error: new Error('relation "problems" does not exist') } })
    await expect(fetchProblems()).rejects.toThrow('does not exist')
  })
})

describe('fetchProblemDetail', () => {
  it('names each report by its platform and keeps the latest intervention result', async () => {
    mock.supabase = makeSupabaseMock({
      occurrence_stats: ok([{ occurrence_id: 'o1', subject_key: null, ended_at: null, ended_reason: null, reports_n: '5', first_report_at: 'a', last_report_at: 'b', boundary_uncertain: false }]),
      incident_current_link: ok([{ incident_id: 'i1', occurrence_id: 'o1', state: 'confirmed', score: 90 }]),
      interventions: ok([{ id: 'v1', action_type: 'tow', agency: 'a', performed_at: 'c', description: 'd', intervention_results: [{ id: 1, outcome: 'partial' }, { id: 2, outcome: 'cleared' }] }]),
      problem_events: ok([]),
      source_platforms: ok([{ code: 'simur', name: 'SIMUR' }]),
      incidents: ok([{ id: 'i1' }]),
      incident_sources: ok([{ incident_id: 'i1', platform: 'simur' }]),
    })
    const d = await fetchProblemDetail('p1')
    expect(d.sources).toEqual({ i1: 'SIMUR' })
    expect(d.interventions[0].outcome).toBe('cleared')
    expect(d.occurrences[0].reports_n).toBe(5)
  })
})

describe('fetchLinkedIncidentIds', () => {
  it('returns the ids of incidents a problem already stands for', async () => {
    mock.supabase = makeSupabaseMock({ incident_current_link: ok([{ incident_id: 'a', problem_id: 'p' }, { incident_id: 'b', problem_id: 'p' }]) })
    const { fetchLinkedIncidentIds } = await import('@/lib/problems')
    expect([...(await fetchLinkedIncidentIds())]).toEqual([['a', 'p'], ['b', 'p']])
  })
})
