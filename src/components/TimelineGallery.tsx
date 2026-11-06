import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Option } from '@/components/ChartGallery'
import { ProblemTimeline } from '@/components/ProblemTimeline'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { label } from '@/lib/incidents'
import type { ProblemDetailData } from '@/lib/problems'
import { buildTimeline, tickLabel } from '@/lib/timeline'

/**
 * Open /#timeline (no sign-in): the same problem history shown six ways with shadcn Chart, so one can be chosen for the Recurrence Panel (owner, 2026-11-02).
 * Nothing in the app uses this page. The switch at the top changes the sample: the Figma example (3 occurrences) or a busy history (14 occurrences over 9 months).
 */

const DAY = 86_400_000
const at = (d: string) => Date.parse(d)
const SOURCES = ['SIMUR', 'Salvajes en la Via', 'Community reporting channel']
const tick = { fill: 'var(--neutral-200)', fontSize: 12 }
const grid = 'var(--neutral-500)'
const TOW = 'var(--blue-300)'
const STATUS = 'var(--map-problem-active)'

/** The two samples, in the same shape the Recurrence Panel gets from the database. */
function sample(kind: 'small' | 'busy'): ProblemDetailData {
  const starts = kind === 'small' ? ['2026-08-12', '2026-09-08', '2026-10-12'].map(at) : Array.from({ length: 14 }, (_, i) => at('2026-01-12') + i * 20 * DAY)
  const counts = kind === 'small' ? [5, 4, 3] : starts.map((_, i) => 2 + ((i * 5 + 3) % 8))
  const days = kind === 'small' ? starts.map(() => 2) : starts.map((_, i) => 2 + ((i * 3) % 9)) // how long each occurrence lasts: 2 days in the Figma example, 2 to 10 in the busy one
  const occurrences = starts.map((t, i) => ({ occurrence_id: `o${i}`, subject_key: null, ended_at: null, ended_reason: null, reports_n: counts[i], first_report_at: new Date(t).toISOString(), last_report_at: new Date(t + days[i] * DAY).toISOString(), boundary_uncertain: i === 1 }))
  const incidents: ProblemDetailData['incidents'] = []
  const links: ProblemDetailData['links'] = []
  const sources: Record<string, string> = {}
  starts.forEach((t, i) =>
    Array.from({ length: counts[i] }, (_, k) => {
      const id = `i${i}-${k}`
      incidents.push({ id, reference: `PRK-${String(100 + i * 10 + k).padStart(4, '0')}`, occurred_at: new Date(t + (k * days[i] * DAY) / counts[i]).toISOString() } as never)
      links.push({ incident_id: id, occurrence_id: `o${i}`, state: 'confirmed', score: 1 })
      sources[id] = SOURCES[(i + k) % 3]
    }),
  )
  const towDays = kind === 'small' ? [at('2026-08-16'), at('2026-09-12')] : [2, 5, 8, 11].map((i) => starts[i] + 4 * DAY)
  const interventions = towDays.map((t, i) => ({ id: `v${i}`, action_type: 'tow', agency: 'Secretaría Distrital de Movilidad', performed_at: new Date(t).toISOString(), description: 'Vehicle towed from the garage entrance', outcome: 'cleared' }))
  return { occurrences, links, incidents, sources, interventions, events: [] }
}

