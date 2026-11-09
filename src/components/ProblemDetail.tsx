import { useRef } from 'react'
import { ArrowsClockwise, Calendar, FileText, Stack, Wrench, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import { label } from '@/lib/incidents'
import type { ProblemRow } from '@/lib/problems'
import { useRestoreFocus } from '@/lib/useRestoreFocus'

// Header (owner, 2026-11-08): option 3 of the header gallery (/#header) is the default on desktop; /?header=1 draws the strip option and /?header=0 today's 400 px card.
export const HEADER = new URLSearchParams(location.search).get('header') ?? '3'
const WIDE = HEADER === '1' || HEADER === '3'

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
      className={`max-h-[45%] shrink-0 gap-0 overflow-auto bg-card/95 py-0 outline-none desk:absolute desk:top-[calc(var(--map-pad)+var(--banner-offset,0px))] desk:left-(--col-left) desk:z-20 desk:max-h-[calc(100%-var(--map-pad)-var(--map-pad)-var(--banner-offset,0px))] desk:border desk:border-(--neutral-900) desk:bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] ${WIDE ? 'desk:right-(--col-right)' : 'desk:w-[400px]'} ${WIDE ? 'desk:bg-(--neutral-900)!' : ''}`}
    >
      {WIDE && (
        <>
          <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose} className="absolute top-5 right-5 z-10 hidden desk:inline-flex">
            <X />
          </Button>
          <div className="hidden desk:block">
            <WideHeader problem={problem} localityName={localityName} categoryName={categoryName} />
          </div>
        </>
      )}
      <div className={`flex flex-col gap-4 px-4 py-6 ${WIDE ? 'desk:hidden' : ''}`}>
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

export const stats = (p: ProblemRow) => [
  { Icon: Stack, label: 'Occurrences', value: String(p.occurrences_n) },
  { Icon: ArrowsClockwise, label: 'Returns', value: String(p.recurrences_n) },
  { Icon: FileText, label: 'Reports', value: String(p.reports_n) },
  { Icon: Wrench, label: 'Interventions', value: String(p.interventions_n) },
  { Icon: Calendar, label: 'Last reported', value: p.last_seen ? day(p.last_seen) : '-' },
]

/** Gallery options 1 and 3 (/#header) with the real data. */
function WideHeader({ problem, localityName, categoryName }: { problem: ProblemRow; localityName: string | undefined; categoryName: string | undefined }) {
  const category = (
    <div className="flex items-center gap-3">
      <p className="text-body-medium leading-5">{categoryName ?? label(problem.category)}</p>
      <span className="h-3.5 w-px bg-(--neutral-500)" aria-hidden />
      <p className="text-meta leading-5 text-muted-foreground">{problem.reference} · {localityName}</p>
      {HEADER === '1' && <ProblemStatusPill status={problem.status} />}
    </div>
  )
  const title = (
    <div className="flex min-w-0 flex-col gap-1">
      <h2 className="text-heading text-[24px]! leading-[30px]">{problem.location_description}</h2>
      {category}
    </div>
  )
  const s = stats(problem)
  if (HEADER === '1')
    return (
      <>
        <div className="flex items-center gap-6 py-4 pr-[60px] pl-5">
          {title}
          <dl className="ml-auto flex items-stretch">
            {s.map((x) => (
              <div key={x.label} className="flex shrink-0 flex-col gap-0 whitespace-nowrap border-l border-(--neutral-500) px-5 first:border-l-0">
                <dt className="text-meta text-muted-foreground">{x.label}</dt>
                <dd className="text-heading text-[24px]!">{x.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </>
    )
  return (
    <>
      <div className="flex items-start gap-4 pt-5 pr-[60px] pb-5 pl-5">
        {title}
        <div className="ml-auto flex items-start">
          <ProblemStatusPill status={problem.status} />
        </div>
      </div>
    </>
  )
}

/** Option 3 (owner's drawing, 2026-11-08): the five numbers are not in the header; they stack at the top of the left column, above the occurrences history (ProblemTimelineCard). */
export function StatList({ problem }: { problem: ProblemRow }) {
  return (
    <dl className="hidden grid-cols-2 border-b border-(--neutral-500) desk:grid">
      {stats(problem).map((x) => (
        <div key={x.label} className="flex items-center gap-3 border-(--neutral-500) px-4 py-3 even:border-l nth-[n+3]:border-t last:col-span-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-(--neutral-600)">
            <x.Icon weight="regular" className="size-4 text-(--neutral-100)" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <dt className="text-meta leading-none text-muted-foreground">{x.label}</dt>
            <dd className="text-heading leading-none">{x.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
