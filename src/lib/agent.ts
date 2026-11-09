import { supabase } from '@/lib/supabase'
import type { Locality } from '@/lib/incidents'
import type { Draft } from '@/lib/recommendations'
import { timeBlockLabel } from '@/lib/utils'
import { fetchLinkedIncidentIds, fetchProblems, type ProblemRow } from '@/lib/problems'
import type { Shape } from '@/lib/modules'
import type { ProblemStatus } from '@/lib/statusColors'

/**
 * Civic Operations Agent, MOCK MODE.
 * A deterministic planner picks one controlled SQL tool (Postgres functions that run as the signed-in
 * user, so RLS applies) and templates the answer from the returned numbers. No LLM, no invented figures.
 * The planner is the only part an LLM Edge Function will replace; the tools and answer shape stay.
 */

export interface Bar {
  label: string
  value: number
  /** Locality code when the bar is a locality: hovering it lights its outline on the map and clicking it zooms there. */
  code?: number
  /** A recurrence row (chart 'recurrences'): the line under the title (reference and status) and the recurrence it opens when picked. */
  sub?: string
  problemId?: string
}
export interface Evidence {
  tool: string
  scope: string
  period: string
  incidentCount: number
  references: string[]
}
export interface Area {
  code: number
  value: number
}
export interface Answer {
  text: string
  bars: Bar[]
  evidence: Evidence[]
  limitations: string[]
  highlightIds: string[]
  /** Which chart draws `bars`: localities of one category (donut, the smaller ones grouped as "Others"), localities of all categories (bar list), the day in 4-hour blocks (area), two periods (two columns), repeated locations (dot matrix) or tomorrow's candidates (numbered rows with a thin bar). Without it, the plain bar list. */
  chart?: 'donut' | 'barlist' | 'time' | 'period' | 'dots' | 'rows' | 'recurrences'
  /** Localities to outline and shade on the map (code, and a value that sets the shade). An answer about localities shows these instead of circles. */
  areas?: Area[]
  /** Repeated locations: the incident ids of each spot. The map draws one radius around each spot's reports, not the locality outlines. */
  spots?: string[][]
  /** Set when the answer is a recommendation a human can send for review. */
  proposal?: Draft
  /** Ready-made panels the agent suggests for this answer (decision 0049): a deterministic suggestion the person accepts, never UI the agent invents. */
  offers?: Offer[]
}

/** A module the agent offers: which one, for which recurrence, in which shape (the zone shape it suits best) and why. */
export interface Offer {
  type: 'timeline'
  label: string
  reason: string
  shape: Shape
  problemId: string
  reference: string
  status: ProblemStatus
}

/** What the planner may know about the screen: the recurrence that is open (from the map or the list). */
export interface AskContext {
  recurrenceId?: string | null
}

/** category: a code from incident_categories, or null for "all categories the user can see". */
type Plan = { category: string | null } & (
  | { kind: 'ranking'; days: number | null }
  | { kind: 'time'; locality: Locality | null; days: number | null }
  | { kind: 'compare'; locality: Locality | null; days: number }
  | { kind: 'recurring'; days: number | null }
  | { kind: 'candidates' }
  | { kind: 'attention' }
  | { kind: 'timeline' }
)

/** Display names, mirroring incident_categories. */
const CATEGORY_NAMES: Record<string, string> = { parking: 'Obstructive Parking', illegal_dumping: 'Illegal Dumping' }
const categoryName = (c: string | null) => (c ? (CATEGORY_NAMES[c] ?? c) : 'all categories you can see')

export { titleCase } from '@/lib/titleCase'
import { titleCase } from '@/lib/titleCase'

const DAY = 86_400_000
const TZ = 'America/Bogota'
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SYNTHETIC = 'All records are synthetic.'
const CIRCLES = 'Circles on the map show where the incidents are, not an area of risk.'
const AREAS = 'Localities on the map are outlined and tinted because they are in the answer: the tint is the same for all and is not a risk level.'
const MIN_REPEATS = 3
const CANDIDATE_DAYS = 90
const COUNTING = 'Counts exclude reports marked duplicate or rejected.'

