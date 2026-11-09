import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MediaGallery } from '@/components/MediaGallery'
import { ProblemTimeline } from '@/components/ProblemTimeline'
import { label, type Incident } from '@/lib/incidents'
import { initials } from '@/lib/sourceInitials'
import { HEADER, StatList } from '@/components/ProblemDetail'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) // 24 h, no AM or PM (owner, 2026-11-07)

type Step =
  | { key: string; at: number; kind: 'occurrence'; id: string }
  | { key: string; at: number; kind: 'intervention'; id: string }
  | { key: string; at: number; kind: 'event'; text: string }

/**
 * A problem's history as two separate floating cards at the bottom of the map (owner, 2026-11-05), apart from the Recurrence Panel and 40 px apart: the vertical occurrences list on the left, 40% of the width (its own scroll: occurrences with
 * their reports, interventions and events, oldest first) and the lanes timeline on the right, 60% (percentages of the width without the gap). Both are 360 px tall. On phones they sit stacked in the bottom sheet.
 */
export function ProblemTimelineCard({ problem, detail, onSelectIncident, openReportId = null }: { problem: ProblemRow; detail: ProblemDetailData | null; onSelectIncident: (id: string) => void; openReportId?: string | null }) {
  const [focus, setFocus] = useState<string | null>(null)
  const list = useRef<HTMLDivElement>(null) // the ScrollArea viewport of the occurrences history
  useEffect(() => {
    // the timeline is the anchor: a click on an occurrence, intervention or event there scrolls this list to the same item
    const box = list.current
    const el = focus ? box?.querySelector<HTMLElement>(`[data-step="${focus}"]`) : null
    if (box && el) box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16, behavior: 'smooth' })
  }, [focus])
  useEffect(() => {
    // a report opened from the map (or from its row) scrolls into view in this list
    const el = openReportId ? list.current?.querySelector<HTMLElement>(`[data-report="${openReportId}"]`) : null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [openReportId])
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
    const source = detail?.sources[id] ?? 'Unknown source'
    const open = openReportId === id // the open report's row becomes a raised card with its details under the same row (owner, 2026-11-09, option 2 of /#report-expand); the row itself keeps its places
    return (
      <li key={id} data-report={id} className={`border-b border-(--neutral-600) last:border-b-0${open ? ' -mx-3 my-1 rounded-sm border-b-0 bg-(--neutral-800) px-3' : ''}`}>
        {/* Three columns (owner, 2026-11-07, from /#history): a square tile with the source's initials, the source with its reference below, and the date with the time (24 h) below. */}
        <button type="button" aria-expanded={open} onClick={() => onSelectIncident(id)} className={`flex items-center gap-3 rounded-sm py-4 text-left hover:bg-(--neutral-800) focus-visible:bg-(--neutral-800) ${open ? 'w-full' : '-mx-3 w-[calc(100%+1.5rem)] px-3'}`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-(--neutral-600) text-caption-strong text-(--neutral-100)" aria-hidden>
            {initials(source)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-sm-medium text-foreground">{source}</span>
            <span className="flex items-center gap-2 text-meta text-muted-foreground">
              {i.reference}
              {proposed && <Badge variant="outline">Needs review</Badge>}
            </span>
          </span>
          <span className="flex w-[52px] shrink-0 flex-col items-start text-left">
            <span className="text-body-sm text-foreground">{day(i.occurred_at)}</span>
            <span className="text-meta tabular-nums text-muted-foreground">{clock(i.occurred_at)}</span>
          </span>
        </button>
        {open && (
          <div className="flex flex-col gap-3 pb-3">
            <MediaGallery incidentId={id} carousel />
            <p className="text-body-sm text-foreground">{i.description}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-meta">
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd className="text-foreground">{label(i.vehicle_type)}</dd>
              <dt className="text-muted-foreground">Validation</dt>
              <dd className="text-foreground">{label(i.validation_status)}</dd>
              <dt className="text-muted-foreground">AI</dt>
              <dd className="text-foreground">
                {i.ai_classification} ({Math.round((i.ai_confidence ?? 0) * 100)}% confidence)
              </dd>
              {i.outcome && (
                <>
                  <dt className="text-muted-foreground">Outcome</dt>
                  <dd className="text-foreground">{i.outcome}</dd>
                </>
              )}
            </dl>
          </div>
        )}
      </li>
    )
  }

  const M3 = HEADER === '3' // option 3: a 300 px left column (numbers + occurrences history) and the timeline along the bottom
  return (
    <div data-float={M3 ? undefined : true} className={M3 ? 'flex shrink-0 flex-col gap-2 desk:contents' : 'flex shrink-0 flex-col gap-2 desk:absolute desk:right-(--col-right) desk:bottom-(--map-pad) '+'desk:left-(--col-left) desk:z-20 desk:h-[360px] desk:flex-row desk:gap-3'}>
    {/* The timeline card is gone in the default layout (owner, 2026-11-09): the timeline is a module now, docked from the sidebar (decision 0049). */}
    {!M3 && (
    <Card role="region" aria-label="Timeline" data-float={M3 ? true : undefined} className={`min-w-0 gap-0 overflow-hidden bg-card/95 py-0 ${M3 ? 'desk:absolute desk:right-(--col-right) desk:bottom-(--map-pad) desk:left-[calc(var(--col-left)+360px+12px)] desk:z-20 desk:h-[360px]' : 'desk:h-full desk:flex-1'} desk:border desk:border-(--neutral-900) desk:bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)]`}>
    <ScrollArea className="min-h-0 flex-1" viewportClassName="max-desk:max-h-[40svh]">
      <section className="flex flex-col gap-3 p-4">
        <h3 className="text-caption-medium text-(--neutral-200)">Timeline · {problem.reference}</h3>
        {!detail && <p className="text-muted-foreground">Loading…</p>}
        {detail && <ProblemTimeline detail={detail} status={problem.status} onSelectIncident={onSelectIncident} onPick={setFocus} />}
      </section>
    </ScrollArea>
    </Card>
    )}
    <Card role="region" aria-label="Occurrences history" data-float={M3 ? true : undefined} className={`gap-0 overflow-hidden bg-card/95 py-0 ${M3 ? 'desk:absolute desk:bottom-(--map-pad) desk:right-(--col-right) desk:top-[calc(var(--map-pad)+var(--banner-offset,0px)+96px+12px)] desk:z-20 desk:w-[360px]' : 'desk:h-full desk:w-[calc((100%-0.75rem)*0.4)] desk:shrink-0'} desk:border desk:border-(--neutral-900) desk:bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)]`}>
    {M3 && <StatList problem={problem} />}
    <ScrollArea viewportRef={list} className="min-h-0 flex-1" viewportClassName="max-desk:max-h-[40svh]">
      <section className="flex flex-col gap-3 p-4">
        <h3 className="text-caption-medium text-(--neutral-200)">Occurrences history</h3>
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
                  Occurrence {occN.get(o.occurrence_id)} · {day(o.first_report_at!)} · {o.reports_n} {o.reports_n === 1 ? 'Report' : 'Reports'}
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
