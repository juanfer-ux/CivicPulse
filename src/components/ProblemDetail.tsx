import type { ReactNode } from 'react'
import { BarList } from '@/components/BarList'
import { HistoryTitle, type HistorySort } from '@/components/HistoryTitle'
import { ModulesMenu, PanelMenuRow } from '@/components/modules/ModulesMenu'
import { useModules } from '@/components/modules/ModulesProvider'
import { useRef, Fragment } from 'react'
import { ArrowsClockwise, Calendar, FileText, Stack, Wrench, X, UserCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import { MediaGallery } from '@/components/MediaGallery'
import { twoLines } from '@/lib/address'
import { label } from '@/lib/incidents'
import type { ProblemRow, ProblemEvent } from '@/lib/problems'
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
  event,
  photoOf,
  onClose,
  ...sort
}: HistorySort & {
  photoOf?: string // the newest report, whose photos head the Overview card
  problem: ProblemRow
  event?: ProblemEvent // the latest status event, shown with the numbers
  localityName: string | undefined
  categoryName: string | undefined
  onClose: () => void
}) {
  const panel = useRef<HTMLDivElement>(null)
  useRestoreFocus(panel)
  const { on: modulesOn } = useModules()
  return (
    <>
    {WIDE && (
      <div className="hidden items-center gap-2 desk:absolute desk:top-3 desk:right-[calc(var(--col-right)+326px+12px)] desk:z-20 desk:flex"> {/* the Modules button and the close X float at the map's top right corner, just left of the history column (owner, 2026-11-26; they were above the numbers card), like the map buttons of Google Maps */}
        {modulesOn && <div className="rounded-md border border-(--neutral-600) bg-(--neutral-900) shadow-lg"><ModulesMenu kind="recurrence" /></div>}
        <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose} className="rounded-md border border-(--neutral-600) bg-(--neutral-900) shadow-lg hover:bg-(--neutral-700)">
          <X />
        </Button>
      </div>
    )}
    <Card
      ref={panel}
      tabIndex={-1}
      role="region"
      data-float
      aria-label="Recurrence details"
      className={`max-h-[45%] shrink-0 gap-0 overflow-auto bg-card/95 py-0 outline-none ${WIDE ? 'desk:absolute desk:top-3 desk:left-[calc(var(--col-left)+12px)] desk:z-20 desk:max-h-[calc(100%-24px)] desk:w-[320px] desk:flex-col desk:items-stretch desk:gap-2 desk:overflow-visible desk:rounded-none desk:border-0 desk:bg-transparent! desk:shadow-none' : 'desk:absolute desk:top-[calc(var(--map-pad)+var(--banner-offset,0px))] desk:left-(--col-left) desk:z-20 desk:max-h-[calc(100%-var(--map-pad)-var(--map-pad)-var(--banner-offset,0px))] desk:w-[400px] desk:rounded-sm desk:border desk:border-(--neutral-600) desk:bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)]'}`}
    >
      {WIDE && <div className="hidden desk:block desk:min-h-0 desk:overflow-y-auto desk:rounded-lg desk:shadow-lg"><Overview problem={problem} event={event} photoOf={photoOf} {...sort} /></div>} {/* the numbers (last reported, occurrences, returns, reports, interventions) float at the top left on every recurrence (owner, 2026-11-24) */}
      <div className={`flex flex-col gap-4 px-4 py-6 ${WIDE ? 'desk:hidden' : ''}`}>
        <header className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-subtitle">{categoryName ?? label(problem.category)}</h2>
            <p className="whitespace-pre-line text-subtitle">{twoLines(problem.location_description)}</p>
            <p className="text-meta text-muted-foreground">
              {problem.reference} · {localityName}
            </p>
          </div>
          <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </header>
        <PanelMenuRow kind="recurrence" className="-mx-4 border-y" />
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
    </>
  )
}

export const stats = (p: ProblemRow) => [
  { Icon: Stack, label: 'Occurrences', value: String(p.occurrences_n) },
  { Icon: ArrowsClockwise, label: 'Returns', value: String(p.recurrences_n) },
  { Icon: FileText, label: 'Reports', value: String(p.reports_n) },
  { Icon: Wrench, label: 'Interventions', value: String(p.interventions_n) },
  { Icon: Calendar, label: 'Last reported', value: p.last_seen ? day(p.last_seen) : '-' },
]

