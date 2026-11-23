import type { Answer } from '@/lib/agent'

// Mocked conversations for the demo (owner, 2026-11-08): a few of the loaded recurrences and incidents, picked by status so every group shows, each with a short history of questions and answers on one theme. All numbers are made up. Delete this file when conversations are saved for real.
type Rec = { id: string; status: string; title?: string }
type Inc = { id: string; title: string; group: string }
export interface MockChat {
  created: number // when it started and when it last changed (ms), so the Investigations list can sort by either
  updated: number
  ids: string[] // the incidents and recurrences it touched
  turns: { question: string; result: Answer }[]
}

const TIME = ['12–4 AM', '4–8 AM', '8 AM–12 PM', '12–4 PM', '4–8 PM', '8 PM–12 AM']
const DAY = 86_400_000
const LIMITS: string[] = [] // the "This conversation is a mock-up for the demo" note is gone (owner, 2026-11-17); the owner will place that copy elsewhere

export function mockChats(recs: Rec[], incs: Inc[]): MockChat[] {
  const NOW = Date.now()
  const used = new Set<string>()
  const take = <T extends { id: string }>(list: T[], pred: (t: T) => boolean, n: number) => {
    const l = list.filter((t) => !used.has(t.id) && pred(t)).slice(0, n)
    l.forEach((t) => used.add(t.id))
    return l
  }
  const r = (s: string) => (x: Rec) => x.status === s
  const i = (g: string) => (x: Inc) => x.group === g
  const answer = (text: string, over: Partial<Answer>, highlight: Inc[]): Answer => ({ text, bars: [], evidence: [], limitations: LIMITS, highlightIds: highlight.map((x) => x.id), ...over })
  const rows = (l: Inc[], values: number[]) => l.map((x, k) => ({ label: x.title, value: values[k] ?? 1 }))

  // 1 · Repeated locations
  // one red Illegal Dumping and one red Obstructive Parking (owner, 2026-11-23: the list used to show two dumping rows); the yellow Monitoring row is the second conversation's
  const parking = (x: Rec) => (x.title ?? '').startsWith('Obstructive')
  const pr = [...take(recs, (x) => r('active')(x) && !parking(x), 1), ...take(recs, (x) => r('active')(x) && parking(x), 1)]
  const pi = take(incs, i('pending'), 3)
  // 2 · Access ramps near schools
  const sr = [...take(recs, r('monitoring'), 1), ...take(recs, r('resolved'), 1)]
  const si = [...take(incs, i('reviewing'), 1), ...take(incs, i('approved'), 1)]
  // 3 · Tomorrow evening
  const ti = [...take(incs, i('pending'), 2), ...take(incs, i('rejected'), 1)]

  const chats: MockChat[] = [
    {
      created: NOW - 9 * DAY, updated: NOW - 1 * DAY,
      ids: [...pr, ...pi].map((x) => x.id),
      turns: [
        { question: 'Which locations have repeated parking obstruction reports?', result: answer(`${pi.length} locations came up with repeated reports in the last 90 days. The most repeated has ${pi.length + 9} reports.`, { chart: 'dots', bars: rows(pi, [12, 9, 6]) }, pi) },
        { question: 'When do those reports usually happen?', result: answer('Most of them fall between 4 PM and 8 PM, with a smaller bump around noon.', { chart: 'time', bars: TIME.map((label, k) => ({ label, value: [3, 2, 2, 9, 11, 1][k] })) }, pi) },
        { question: 'Are they getting worse than last month?', result: answer('Slightly: 19 reports in the last 30 days against 15 in the 30 before.', { chart: 'period', bars: [{ label: 'Previous 30 days', value: 15 }, { label: 'Last 30 days', value: 19 }] }, pi) },
        { question: 'Which one should be reviewed first?', result: answer(`${pi[0]?.title ?? 'The first location'} has the most reports and an active recurrence, so it is the first candidate for human review. This is a suggestion, not a decision.`, {}, pi.slice(0, 1)) },
      ],
    },
    {
      created: NOW - 6 * DAY, updated: NOW - 2 * DAY,
      ids: [...sr, ...si].map((x) => x.id),
      turns: [
        { question: 'Which areas near schools have blocked access ramps?', result: answer(`${si.length} incidents near schools mention a blocked access ramp.`, { chart: 'rows', bars: rows(si, [5, 3]) }, si) },
        { question: 'How many were rejected after review?', result: answer('One in four was rejected after review, mostly because the photo did not show the ramp.', { chart: 'period', bars: [{ label: 'Approved', value: 6 }, { label: 'Rejected', value: 2 }] }, si) },
        { question: 'Has any of them been resolved?', result: answer(`${sr.length} recurrences are being monitored or were resolved after an intervention.`, {}, si.slice(0, 1)) },
      ],
    },
    {
      created: NOW - 3 * DAY, updated: NOW - 3 * DAY,
      ids: ti.map((x) => x.id),
      turns: [
        { question: 'Which area might deserve further investigation tomorrow evening?', result: answer(`${ti[0]?.title ?? 'One location'} has the most incidents between 4 PM and 8 PM. It is a candidate for human review, not a prediction.`, { chart: 'rows', bars: rows(ti, [11, 8, 4]) }, ti) },
        { question: 'Why that one?', result: answer('It has the most evening incidents in the last 90 days, and three of them fell on the same weekday as tomorrow.', {}, ti.slice(0, 1)) },
        { question: 'Draft a note for the field team.', result: answer('Ask a human operator to review this location tomorrow between 4 PM and 8 PM and decide whether any follow-up is warranted. This system proposes no dispatch and no sanction.', {}, ti.slice(0, 1)) },
      ],
    },
  ]
  // 4 to 10 · seven more short conversations (owner, 2026-11-23) so the Investigations list has enough rows to sort and scroll; each touches two incidents, reused from the pool, and all numbers are made up
  const SHORT: { q: string; a: string; q2: string; a2: string; chart: 'rows' | 'period' | 'dots'; ago: [number, number] }[] = [
    { q: 'Which localities have the most illegal dumping this quarter?', a: 'Suba and Kennedy lead, with a third of the reports between them.', q2: 'Is it growing?', a2: 'Up 12% on the previous quarter, mostly in Kennedy.', chart: 'rows', ago: [14, 5] },
    { q: 'Why were so many reports rejected last week?', a: 'Most were rejected because the photo did not show the vehicle or the pile.', q2: 'Which category is hit hardest?', a2: 'Parking obstruction, with 7 of the 10 rejections.', chart: 'period', ago: [12, 12] },
    { q: 'How long do approved incidents wait before review?', a: 'The median wait is 2 days; the slowest quarter waited 6.', q2: 'Where is the wait longest?', a2: 'Incidents near schools wait about a day longer than the rest.', chart: 'period', ago: [11, 7] },
    { q: 'Show incidents near bus stops this week', a: 'Several incidents this week fall within 30 m of a bus stop.', q2: 'Are they the same locations as last week?', a2: 'About half repeat; the rest are new.', chart: 'dots', ago: [10, 4] },
    { q: 'Which recurrences are still being monitored?', a: 'A handful are in Monitoring, none with a new report in the last 10 days.', q2: 'Could any of them be resolved?', a2: 'Two have had no reports since the intervention, so they are candidates for a human to close. This is a suggestion, not a decision.', chart: 'rows', ago: [8, 6] },
    { q: 'Compare Suba and Kennedy for obstructive parking', a: 'Kennedy has more reports, Suba has more repeated locations.', q2: 'Which one is more stable over time?', a2: 'Suba, with a flat trend over the last 90 days.', chart: 'period', ago: [5, 2] },
    { q: 'Which locations improved after an intervention?', a: 'Three locations dropped by more than half after the intervention.', q2: 'Did any get worse?', a2: 'One rose again after four weeks.', chart: 'rows', ago: [2, 0.5] },
  ]
  SHORT.forEach((c, k) => {
    const pool = incs.slice(k * 2, k * 2 + 2)
    if (!pool.length) return
    const values = [8, 5]
    chats.push({
      created: NOW - c.ago[0] * DAY, updated: NOW - c.ago[1] * DAY,
      ids: pool.map((x) => x.id),
      turns: [
        { question: c.q, result: answer(c.a, { chart: c.chart, bars: c.chart === 'period' ? [{ label: 'Previous 30 days', value: 14 }, { label: 'Last 30 days', value: 18 }] : rows(pool, values) }, pool) },
        { question: c.q2, result: answer(c.a2, {}, pool.slice(0, 1)) },
      ],
    })
  })
  return chats.filter((c) => c.ids.length)
}
