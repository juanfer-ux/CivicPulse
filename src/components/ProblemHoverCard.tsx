import { useEffect, useState, type CSSProperties } from 'react'
import { Image } from '@phosphor-icons/react'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import { fetchLatestPhoto, type LatestPhoto, type ProblemRow } from '@/lib/problems'

const date = (iso: string, year: boolean) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) })

/**
 * A very small view of a problem (owner, 2026-10-30; Figma Recurrence Card, adjusted 2026-11-02), shown while the pointer is over it on the map, at any zoom:
 * where, its status, the occurrences with the dates they span, the reports behind them and the interventions.
 * The full story is in the Recurrence Panel (click).
 */
export function ProblemHoverCard({ problem, className = '', style }: { problem: ProblemRow; className?: string; style?: CSSProperties }) {
  const [photo, setPhoto] = useState<{ id: string; photo: LatestPhoto | null } | null>(null)
  useEffect(() => {
    let stale = false
    fetchLatestPhoto(problem.id).then((p) => !stale && setPhoto({ id: problem.id, photo: p }))
    return () => {
      stale = true
    }
  }, [problem.id])
  const latest = photo?.id === problem.id ? photo.photo : null
  const sameYear = !!problem.first_seen && !!problem.last_seen && new Date(problem.first_seen).getFullYear() === new Date(problem.last_seen).getFullYear()
  return (
    <div role="tooltip" style={style} className={`pointer-events-none flex w-[353px] flex-col gap-2 rounded-sm bg-[color-mix(in_srgb,var(--neutral-900)_90%,transparent)] p-3 text-body-sm shadow-lg backdrop-blur-[16px] ${className}`}>
      {latest && (
        <div className="relative grid h-28 place-items-center rounded-sm border border-dashed border-(--neutral-500) bg-(--neutral-800) text-(--neutral-300)" title={latest.placeholder ? 'Placeholder: no file attached yet' : undefined}> {/* the newest photo of the newest occurrence (owner, 2026-11-24); no files exist yet, so a placeholder tile like the report carousel's */}
          <Image className="size-6" aria-hidden />
          <span className="absolute bottom-1.5 left-2 text-caption-medium">Latest photo · {latest.reference} · {date(latest.at, false)}</span>
        </div>
      )}
      <p className="line-clamp-2 text-title text-foreground">{problem.location_description}</p>
      <ProblemStatusPill status={problem.status} />
      <div className="flex flex-col gap-0.5">
        <p className="text-foreground">
          {problem.occurrences_n} {problem.occurrences_n === 1 ? 'Occurrence' : 'Occurrences'}
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