/** The series each chart needs, all derived from the one history. */
function series(d: ProblemDetailData) {
  const reports = d.incidents.map((i) => ({ t: Date.parse(i.occurred_at), source: d.sources[i.id] ?? 'Unknown' })).sort((a, b) => a.t - b.t)
  const tows = d.interventions.map((v) => Date.parse(v.performed_at))
  const lo = reports[0].t
  const hi = reports[reports.length - 1].t
  const monday = new Date(lo)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const weekly: { t: number; reports: number }[] = []
  for (let t = monday.getTime(); t <= hi; t += 7 * DAY) weekly.push({ t, reports: reports.filter((r) => r.t >= t && r.t < t + 7 * DAY).length })
  const cumulative = [{ t: lo - DAY, total: 0 }, ...reports.map((r, i) => ({ t: r.t, total: i + 1 }))]
  const months: { month: string; s0: number; s1: number; s2: number }[] = []
  for (const d0 = new Date(lo); d0.setDate(1), d0.setHours(0, 0, 0, 0), d0.getTime() <= hi; d0.setMonth(d0.getMonth() + 1)) {
    const from = d0.getTime()
    const to = new Date(d0.getFullYear(), d0.getMonth() + 1, 1).getTime()
    const n = (s: string) => reports.filter((r) => r.t >= from && r.t < to && r.source === s).length
    months.push({ month: d0.toLocaleDateString('en-GB', { month: 'short' }), s0: n(SOURCES[0]), s1: n(SOURCES[1]), s2: n(SOURCES[2]) })
  }
  const spans = d.occurrences.map((o, i) => ({ name: `#${i + 1}`, range: [Date.parse(o.first_report_at!), Math.max(Date.parse(o.last_report_at!), Date.parse(o.first_report_at!) + DAY)] as [number, number], reports: o.reports_n }))
  const columns = d.occurrences.map((o) => ({ t: Date.parse(o.first_report_at!), reports: o.reports_n }))
  return { tows, weekly, cumulative, months, spans, columns }
}

const dayText = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const tipDate = (_: unknown, items: readonly { payload?: { t?: number } }[]) => (items?.[0]?.payload?.t ? dayText(items[0].payload.t) : '')
const reportsConfig = { reports: { label: 'Reports', color: STATUS } } satisfies ChartConfig
const totalConfig = { total: { label: 'Reports so far', color: 'var(--neutral-100)' } } satisfies ChartConfig
const sourceConfig = { s0: { label: SOURCES[0], color: 'var(--indigo-300)' }, s1: { label: SOURCES[1], color: 'var(--blue-300)' }, s2: { label: SOURCES[2], color: 'var(--yellow-300)' } } satisfies ChartConfig
const spanConfig = { range: { label: 'Occurrence', color: STATUS } } satisfies ChartConfig

