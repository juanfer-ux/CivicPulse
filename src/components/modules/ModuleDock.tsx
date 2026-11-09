import { lazy, Suspense, useEffect, type CSSProperties, type ReactNode } from 'react'
import { DotsSixVertical, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BOTTOM_H, COLUMN_MIN_H, COLUMN_NATURAL_H, COLUMN_PUSH, COLUMN_W, DOCK_GAP, MODULES, fitsArea, inArea, shapeFor, suggestedArea, type Area, type Placed } from '@/lib/modules'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'
import { useModules } from '@/components/modules/ModulesProvider'

const NumbersModule = lazy(() => import('@/components/modules/NumbersModule'))
const TimelineModule = lazy(() => import('@/components/modules/TimelineModule'))
const LABEL: Record<Area, string> = { left: 'Left column', right: 'Right column', bottom: 'Bottom strip' }

/**
 * The three docking areas on the map (decision 0049, behind /?modules=1; the owner's drawing of 2026-11-09): a column on the left, a column on the right and a strip along the bottom. While a module is dragged the areas show: the ones it fits light up, the others fade, its first choice says "Suggested". A docked module is a floating card in its area. The bottom strip divides its width equally; a column keeps each module at its natural height and, when they do not fit, they shrink (the right column also holds the recurrence's history card, which gives way first). With a recurrence open the columns sit under its header and do not push the map content; without one they do (`--dock-w` and `--dock-l`, set by Dashboard, folded into `.map-col`). Desktop only for now.
 */