const date = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' })
const pct = (n: number, total: number) => Math.round((n / total) * 100)
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** The Quick questions on the empty Investigate and Ask panel (owner's Figma, 2026-11-05: five; the "increased in Chapinero" one is out). The planner still understands it. */
export const SUGGESTIONS = [
  'Which parking obstruction recurrences need the most attention?',
  'Which localities have the most parking obstruction incidents?',
  'When do parking obstruction incidents occur most frequently in Usaquén?',
  'Which locations have repeated parking obstruction reports?',
  'Which area might deserve further investigation tomorrow evening?',
]

/** The two Worth investigating cards: a title and the question each one asks (the picture is a placeholder for now). */
export const WORTH_INVESTIGATING = [
  { title: 'Recurring Dumping Sites', category: 'Illegal Dumping', question: 'Which locations have repeated illegal dumping reports?' },
  { title: 'Recurring Obstructive Parking', category: 'Parking Obstruction', question: 'Which locations have repeated parking obstruction reports?' },
]

export function plan(question: string, localities: Locality[]): Plan | null {
  const q = norm(question)
  const locality =
    [...localities].sort((a, b) => b.name.length - a.name.length).find((l) => q.includes(norm(l.name))) ?? null
  const n = q.match(/(\d+)\s*days?/)
  const days = n ? Math.min(Math.max(Number(n[1]), 1), 365) : /last week/.test(q) ? 7 : /last month/.test(q) ? 30 : null

  const dumping = /\b(dump\w*|garbage|trash|rubbish|waste|debris)\b/.test(q)
  const parking = /\b(parking|parked|obstruction\w*|obstructive|blocking)\b/.test(q)
  const category = dumping && !parking ? 'illegal_dumping' : parking && !dumping ? 'parking' : null

  if (/\battention\b/.test(q) && /\brecurr\w*/.test(q)) return { kind: 'attention', category }
  if (/\b(timeline|different way|another way|see (the )?occurrences|chart (of )?(the )?occurrences)\b/.test(q)) return { kind: 'timeline', category }
  if (/\b(tomorrow|tonight|next (shift|evening)|deserve\w*|recommend\w*|prioriti\w+)\b/.test(q)) return { kind: 'candidates', category }
  if (/\b(recurr\w*|repeat\w*|same (place|location))\b|which locations/.test(q)) return { kind: 'recurring', days, category }
  if (/\b(increase\w*|decrease\w*|chang\w+|trend\w*|compar\w+|versus|vs)\b/.test(q)) {
    return { kind: 'compare', locality, days: days ?? 30, category }
  }
  if (/\b(when|what time|hours?|mornings?|afternoons?|evenings?|nights?|peak)\b/.test(q)) {
    return { kind: 'time', locality, days, category }
  }
  if (/\b(most|highest|rank\w*|top|which localit\w+|worst)\b/.test(q)) return { kind: 'ranking', days, category }
  return null
}

// ───────── Controlled tools (each maps to one SQL function) ─────────
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, args)
  // 42501 on a function the signed-in role may run means the request went out as anonymous: the session expired (owner's screenshot, 2026-10-30).
  if (error?.code === '42501') throw new Error('Your session has expired. Sign out and sign in again to keep asking.')
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
interface RecurringRow {
  match_type: 'exact' | 'approximate'
  label: string
  locality_code: number
  locality_name: string
  incident_count: number
  first_at: string
  last_at: string
  incident_ids: string[]
}
interface CandidateRow {
  label: string
  locality_code: number
  locality_name: string
  category: string
  total_count: number
  evening_count: number
  weekday_evening_count: number
  recent_count: number
  lat: number
  lng: number
  last_at: string
  incident_ids: string[]
}
interface PeriodRow {
  period: 'current' | 'previous'
  incident_count: number
  incident_ids: string[]
}

const iso = (d: Date | null) => d?.toISOString() ?? null
const byLocality = (from: Date | null, to: Date | null, category: string | null) =>
  rpc<LocalityRow>('tool_incidents_by_locality', { p_from: iso(from), p_to: iso(to), p_category: category })

