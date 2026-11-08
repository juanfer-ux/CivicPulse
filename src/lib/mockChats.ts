import type { Answer } from '@/lib/agent'

// Mocked conversations for the demo (owner, 2026-11-08): a few of the loaded recurrences and incidents, picked by status so every group shows, each with a short history of questions and answers on one theme. All numbers are made up. Delete this file when conversations are saved for real.
type Rec = { id: string; status: string }
type Inc = { id: string; title: string; group: string }
export interface MockChat {
  ids: string[] // the incidents and recurrences it touched
  turns: { question: string; result: Answer }[]
}

const TIME = ['12–4 AM', '4–8 AM', '8 AM–12 PM', '12–4 PM', '4–8 PM', '8 PM–12 AM']
const LIMITS = ['This conversation is a mock-up for the demo: nothing was asked of the data.']

export function mockChats(recs: Rec[], incs: Inc[]): MockChat[] {
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
  const pr = take(recs, r('active'), 2)
  const pi = take(incs, i('pending'), 3)
  // 2 · Access ramps near schools
  const sr = [...take(recs, r('monitoring'), 1), ...take(recs, r('resolved'), 1)]
  const si = [...take(incs, i('reviewing'), 1), ...take(incs, i('approved'), 1)]
  // 3 · Tomorrow evening
  const ti = [...take(incs, i('pending'), 2), ...take(incs, i('rejected'), 1)]

  const chats: MockChat[] = [
    {
      ids: [...pr, ...pi].map((x) => x.id),
      turns: [
        { question: 'Which locations have repeated parking obstruction reports?', result: answer(`${pi.length} locations came up with repeated reports in the last 90 days. The most repeated has ${pi.length + 9} reports.`, { chart: 'dots', bars: rows(pi, [12, 9, 6]) }, pi) },
        { question: 'When do those reports usually happen?', result: answer('Most of them fall between 4 PM and 8 PM, with a smaller bump around noon.', { chart: 'time', bars: TIME.map((label, k) => ({ label, value: [3, 2, 2, 9, 11, 1][k] })) }, pi) },
        { question: 'Are they getting worse than last month?', result: answer('Slightly: 19 reports in the last 30 days against 15 in the 30 before.', { chart: 'period', bars: [{ label: 'Previous 30 days', value: 15 }, { label: 'Last 30 days', value: 19 }] }, pi) },
        { question: 'Which one should be reviewed first?', result: answer(`${pi[0]?.title ?? 'The first location'} has the most reports and an active recurrence, so it is the first candidate for human review. This is a suggestion, not a decision.`, {}, pi.slice(0, 1)) },
      ],
    },
    {
      ids: [...sr, ...si].map((x) => x.id),
      turns: [
        { question: 'Which areas near schools have blocked access ramps?', result: answer(`${si.length} incidents near schools mention a blocked access ramp.`, { chart: 'rows', bars: rows(si, [5, 3]) }, si) },
        { question: 'How many were rejected after review?', result: answer('One in four was rejected after review, mostly because the photo did not show the ramp.', { chart: 'period', bars: [{ label: 'Approved', value: 6 }, { label: 'Rejected', value: 2 }] }, si) },
        { question: 'Has any of them been resolved?', result: answer(`${sr.length} recurrences are being monitored or were resolved after an intervention.`, {}, si.slice(0, 1)) },
      ],
    },
    {
      ids: ti.map((x) => x.id),
      turns: [
        { question: 'Which area might deserve further investigation tomorrow evening?', result: answer(`${ti[0]?.title ?? 'One location'} has the most incidents between 4 PM and 8 PM. It is a candidate for human review, not a prediction.`, { chart: 'rows', bars: rows(ti, [11, 8, 4]) }, ti) },
        { question: 'Why that one?', result: answer('It has the most evening incidents in the last 90 days, and three of them fell on the same weekday as tomorrow.', {}, ti.slice(0, 1)) },
        { question: 'Draft a note for the field team.', result: answer('Ask a human operator to review this location tomorrow between 4 PM and 8 PM and decide whether any follow-up is warranted. This system proposes no dispatch and no sanction.', {}, ti.slice(0, 1)) },
      ],
    },
  ]
  return chats.filter((c) => c.ids.length)
}