export function ModuleDock({ problems, openProblemId, openDetail, openKind }: { problems: ProblemRow[]; openProblemId: string | null; openDetail: ProblemDetailData | null; openKind: 'recurrence' | 'incident' | null }) {
  const { on, placed, follow, drag, message, setOpen, remove, setRightSlot, startDrag } = useModules()
  const recurrenceOpen = openKind === 'recurrence'
  useEffect(() => setOpen({ id: openProblemId, kind: openKind }), [openProblemId, openKind, setOpen])
  const mods = (a: Area) => inArea(placed, a, follow, openProblemId)
  const [left, right, bottom] = [mods('left'), mods('right'), mods('bottom')]
  // the map recentres in the free area when a column appears or goes (the map itself does not resize)
  useEffect(() => void window.dispatchEvent(new Event('civic:float')), [left.length, right.length, bottom.length, recurrenceOpen])
  if (!on) return null

  const card = (m: Placed, area: Area) => {
    const id = follow ? openProblemId : m.target
    const problem = id ? problems.find((p) => p.id === id) : undefined
    const { title } = MODULES[m.type]
    const style: CSSProperties = area === 'bottom' ? { flex: '1 1 0' } : { flex: `0 1 ${COLUMN_NATURAL_H}px`, minHeight: COLUMN_MIN_H }
    return (
      <div key={m.type} data-pos={m.pos} data-type={m.type} className="pointer-events-auto flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] p-3" style={style}>
        <div className="flex items-center gap-1">
          {/* The title is the drag handle: a docked module can be moved to another area, or above or below its neighbours, without going back to the sidebar. */}
          <div role="button" tabIndex={0} aria-label={`${title}: drag to move it`} onPointerDown={startDrag(m.type)} className="flex min-w-0 flex-1 cursor-grab touch-none select-none items-center gap-1 active:cursor-grabbing">
            <DotsSixVertical className="size-3.5 shrink-0 text-(--neutral-300)" aria-hidden />
            <h3 className="flex-1 truncate text-caption-medium text-(--neutral-200)">
              {title}
              {problem ? ` · ${problem.reference}` : ''}
            </h3>
          </div>
          <Button size="icon" variant="ghost" aria-label={`Close ${title}`} className="size-6" onPointerDown={(e) => e.stopPropagation()} onClick={() => remove(m)}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {!problem ? (
            <p className="grid h-full place-items-center text-center text-meta text-muted-foreground">Open a recurrence to fill this module.</p>
          ) : (
            <Suspense fallback={<p className="text-meta text-muted-foreground">Loading…</p>}>
              {m.type === 'numbers' ? <NumbersModule problem={problem} shape={shapeFor(area)} /> : <TimelineModule problem={problem} openDetail={problem.id === openProblemId ? openDetail : null} />}
            </Suspense>
          )}
        </div>
      </div>
    )
  }
  /** While dragging, a layer over the whole area: lit when the module fits it, faded when not; it is the drop target (data-area). */
  const overlay = (area: Area) =>
    drag && (
      <div data-area={area} className={`pointer-events-auto absolute inset-0 z-10 grid place-items-center rounded-lg border-2 border-dashed text-meta transition-opacity ${fitsArea(drag.type, area) ? 'border-(--indigo-300) bg-(--indigo-300)/10 text-(--indigo-100)' : 'border-(--neutral-500) opacity-30'}`}>
        <span className="flex flex-col items-center gap-0.5">
          <span>{LABEL[area]}</span>
          {fitsArea(drag.type, area) && suggestedArea(drag.type) === area && <span className="rounded-sm bg-(--indigo-600) px-1.5 py-0.5 text-caption-strong text-(--indigo-100)">Suggested</span>}
        </span>
      </div>
    )

  const columnTop = recurrenceOpen ? 'calc(var(--map-pad) + var(--banner-offset, 0px) + 96px + 12px)' : 'calc(var(--section-header-h) + var(--map-pad) + var(--banner-offset, 0px))'
  const column = (area: 'left' | 'right', list: Placed[]) => {
    const hasSlot = area === 'right' && recurrenceOpen
    if (!list.length && !drag && !hasSlot) return null
    const edge = area === 'left' ? { left: recurrenceOpen ? 'var(--col-left)' : 'calc(var(--map-left) - var(--page-pad) + var(--group-gap))' } : { right: recurrenceOpen ? 'var(--col-right)' : 'var(--map-pad)' }
    // The bottom strip keeps its full width (owner, 2026-11-09): with a recurrence open the left column stops above it instead of pushing it aside.
    const lift = area === 'left' && recurrenceOpen && (bottom.length || drag) ? BOTTOM_H + DOCK_GAP : 0
    // Top to bottom by pos; the recurrence's history card is an item with pos 0, so a module dropped on its upper half goes above it.
    const items: { pos: number; node: ReactNode }[] = list.map((m) => ({ pos: m.pos, node: card(m, area) }))
    if (hasSlot) items.push({ pos: 0, node: <div key="history" data-pos="0" data-type="history" ref={setRightSlot} className="min-h-[200px] flex-1 basis-0 [&>*]:h-full [&>*]:pointer-events-auto" /> })
    items.sort((a, b) => a.pos - b.pos)
    return (
      <div data-col={area} data-float={list.length || hasSlot ? '' : undefined} className="pointer-events-none absolute z-20 hidden flex-col gap-3 desk:flex" style={{ ...edge, top: columnTop, bottom: `calc(var(--map-pad) + ${lift}px)`, width: COLUMN_W }}>
        {items.map((i) => i.node)}
        {overlay(area)}
      </div>
    )
  }

  const showBottom = bottom.length > 0 || !!drag
  return (
    <>
      {column('left', left)}
      {column('right', right)}
      {showBottom && (
        <div
          data-col="bottom"
          data-float={bottom.length ? '' : undefined}
          className="pointer-events-none absolute z-20 hidden gap-3 desk:flex"
          style={{ left: 'var(--col-left)', right: recurrenceOpen ? `calc(var(--col-right) + ${COLUMN_PUSH}px)` : 'calc(var(--col-right) + 44px)', bottom: 'var(--map-pad)', height: BOTTOM_H }}
        >
          {bottom.map((m) => card(m, 'bottom'))}
          {overlay('bottom')}
        </div>
      )}
      {message && <p className="absolute top-24 right-(--map-pad) z-30 hidden rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-2 text-meta desk:block">{message}</p>}
    </>
  )
}
