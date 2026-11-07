import type { CSSProperties } from 'react'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import type { ProblemRow } from '@/lib/problems'

const date = (iso: string, year: boolean) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) })

/**
 * A very small view of a problem (owner, 2026-10-30; Figma Recurrence Card, adjusted 2026-11-02), shown while the pointer is over it on the map, at any zoom:
 * where, its status, the occurrences with the dates they span, the reports behind them and the interventions.
 * The full story is in the Recurrence Panel (click).
 */
export function ProblemHoverCard({ problem, className = '', style }: { problem: ProblemRow; className?: string; style?: CSSProperties }) {
  const sameYear = !!problem.first_seen && !!problem.last_seen && new Date(problem.first_seen).getFullYear() === new Date(problem.last_seen).getFullYear()
  return (
    <div role="tooltip" style={style} className={`pointer-events-none flex w-[353px] flex-col gap-2 rounded-sm bg-[color-mix(in_srgb,var(--neutral-900)_90%,transparent)] p-3 text-body-sm shadow-lg backdrop-blur-[16px] ${className}`}>
      <p className="line-clamp-2 text-title text-foreground">{problem.location_description}</p>
      <ProblemStatusPill status={problem.status} />
      <div className="flex flex-col gap-0.5">
        <p className="text-foreground">
          {problem.occurrences_n} {problem.occurrences_n === 1 ? 'occurrence' : 'occurrences'}
          {problem.first_seen && problem.last_seen && (
            <>
              {' '}
              · {date(problem.first_seen, !sameYear)} – {date(problem.last_seen, true)}
            </>
          )}
        </p>
        <p className="text-muted-foreground">
          {problem.reports_n} {problem.reports_n === 1 ? 'Report' : 'Reports'} · {problem.interventions_n} {problem.interventions_n === 1 ? 'Intervention' : 'Interventions'}
        </p>
      </div>
    </div>
  )
}
