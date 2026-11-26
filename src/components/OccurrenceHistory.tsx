import { useState, type RefObject } from 'react'
import { CarSimple, Check, SortAscending, SortDescending, Trash, Wrench } from '@phosphor-icons/react'
import { MediaGallery } from '@/components/MediaGallery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { groupHistory } from '@/lib/history'
import { label, type Incident } from '@/lib/incidents'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'
import type { LinkRow, ProblemDetailData } from '@/lib/problems'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) // 24 h, no AM or PM (owner, 2026-11-07)
const RING = ' rounded-sm outline outline-1 outline-offset-4 outline-(--neutral-200)'

/**
 * The right column of an open recurrence (owner's Figma Recurrence Right Column, node 1418:7408, 2026-11-25): the title with the sort button, a search field, then one group per occurrence, newest first, all open (no collapsing, owner 2026-11-25). Each group has a header (date and plate), its reports (a dot in the recurrence's status color, as on the map, the reference over the source, the date over the time) and, attached under them, the interventions that followed it. Replaces the flat list of all occurrences.
 */
export function OccurrenceHistory({ category, status, detail, openReportId, onSelectIncident, focus, viewport }: { category: string; status: ProblemStatus; detail: ProblemDetailData | null; openReportId: string | null; onSelectIncident: (id: string) => void; focus: string | null; viewport: RefObject<HTMLDivElement | null> }) {
  const [oldestFirst, setOldestFirst] = useState(false)
  const [query, setQuery] = useState('')
  const groups = detail ? groupHistory(detail.occurrences, detail.interventions, detail.events) : []
  const links = detail?.links ?? []
  const incidents = new Map<string, Incident>((detail?.incidents ?? []).map((i) => [i.id, i]))
  const q = query.trim().toLowerCase()
  const matches = (l: LinkRow) => {
    const i = incidents.get(l.incident_id)
    return !!i && (!q || `${i.reference} ${detail?.sources[l.incident_id] ?? ''} ${day(i.occurred_at)}`.toLowerCase().includes(q))
  }
  const rowsOf = (occurrenceId: string | null) => links.filter((l) => l.occurrence_id === occurrenceId && matches(l)).sort((a, b) => (incidents.get(a.incident_id)!.occurred_at < incidents.get(b.incident_id)!.occurred_at ? -1 : 1))
  const unplaced = links.filter((l) => !l.occurrence_id && matches(l))
  const shown = (oldestFirst ? groups : [...groups].reverse()).filter((g) => !q || rowsOf(g.occurrence.occurrence_id).length)

  const when = (iso: string) => (
    <span className="flex w-[52px] shrink-0 flex-col items-end">
      <span className="text-body text-(--neutral-100)">{day(iso)}</span>
      <span className="text-meta tabular-nums text-(--neutral-200)">{clock(iso)}</span>
    </span>
  )

  const report = (l: LinkRow) => {
    const i = incidents.get(l.incident_id)!
    const source = detail?.sources[i.id] ?? 'Unknown source'
    const open = openReportId === i.id
    return (
      <li key={i.id} data-report={i.id} className="rounded-sm bg-(--neutral-800)">
        <button type="button" aria-expanded={open} onClick={() => onSelectIncident(i.id)} className={`flex w-full items-start gap-3 rounded-sm py-3 pr-4 pl-2.5 text-left hover:bg-(--neutral-700) focus-visible:bg-(--neutral-700) ${open ? 'bg-(--neutral-700)' : ''}`}>
          <span className="flex h-11 w-4 shrink-0 justify-center pt-2" aria-hidden>
            <span className="size-2 rounded-full" style={{ background: `var(${PROBLEM_STATUS[status].token})` }} /> {/* the same color as the report's dot on the map: the recurrence's status (owner, 2026-11-25) */}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-2 text-body-medium text-(--neutral-200)">
              {i.reference}
              {l.state === 'proposed' && <Badge variant="outline">Needs review</Badge>}
            </span>
            <span className="text-body-sm text-(--neutral-200)">{source}</span>
          </span>
          {when(i.occurred_at)}
        </button>
        {open && (
          <div className="flex flex-col gap-3 px-2 pb-3">
            <MediaGallery incidentId={i.id} carousel />
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

  return (
    <>
      <div className="flex h-17 shrink-0 items-center gap-5 border-b-[0.5px] border-(--neutral-600) px-4"> {/* Figma Title row: 68 px, 16 px at the sides, a 0.5 px `neutral-600` line under it */}
        <h3 className="flex-1 text-label text-(--neutral-200)">Occurrence history</h3>
        <Button variant="ghost" className="h-11 w-10 justify-center px-2" aria-label={oldestFirst ? 'Show newest first' : 'Show oldest first'} title={oldestFirst ? 'Show newest first' : 'Show oldest first'} onClick={() => setOldestFirst((o) => !o)}>
          {oldestFirst ? <SortAscending className="size-5" aria-hidden /> : <SortDescending className="size-5" aria-hidden />}
        </Button>
      </div>
      <div className="shrink-0 px-4">
        <Input type="search" aria-label="Search the occurrence history" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 border-[0.5px] border-(--neutral-400) bg-(--neutral-800) text-body-sm" />
      </div>
      <ScrollArea viewportRef={viewport} className="min-h-0 flex-1" viewportClassName="max-desk:max-h-[40svh] [&>div]:!block">
        <div className="flex flex-col gap-3 px-4">
          {detail && groups.length === 0 && <p className="text-muted-foreground">No history yet.</p>}
          {detail && q && shown.length === 0 && unplaced.length === 0 && <p className="text-muted-foreground">Nothing matches the search.</p>}
          {shown.map((g) => {
            const id = g.occurrence.occurrence_id
            const rows = rowsOf(id)
            const OccurrenceIcon = category === 'parking' ? CarSimple : Trash
            return (
              <section key={id} data-step={`o-${id}`} className={`flex flex-col gap-0.5${focus === `o-${id}` ? RING : ''}`}>
                <h4 className="flex min-h-10 items-center gap-2.5 rounded-sm border border-(--neutral-700) bg-(--neutral-700) px-2.5 text-body-medium text-(--neutral-100)">
                  <OccurrenceIcon weight="duotone" className="size-5 shrink-0 text-(--neutral-200)" aria-hidden />
                  <span className="flex min-w-0 flex-1 gap-2">
                    <span className="sr-only">Occurrence</span>
                    <span>{day(g.occurrence.first_report_at!)}</span>
                    {g.occurrence.boundary_uncertain && <Badge variant="outline">Boundary uncertain</Badge>}
                  </span>
                  {g.occurrence.subject_key && <span className="rounded-sm bg-(--plate-yellow) p-1 text-[12px]/[16px] font-bold tracking-[0.06em] text-(--neutral-900)">{g.occurrence.subject_key.replace('-', ' ')}</span>}{/* the vehicle's plate (owner's Figma, 2026-11-25); dumping has none */}
                </h4>
                <ul className="flex flex-col gap-0.5">{rows.map(report)}</ul>
                {g.interventions.length > 0 && (
                  <div className="flex flex-col rounded-sm border border-(--neutral-800) bg-(--black) p-2">
                    {g.interventions.map((v) => (
                      <div key={v.id} data-step={`v-${v.id}`} className={`flex flex-col gap-1 py-2 pr-2 pl-0.5${focus === `v-${v.id}` ? RING : ''}`}>
                        <div className="flex items-start gap-3">
                          <span className="flex w-4 shrink-0 justify-center pt-1 text-(--neutral-100)" aria-hidden>
                            {v.outcome === 'cleared' ? <Check className="size-4" /> : <Wrench className="size-4" />}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-body-medium text-(--neutral-200)">{v.outcome === 'cleared' ? 'Road Cleared' : label(v.action_type)}</p>
                            <p className="text-body-sm text-(--neutral-200)">{v.description}</p>
                            {v.outcome !== 'cleared' && <p className="text-meta text-(--neutral-200)">Outcome: {v.outcome ? label(v.outcome) : 'Not recorded yet'}</p>}
                          </div>
                          {when(v.performed_at)}
                        </div>
                        <p className="pl-[29px] text-[11px]/[21px] tracking-[0.08em] text-(--neutral-200)">By {v.agency}</p>
                      </div>
                    ))}
                  </div>
                )}
                {g.events.map((e) => (
                  <p key={e.created_at} data-step={`e-${e.created_at}`} className={`px-1 pt-1 text-meta text-(--neutral-200)${focus === `e-${e.created_at}` ? RING : ''}`}>
                    {day(e.created_at)} · {e.kind === 'resolved' ? 'Marked resolved by an operator' : 'Reopened by a new occurrence'}
                  </p>
                ))}
              </section>
            )
          })}
          {unplaced.length > 0 && (
            <div>
              <p className="text-body-sm-medium text-foreground">Waiting for review</p>
              <ul className="mt-1 flex flex-col gap-0.5">{unplaced.map(report)}</ul>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
}