async function references(ids: string[]) {
  if (!ids.length) return []
  const { data } = await supabase.from('incidents').select('reference').in('id', ids.slice(0, 8))
  return (data ?? []).map((r) => r.reference as string)
}

// ───────── Recurrences (read from the problems layer, ranked by a stated rule: deterministic code, no model) ─────────
const ATTENTION_RANK: Partial<Record<ProblemStatus, number>> = { active: 0, monitoring: 1 }
const ATTENTION_COUNT = 3

/** The recurrences that need the most attention: Active before Monitoring, then the most returns (occurrences minus one), then the latest report. A rule the person can read, not a risk score. */
export function rankForAttention(rows: ProblemRow[], category: string | null, count = ATTENTION_COUNT): ProblemRow[] {
  return rows
    .filter((r) => (category ? r.category === category : true) && r.status in ATTENTION_RANK)
    .sort((a, b) => ATTENTION_RANK[a.status]! - ATTENTION_RANK[b.status]! || b.recurrences_n - a.recurrences_n || (b.last_seen ?? '').localeCompare(a.last_seen ?? ''))
    .slice(0, count)
}

async function attention(category: string | null): Promise<Answer> {
  const rows = rankForAttention(await fetchProblems(), category)
  if (!rows.length) {
    return { text: 'No active or monitored recurrences in your scope.', bars: [], evidence: [], limitations: [SYNTHETIC], highlightIds: [] }
  }
  const linked = await fetchLinkedIncidentIds()
  const ids = rows.flatMap((r) => [...linked].filter(([, pid]) => pid === r.id).map(([iid]) => iid))
  const top = rows[0]
  return {
    text:
      `${rows.length === 1 ? 'One recurrence needs' : `${rows.length} recurrences need`} the most attention. ` +
      `${top.title} comes first: ${top.recurrences_n} returns, ${top.occurrences_n} occurrences, ${top.reports_n} reports, last reported ${top.last_seen ? date(top.last_seen) : 'never'}. Pick one to open it on the map.`,
    bars: rows.map((r) => ({ label: r.title, value: r.recurrences_n, sub: `${r.reference} · ${titleCase(r.status)}`, problemId: r.id })),
    chart: 'recurrences',
    evidence: [{ tool: 'recurrence ranking (status, returns, latest report)', scope: `${rows.length} recurrences`, period: 'all available data', incidentCount: rows.reduce((n, r) => n + r.reports_n, 0), references: rows.map((r) => r.reference) }],
    limitations: ['Ranked by status (Active before Monitoring), then by returns (occurrences minus one), then by the latest report: a rule you can read, not a risk score.', 'A return counts occurrences, never reports: many reports of one event are one occurrence.', SYNTHETIC],
    highlightIds: ids,
  }
}

/** The follow-up about the open recurrence: what its history looks like, and the offer of a timeline module (decision 0049). The offer's shape is the zone shape that suits the data: many reports read better wide. */
async function timelineAnswer(recurrenceId: string | null): Promise<Answer> {
  if (!recurrenceId) {
    return { text: 'Pick a recurrence first: open one on the map or from the list, then ask again and I can show its occurrences as a timeline.', bars: [], evidence: [], limitations: ['I do not guess: without an open recurrence there is no history to draw.'], highlightIds: [] }
  }
  const r = (await fetchProblems()).find((x) => x.id === recurrenceId)
  if (!r) return { text: 'I cannot find that recurrence in your scope.', bars: [], evidence: [], limitations: [], highlightIds: [] }
  const wide = r.reports_n > 8
  const shape: Shape = wide ? '4:2' : '4:3'
  return {
    text: `${r.title} (${r.reference}) has ${r.occurrences_n} occurrences, ${r.recurrences_n} returns and ${r.reports_n} reports${r.first_seen && r.last_seen ? `, from ${date(r.first_seen)} to ${date(r.last_seen)}` : ''}, with ${r.interventions_n} interventions. A timeline puts each occurrence, its reports and the interventions on one time axis.`,
    bars: [],
    evidence: [{ tool: 'recurrence history (occurrences, reports, interventions)', scope: r.reference, period: r.first_seen && r.last_seen ? `${date(r.first_seen)} to ${date(r.last_seen)}` : 'all available data', incidentCount: r.reports_n, references: [r.reference] }],
    limitations: ['The timeline only shows what is recorded; a gap between occurrences does not mean the problem is solved.', SYNTHETIC],
    highlightIds: [],
    offers: [{ type: 'timeline', label: `Draw a ${wide ? 'wide ' : ''}timeline of these occurrences?`, reason: wide ? `Many reports (${r.reports_n}), so it reads best in the wide strip along the bottom (4:2).` : 'A short history fits the 4:3 zone in the right column.', shape, problemId: r.id, reference: r.reference, status: r.status }],
  }
}

