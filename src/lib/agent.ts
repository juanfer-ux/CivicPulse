import { supabase } from '@/lib/supabase'
import type { Locality } from '@/lib/incidents'

/**
 * Civic Operations Agent, MOCK MODE.
 * A deterministic planner picks one controlled SQL tool (Postgres functions that run as the signed-in
 * user, so RLS applies) and templates the answer from the returned numbers. No LLM, no invented figures.
 * The planner is the only part an LLM Edge Function will replace; the tools and answer shape stay.
 */

export interface Bar {
  label: string
  value: number
}
export interface Evidence {
  tool: string
  scope: string
  period: string
  incidentCount: number
  references: string[]
}
export interface Answer {
  text: string
  bars: Bar[]
  evidence: Evidence[]
  limitations: string[]
  highlightIds: string[]
}

type Plan =
  | { kind: 'ranking'; days: number | null }
  | { kind: 'time'; locality: Locality | null; days: number | null }
  | { kind: 'compare'; locality: Locality | null; days: number }

const DAY = 86_400_000
const TZ = 'America/Bogota'
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SYNTHETIC = 'All records are synthetic.'
const COUNTING = 'Counts exclude reports marked duplicate or rejected.'

const date = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' })
const pct = (n: number, total: number) => Math.round((n / total) * 100)
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const SUGGESTIONS = [
  'Which localities have the most parking obstruction incidents?',
  'When do parking obstruction incidents occur most frequently in Usaquén?',
  'Have parking obstruction incidents increased in Chapinero over the last 30 days?',
]

export function plan(question: string, localities: Locality[]): Plan | null {
  const q = norm(question)
  const locality =
    [...localities].sort((a, b) => b.name.length - a.name.length).find((l) => q.includes(norm(l.name))) ?? null
  const n = q.match(/(\d+)\s*days?/)
  const days = n ? Math.min(Math.max(Number(n[1]), 1), 365) : /last week/.test(q) ? 7 : /last month/.test(q) ? 30 : null

  if (/\b(increase\w*|decrease\w*|chang\w+|trend\w*|compar\w+|versus|vs)\b/.test(q)) {
    return { kind: 'compare', locality, days: days ?? 30 }
  }
  if (/\b(when|what time|hours?|mornings?|afternoons?|evenings?|nights?|peak)\b/.test(q)) {
    return { kind: 'time', locality, days }
  }
  if (/\b(most|highest|rank\w*|top|which localit\w+|worst)\b/.test(q)) return { kind: 'ranking', days }
  return null
}

// ───────── Controlled tools (each maps to one SQL function) ─────────
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return (data ?? []) as T[]
}

interface LocalityRow {
  locality_code: number
  locality_name: string
  incident_count: number
  first_at: string
  last_at: string
  incident_ids: string[]
}
interface TimeRow {
  dow: number
  hour: number
  incident_count: number
  first_at: string
  last_at: string
  incident_ids: string[]
}
interface PeriodRow {
  period: 'current' | 'previous'
  incident_count: number
  incident_ids: string[]
}

const iso = (d: Date | null) => d?.toISOString() ?? null
const byLocality = (from: Date | null, to: Date | null) =>
  rpc<LocalityRow>('tool_incidents_by_locality', { p_from: iso(from), p_to: iso(to) })

async function references(ids: string[]) {
  if (!ids.length) return []
  const { data } = await supabase.from('incidents').select('reference').in('id', ids.slice(0, 8))
  return (data ?? []).map((r) => r.reference as string)
}

// ───────── Answers ─────────
export async function answer(question: string, localities: Locality[]): Promise<Answer> {
  const p = plan(question, localities)
  if (!p) return unsupported()
  if (p.kind === 'ranking') return ranking(p.days)
  if (p.kind === 'time') return timeOfDay(p.locality, p.days)
  return compare(p.locality, p.days)
}

