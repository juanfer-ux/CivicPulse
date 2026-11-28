import { lazy, Suspense, useEffect, type CSSProperties } from 'react'
import { DotsSixVertical, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BOTTOM_H, COLUMN_MIN_H, COLUMN_NATURAL_H, COLUMN_W, DOCK_GAP, MODULES, fitsArea, inArea, shapeFor, suggestedArea, type Area, type Placed, HISTORY_W, homeModules, PANEL_TITLE } from '@/lib/modules'
import type { Incident } from '@/lib/incidents'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'
import { useModules } from '@/components/modules/ModulesProvider'
import { HistoryTitle } from '@/components/HistoryTitle'
import { ScrollArea } from '@/components/ui/scroll-area'

const NumbersModule = lazy(() => import('@/components/modules/NumbersModule'))
const TimelineModule = lazy(() => import('@/components/modules/TimelineModule'))
const LABEL: Record<Area, string> = { left: 'Left column', right: 'Sidebar', bottom: 'Bottom strip' }

/**
 * The three docking areas on the map (decision 0049, behind /?modules=1; the owner's drawing of 2026-11-09): a column on the left, a column on the right and a strip along the bottom. While a module is dragged the areas show: the ones it fits light up, the others fade, its first choice says "Suggested". A docked module is a floating card in its area. The bottom strip divides its width equally; a column keeps each module at its natural height and, when they do not fit, they shrink (the right column also holds the recurrence's history card, which gives way first). With a recurrence open the columns sit under its header and do not push the map content; without one they do (`--dock-w` and `--dock-l`, set by Dashboard, folded into `.map-col`). Desktop only for now.
 */