// ───────── Answers ─────────
export async function answer(question: string, localities: Locality[], ctx: AskContext = {}): Promise<Answer> {
  const p = plan(question, localities)
  if (!p) return unsupported()
  if (p.kind === 'attention') return withCategory(await attention(p.category), p.category)
  if (p.kind === 'timeline') return timelineAnswer(ctx.recurrenceId ?? null)
  if (p.kind === 'candidates') return candidates(p.category) // names its own category
  const result =
    p.kind === 'ranking'
      ? await ranking(p.days, p.category)
      : p.kind === 'time'
        ? await timeOfDay(p.locality, p.days, p.category)
        : p.kind === 'recurring'
          ? await recurring(p.days, p.category)
          : await compare(p.locality, p.days, p.category)
  return withCategory(result, p.category)
}

/** Every answer states which category it covers. */
function withCategory(a: Answer, category: string | null): Answer {
  const name = categoryName(category)
  return {
    ...a,
    text: `${a.text} Category: ${name}.`,
    evidence: a.evidence.map((e) => ({ ...e, scope: `${e.scope} · ${name}` })),
  }
}

function unsupported(): Answer {
  return {
    text:
      'I cannot answer that yet. In this prototype I can rank localities by incident count, show when incidents occur ' +
      'in a locality, compare the last N days with the N days before, list locations with repeated reports, ' +
      'and suggest an area for human review tomorrow evening.',
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

async function ranking(days: number | null, category: string | null): Promise<Answer> {
  const to = new Date()
  const from = days ? new Date(to.getTime() - days * DAY) : null
  const rows = await byLocality(from, to, category)
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
  const shown = rows.slice(0, 10)
  // The chart shows the biggest localities and the rest together as "Others" (owner, 2026-11-08): five for the donut, ten for the bar list.
  const keep = category ? 5 : 10
  const rest = rows.slice(keep).reduce((n, r) => n + r.incident_count, 0)
  const topIds = shown.flatMap((r) => r.incident_ids)

  return {
    text: `${lead}, across ${rows.length} localities, ${period}.${next ? ` Next: ${next}.` : ''}`,
    bars: [...rows.slice(0, keep).map((r) => ({ label: r.locality_name, value: r.incident_count, code: r.locality_code })), ...(rest ? [{ label: 'Others', value: rest }] : [])],
    chart: category ? 'donut' : 'barlist',
    areas: shown.map((r) => ({ code: r.locality_code, value: r.incident_count })),
    evidence: [
      {
        tool: 'tool_incidents_by_locality',
        scope: `top ${shown.length} localities of ${rows.length}`,
        period,
        incidentCount: topIds.length,
        references: await references(topIds),
      },
    ],
    limitations: [
      COUNTING,
      'Only localities in your authorized scope are included.',
      'Raw counts are not adjusted for population, area or reporting rates: they show where reports concentrate, not where the problem is worst.',
      AREAS,
      SYNTHETIC,
    ],
    highlightIds: topIds,
  }
}

async function timeOfDay(locality: Locality | null, days: number | null, category: string | null): Promise<Answer> {
  const to = new Date()
  const from = days ? new Date(to.getTime() - days * DAY) : null
  const rows = await rpc<TimeRow>('tool_time_distribution', {
    p_locality: locality?.code ?? null,
    p_from: iso(from),
    p_to: iso(to),
    p_category: category,
  })
  const scope = locality?.name ?? 'all localities in your scope'
  if (!rows.length) return noData(scope, from ? `the last ${days} days` : 'all available data')

  const total = rows.reduce((s, r) => s + r.incident_count, 0)
  const period = `${date(rows[0].first_at)} to ${date(rows[0].last_at)}`
  const blocks = Array.from({ length: 6 }, (_, b) => ({
    label: timeBlockLabel(b),
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
    chart: 'time',
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
      locality ? AREAS : CIRCLES,
      SYNTHETIC,
    ],
    highlightIds: ids,
    areas: locality ? [{ code: locality.code, value: 1 }] : undefined,
  }
}

async function compare(locality: Locality | null, days: number, category: string | null): Promise<Answer> {
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
      p_category: category,
    }),
    byLocality(null, null, category),
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
    chart: 'period',
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
      locality ? AREAS : CIRCLES,
      SYNTHETIC,
    ],
    highlightIds: ids,
    areas: locality ? [{ code: locality.code, value: 1 }] : undefined,
  }
}

