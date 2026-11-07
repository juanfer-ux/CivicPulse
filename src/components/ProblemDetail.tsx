import { useRef } from 'react'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import { label } from '@/lib/incidents'
import type { ProblemRow } from '@/lib/problems'
import { useRestoreFocus } from '@/lib/useRestoreFocus'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/**
 * The recurrence (decision 0030): its status and the facts: occurrences, recurrence, reports, interventions, last reported. Its history
 * lives in its own floating card at the bottom of the map (ProblemTimelineCard). It is a 400 px floating card in the map's top-left corner (owner, 2026-11-05: no longer a side panel).
 */
export function ProblemDetail({
  problem,
  localityName,
  categoryName,
  onClose,
}: {
  problem: ProblemRow
  localityName: string | undefined
  categoryName: string | undefined
  onClose: () => void
}) {
  const panel = useRef<HTMLDivElement>(null)
  useRestoreFocus(panel)
  return (
    <Card
      ref={panel}
      tabIndex={-1}
      role="region"
      data-float
      aria-label="Recurrence details"
      className="max-h-[45%] shrink-0 gap-0 overflow-auto bg-card/95 py-0 outline-none desk:absolute desk:top-(--map-pad) desk:left-[calc(var(--map-base)-var(--page-pad)+var(--group-gap))] desk:z-20 desk:max-h-[calc(100%-var(--map-pad)-var(--map-pad))] desk:w-[400px] desk:bg-(--neutral-800)"
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        <header className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-subtitle">{categoryName ?? label(problem.category)}</h2>
            <p className="text-subtitle">{problem.location_description}</p>
            <p className="text-meta text-muted-foreground">
              {problem.reference} · {localityName}
            </p>
          </div>
          <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </header>
        <ProblemStatusPill status={problem.status} />
        <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-muted-foreground [&>dd]:text-body-sm-strong [&>dt]:text-body-sm-medium">
          <dt className="text-muted-foreground">Occurrences</dt>
          <dd className="text-foreground">{problem.occurrences_n}</dd>
          <dt className="text-muted-foreground">Returns</dt>
          <dd className="text-foreground">
            {problem.recurrences_n === 0 ? 'Has not come back' : `Came back ${problem.recurrences_n} ${problem.recurrences_n === 1 ? 'time' : 'times'}`}
          </dd>
          <dt className="text-muted-foreground">Reports</dt>
          <dd className="text-foreground">{problem.reports_n} (many reports can describe one occurrence)</dd>
          <dt className="text-muted-foreground">Interventions</dt>
          <dd className="text-foreground">{problem.interventions_n}</dd>
          {problem.last_seen && (
            <>
              <dt className="text-muted-foreground">Last reported</dt>
              <dd className="text-foreground">{day(problem.last_seen)}</dd>
            </>
          )}
        </dl>

      </div>
    </Card>
  )
}
