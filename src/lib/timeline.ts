import type { ProblemDetailData } from '@/lib/problems' // type only: erased at build time, so this file needs no Supabase

/** The lanes of a problem's history chart, top to bottom. A lane is only drawn when it has something in it. */
export type Lane = 'occurrence' | 'report' | 'intervention' | 'event'
export const LANE_LABEL: Record<Lane, string> = { occurrence: 'Occurrences', report: 'Reports', intervention: 'Interventions', event: 'Events' }
const LANE_ORDER: Lane[] = ['occurrence', 'report', 'intervention', 'event']

export interface TimelinePoint {
  id: string
  lane: Lane
  /** Where it sits on the time axis (ms) and on the lane axis (top lane = highest number). */
  t: number
  y: number
  /** Occurrences: the number of reports (the dot's size). Everything else: 1. */
  size: number
  /** What the tooltip says. */
  text: string
  incidentId?: string
  occurrenceId?: string
  interventionId?: string
  proposed?: boolean
}

export interface Timeline {
  points: TimelinePoint[]
  lanes: { lane: Lane; y: number; label: string }[]
  /** The time axis: the data's range with a little room on each side, and where the tick labels go. */
  domain: [number, number]
  ticks: number[]
  /** Months for a history of more than 90 days (with the year from a year up), otherwise days. */
  mode: 'month' | 'day'
  withYear: boolean
  /** Pixels the chart needs so many occurrences stay readable: the box scrolls sideways when this is wider than it. */
  minWidth: number
}

const DAY = 86_400_000
const PX_PER_OCCURRENCE = 36
const AXIS_PX = 40 // the margins around the plot
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const day = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/** The label under a tick. */
export function tickLabel(t: number, mode: 'month' | 'day', withYear: boolean) {
  if (mode === 'day') return day(t)
  const d = new Date(t)
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  return withYear ? `${month} ’${String(d.getFullYear()).slice(2)}` : month // "Oct ’26", never "Oct 26" (that reads as a day)
}

/** One mark per thing in the problem's history, on a time axis to scale. `label` turns a database code ("tow") into words. */
export function buildTimeline(detail: ProblemDetailData, label: (code: string) => string): Timeline {
  const incidents = new Map(detail.incidents.map((i) => [i.id, i]))
  const occN = new Map(detail.occurrences.map((o, i) => [o.occurrence_id, i + 1]))
  const raw: Omit<TimelinePoint, 'y'>[] = []

  for (const o of detail.occurrences) {
    if (!o.first_report_at) continue
    const t = Date.parse(o.first_report_at)
    raw.push({ id: `o-${o.occurrence_id}`, lane: 'occurrence', t, size: Math.max(1, o.reports_n), occurrenceId: o.occurrence_id, text: `Occurrence ${occN.get(o.occurrence_id)} · ${day(t)} · ${o.reports_n} ${o.reports_n === 1 ? 'report' : 'reports'}` })
  }
  for (const l of detail.links) {
    const i = incidents.get(l.incident_id)
    if (!i) continue
    const proposed = l.state === 'proposed'
    raw.push({ id: `r-${l.incident_id}`, lane: 'report', t: Date.parse(i.occurred_at), size: 1, incidentId: l.incident_id, occurrenceId: l.occurrence_id ?? undefined, proposed, text: `${i.reference} · ${detail.sources[l.incident_id] ?? 'Unknown source'} · ${when(i.occurred_at)}${proposed ? ' · Needs review' : ''}` })
  }
  for (const v of detail.interventions) {
    const t = Date.parse(v.performed_at)
    raw.push({ id: `v-${v.id}`, lane: 'intervention', t, size: 1, interventionId: v.id, text: `${day(t)} · ${label(v.action_type)} · ${v.agency} · Outcome: ${v.outcome ? label(v.outcome) : 'Not recorded yet'}` })
  }
  for (const e of detail.events) {
    const t = Date.parse(e.created_at)
    raw.push({ id: `e-${e.created_at}`, lane: 'event', t, size: 1, text: `${day(t)} · ${e.kind === 'resolved' ? 'Marked resolved by an operator' : 'Reopened by a new occurrence'}` })
  }

  const present = LANE_ORDER.filter((lane) => raw.some((p) => p.lane === lane))
  const y = (lane: Lane) => present.length - 1 - present.indexOf(lane) // the first lane gets the highest number, so it is drawn on top
  const points = raw.map((p) => ({ ...p, y: y(p.lane) })).sort((a, b) => a.t - b.t)
  const lanes = present.map((lane) => ({ lane, y: y(lane), label: LANE_LABEL[lane] }))

  const ts = points.map((p) => p.t)
  const lo = ts.length ? Math.min(...ts) : Date.now()
  const hi = ts.length ? Math.max(...ts) : Date.now()
  const span = hi - lo
  const pad = Math.max(DAY, span * 0.04)
  const domain: [number, number] = [lo - pad, hi + pad]
  const spanDays = (domain[1] - domain[0]) / DAY
  const mode = spanDays > 90 ? 'month' : 'day'
  const withYear = spanDays >= 330

  let ticks: number[]
  if (mode === 'month') {
    ticks = []
    const d = new Date(domain[0])
    d.setDate(1) // local month starts, so the label under a tick is the month it says
    d.setHours(0, 0, 0, 0)
    for (; d.getTime() <= domain[1]; d.setMonth(d.getMonth() + 1)) if (d.getTime() >= domain[0]) ticks.push(d.getTime())
  } else {
    ticks = Array.from({ length: 5 }, (_, i) => Math.round(domain[0] + ((domain[1] - domain[0]) * i) / 4))
  }

  const occurrences = points.filter((p) => p.lane === 'occurrence').length
  return { points, lanes, domain, ticks, mode, withYear, minWidth: AXIS_PX + Math.max(occurrences, 1) * PX_PER_OCCURRENCE }
}
