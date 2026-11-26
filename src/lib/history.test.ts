import { describe, expect, it } from 'vitest'
import { groupHistory } from '@/lib/history'
import type { InterventionRow, OccurrenceRow } from '@/lib/problems'

const occ = (id: string, at: string) => ({ occurrence_id: id, first_report_at: at }) as OccurrenceRow
const iv = (id: string, at: string) => ({ id, performed_at: at }) as InterventionRow

describe('groupHistory', () => {
  it('orders occurrences oldest first and puts each intervention with the occurrence before it', () => {
    const g = groupHistory([occ('b', '2026-08-12'), occ('a', '2026-08-02')], [iv('v1', '2026-08-05'), iv('v2', '2026-08-16'), iv('v0', '2026-07-01')], [])
    expect(g.map((x) => [x.occurrence.occurrence_id, x.number, x.interventions.map((v) => v.id)])).toEqual([['a', 1, ['v1', 'v0']], ['b', 2, ['v2']]])
  })
})
