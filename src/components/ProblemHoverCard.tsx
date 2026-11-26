import { useEffect, useState, type CSSProperties } from 'react'
import { HoverCard } from '@/components/HoverCard'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import { twoLines } from '@/lib/address'
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
  const n = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
  return (
    <HoverCard
      className={className}
      style={style}
      status={<ProblemStatusPill status={problem.status} />}
      photo={latest && `Latest photo · ${latest.reference} · ${date(latest.at, false)}`}
      placeholder={latest?.placeholder}
      title={twoLines(problem.location_description)}
      columns={[problem.first_seen && problem.last_seen ? `${date(problem.first_seen, !sameYear)} – ${date(problem.last_seen, true)}` : '', n(problem.occurrences_n, 'occurrence')]}
      note={`${n(problem.reports_n, 'Report')} · ${n(problem.interventions_n, 'Intervention')}`}
    />
  )
}
