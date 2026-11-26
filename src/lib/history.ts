import type { InterventionRow, OccurrenceRow, ProblemEvent } from '@/lib/problems'

export interface HistoryGroup { occurrence: OccurrenceRow; number: number; interventions: InterventionRow[]; events: ProblemEvent[] }

/** The history of a recurrence, one group per occurrence (oldest first), each with the interventions and events that came after it started and before the next occurrence did (owner's Figma Recurrence Right Column, 2026-11-25). Anything older than the first occurrence goes with the first one. Occurrences without a dated report are left out. */
export function groupHistory(occurrences: OccurrenceRow[], interventions: InterventionRow[], events: ProblemEvent[]): HistoryGroup[] {
  const dated = occurrences.filter((o) => o.first_report_at).sort((a, b) => Date.parse(a.first_report_at!) - Date.parse(b.first_report_at!))
  const groups: HistoryGroup[] = dated.map((occurrence, i) => ({ occurrence, number: i + 1, interventions: [], events: [] }))
  const groupFor = (at: string) => groups.findLast((g) => Date.parse(g.occurrence.first_report_at!) <= Date.parse(at)) ?? groups[0]
  for (const v of interventions) groupFor(v.performed_at)?.interventions.push(v)
  for (const e of events) groupFor(e.created_at)?.events.push(e)
  return groups
}
