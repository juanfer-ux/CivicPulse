import { lazy, Suspense, useState } from 'react'
import { ChartScatter, DotsSixVertical, Plus, Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { Offer } from '@/lib/agent'
import { suggestedArea } from '@/lib/modules'
import type { ProblemRow } from '@/lib/problems'
import { useModules } from '@/components/modules/ModulesProvider'

const TimelineModule = lazy(() => import('@/components/modules/TimelineModule'))

/**
 * The agent's offer under an answer (decision 0049, behind /?modules=1): one line and its reason, then Yes / Not now. Yes shows the module as a small chart card like the answer charts: its title row is the drag handle (drop it in a lit zone on the map) and "Add to side panel" sends it to the zone that suits it. A deterministic suggestion the person accepts; read-only.
 */
export function ModuleOffer({ offer }: { offer: Offer }) {
  const { on, placed, startDrag, dockAt } = useModules()
  const [state, setState] = useState<'offer' | 'preview' | 'dismissed'>('offer')
  if (!on) return null
  const area = suggestedArea('timeline') // the bottom strip: a timeline reads best wide
  const docked = placed.some((p) => p.type === 'timeline')
  if (state === 'dismissed') {
    return (
      <Button size="sm" variant="ghost" className="self-start" onClick={() => setState('offer')}>
        Offer the timeline again
      </Button>
    )
  }
  if (state === 'offer') {
    return (
      <div className="flex flex-col gap-2 rounded-sm border border-(--neutral-500) p-3">
        <p className="flex items-start gap-2 text-body-sm-medium text-foreground">
          <Sparkle weight="fill" className="mt-0.5 size-4 shrink-0 text-(--indigo-200)" aria-hidden />
          {offer.label}
        </p>
        <p className="text-meta text-muted-foreground">{offer.reason}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setState('preview')}>
            Yes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setState('dismissed')}>
            Not now
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3 rounded-[6px] border-[0.5px] border-(--neutral-500) bg-(--neutral-700) p-4">
      <div role="button" tabIndex={0} aria-label={`Recurrence timeline for ${offer.reference}: drag to an area on the map`} onPointerDown={startDrag('timeline')} className="flex touch-none cursor-grab select-none items-center gap-2 active:cursor-grabbing">
        <DotsSixVertical className="size-4 shrink-0 text-(--neutral-300)" aria-hidden />
        <ChartScatter weight="regular" className="size-4 shrink-0 text-(--neutral-200)" aria-hidden />
        <span className="flex-1 truncate text-body-sm-medium text-foreground">Recurrence timeline · {offer.reference}</span>
        <span className="text-meta text-muted-foreground">suggested: bottom strip</span>
      </div>
      <div className="h-[200px] overflow-hidden">
        <Suspense fallback={<p className="text-meta text-muted-foreground">Loading…</p>}>
          <TimelineModule problem={{ id: offer.problemId, status: offer.status } as ProblemRow} openDetail={null} />
        </Suspense>
      </div>
      {docked ? (
        <p className="text-meta text-muted-foreground">Docked in the side panel. Close it there to dock it again.</p>
      ) : (
        <>
          <Button size="sm" variant="secondary" className="gap-1 self-start" onClick={() => dockAt(area, 'timeline')}>
            <Plus className="size-3.5" aria-hidden />
            Add to side panel
          </Button>
          <p className="text-meta text-muted-foreground">Drag the title to a lit area on the map, or press the button: it goes to the suggested one, the strip along the bottom.</p>
        </>
      )}
    </div>
  )
}