/** The header of an open case (owner, 2026-11-15: the same for a recurrence and an incident): the big title, a line with the category and the reference, a status at the right and, under them, the menu row with the Modules button. The close button is placed by the panel, at its top right. */
export function CaseHeader({ title, category, reference, locality, pill, kind }: { title: string; category: string; reference: string; locality: string | undefined; pill: ReactNode; kind: 'recurrence' | 'incident' }) {
  return (
    <>
      <div className="flex items-start gap-4 pt-5 pr-[68px] pb-5 pl-5">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="font-display-semi text-display-sm font-[calc(700+var(--display-weight-offset))] tracking-[0.01em] text-(--fg-emphasis)">{title}</h2>
          <div className="flex items-center gap-3">
            <p className="text-body-medium leading-5">{category}</p>
            <span className="h-3.5 w-px bg-(--neutral-500)" aria-hidden />
            <p className="text-meta leading-5 text-(--fg-secondary)">{reference} · {locality}</p>
          </div>
        </div>
        <div className="ml-auto flex items-start">{pill}</div>
      </div>
      <PanelMenuRow kind={kind} />
    </>
  )
}

// ponytail: sample numbers from the Figma component, until the owner says what this list shows
const SAMPLE_BARS = [{ label: 'Chapinero', value: 62 }, { label: 'Suba', value: 52 }, { label: 'Kennedy', value: 43 }, { label: 'Engativá', value: 36 }, { label: 'Others', value: 61 }]

/** The numbers of an open recurrence (Figma Overview, owner 2026-11-26): a `neutral-900` box (8 px radius): the history title row, then, 8 px in and 12 px apart, last report and the latest status event (a `neutral-600` line between them), then four equal 84 px tiles in two columns (the label, 12 px, the number; no icons since 2026-11-27) and a bar list (sample data for now). */
export function Overview({ problem, event, photoOf, ...sort }: HistorySort & { problem: ProblemRow; event?: ProblemEvent; photoOf?: string }) {
  const [occ, ret, rep, int, last] = stats(problem)
  const rows = [{ Icon: last.Icon, label: last.label, value: last.value }, ...(event ? [{ Icon: event.kind === 'resolved' ? UserCheck : last.Icon, label: event.kind === 'resolved' ? 'Resolved by an operator' : 'Reopened by a new occurrence', value: day(event.created_at) }] : [])] // a person icon when an operator resolved it (owner, 2026-11-26)
  return (
    <div className="hidden flex-col gap-2 rounded-lg bg-(--neutral-900) desk:flex">
      <HistoryTitle title="Overview" {...sort} />
      <h4 className="p-3 font-display-semi text-display-xs-strong whitespace-pre-line text-(--fg-primary)">{twoLines(problem.location_description)}</h4> {/* the address, on two lines, under the title row (owner's Figma, 2026-11-27) */}
      <div className="flex flex-col gap-3 p-3">
        {photoOf && <MediaGallery key={photoOf} incidentId={photoOf} cover />} {/* the photos of the newest report (owner, 2026-11-27) */}
        <div className="flex flex-col gap-2 py-1">
          {rows.map((r, i) => (
            <Fragment key={r.label}>
              {i > 0 && <div className="border-t border-(--neutral-600)" aria-hidden />}
              <p className="flex items-center gap-2 p-2">
                <r.Icon weight="regular" className="size-5 shrink-0 text-(--neutral-200)" aria-hidden />
                <span className="flex-1 text-body-sm text-(--fg-secondary)">{r.label}</span>
                <span className="text-body-sm-medium text-(--fg-primary)">{r.value}</span>
              </p>
            </Fragment>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-1 px-1">
          {[occ, ret, rep, int].map((x) => (
            <div key={x.label} className="flex flex-col gap-3 rounded-sm bg-(--neutral-700) px-4 py-3">
              <dt className="text-body-sm text-(--fg-secondary)">{x.label}</dt>
              <dd className="font-display-semi text-stat text-[24px]! leading-7! text-(--fg-primary)">{x.value}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-lg border border-(--neutral-700) p-[15px]"> {/* Figma: the line is excluded from layout, so 16 px from the outer edge */}
          <BarList bars={SAMPLE_BARS} />
        </div>
      </div>
    </div>
  )
}