function unsupported(): Answer {
  return {
    text:
      'I cannot answer that yet. In this prototype I can rank localities by incident count, show when incidents occur ' +
      'in a locality, and compare the last N days with the N days before. Recurring locations and next-shift ' +
      'recommendations are planned.',
    bars: [],
    evidence: [],
    limitations: ['I do not guess: if the data cannot support a question, I say so.'],
    highlightIds: [],
  }
}

const noData = (scope: string, period: string): Answer => ({
  text: `No incidents found for ${scope} in ${period}, within the localities you are authorized to see. I cannot draw conclusions from an empty result.`,
  bars: [],
  evidence: [{ tool: 'SQL tool', scope, period, incidentCount: 0, references: [] }],
  limitations: [COUNTING, SYNTHETIC],
  highlightIds: [],
})

async function ranking(days: number | null): Promise<Answer> {
  const to = new Date()
  const from = days ? new Date(to.getTime() - days * DAY) : null
  const rows = await byLocality(from, to)
  const period = from
    ? `the last ${days} days (${date(from)} to ${date(to)})`
    : rows.length
      ? `all available data (${date(rows.map((r) => r.first_at).sort()[0])} to ${date(rows.map((r) => r.last_at).sort().at(-1)!)})`
      : 'all available data'
  if (!rows.length) return noData('all localities', period)

  const total = rows.reduce((s, r) => s + r.incident_count, 0)
  const tied = rows.filter((r) => r.incident_count === rows[0].incident_count)
  const lead =
    tied.length > 1
      ? `${tied.map((r) => r.locality_name).join(' and ')} are tied for the most incidents with ${tied[0].incident_count} each`
      : `${rows[0].locality_name} has the most incidents: ${rows[0].incident_count} of ${total} (${pct(rows[0].incident_count, total)}%)`
  const next = rows
    .slice(tied.length, tied.length + 2)
    .map((r) => `${r.locality_name} (${r.incident_count})`)
    .join(', ')
  const topIds = rows.slice(0, 3).flatMap((r) => r.incident_ids)

  return {
    text: `${lead}, across ${rows.length} localities, ${period}.${next ? ` Next: ${next}.` : ''}`,
    bars: rows.slice(0, 10).map((r) => ({ label: r.locality_name, value: r.incident_count })),
    evidence: [
      {
        tool: 'tool_incidents_by_locality',
        scope: `top 3 localities of ${rows.length}`,
        period,
        incidentCount: topIds.length,
        references: await references(topIds),
      },
    ],
    limitations: [
      COUNTING,
      'Only localities in your authorized scope are included.',
      'Raw counts are not adjusted for population, area or reporting rates: they show where reports concentrate, not where the problem is worst.',
      SYNTHETIC,
    ],
    highlightIds: topIds,
  }
}

async function timeOfDay(locality: Locality | null, days: number | null): Promise<Answer> {
  const to = new Date()
  const from = days ? new Date(to.getTime() - days * DAY) : null
  const rows = await rpc<TimeRow>('tool_time_distribution', {
    p_locality: locality?.code ?? null,
    p_from: iso(from),
    p_to: iso(to),
  })
  const scope = locality?.name ?? 'all localities in your scope'
  if (!rows.length) return noData(scope, from ? `the last ${days} days` : 'all available data')

  const total = rows.reduce((s, r) => s + r.incident_count, 0)
  const period = `${date(rows[0].first_at)} to ${date(rows[0].last_at)}`
  const blocks = Array.from({ length: 6 }, (_, b) => ({
    label: `${String(b * 4).padStart(2, '0')}:00–${String(b * 4 + 4).padStart(2, '0')}:00`,
    value: rows.filter((r) => Math.floor(r.hour / 4) === b).reduce((s, r) => s + r.incident_count, 0),
  }))
  const peak = blocks.reduce((a, b) => (b.value > a.value ? b : a))
  const peakTied = blocks.filter((b) => b.value === peak.value)
  const days7 = WEEKDAYS.map((label, i) => ({
    label,
    value: rows.filter((r) => r.dow === i + 1).reduce((s, r) => s + r.incident_count, 0),
  }))
  const busiest = days7.reduce((a, b) => (b.value > a.value ? b : a))
  const ids = rows.flatMap((r) => r.incident_ids)

  return {
    text:
      `In ${scope}, ${total} incidents were recorded from ${period} (Bogotá time). ` +
      `${peakTied.length > 1 ? `The most frequent intervals are ${peakTied.map((b) => b.label).join(' and ')}` : `The most frequent interval is ${peak.label}`} ` +
      `with ${peak.value} incidents (${pct(peak.value, total)}%). The busiest weekday is ${busiest.label} (${busiest.value}).`,
    bars: blocks,
    evidence: [
      {
        tool: 'tool_time_distribution',
        scope,
        period,
        incidentCount: total,
        references: await references(ids),
      },
    ],
    limitations: [
      ...(total < 30 ? [`Small sample (${total} incidents): treat the distribution as indicative only.`] : []),
      'Times are when the incident occurred (Bogotá time), in 4-hour intervals.',
      COUNTING,
      SYNTHETIC,
    ],
    highlightIds: ids,
  }
}