async function recurring(days: number | null, category: string | null): Promise<Answer> {
  const to = new Date()
  const from = days ? new Date(to.getTime() - days * DAY) : null
  const rows = await rpc<RecurringRow>('tool_recurring_locations', {
    p_from: iso(from),
    p_to: iso(to),
    p_min: MIN_REPEATS,
    p_category: category,
  })
  const period = from ? `the last ${days} days (${date(from)} to ${date(to)})` : 'all available data'
  const limitations = [
    'Repeated reports at a location do not prove they describe the same event: they may be separate occurrences or several reports of one obstruction.',
    'Exact matches share the same described location; approximate matches are only close in coordinates (about 200 m).',
    `Only locations with at least ${MIN_REPEATS} reports are listed (up to 30).`,
    AREAS,
    COUNTING,
    SYNTHETIC,
  ]
  if (!rows.length) {
    return {
      text: `No location has at least ${MIN_REPEATS} reports in ${period}, within the localities you are authorized to see.`,
      bars: [],
      evidence: [],
      limitations,
      highlightIds: [],
    }
  }
  const exact = rows.filter((r) => r.match_type === 'exact').length
  const top = rows.slice(0, 8) // the same locations as the bars, so the list and the map agree
  const ids = top.flatMap((r) => r.incident_ids)
  return {
    text:
      `${rows.length} locations have at least ${MIN_REPEATS} reports in ${period}: ${exact} exact ${exact === 1 ? 'match' : 'matches'} (same described location) and ${rows.length - exact} approximate ${rows.length - exact === 1 ? 'match' : 'matches'}. ` +
      `The most repeated is "${titleCase(rows[0].label)}" with ${rows[0].incident_count} reports between ${date(rows[0].first_at)} and ${date(rows[0].last_at)}.`,
    bars: top.map((r) => ({ label: titleCase(r.label.replace('Synthetic ', '')), value: r.incident_count })),
    chart: 'dots',
    evidence: [
      {
        tool: 'tool_recurring_locations',
        scope: `top ${top.length} of ${rows.length} locations (${top.map((r) => r.match_type).join(', ')})`,
        period,
        incidentCount: ids.length,
        references: await references(ids),
      },
    ],
    limitations,
    highlightIds: ids,
    spots: top.map((r) => r.incident_ids),
  }
}

