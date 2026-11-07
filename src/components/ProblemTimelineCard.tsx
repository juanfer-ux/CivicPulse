import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProblemTimeline } from '@/components/ProblemTimeline'
import { label, type Incident } from '@/lib/incidents'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const time = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

type Step =
  | { key: string; at: number; kind: 'occurrence'; id: string }
  | { key: string; at: number; kind: 'intervention'; id: string }
  | { key: string; at: number; kind: 'event'; text: string }

/**
 * A problem's history as two separate floating cards at the bottom of the map (owner, 2026-11-05), apart from the Recurrence Panel and 40 px apart: the vertical occurrences list on the left, 40% of the width (its own scroll: occurrences with
 * their reports, interventions and events, oldest first) and the lanes timeline on the right, 60% (percentages of the width without the gap). Both are 360 px tall. On phones they sit stacked in the bottom sheet.
 */
export function ProblemTimelineCard({ problem, detail, onSelectIncident }: { problem: ProblemRow; detail: ProblemDetailData | null; onSelectIncident: (id: string) => void }) {
  const [focus, setFocus] = useState<string | null>(null)
  const list = useRef<HTMLDivElement>(null) // the ScrollArea viewport of the occurrences history
  useEffect(() => {
    // the timeline is the anchor: a click on an occurrence, intervention or event there scrolls this list to the same item
    const box = list.current
    const el = focus ? box?.querySelector<HTMLElement>(`[data-step="${focus}"]`) : null
    if (box && el) box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16, behavior: 'smooth' })
  }, [focus])
  const incidents = new Map<string, Incident>((detail?.incidents ?? []).map((i) => [i.id, i]))
  const occN = new Map((detail?.occurrences ?? []).map((o, i) => [o.occurrence_id, i + 1]))
  const steps: Step[] = detail
    ? [
        ...detail.occurrences.filter((o) => o.first_report_at).map((o) => ({ at: Date.parse(o.first_report_at!), kind: 'occurrence' as const, key: `o-${o.occurrence_id}`, id: o.occurrence_id })),
        ...detail.interventions.map((v) => ({ at: Date.parse(v.performed_at), kind: 'intervention' as const, key: `v-${v.id}`, id: v.id })),
        ...detail.events.map((e) => ({ at: Date.parse(e.created_at), kind: 'event' as const, key: `e-${e.created_at}`, text: e.kind === 'resolved' ? 'Marked resolved by an operator' : 'Reopened by a new occurrence' })),
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
    <div data-float className="flex shrink-0 flex-col gap-2 desk:absolute desk:right-(--page-pad) desk:bottom-(--page-pad) desk:left-[calc(var(--map-base)-var(--page-pad)+var(--group-gap))] desk:z-20 desk:h-[360px] desk:flex-row desk:gap-6">
    <Card role="region" aria-label="Timeline" className="min-w-0 gap-0 overflow-hidden bg-card/95 py-0 desk:h-full desk:flex-1 desk:bg-(--neutral-800)">
    <ScrollArea className="min-h-0 flex-1" viewportClassName="max-desk:max-h-[40svh]">
      <section className="flex flex-col gap-3 p-4">
        <h3 className="text-section-label uppercase text-(--neutral-200)">Timeline · {problem.reference}</h3>
        {!detail && <p className="text-muted-foreground">Loading…</p>}
        {detail && <ProblemTimeline detail={detail} status={problem.status} onSelectIncident={onSelectIncident} onPick={setFocus} />}
      </section>
    </ScrollArea>
    </Card>
    <Card role="region" aria-label="Occurrences history" className="gap-0 overflow-hidden bg-card/95 py-0 desk:h-full desk:w-[calc((100%-1.5rem)*0.4)] desk:shrink-0 desk:bg-(--neutral-800)">
    <ScrollArea viewportRef={list} className="min-h-0 flex-1" viewportClassName="max-desk:max-h-[40svh]">
      <section className="flex flex-col gap-3 p-4">
        <h3 className="text-section-label uppercase text-(--neutral-200)">Occurrences history</h3>
        {detail && steps.length === 0 && <p className="text-muted-foreground">No history yet.</p>}
        <ol className="flex flex-col gap-3">
          {steps.map((st) => {
            if (st.kind === 'event') {
              return (
                <li key={st.key} data-step={st.key} className={`text-muted-foreground${focus === st.key ? ' rounded-sm outline outline-1 outline-offset-4 outline-(--neutral-200)' : ''}`}>
                  {day(new Date(st.at).toISOString())} · {st.text}
                </li>
              )
            }
            if (st.kind === 'intervention') {
              const v = detail!.interventions.find((x) => x.id === st.id)!
              return (
                <li key={v.id} data-step={st.key} className={`flex flex-col gap-0.5 rounded-sm border-[0.5px] border-(--neutral-400) p-2${focus === st.key ? ' rounded-sm outline outline-1 outline-offset-4 outline-(--neutral-200)' : ''}`}>
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
              <li key={o.occurrence_id} data-step={st.key} className={`flex flex-col gap-1${focus === st.key ? ' rounded-sm outline outline-1 outline-offset-4 outline-(--neutral-200)' : ''}`}>
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
    </ScrollArea>
    </Card>
    </div>
  )
}