async function compare(locality: Locality | null, days: number): Promise<Answer> {
  const now = new Date()
  const curFrom = new Date(now.getTime() - days * DAY)
  const prevFrom = new Date(now.getTime() - 2 * days * DAY)
  const [rows, coverage] = await Promise.all([
    rpc<PeriodRow>('tool_period_comparison', {
      p_locality: locality?.code ?? null,
      p_current_from: iso(curFrom),
      p_current_to: iso(now),
      p_previous_from: iso(prevFrom),
      p_previous_to: iso(curFrom),
    }),
    byLocality(null, null),
  ])
  const cur = rows.find((r) => r.period === 'current')!
  const prev = rows.find((r) => r.period === 'previous')!
  const scope = locality?.name ?? 'all localities in your scope'
  const curLabel = `${date(curFrom)} to ${date(now)}`
  const prevLabel = `${date(prevFrom)} to ${date(curFrom)}`
  const firstRecord = coverage.map((r) => r.first_at).sort()[0]

  let change: string
  if (prev.incident_count === 0) {
    change = 'A percentage change cannot be calculated because the previous period has no incidents.'
  } else {
    const diff = cur.incident_count - prev.incident_count
    const p = Math.round((diff / prev.incident_count) * 100)
    change = diff === 0 ? 'The count is unchanged.' : `That is ${diff > 0 ? 'an increase' : 'a decrease'} of ${Math.abs(p)}% (${diff > 0 ? '+' : ''}${diff}).`
  }
  const ids = cur.incident_ids

  return {
    text: `In ${scope}, there were ${cur.incident_count} incidents in the last ${days} days (${curLabel}) versus ${prev.incident_count} in the previous ${days} days (${prevLabel}). ${change}`,
    bars: [
      { label: `Previous ${days} days`, value: prev.incident_count },
      { label: `Last ${days} days`, value: cur.incident_count },
    ],
    evidence: [
      {
        tool: 'tool_period_comparison',
        scope,
        period: `${curLabel} vs ${prevLabel}`,
        incidentCount: cur.incident_count + prev.incident_count,
        references: await references(ids),
      },
    ],
    limitations: [
      ...(!locality ? ['No locality was named, so all localities in your scope were used.'] : []),
      ...(prev.incident_count > 0 && (prev.incident_count < 10 || cur.incident_count + prev.incident_count < 20)
        ? ['Small base: with so few incidents the percentage swings easily. Read the raw counts first.']
        : []),
      ...(firstRecord && new Date(firstRecord) > prevFrom
        ? [`The previous period starts before the first available record (${date(firstRecord)}), so it may be incomplete.`]
        : []),
      'This compares counts only. It does not explain why the numbers differ.',
      COUNTING,
      SYNTHETIC,
    ],
    highlightIds: ids,
  }
}
