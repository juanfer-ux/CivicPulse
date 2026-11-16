import { CheckCircle, Clock, Robot, Tag } from '@phosphor-icons/react'
import { stats } from '@/components/ProblemDetail'
import type { Incident } from '@/lib/incidents'
import type { Shape } from '@/lib/modules'
import type { ProblemRow } from '@/lib/problems'

const label = (s: string) => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
/** An incident's own numbers, all read from its row (no new data): the AI's confidence, how long after it happened it was reported, its validation and its status. */
const incidentStats = (i: Incident) => [
  { Icon: Robot, label: 'AI confidence', value: i.ai_confidence == null ? '-' : `${Math.round(i.ai_confidence * 100)} %` },
  { Icon: Clock, label: 'Reported after', value: `${Math.max(0, Math.round((new Date(i.reported_at).getTime() - new Date(i.occurred_at).getTime()) / 3600000))} h` },
  { Icon: CheckCircle, label: 'Validation', value: label(i.validation_status) },
  { Icon: Tag, label: 'Status', value: label(i.status) },
]

/** The Numbers module: a recurrence's five numbers (the same ones as the header's column), laid out for its area: a column in three columns, the bottom strip (4:2) in one row of five. */
export default function NumbersModule({ problem, incident, shape }: { problem?: ProblemRow; incident?: Incident; shape: Shape }) {
  const big = shape === '4:4'
  const cols = shape === '4:2' ? 'grid-cols-5' : big ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <dl className={`grid gap-x-3 gap-y-3 ${cols}`}>
      {(problem ? stats(problem) : incident ? incidentStats(incident) : []).map((x) => (
        <div key={x.label} className="flex min-w-0 flex-col gap-1">
          <dt className="flex items-center gap-1 truncate text-meta text-muted-foreground">
            <x.Icon weight="regular" className="size-3.5 shrink-0 text-(--neutral-200)" aria-hidden />
            <span className="truncate">{x.label}</span>
          </dt>
          <dd className={`truncate ${big ? 'text-heading' : 'text-subtitle'}`}>{x.value}</dd>
        </div>
      ))}
    </dl>
  )
}
