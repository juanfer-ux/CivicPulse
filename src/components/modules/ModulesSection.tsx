import { useEffect, useRef, useState } from 'react'
import { ChartScatter, Check, DotsSixVertical, GearSix, Hash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MODULES, MODULES_ON, type ModuleType } from '@/lib/modules'
import { useModules } from '@/components/modules/ModulesProvider'

const ICON = { timeline: ChartScatter, numbers: Hash } as const

const Item = ({ label, on, pick }: { label: string; on: boolean; pick: () => void }) => (
  <Button role="menuitemradio" aria-checked={on} variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-body-sm hover:bg-(--neutral-800)" onClick={pick}>
    <span className="flex size-4 items-center justify-center">{on && <Check weight="bold" className="size-3.5" aria-hidden />}</span>
    {label}
  </Button>
)

/** The gear in the title row: a small menu with the two choices, the look of the view menu (owner, 2026-11-09, option 1 of /#module-options). */
function Settings() {
  const { follow, setFollow } = useModules()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => (document.removeEventListener('pointerdown', down), document.removeEventListener('keydown', key))
  }, [open])
  return (
    <>
      <Button size="icon" variant="ghost" aria-label="Module settings" aria-pressed={open} title="Module settings" onClick={() => setOpen(!open)} className={`size-6 ${open ? 'bg-(--neutral-600)' : ''}`}>
        <GearSix weight="regular" className="size-4 text-(--neutral-100)" />
      </Button>
      {open && (
        <div ref={box} role="menu" aria-label="Module settings" className="absolute top-full right-0 z-20 mt-1 w-60 rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-1 shadow-lg">
          <p className="px-2 pt-1 pb-0.5 text-caption-medium text-(--neutral-300)">Apply modules across every case</p>
          <Item label="Follow the open case" on={follow} pick={() => setFollow(true)} />
          <Item label="Stay with each case" on={!follow} pick={() => setFollow(false)} />
        </div>
      )}
    </>
  )
}

/** The sidebar's Modules section (decision 0049, behind /?modules=1), right below the Explore row: the built-in modules, each a drag source for the docking zones on the map. */
export function ModulesSection() {
  const { startDrag } = useModules()
  if (!MODULES_ON) return null
  return (
    <div className="flex flex-col gap-1 px-2" aria-label="Modules">
      <div className="relative flex h-8 items-center justify-between">
        <span className="text-body-sm text-(--neutral-100)">Modules</span>
        <Settings />
      </div>
      {(Object.keys(MODULES) as ModuleType[]).map((t) => {
        const Icon = ICON[t]
        return (
          <div key={t} role="button" tabIndex={0} aria-label={`${MODULES[t].title}: drag to an area on the map`} onPointerDown={startDrag(t)} className="flex touch-none cursor-grab select-none items-center gap-2 rounded-sm px-1 py-1.5 text-body-sm hover:bg-(--neutral-800) active:cursor-grabbing">
            <DotsSixVertical className="size-3.5 text-(--neutral-300)" aria-hidden />
            <Icon weight="regular" className="size-4 text-(--neutral-200)" aria-hidden />
            <span className="flex-1 truncate">{MODULES[t].title}</span>
          </div>
        )
      })}
    </div>
  )
}
