import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ProblemTimeline } from '@/components/ProblemTimeline'
import { label, type Incident } from '@/lib/incidents'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const time = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

type Step =
  | { at: number; kind: 'occurrence'; id: string }
  | { at: number; kind: 'intervention'; id: string }
  | { at: number; kind: 'event'; text: string }

/**
 * A problem's history as its own floating card at the bottom of the map (owner, 2026-11-05), apart from the Problem Panel: the vertical occurrences list on the left, 40% of the card (its own scroll: occurrences with
 * their reports, interventions and events, oldest first) and the lanes timeline on the right, 60%. On phones it sits in the bottom sheet.
 */
export function ProblemTimelineCard({ problem, detail, onSelectIncident }: { problem: ProblemRow; detail: ProblemDetailData | null; onSelectIncident: (id: string) => void }) {
  const incidents = new Map<string, Incident>((detail?.incidents ?? []).map((i) => [i.id, i]))
  const occN = new Map((detail?.occurrences ?? []).map((o, i) => [o.occurrence_id, i + 1]))
  const steps: Step[] = detail
    ? [
        ...detail.occurrences.filter((o) => o.first_report_at).map((o) => ({ at: Date.parse(o.first_report_at!), kind: 'occurrence' as const, id: o.occurrence_id })),
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
      role="region"
      aria-label="Problem history"
      className="max-h-[45%] shrink-0 gap-0 overflow-hidden bg-card/95 py-0 desk:absolute desk:right-6 desk:bottom-6 desk:left-[calc(var(--map-base)+1.5rem)] desk:z-20 desk:max-h-[40svh] desk:flex-row"
    >
      <section aria-label="Occurrences history" className="flex flex-col gap-3 overflow-y-auto p-4 desk:w-2/5 desk:shrink-0 desk:border-t-0 desk:border-r max-desk:border-b">
        <h3 className="text-section-label uppercase text-(--neutral-200)">Occurrences history</h3>
        {detail && steps.length === 0 && <p className="text-muted-foreground">No history yet.</p>}
        <ol className="flex flex-col gap-3">
          {steps.map((st) => {
            if (st.kind === 'event') {
              return (
                <li key={`e-${st.at}`} className="text-muted-foreground">
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
          <div>
            <p className="text-body-sm-medium text-foreground">Waiting for review</p>
            <ul className="mt-1 flex flex-col">{unplaced.map((l) => report(l.incident_id, true))}</ul>
          </div>
        )}
      </section>
      <section aria-label="Timeline" className="flex min-w-0 flex-col gap-3 overflow-auto p-4 max-desk:border-t desk:w-3/5">
        <h3 className="text-section-label uppercase text-(--neutral-200)">Timeline · {problem.reference}</h3>
        {!detail && <p className="text-muted-foreground">Loading…</p>}
        {detail && <ProblemTimeline detail={detail} status={problem.status} onSelectIncident={onSelectIncident} />}
      </section>
    </Card>
  )
}
