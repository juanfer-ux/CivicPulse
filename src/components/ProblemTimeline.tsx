import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { label } from '@/lib/incidents'
import type { ProblemDetailData } from '@/lib/problems'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'
import { buildTimeline, tickLabel, type Lane, type TimelinePoint } from '@/lib/timeline'

const tick = { fill: 'var(--neutral-200)', fontSize: 12 }
const LANE_PX = 44
type ShapeProps = { cx?: number; cy?: number; size?: number; payload?: TimelinePoint }

/**
 * A problem's whole history as one chart (owner, 2026-11-02): a time axis to scale with a lane for the occurrences (dot size = reports), one for the reports
 * themselves, one for the interventions and one for events. Hover tells what a mark is; a click on a report opens it, a click on anything else shows it under the chart.
 * With many occurrences the chart gets wider and the box scrolls sideways.
 */
export function ProblemTimeline({ detail, status, onSelectIncident }: { detail: ProblemDetailData; status: ProblemStatus; onSelectIncident: (id: string) => void }) {
  const tl = useMemo(() => buildTimeline(detail, label), [detail])
  const [pick, setPick] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth // many occurrences: open at the latest end
  }, [tl])
  const sel = tl.points.find((p) => p.id === pick) ?? [...tl.points].reverse().find((p) => p.lane === 'occurrence') ?? null
  const occurrenceId = sel?.occurrenceId
  const inLane = (lane: Lane) => tl.points.filter((p) => p.lane === lane)
  const maxReports = Math.max(1, ...inLane('occurrence').map((p) => p.size))
  const color = `var(${PROBLEM_STATUS[status].token})`
  const config = { occurrence: { label: 'Occurrences', color } } satisfies ChartConfig

  const hit = (d: unknown) => {
    const p = ((d as { payload?: TimelinePoint }).payload ?? d) as TimelinePoint
    if (p.incidentId) onSelectIncident(p.incidentId)
    else setPick(p.id)
  }
  /** A round mark: filled, hollow when the report only needs review, with a ring when it belongs to the selected occurrence. */
  const dot = (fill: string) => (props: ShapeProps) => {
    const { cx = 0, cy = 0, size = 30, payload } = props
    const ring = !!payload && (payload.id === sel?.id || (payload.lane === 'report' && !!occurrenceId && payload.occurrenceId === occurrenceId))
    return (
      <circle cx={cx} cy={cy} r={Math.sqrt(size / Math.PI)} fill={payload?.proposed ? 'none' : fill} stroke={payload?.proposed ? fill : ring ? 'var(--neutral-100)' : 'none'} strokeWidth={1.5} className="cursor-pointer" />
    )
  }

  if (!tl.points.length) return <p className="text-meta text-muted-foreground">No history yet.</p>
  const intervention = sel?.interventionId ? detail.interventions.find((v) => v.id === sel.interventionId) : undefined
  const uncertain = !!occurrenceId && detail.occurrences.find((o) => o.occurrence_id === occurrenceId)?.boundary_uncertain

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-muted-foreground" aria-hidden>
        {tl.lanes.map((l) => (
          <li key={l.lane} className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10">
              {l.lane === 'intervention' ? <path d="M5 0 10 5 5 10 0 5Z" fill="var(--blue-300)" /> : l.lane === 'event' ? <rect x="1" y="1" width="8" height="8" fill="var(--yellow-300)" /> : <circle cx="5" cy="5" r="4.25" fill={l.lane === 'occurrence' ? color : 'var(--neutral-100)'} />}
            </svg>
            {l.label}
            {l.lane === 'report' && inLane('report').some((p) => p.proposed) && ' (hollow: needs review)'}
          </li>
        ))}
      </ul>
      <div ref={scroller} className="overflow-x-auto" role="img" aria-label={`History chart: ${inLane('occurrence').length} occurrences, ${inLane('report').length} reports, ${inLane('intervention').length} interventions. The same history is in the list below.`}>
        <div style={{ minWidth: tl.minWidth }}>
          <ChartContainer config={config} className="w-full" style={{ height: tl.lanes.length * LANE_PX + 32 }}>
            <ScatterChart margin={{ top: 8, right: 24, bottom: 0, left: 20 }}>
              <CartesianGrid horizontal={false} stroke="var(--neutral-500)" />
              <XAxis type="number" dataKey="t" domain={tl.domain} ticks={tl.ticks} interval={0} tickFormatter={(t: number) => tickLabel(t, tl.mode, tl.withYear)} tickLine={false} axisLine={false} tick={tick} />
              <YAxis type="number" dataKey="y" domain={[-0.6, tl.lanes.length - 0.4]} hide />
              <ZAxis zAxisId="reports" type="number" dataKey="size" domain={[0, maxReports]} range={[60, 420]} />
              <ZAxis zAxisId="mark" type="number" dataKey="size" domain={[0, 1]} range={[34, 34]} />
              <ChartTooltip cursor={false} content={({ active, payload }) => (active && payload?.length ? <div className="rounded-sm border border-input bg-(--neutral-700) px-2 py-1 text-meta text-foreground shadow-lg">{(payload[0].payload as TimelinePoint).text}</div> : null)} />
              <Scatter isAnimationActive={false} data={inLane('occurrence')} zAxisId="reports" shape={dot(color)} onClick={hit} />
              <Scatter isAnimationActive={false} data={inLane('report')} zAxisId="mark" shape={dot('var(--neutral-100)')} onClick={hit} />
              <Scatter isAnimationActive={false} data={inLane('intervention')} zAxisId="mark" fill="var(--blue-300)" shape="diamond" onClick={hit} />
              <Scatter isAnimationActive={false} data={inLane('event')} zAxisId="mark" fill="var(--yellow-300)" shape="square" onClick={hit} />
            </ScatterChart>
          </ChartContainer>
        </div>
      </div>

      {sel && (
        <div aria-live="polite" className="flex flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2 text-body-sm-medium text-foreground">
            {intervention ? sel.text.split(' · ').slice(0, 3).join(' · ') : sel.text}
            {uncertain && sel.lane === 'occurrence' && <Badge variant="outline">Boundary uncertain</Badge>}
          </p>
          {intervention && (
            <>
              <p className="text-meta text-muted-foreground">{intervention.description}</p>
              <p className="text-meta text-muted-foreground">Outcome: {intervention.outcome ? label(intervention.outcome) : 'Not recorded yet'}</p>
            </>
          )}
          {sel.lane === 'occurrence' && (
            <ul className="flex flex-col">
              {inLane('report')
                .filter((p) => p.occurrenceId === sel.occurrenceId)
                .map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => onSelectIncident(p.incidentId!)} className="w-full rounded-sm py-0.5 text-left text-meta text-muted-foreground hover:bg-sidebar focus-visible:bg-sidebar">
                      {p.text}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
