import type { CSSProperties } from 'react'
import { label } from '@/lib/incidents'
import { type ProblemRow } from '@/lib/problems'
import { PROBLEM_STATUS } from '@/lib/statusColors'

const date = (iso: string, year: boolean) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) })

/**
 * A very small view of a problem (owner, 2026-10-30), shown while the pointer is over it on the map, at any zoom:
 * where and what, its status, the occurrences with the dates they span, the reports behind them and the interventions.
 * The full story is in the Problem Panel (click).
 */
export function ProblemHoverCard({ problem, className = '', style }: { problem: ProblemRow; className?: string; style?: CSSProperties }) {
  const status = PROBLEM_STATUS[problem.status]
  const sameYear = !!problem.first_seen && !!problem.last_seen && new Date(problem.first_seen).getFullYear() === new Date(problem.last_seen).getFullYear()
  return (
    <div role="tooltip" style={style} className={`pointer-events-none w-64 rounded-sm border border-(--neutral-400) bg-(--neutral-700) p-3 text-body-sm shadow-lg ${className}`}>
      <p className="line-clamp-2 text-body-strong text-foreground">{problem.location_description}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-meta text-muted-foreground">
        <span className="block size-2 rounded-full" style={{ background: `var(${status.token})` }} aria-hidden />
        {status.label} · {label(problem.category)}
      </p>
      <p className="mt-2 text-foreground">
        <span className="text-body-strong">{problem.occurrences_n}</span> {problem.occurrences_n === 1 ? 'occurrence' : 'occurrences'}
        {problem.first_seen && problem.last_seen && (
          <span className="text-muted-foreground">
            {' '}
            · {date(problem.first_seen, !sameYear)} – {date(problem.last_seen, true)}
          </span>
        )}
      </p>
      <p className="text-muted-foreground">
        {problem.reports_n} {problem.reports_n === 1 ? 'report' : 'reports'} · {problem.interventions_n} {problem.interventions_n === 1 ? 'intervention' : 'interventions'}
      </p>
    </div>
  )
}
