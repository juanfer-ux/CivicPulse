import { describe, expect, it } from 'vitest'
import { buildTimeline, tickLabel } from '@/lib/timeline'
import type { ProblemDetailData } from '@/lib/problems'

const label = (c: string) => c.charAt(0).toUpperCase() + c.slice(1)
const inc = (id: string, reference: string, at: string) => ({ id, reference, occurred_at: at }) as never
const occ = (id: string, at: string, reports_n: number) => ({ occurrence_id: id, subject_key: null, ended_at: null, ended_reason: null, reports_n, first_report_at: at, last_report_at: null, boundary_uncertain: false })

// The Figma sample: PR-00088, 3 occurrences, 2 tows, one report that only needs review.
const sample: ProblemDetailData = {
  occurrences: [occ('o1', '2026-08-12T17:18:00Z', 5), occ('o2', '2026-09-08T22:18:00Z', 4), occ('o3', '2026-10-12T17:18:00Z', 3)],
  links: [
    { incident_id: 'i1', occurrence_id: 'o1', state: 'confirmed', score: 1 },
    { incident_id: 'i2', occurrence_id: 'o2', state: 'confirmed', score: 1 },
    { incident_id: 'i3', occurrence_id: null, state: 'proposed', score: 0.5 },
  ],
  incidents: [inc('i1', 'PRK-0021', '2026-08-12T17:18:00Z'), inc('i2', 'PRK-0063', '2026-09-08T22:18:00Z'), inc('i3', 'PRK-0095', '2026-10-13T09:00:00Z')],
  sources: { i1: 'SIMUR', i2: 'Salvajes en la Via' },
  interventions: [
    { id: 'v1', action_type: 'tow', agency: 'Movilidad', performed_at: '2026-08-16T10:00:00Z', description: 'x', outcome: 'cleared' },
    { id: 'v2', action_type: 'tow', agency: 'Movilidad', performed_at: '2026-09-12T10:00:00Z', description: 'x', outcome: null },
  ],
  events: [],
}

describe('buildTimeline', () => {
  const tl = buildTimeline(sample, label)

  it('has one mark per thing, in time order, in the lanes that have something', () => {
    expect(tl.points.map((p) => p.lane).sort()).toEqual(['intervention', 'intervention', 'occurrence', 'occurrence', 'occurrence', 'report', 'report', 'report'])
    expect(tl.points.map((p) => p.t)).toEqual([...tl.points.map((p) => p.t)].sort((a, b) => a - b))
    expect(tl.lanes.map((l) => l.lane)).toEqual(['occurrence', 'report', 'intervention']) // no Events lane: there are no events
    expect(tl.lanes.map((l) => l.y)).toEqual([2, 1, 0]) // the first lane is the highest, so it is drawn on top
  })

  it('says what each mark is', () => {
    const text = (id: string) => tl.points.find((p) => p.id === id)!.text
    expect(text('o-o2')).toBe('Occurrence 2 · 8 Sept · 4 reports')
    expect(text('r-i2')).toMatch(/^PRK-0063 · Salvajes en la Via · 8 Sept, \d\d:\d\d$/)
    expect(text('r-i3')).toMatch(/^PRK-0095 · Unknown source · .* · Needs review$/)
    expect(text('v-v2')).toBe('12 Sept · Tow · Movilidad · Outcome: Not recorded yet')
  })

  it('sizes an occurrence by its reports and marks a provisional report', () => {
    expect(tl.points.find((p) => p.id === 'o-o1')!.size).toBe(5)
    expect(tl.points.find((p) => p.id === 'r-i3')!.proposed).toBe(true)
    expect(tl.points.find((p) => p.id === 'r-i1')!.proposed).toBe(false)
  })

  it('gives the time axis a little room and day ticks for a short history', () => {
    const ts = tl.points.map((p) => p.t)
    expect(tl.domain[0]).toBeLessThan(Math.min(...ts))
    expect(tl.domain[1]).toBeGreaterThan(Math.max(...ts))
    expect(tl.mode).toBe('day')
    expect(tl.ticks).toHaveLength(5)
  })
})

describe('many occurrences', () => {
  const many: ProblemDetailData = { ...sample, links: [], incidents: [], interventions: [], occurrences: Array.from({ length: 60 }, (_, i) => occ(`o${i}`, new Date(Date.UTC(2025, 0, 1) + i * 12 * 86_400_000).toISOString(), 2)) }
  const tl = buildTimeline(many, label)

  it('keeps every occurrence, uses months with the year, and gets wider so the box can scroll', () => {
    expect(tl.points).toHaveLength(60)
    expect(new Set(tl.points.map((p) => p.id)).size).toBe(60)
    expect(tl.mode).toBe('month')
    expect(tl.withYear).toBe(true)
    expect(tl.ticks.length).toBeGreaterThan(18)
    expect(tl.minWidth).toBeGreaterThan(buildTimeline(sample, label).minWidth)
  })

  it('names a month tick with its year', () => expect(tickLabel(new Date(2026, 0, 1).getTime(), 'month', true)).toBe('Jan ’26'))
})

describe('an empty history', () => {
  it('has no marks and no lanes', () => {
    const tl = buildTimeline({ ...sample, occurrences: [], links: [], incidents: [], interventions: [], events: [] }, label)
    expect(tl.points).toEqual([])
    expect(tl.lanes).toEqual([])
  })
})