export function TimelineGallery() {
  const [kind, setKind] = useState<'small' | 'busy'>('small')
  const detail = useMemo(() => sample(kind), [kind])
  const s = useMemo(() => series(detail), [detail])
  const tl = useMemo(() => buildTimeline(detail, label), [detail])
  const xAxis = <XAxis type="number" dataKey="t" domain={tl.domain} ticks={tl.ticks} interval={0} tickFormatter={(t: number) => tickLabel(t, tl.mode, tl.withYear)} tickLine={false} axisLine={false} tick={tick} />
  const tows = s.tows.map((t) => <ReferenceLine key={t} x={t} stroke={TOW} strokeDasharray="3 3" />)
  const margin = { top: 12, right: 24, left: 20, bottom: 0 }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-heading">Recurrence history: ways to show it as a timeline</h1>
          <p className="text-body-sm text-muted-foreground">
            The same history in each card, all built with shadcn Chart. Nothing in the app uses this page. Blue dashed lines are tows (interventions). Try the busy sample to see how each one copes with many occurrences.
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Sample">
          <Button size="sm" variant={kind === 'small' ? 'default' : 'outline'} aria-pressed={kind === 'small'} onClick={() => setKind('small')}>
            Small: 3 occurrences (the Figma example)
          </Button>
          <Button size="sm" variant={kind === 'busy' ? 'default' : 'outline'} aria-pressed={kind === 'busy'} onClick={() => setKind('busy')}>
            Busy: 14 occurrences over 9 months
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-3">
        <Option name="A · Lanes (in the Recurrence Panel now)" note="Every kind of mark has its own lane on a time axis to scale; hover for the PRK, source and time, click to open. Shows everything, scrolls sideways when busy.">
          <ProblemTimeline detail={detail} status="active" onSelectIncident={() => {}} />
        </Option>

        <Option name="B · Columns and tow lines" note="One column per occurrence, height = reports. A column after a line reads as a return. Clear when small, crowded when busy; no sources or times.">
          <ChartContainer config={reportsConfig} className="h-[200px] w-full">
            <BarChart data={s.columns} margin={margin}>
              <CartesianGrid vertical={false} stroke={grid} />
              {xAxis}
              <YAxis hide domain={[0, 'dataMax + 2']} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={tipDate as never} />} />
              {tows}
              <Bar dataKey="reports" fill="var(--color-reports)" radius={3} barSize={kind === 'busy' ? 8 : 16} />
            </BarChart>
          </ChartContainer>
        </Option>

        <Option name="C · Reports per week (area)" note="Weekly reports as a stepped area, with the tows over it. Best for many occurrences: the rhythm is a shape. Hides single reports and who sent them.">
          <ChartContainer config={reportsConfig} className="h-[200px] w-full">
            <AreaChart data={s.weekly} margin={margin}>
              <CartesianGrid vertical={false} stroke={grid} />
              {xAxis}
              <YAxis hide domain={[0, 'dataMax + 2']} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={tipDate as never} />} />
              {tows}
              <Area dataKey="reports" type="stepAfter" stroke="var(--color-reports)" fill="var(--color-reports)" fillOpacity={0.25} />
            </AreaChart>
          </ChartContainer>
        </Option>

        <Option name="D · Reports so far (line)" note="A running total of reports. A tow should flatten the line; a steep climb after it means it came back. Good for 'did it work'; says nothing about single events.">
          <ChartContainer config={totalConfig} className="h-[200px] w-full">
            <LineChart data={s.cumulative} margin={margin}>
              <CartesianGrid vertical={false} stroke={grid} />
              {xAxis}
              <YAxis hide domain={[0, 'dataMax + 2']} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={tipDate as never} />} />
              {tows}
              <Line dataKey="total" type="stepAfter" stroke="var(--color-total)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </Option>

        <Option name="E · Reports by source (stacked columns)" note="Reports per month, split by where they came from. Answers 'who is reporting this'. Months, so single occurrences and tows are not visible.">
          <ChartContainer config={sourceConfig} className="h-[200px] w-full">
            <BarChart data={s.months} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={grid} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={tick} />
              <YAxis hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="s0" stackId="a" fill="var(--color-s0)" />
              <Bar dataKey="s1" stackId="a" fill="var(--color-s1)" />
              <Bar dataKey="s2" stackId="a" fill="var(--color-s2)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Option>

        <Option name="F · Occurrence spans (Gantt-style)" note="One bar per occurrence from its first to its last report, on a shared time axis, with the tows as lines. Reads like a schedule; a row per occurrence, so it gets tall when busy.">
          <ChartContainer config={spanConfig} className="w-full" style={{ height: Math.max(140, s.spans.length * 22 + 36) }}>
            <BarChart data={s.spans} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={grid} />
              <XAxis type="number" domain={tl.domain} ticks={tl.ticks} interval={0} tickFormatter={(t: number) => tickLabel(t, tl.mode, tl.withYear)} tickLine={false} axisLine={false} tick={tick} />
              <YAxis type="category" dataKey="name" interval={0} tickLine={false} axisLine={false} width={32} tick={tick} />
              <ChartTooltip cursor={false} content={({ active, payload }) => (active && payload?.length ? <div className="rounded-sm border border-input bg-(--neutral-700) px-2 py-1 text-meta text-foreground shadow-lg">{`Occurrence ${(payload[0].payload as { name: string }).name.slice(1)} · ${dayText((payload[0].payload as { range: [number, number] }).range[0])} · ${(payload[0].payload as { reports: number }).reports} reports`}</div> : null)} />
              {tows}
              <Bar dataKey="range" fill="var(--color-range)" radius={3} barSize={10} />
            </BarChart>
          </ChartContainer>
        </Option>
      </div>
    </main>
  )
}
