import { createContext, useCallback, useContext, useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { MODULES, MODULES_ON, ZONES, canDock, place, type ModuleType, type Placed } from '@/lib/modules'

/**
 * The modules' shared state (decision 0049, behind /?modules=1): what is docked where, the follow / stay option, the drag in progress and the case that is open. The sidebar's Modules section starts a drag; the dock (in Dashboard) shows the zones and takes the drop. Kept in memory for now (saving comes later). Safe to use without the provider (tests): everything is off.
 */
type Drag = { type: ModuleType; x: number; y: number }
type Open = { id: string | null; kind: 'recurrence' | 'incident' | null }
type Ctx = {
  on: boolean
  placed: Placed[]
  follow: boolean
  setFollow: (v: boolean) => void
  drag: Drag | null
  open: Open
  setOpen: (o: Open) => void
  message: string
  startDrag: (type: ModuleType) => (e: ReactPointerEvent) => void
  dockAt: (zoneId: string | null | undefined, type: ModuleType) => void
  remove: (p: Placed) => void
}
const OFF: Ctx = { on: false, placed: [], follow: true, setFollow: () => {}, drag: null, open: { id: null, kind: null }, setOpen: () => {}, message: '', startDrag: () => () => {}, dockAt: () => {}, remove: () => {} }
const ModulesContext = createContext<Ctx>(OFF)
export const useModules = () => useContext(ModulesContext)

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [placed, setPlaced] = useState<Placed[]>([])
  const [follow, setFollow] = useState(true) // "Follow the open case" (default) or "Stay with each case"
  const [drag, setDrag] = useState<Drag | null>(null)
  const [open, setOpen] = useState<Open>({ id: null, kind: null })
  const [message, setMessage] = useState('')

  const dockAt = useCallback(
    (zoneId: string | null | undefined, type: ModuleType) => {
      const zone = ZONES.find((z) => z.id === zoneId)
      if (!zone) return
      if (!canDock(type, open.kind)) return setMessage('Recurrence modules dock on a recurrence: open one first.')
      setMessage('')
      setPlaced((list) => place(list, zone, type, open.id))
    },
    [open],
  )
  /** Pointer-events drag (mouse and touch, no library), the same pattern as the sidebar's resize handle; the dock's zones carry data-zone. */
  const startDrag = useCallback(
    (type: ModuleType) => (e: ReactPointerEvent) => {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      setDrag({ type, x: e.clientX, y: e.clientY })
      const move = (m: PointerEvent) => setDrag({ type, x: m.clientX, y: m.clientY })
      const up = (u: PointerEvent) => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        if (u.type === 'pointerup') dockAt(document.elementsFromPoint(u.clientX, u.clientY).find((el) => (el as HTMLElement).dataset?.zone)?.getAttribute('data-zone'), type)
        setDrag(null)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    },
    [dockAt],
  )
  const remove = useCallback((p: Placed) => setPlaced((list) => list.filter((x) => x !== p)), [])
  const value = useMemo<Ctx>(() => ({ on: MODULES_ON, placed, follow, setFollow, drag, open, setOpen, message, startDrag, dockAt, remove }), [placed, follow, drag, open, message, startDrag, dockAt, remove])
  return (
    <ModulesContext.Provider value={value}>
      {children}
      {drag && (
        <div className="pointer-events-none fixed z-50 rounded-lg border border-(--neutral-900) bg-(--neutral-700) px-3 py-2 text-body-sm-medium shadow-lg" style={{ left: drag.x + 12, top: drag.y + 12 }}>
          {MODULES[drag.type].title}
        </div>
      )}
    </ModulesContext.Provider>
  )
}
