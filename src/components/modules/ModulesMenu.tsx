import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Check, Stack } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { MODULES, modulesFor, suggestedArea, type ModuleType } from '@/lib/modules'
import { useModules } from '@/components/modules/ModulesProvider'

const Item = ({ label, on, pick }: { label: string; on: boolean; pick: () => void }) => (
  <Button role="menuitemradio" aria-checked={on} variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-body-sm hover:bg-(--neutral-700)" onClick={pick}>
    <span className="flex size-4 items-center justify-center">{on && <Check weight="regular" className="size-3.5" aria-hidden />}</span>
    {label}
  </Button>
)

/**
 * The Modules button in the header of an open recurrence or incident (owner, 2026-11-15; it replaces the sidebar's Modules section, decision 0049): a menu with the modules that case offers (a recurrence: the timeline and the numbers; an incident: the numbers). Drag a row to a docking area on the map, or click it to dock it in its suggested area. The menu also holds the two "apply across cases" choices that the sidebar's gear had. It is `fixed`, because the panels scroll and would clip it.
 */
export function ModulesMenu({ kind }: { kind: 'recurrence' | 'incident' }) {
  const { on, startDrag, dockAt, follow, setFollow } = useModules() // off without the provider (tests) or with /?modules=0
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState({ top: 0, left: 0 })
  const btn = useRef<HTMLButtonElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const down = useRef({ x: 0, y: 0 })
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => (document.removeEventListener('pointerdown', away), document.removeEventListener('keydown', key))
  }, [open])
  if (!on) return null
  const toggle = () => {
    const r = btn.current!.getBoundingClientRect()
    setAt({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - 240 - 8)) }) // opens from the button's left edge, never past the viewport: a right-aligned menu slid under the agent panel (owner's screenshot, 2026-11-19)
    setOpen(!open)
  }
  const row = (t: ModuleType) => (
    <div
      key={t}
      role="button"
      tabIndex={0}
      aria-label={`${MODULES[t].title}: drag to an area on the map, or click to add it`}
      onPointerDown={(e: ReactPointerEvent) => { down.current = { x: e.clientX, y: e.clientY }; startDrag(t)(e); window.addEventListener('pointerup', (u) => Math.hypot(u.clientX - down.current.x, u.clientY - down.current.y) >= 4 && setOpen(false), { once: true }) }} // a drag drops the module on the map and closes the menu too (it stayed open under the docked module, owner's screenshot 2026-11-19)
      onClick={(e) => { if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) < 4) { dockAt(suggestedArea(t), t); setOpen(false) } }} // a click, not the end of a drag
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dockAt(suggestedArea(t), t); setOpen(false) } }}
      className="flex h-8 cursor-grab touch-none items-center gap-2 rounded-sm px-2 text-body-sm text-(--fg-primary) outline-none select-none hover:bg-(--neutral-700) focus-visible:bg-(--neutral-700) active:cursor-grabbing"
    >
      <Stack weight="regular" className="size-4 text-(--neutral-200)" aria-hidden />
      <span className="flex-1 truncate">{MODULES[t].title}</span>
    </div>
  )
  return (
    <>
      <Button ref={btn} variant="ghost" size="sm" aria-haspopup="menu" aria-expanded={open} onClick={toggle} className={`gap-1.5 px-2 text-body-sm ${open ? 'bg-(--neutral-600)' : ''}`}>
        <Stack weight="regular" className="size-4" aria-hidden />
        Modules
      </Button>
      {open && createPortal(
        <div ref={box} role="menu" aria-label="Modules" style={{ top: at.top, left: at.left }} className="fixed z-50 w-60 rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-1 shadow-lg">
          <p className="px-2 pt-1 pb-0.5 text-caption-medium text-(--neutral-300)">Drag to the map, or click to add</p>
          {modulesFor(kind).map(row)}
          <div className="my-1 h-px bg-(--neutral-600)" aria-hidden />
          <p className="px-2 pt-1 pb-0.5 text-caption-medium text-(--neutral-300)">Apply modules across every case</p>
          <Item label="Follow the open case" on={follow} pick={() => setFollow(true)} />
          <Item label="Stay with each case" on={!follow} pick={() => setFollow(false)} />
        </div>,
        document.body,
      )}
    </>
  )
}

/** The menu row under the details in the header of an open recurrence or incident (owner, 2026-11-15): the same row in both panels, a line above it, with the Modules button at its left (more buttons can join it later). */
export function PanelMenuRow({ kind, className = '' }: { kind: 'recurrence' | 'incident'; className?: string }) {
  const { on } = useModules()
  if (!on) return null
  return (
    <div className={`flex items-center gap-1 border-t border-(--neutral-600) px-3 py-1 ${className}`}>
      <ModulesMenu kind={kind} />
    </div>
  )
}
