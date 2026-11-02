import { useRef } from 'react'
import { X } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import { ProblemTimeline } from '@/components/ProblemTimeline'
import { label, type Incident } from '@/lib/incidents'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'
import { useRestoreFocus } from '@/lib/useRestoreFocus'
import { useSlide } from '@/lib/useSlide'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const time = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

type Step =
  | { at: number; kind: 'occurrence'; n: number; id: string }
  | { at: number; kind: 'intervention'; id: string }
  | { at: number; kind: 'event'; text: string }

/**
 * The persistent problem (decision 0030): its status, how often it came back (OCCURRENCES, with the number of reports next to it
 * as intensity only), and one chronological history of occurrences, their reports (with the platform each came from) and the
 * interventions with their outcomes. It is 400 px wide (the incident panel is 360), per the Figma Problem Panel.
 */
export function ProblemDetail({
  problem,
  detail,
  localityName,
  categoryName,
  onSelectIncident,
  onClose,
  slide,
  leaving,
}: {
  problem: ProblemRow
  detail: ProblemDetailData | null
  localityName: string | undefined
  categoryName: string | undefined
  onSelectIncident: (id: string) => void
  onClose: () => void
  slide: boolean
  leaving: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  useRestoreFocus(panel)
  useSlide(panel, slide, leaving)
  const incidents = new Map<string, Incident>((detail?.incidents ?? []).map((i) => [i.id, i]))
  const occN = new Map((detail?.occurrences ?? []).map((o, i) => [o.occurrence_id, i + 1]))
  const steps: Step[] = detail
    ? [
        ...detail.occurrences.filter((o) => o.first_report_at).map((o, i) => ({ at: Date.parse(o.first_report_at!), kind: 'occurrence' as const, n: i + 1, id: o.occurrence_id })),
        ...detail.interventions.map((v) => ({ at: Date.parse(v.performed_at), kind: 'intervention' as const, id: v.id })),
        ...detail.events.map((e) => ({ at: Date.parse(e.created_at), kind: 'event' as const, text: e.kind === 'resolved' ? 'Marked resolved by an operator' : 'Reopened by a new occurrence' })),
      ].sort((a, b) => a.at - b.at)
    : []
  const unplaced = (detail?.links ?? []).filter((l) => !l.occurrence_id)

  const report = (id: string, proposed: boolean) => {
    const i = incidents.get(id)
    if (!i) return null
    return (
      <li key={id}>
        <button type="button" onClick={() => onSelectIncident(id)} className="flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-sm py-0.5 text-left text-meta text-muted-foreground hover:bg-sidebar focus-visible:bg-sidebar">
          <span>{i.reference}</span>
          <span>
            {detail?.sources[id] ?? 'Unknown source'} · {time(i.occurred_at)}
          </span>
          {proposed && <Badge variant="outline">Needs review</Badge>}
        </button>
      </li>
    )
  }

  return (
    <Card
      ref={panel}
      tabIndex={-1}
      role="region"
      aria-label="Problem details"
      className="max-h-[45%] shrink-0 gap-0 overflow-auto bg-card/95 py-0 outline-none desk:absolute desk:top-0 desk:bottom-0 desk:left-[calc(var(--agent-w)+var(--panel-gap))] desk:z-20 desk:max-h-none desk:w-[400px] desk:rounded-none desk:border-y-0 desk:border-l-0 desk:border-r desk:border-secondary desk:bg-(--neutral-800)"
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
        <div className="flex flex-wrap items-center gap-1.5">
          <ProblemStatusPill status={problem.status} />
          <span className="inline-flex items-center rounded-sm bg-(--neutral-400) px-2.5 py-1 text-meta text-foreground">{categoryName ?? label(problem.category)}</span>
          {problem.quiet && problem.status !== 'resolved' && <Badge variant="outline">Quiet for 30+ days</Badge>}
          {problem.uncertain_n > 0 && <Badge variant="outline">Boundary uncertain</Badge>}
        </div>
        <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-meta">
          <dt className="text-muted-foreground">Occurrences</dt>
          <dd className="text-foreground">{problem.occurrences_n}</dd>
          <dt className="text-muted-foreground">Recurrence</dt>
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

        <section aria-label="History" className="flex flex-col gap-3 bg-(--neutral-700) p-3">
          <h3 className="text-section-label uppercase text-(--neutral-200)">History</h3>
          {!detail && <p className="text-meta text-muted-foreground">Loading…</p>}
          {detail && <ProblemTimeline detail={detail} status={problem.status} onSelectIncident={onSelectIncident} />}
          {detail && steps.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-meta text-muted-foreground hover:text-foreground">Show as a list</summary>
              <ol className="mt-3 flex flex-col gap-3">
                {steps.map((st) => {
                  if (st.kind === 'event') {
                    return (
                      <li key={`e-${st.at}`} className="text-meta text-muted-foreground">
                        {day(new Date(st.at).toISOString())} · {st.text}
                      </li>
                    )
                  }
                  if (st.kind === 'intervention') {
                    const v = detail!.interventions.find((x) => x.id === st.id)!
                    return (
                      <li key={v.id} className="flex flex-col gap-0.5 rounded-sm border-[0.5px] border-(--neutral-400) p-2">
                        <p className="text-body-sm-medium text-foreground">
                          {day(v.performed_at)} · {label(v.action_type)} · {v.agency}
                        </p>
                        <p className="text-meta text-muted-foreground">{v.description}</p>
                        <p className="text-meta text-muted-foreground">Outcome: {v.outcome ? label(v.outcome) : 'Not recorded yet'}</p>
                      </li>
                    )
                  }
                  const o = detail!.occurrences.find((x) => x.occurrence_id === st.id)!
                  const rows = detail!.links.filter((l) => l.occurrence_id === o.occurrence_id)
                  return (
                    <li key={o.occurrence_id} className="flex flex-col gap-1">
                      <p className="flex flex-wrap items-center gap-2 text-body-sm-medium text-foreground">
                        Occurrence {occN.get(o.occurrence_id)} · {day(o.first_report_at!)} · {o.reports_n} {o.reports_n === 1 ? 'report' : 'reports'}
                        {o.boundary_uncertain && <Badge variant="outline">Boundary uncertain</Badge>}
                      </p>
                      <ul className="flex flex-col">{rows.map((l) => report(l.incident_id, l.state === 'proposed'))}</ul>
                    </li>
                  )
                })}
              </ol>
              {unplaced.length > 0 && (
                <div className="mt-3">
                  <p className="text-body-sm-medium text-foreground">Waiting for review</p>
                  <ul className="mt-1 flex flex-col">{unplaced.map((l) => report(l.incident_id, true))}</ul>
                </div>
              )}
            </details>
          )}
        </section>
      </div>
    </Card>
  )
}
