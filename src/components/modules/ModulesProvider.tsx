import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { MODULES, MODULES_ON, canDock, insertPos, parseLayout, place, type Area, type ModuleType, type Placed } from '@/lib/modules'

/**
 * The modules' shared state (decision 0049, behind /?modules=1): what is docked where, the follow / stay option, the drag in progress and the case that is open. The sidebar's Modules section starts a drag; the dock (in Dashboard) shows the zones and takes the drop. The docked modules and the follow / stay choice are saved in the browser per user (`modules:v1:<user id>`), so a reload brings them back. Safe to use without the provider (tests): everything is off.
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
  /** The element in the right column where the recurrence's history card is shown (it shrinks when modules dock below it). */
  rightSlot: HTMLElement | null
  setRightSlot: (el: HTMLElement | null) => void
  startDrag: (type: ModuleType) => (e: ReactPointerEvent) => void
  dockAt: (area: Area | null | undefined, type: ModuleType, pos?: number) => void
  remove: (p: Placed) => void
}
const OFF: Ctx = { on: false, placed: [], follow: true, setFollow: () => {}, drag: null, open: { id: null, kind: null }, setOpen: () => {}, message: '', rightSlot: null, setRightSlot: () => {}, startDrag: () => () => {}, dockAt: () => {}, remove: () => {} }
const ModulesContext = createContext<Ctx>(OFF)
export const useModules = () => useContext(ModulesContext)

/** Where a drop lands in an area: among the items already there (each carries data-pos; the module being moved does not count), by the pointer's position along the area (x for the bottom strip, y for a column). */
function dropPos(area: Area, type: ModuleType, x: number, y: number) {
  const box = document.querySelector(`[data-col="${area}"]`)
  const items = [...(box?.querySelectorAll(':scope > [data-pos]') ?? [])].filter((el) => (el as HTMLElement).dataset.type !== type).map((el) => {
    const r = el.getBoundingClientRect()
    return { pos: Number((el as HTMLElement).dataset.pos), mid: area === 'bottom' ? r.left + r.width / 2 : r.top + r.height / 2 }
  })
  return insertPos(items, area === 'bottom' ? x : y)
}

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [placed, setPlaced] = useState<Placed[]>([])
  const [follow, setFollow] = useState(true) // "Follow the open case" (default) or "Stay with each case"
  const [drag, setDrag] = useState<Drag | null>(null)
  const [open, setOpen] = useState<Open>({ id: null, kind: null })
  const [message, setMessage] = useState('')
  const [rightSlot, setRightSlot] = useState<HTMLElement | null>(null)

  const userId = useAuth().session?.user.id
  const key = userId ? `modules:v1:${userId}` : null
  const [loadedKey, setLoadedKey] = useState<string | null>(null) // saving waits until this user's layout is read, so the empty start never overwrites it
  useEffect(() => {
    if (!key) return
    try {
      const saved = parseLayout(localStorage.getItem(key))
      setPlaced(saved.placed)
      setFollow(saved.follow)
    } catch {
      /* storage blocked: modules work for this visit only */
    }
    setLoadedKey(key)
  }, [key])
  useEffect(() => {
    if (!key || loadedKey !== key) return
    try {
      localStorage.setItem(key, JSON.stringify({ placed, follow }))
    } catch {
      /* storage blocked or full */
    }
  }, [key, loadedKey, placed, follow])

  const dockAt = useCallback(
    (area: Area | null | undefined, type: ModuleType, pos?: number) => {
      if (!area) return
      if (!canDock(type, open.kind)) return setMessage('Recurrence modules dock on a recurrence: open one first.')
      setMessage('')
      setPlaced((list) => place(list, area, type, open.id, pos))
    },
    [open],
  )
  /** Pointer-events drag (mouse and touch, no library), the same pattern as the sidebar's resize handle; the docking areas carry data-area. */
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
        if (u.type === 'pointerup') {
          const area = document.elementsFromPoint(u.clientX, u.clientY).find((el) => (el as HTMLElement).dataset?.area)?.getAttribute('data-area') as Area | undefined
          dockAt(area, type, area ? dropPos(area, type, u.clientX, u.clientY) : undefined)
        }
        setDrag(null)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    },
    [dockAt],
  )
  const remove = useCallback((p: Placed) => setPlaced((list) => list.filter((x) => x !== p)), [])
  const value = useMemo<Ctx>(() => ({ on: MODULES_ON, placed, follow, setFollow, drag, open, setOpen, message, rightSlot, setRightSlot, startDrag, dockAt, remove }), [placed, follow, drag, open, message, rightSlot, startDrag, dockAt, remove])
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