export function ModuleDock({ problems, openProblemId, openDetail, openKind, openIncident }: { problems: ProblemRow[]; openProblemId: string | null; openDetail: ProblemDetailData | null; openKind: 'recurrence' | 'incident' | null; openIncident: Incident | null }) {
  const { on, placed, follow, drag, message, modulesTop, setOpen, remove, setRightSlot, startDrag } = useModules()
  const recurrenceOpen = openKind === 'recurrence'
  const flush = openKind !== null // an incident's modules sit exactly where a recurrence's do (owner, 2026-11-27)
  useEffect(() => setOpen({ id: openProblemId, kind: openKind }), [openProblemId, openKind, setOpen])
  const mods = (a: Area) => (openKind ? inArea(placed, a, follow, openProblemId) : []) // modules show only while a recurrence or an incident is open, and take no room otherwise (owner, 2026-11-20); the layout is kept and saved
  const [left, bottom] = [mods('left'), mods('bottom')]
  const home = openKind ? homeModules(openKind, placed, follow, openProblemId) : [] // the right sidebar's Modules window
  // the map recentres in the free area when a column appears or goes (the map itself does not resize)
  useEffect(() => void window.dispatchEvent(new Event('civic:float')), [left.length, bottom.length, openKind])
  if (!on) return null

  const card = (m: Placed, area: Area, athome = false) => {
    const id = follow ? openProblemId : m.target
    const problem = id ? problems.find((p) => p.id === id) : undefined
    const incident = !problem && id && openIncident?.id === id ? openIncident : undefined // an incident's numbers (the only module an incident offers)
    const { title } = MODULES[m.type]
    const style: CSSProperties = area === 'bottom' ? { flex: '1 1 0' } : athome ? { flex: `0 0 ${COLUMN_NATURAL_H}px` } : { flex: `0 1 ${COLUMN_NATURAL_H}px`, minHeight: COLUMN_MIN_H }
    return (
      <div key={m.type} data-pos={m.pos} data-type={m.type} className="pointer-events-auto flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] p-3" style={style}>
        <div className="flex items-center gap-1" data-drag-header>
          {/* The title is the drag handle: a docked module can be moved to another area, or above or below its neighbours, without going back to the sidebar. */}
          <div role="button" tabIndex={0} aria-label={`${title}: drag to move it`} onPointerDown={startDrag(m.type)} className="flex min-w-0 flex-1 cursor-grab touch-none select-none items-center gap-1 active:cursor-grabbing">
            <DotsSixVertical className="size-3.5 shrink-0 text-(--neutral-300)" aria-hidden />
            <h3 className="flex-1 truncate text-caption-medium text-(--fg-secondary)">
              {title}
              {problem ? ` · ${problem.reference}` : incident ? ` · ${incident.reference}` : ''}
            </h3>
          </div>
          {!athome && (
            <Button size="icon" variant="ghost" aria-label={`Close ${title}`} className="size-6" onPointerDown={(e) => e.stopPropagation()} onClick={() => remove(m)}>
              <X className="size-4" />
            </Button>
          )} {/* a module at home in the sidebar cannot be closed; one dragged out goes back home when closed */}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {!problem && !(incident && m.type === 'numbers') ? (
            <p className="grid h-full place-items-center text-center text-meta text-muted-foreground">{m.type === 'numbers' ? 'Open a recurrence or an incident to fill this module.' : 'Open a recurrence to fill this module.'}</p>
          ) : (
            <Suspense fallback={<p className="text-meta text-muted-foreground">Loading…</p>}>
              {m.type === 'numbers' ? <NumbersModule problem={problem} incident={incident} shape={shapeFor(area)} /> : problem && <TimelineModule problem={problem} openDetail={problem.id === openProblemId ? openDetail : null} />}
            </Suspense>
          )}
        </div>
      </div>
    )
  }
  /** While dragging, a layer over the whole area: lit when the module fits it, faded when not; it is the drop target (data-area). */
  const overlay = (area: Area) =>
    drag && (
      <div data-area={area} className={`pointer-events-auto absolute inset-0 z-10 grid place-items-center rounded-lg border-2 border-dashed text-meta transition-opacity ${fitsArea(drag.type, area) ? 'border-(--cobalt-300) bg-(--cobalt-300)/10 text-(--cobalt-100)' : 'border-(--neutral-500) opacity-30'}`}>
        <span className="flex flex-col items-center gap-0.5">
          <span>{LABEL[area]}</span>
          {fitsArea(drag.type, area) && suggestedArea(drag.type) === area && <span className="rounded-sm bg-(--cobalt-600) px-1.5 py-0.5 text-caption-strong text-(--cobalt-100)">Suggested</span>}
        </span>
      </div>
    )

  const columnTop = flush ? 'calc(var(--map-pad) + var(--banner-offset, 0px))' : 'calc(var(--section-header-h) + var(--map-pad) + var(--banner-offset, 0px))'
  const leftColumn = () => {
    if (!left.length && !drag) return null
    // The bottom strip keeps its full width (owner, 2026-11-09): with a case open the left column stops above it instead of pushing it aside.
    const lift = flush && (bottom.length || drag) ? BOTTOM_H + DOCK_GAP : 0
    return (
      <div data-col="left" data-float={left.length ? '' : undefined} className="pointer-events-none absolute z-20 hidden flex-col gap-3 desk:flex" style={{ left: flush ? 'calc(var(--col-left) + 12px + 330px + 12px)' /* right of the Overview card, never over it */ : 'calc(var(--map-left) + var(--group-gap))', top: columnTop, bottom: `calc(var(--map-pad) + ${lift}px)`, width: COLUMN_W }}>
        {left.map((m) => card(m, 'left'))}
        {overlay('left')}
      </div>
    )
  }
  /** The right sidebar of an open case (owner, 2026-11-29): two windows, History (a recurrence only) and Modules, one under the other; their title rows drag to swap them. */
  const sidebar = openKind && (
    <div data-col="right" data-float="" className="pointer-events-auto absolute z-20 hidden flex-col border-l border-l-(--neutral-500) bg-(--neutral-900) desk:flex" style={{ right: 'var(--col-right)', top: columnTop, bottom: 'var(--map-pad)', width: HISTORY_W }}>
      {recurrenceOpen && <div data-panel="history" ref={setRightSlot} className="min-h-0 flex-1 basis-0 [&>*]:h-full" style={{ order: modulesTop ? 2 : 1 }} />}
      <section data-panel="modules" aria-label={PANEL_TITLE.modules} className={`flex min-h-0 flex-col ${recurrenceOpen ? `max-h-1/2 shrink-0 ${modulesTop ? 'border-b-2' : 'border-t-2'} border-(--neutral-400)` /* the line between the two windows is brighter than the others, whichever is on top (owner, 2026-11-29) */ : 'flex-1'}`} style={{ order: modulesTop ? 1 : 2 }}>
        <HistoryTitle title={PANEL_TITLE.modules} icon="modules" panel={recurrenceOpen ? 'modules' : undefined} />
        <ScrollArea className="min-h-0 flex-1" viewportClassName="[&>div]:!block">
          <div className="flex flex-col gap-3 p-3">
            {home.map((type) => card({ type, area: 'right', target: openProblemId, pos: 0 }, 'right', true))}
            {!home.length && <p className="text-meta text-muted-foreground">Every module is on the map. Close one to bring it back.</p>}
          </div>
        </ScrollArea>
      </section>
      {overlay('right')}
    </div>
  )

  const showBottom = bottom.length > 0 || !!drag
  return (
    <>
      {leftColumn()}
      {sidebar}
      {showBottom && (
        <div
          data-col="bottom"
          data-float={bottom.length ? '' : undefined}
          className="pointer-events-none absolute z-20 hidden gap-3 desk:flex"
          style={{ left: 'var(--col-left)', right: flush ? `calc(var(--col-right) + ${HISTORY_W + DOCK_GAP}px)` : 'calc(var(--col-right) + 44px)', bottom: 'var(--map-pad)', height: BOTTOM_H }}
        >
          {bottom.map((m) => card(m, 'bottom'))}
          {overlay('bottom')}
        </div>
      )}
      {message && <p className="absolute top-24 right-(--map-pad) z-30 hidden rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-2 text-meta desk:block">{message}</p>}
    </>
  )
}