async function candidates(category: string | null): Promise<Answer> {
  const to = new Date()
  const from = new Date(to.getTime() - CANDIDATE_DAYS * DAY)
  const tomorrow = new Date(to.getTime() + DAY).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' })
  const weekday = WEEKDAYS.indexOf(tomorrow) + 1
  const rows = await rpc<CandidateRow>('tool_candidate_areas', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_dow: weekday,
    p_min: MIN_REPEATS,
    p_category: category,
  })
  const period = `the last ${CANDIDATE_DAYS} days (${date(from)} to ${date(to)})`
  if (!rows.length) {
    return {
      text: `No location has at least ${MIN_REPEATS} reports in ${period}, so the data cannot support a recommendation for tomorrow evening.`,
      bars: [],
      evidence: [],
      limitations: [COUNTING, SYNTHETIC],
      highlightIds: [],
    }
  }
  const top = rows[0]
  const limitations = [
    'Ranking: incidents in the 16:00–20:00 window, then total incidents, then incidents in the last 30 days. The weekday count is shown but not used for ranking because it is usually very small.',
    'History shows where reports concentrated. It does not predict that an incident will occur tomorrow.',
    `Only locations with at least ${MIN_REPEATS} reports in ${CANDIDATE_DAYS} days (same described location) are considered.`,
    ...(top.evening_count < 10 ? [`Small numbers: the top candidate has ${top.evening_count} evening incidents.`] : []),
    AREAS,
    'Photos are placeholders and nothing was visually inspected. No legal violation is asserted.',
    COUNTING,
    SYNTHETIC,
  ]
  const others = rows.slice(1, 3).map((r) => `"${titleCase(r.label)}" (${r.evening_count} evening)`).join(', ')

  return {
    text:
      `Based on ${period}, the location with the most evening (16:00–20:00) incidents is "${titleCase(top.label)}" in ${top.locality_name}: ` +
      `${top.evening_count} of its ${top.total_count} incidents fell in that window and ${top.recent_count} in the last 30 days. ` +
      `${top.weekday_evening_count} of the evening incidents ${top.weekday_evening_count === 1 ? 'was' : 'were'} on a ${tomorrow}. ` +
      `It is a candidate for human review tomorrow evening, not a prediction.${others ? ` Other candidates: ${others}.` : ''} ` +
      `Category: ${categoryName(top.category)}.`,
    bars: rows.map((r) => ({ label: titleCase(r.label.replace('Synthetic ', '')), value: r.evening_count })),
    chart: 'rows',
    evidence: [
      {
        tool: 'tool_candidate_areas',
        scope: `top candidate of ${rows.length}: ${titleCase(top.label)} · ${categoryName(top.category)}`,
        period,
        incidentCount: top.incident_ids.length,
        references: await references(top.incident_ids),
      },
    ],
    limitations,
    highlightIds: top.incident_ids,
    areas: [{ code: top.locality_code, value: 1 }],
    proposal: {
      locality_code: top.locality_code,
      category: top.category,
      title: `Review ${titleCase(top.label.replace('Synthetic ', ''))} tomorrow evening`,
      problem: `${top.total_count} ${categoryName(top.category)} reports at "${titleCase(top.label)}" in the last ${CANDIDATE_DAYS} days; ${top.evening_count} between 16:00 and 20:00 (Bogotá time), ${top.recent_count} in the last 30 days.`,
      period_start: from.toISOString(),
      period_end: to.toISOString(),
      evidence: {
        tool: 'tool_candidate_areas',
        params: { from: from.toISOString(), to: to.toISOString(), weekday, min_reports: MIN_REPEATS, evening_window: '16:00-20:00 America/Bogota' },
        candidate: {
          label: top.label,
          locality_code: top.locality_code,
          category: top.category,
          total_count: top.total_count,
          evening_count: top.evening_count,
          weekday_evening_count: top.weekday_evening_count,
          recent_count: top.recent_count,
          last_at: top.last_at,
          lat: top.lat,
          lng: top.lng,
        },
        ranking: rows.map((r) => ({ label: r.label, evening_count: r.evening_count, total_count: r.total_count })),
        incident_ids: top.incident_ids,
      },
      limitations: limitations.join('\n'),
      proposed_intervention: `Ask a human operator to review this location during tomorrow's (${tomorrow}) 16:00–20:00 window, check the reports for a genuine recurring obstruction, and decide whether any follow-up is warranted. This system proposes no dispatch and no sanction.`,
    },
  }
}
