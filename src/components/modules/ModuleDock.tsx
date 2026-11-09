import { lazy, Suspense, useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MODULES, RIGHT_H, RIGHT_W, ZONES, fitsZone, isVisible, rightUsed, suggestedZone, zoneHeight, type Placed, type Zone } from '@/lib/modules'
import type { ProblemDetailData, ProblemRow } from '@/lib/problems'
import { useModules } from '@/components/modules/ModulesProvider'

const NumbersModule = lazy(() => import('@/components/modules/NumbersModule'))
const TimelineModule = lazy(() => import('@/components/modules/TimelineModule'))
const TITLE = 'text-caption-medium text-(--neutral-200)'

/**
 * The docking zones on the map (decision 0049, behind /?modules=1; layout 2 chosen by the owner): two taller zones in a right column (4:3 and 4:4) and a wide 4:2 strip along the bottom. While a module is dragged the zones show: the ones it fits light up, the others fade, its first-choice zone carries "Suggested". A docked module is a floating card in its zone; its content re-lays out for the zone's shape. The right column pushes the map content through `--dock-w` (set by Dashboard, folded into `.map-col`). Desktop only for now.
 */
export function ModuleDock({ problems, openProblemId, openDetail, historyOpen, openKind }: { problems: ProblemRow[]; openProblemId: string | null; openDetail: ProblemDetailData | null; historyOpen: boolean; openKind: 'recurrence' | 'incident' | null }) {
  const { on, placed, follow, drag, message, setOpen, remove } = useModules()
  useEffect(() => setOpen({ id: openProblemId, kind: openKind }), [openProblemId, openKind, setOpen])
  const showRight = rightUsed(placed, follow, openProblemId)
  // the map recentres in the free area when the right column appears or goes (the map itself does not resize)
  useEffect(() => void window.dispatchEvent(new Event('civic:float')), [showRight])
  if (!on) return null

  const card = (z: Zone, m: Placed) => {
    const id = follow ? openProblemId : m.target
    const problem = id ? problems.find((p) => p.id === id) : undefined
    const { title } = MODULES[m.type]
    return (
      <div key={z.id} data-zone={z.id} className="pointer-events-auto absolute flex flex-col gap-2 overflow-hidden rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] p-3" style={zoneBox(z)}>
        <div className="flex items-center gap-1">
          <h3 className={`flex-1 truncate ${TITLE}`}>
            {title}
            {problem ? ` · ${problem.reference}` : ''}
          </h3>
          <span className="text-meta text-muted-foreground">{z.shape}</span>
          <Button size="icon" variant="ghost" aria-label={`Close ${title}`} className="size-6" onClick={() => remove(m)}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {!problem ? (
            <p className="grid h-full place-items-center text-center text-meta text-muted-foreground">Open a recurrence to fill this module.</p>
          ) : (
            <Suspense fallback={<p className="text-meta text-muted-foreground">Loading…</p>}>
              {m.type === 'numbers' ? <NumbersModule problem={problem} shape={z.shape} /> : <TimelineModule problem={problem} openDetail={problem.id === openProblemId ? openDetail : null} />}
            </Suspense>
          )}
        </div>
      </div>
    )
  }
  const slot = (z: Zone) => {
    const m = placed.find((p) => p.zone === z.id && isVisible(p, follow, openProblemId))
    if (m) return card(z, m)
    if (!drag) return null
    const lit = fitsZone(drag.type, z)
    return (
      <div key={z.id} data-zone={z.id} className={`pointer-events-auto absolute grid place-items-center rounded-lg border-2 border-dashed text-meta transition-opacity ${lit ? 'border-(--indigo-300) bg-(--indigo-300)/10 text-(--indigo-100)' : 'border-(--neutral-500) opacity-30'}`} style={zoneBox(z)}>
        <span className="flex flex-col items-center gap-0.5">
          <span className="tabular-nums">{z.shape}</span>
          {lit && suggestedZone(drag.type) === z.id && <span className="rounded-sm bg-(--indigo-600) px-1.5 py-0.5 text-caption-strong text-(--indigo-100)">Suggested</span>}
        </span>
      </div>
    )
  }
  const bottom = ZONES.find((z) => z.place === 'bottom')

  return (
    <>
      <div data-float={showRight ? '' : undefined} className="pointer-events-none absolute right-(--map-pad) z-20 hidden desk:block" style={{ top: 'calc(var(--section-header-h) + var(--map-pad) + var(--banner-offset, 0px))', width: RIGHT_W, height: RIGHT_H }}>
        {ZONES.filter((z) => z.place === 'right').map(slot)}
      </div>
      {bottom && (
        <div data-float="" className="pointer-events-none absolute left-(--col-left) z-20 hidden desk:block" style={{ bottom: `calc(var(--map-pad) + ${historyOpen ? 372 : 0}px)`, width: bottom.w, height: zoneHeight(bottom) }}>
          {slot({ ...bottom, w: bottom.w })}
        </div>
      )}
      {message && <p className="absolute top-24 right-(--map-pad) z-30 hidden rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-2 text-meta desk:block">{message}</p>}
    </>
  )
}

/** A zone's box inside its container: the right column's zones sit at their `top`, the bottom strip fills its container. */
const zoneBox = (z: Zone) => (z.place === 'right' ? { left: 0, top: z.top ?? 0, width: z.w, height: zoneHeight(z) } : { left: 0, top: 0, width: z.w, height: zoneHeight(z) })
