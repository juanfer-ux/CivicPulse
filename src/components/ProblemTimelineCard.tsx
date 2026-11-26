import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModules } from '@/components/modules/ModulesProvider'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { OccurrenceHistory } from '@/components/OccurrenceHistory'
import { ProblemTimeline } from '@/components/ProblemTimeline'
import { HEADER } from '@/components/ProblemDetail'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'

/**
 * The history of a recurrence: with the default layout (HEADER 3) the right column `OccurrenceHistory` (owner's Figma, 2026-11-25); the other layouts also draw the lanes timeline card beside it.
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
  const M3 = HEADER === '3' // option 3: a 360 px right column (numbers + occurrences history); the timeline is a module
  const { rightSlot } = useModules() // with /?modules=1 the history card lives in the right column, above the modules docked there, and shrinks for them
  const inSlot = M3 && !!rightSlot
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
    <PortalTo target={inSlot ? rightSlot : null}>
    <Card role="region" aria-label="Occurrences history" data-float={M3 && !inSlot ? true : undefined} className={`gap-4 overflow-hidden bg-card/95 py-0 ${inSlot ? 'desk:pointer-events-auto desk:h-full desk:w-full' : M3 ? 'desk:absolute desk:bottom-(--map-pad) desk:right-(--col-right) desk:top-[calc(var(--map-pad)+var(--banner-offset,0px))] desk:z-20 desk:w-[358px]' : 'desk:h-full desk:w-[calc((100%-0.75rem)*0.4)] desk:shrink-0'} ${M3 ? 'desk:rounded-none desk:border-0 desk:border-l desk:border-l-(--neutral-500) desk:bg-(--neutral-900) pt-0 pb-8' : 'desk:rounded-lg desk:border desk:border-(--neutral-900) desk:bg-(--neutral-800) p-4'}`}> {/* Figma Recurrence Right Column (owner 2026-11-25): node 1418:7408 now: 358 px, `neutral-900`, a 1 px `neutral-500` line at the left, 32 px at the bottom, 16 px between the title row, the search and the list; the 16 px sides are inside, so the scrollbar sits on the edge */}
    <OccurrenceHistory key={problem.id} category={problem.category} status={problem.status} detail={detail} openReportId={openReportId} onSelectIncident={onSelectIncident} focus={focus} viewport={list} />
    </Card>
    </PortalTo>
    </div>
  )
}

/** Renders its children where they are, or inside `target` (the right column's slot) when there is one. */
function PortalTo({ target, children }: { target: HTMLElement | null; children: ReactNode }) {
  return target ? createPortal(children, target) : <>{children}</>
}
