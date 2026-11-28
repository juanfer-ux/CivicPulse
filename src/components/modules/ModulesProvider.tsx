import { List } from '@phosphor-icons/react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { PanelIcon } from '@/components/modules/PanelIcon'
import { MODULES, MODULES_ON, PANEL_TITLE, canDock, insertPos, modulesOnTop, parseLayout, place, type Area, type ModuleType, type PanelId, type Placed } from '@/lib/modules'

/**
 * The modules' shared state (decision 0049, behind /?modules=1): what is docked where, the follow / stay option, the drag in progress and the case that is open. Modules live in the right sidebar and can be dragged out to the left or the bottom of the map; the dock (in Dashboard) shows the zones and takes the drop. The docked modules and the order of the sidebar's windows are saved in the browser per user (`modules:v1:<user id>`), so a reload brings them back. Safe to use without the provider (tests): everything is off.
 */
type Drag = { type: ModuleType; x: number; y: number }
/** The header that follows the pointer while a window or a module is dragged: its title, the width of the row picked up and where on it the pointer is. */
type Ghost = { title: string; icon?: PanelId; width: number; dx: number; dy: number; x: number; y: number }

/** Shows the picked-up header under the pointer once it has moved 4 px (a click shows nothing); returns the cleanup. */
function followHeader(e: ReactPointerEvent, title: string, set: (g: Ghost | null) => void, icon?: PanelId) {
  const r = (e.currentTarget as HTMLElement).closest('[data-drag-header]')?.getBoundingClientRect() ?? (e.currentTarget as HTMLElement).getBoundingClientRect()
  const from = { title, icon, width: r.width, dx: e.clientX - r.left, dy: e.clientY - r.top }
  const [x0, y0] = [e.clientX, e.clientY]
  const move = (m: PointerEvent) => Math.hypot(m.clientX - x0, m.clientY - y0) >= 4 && set({ ...from, x: m.clientX, y: m.clientY })
  const end = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', end)
    set(null)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end)
  window.addEventListener('pointercancel', end)
}
type Open = { id: string | null; kind: 'recurrence' | 'incident' | null }
type Ctx = {
  on: boolean
  placed: Placed[]
  follow: boolean
  /** The Modules window sits above History in the right sidebar. */
  modulesTop: boolean
  movePanel: (moved: PanelId, to: 'top' | 'bottom') => void
  /** Drag a window by its title row; letting go over the other window swaps them. */
  startPanelDrag: (id: PanelId) => (e: ReactPointerEvent) => void
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
const OFF: Ctx = { on: false, placed: [], follow: true, modulesTop: false, movePanel: () => {}, startPanelDrag: () => () => {}, drag: null, open: { id: null, kind: null }, setOpen: () => {}, message: '', rightSlot: null, setRightSlot: () => {}, startDrag: () => () => {}, dockAt: () => {}, remove: () => {} }
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
  const follow = true // the docked modules follow the open case (the "stay with each case" choice left with the Modules menu, 2026-11-29)
  const [modulesTop, setModulesTop] = useState(() => {
    try {
      return localStorage.getItem('case-column:modules-top') === '1'
    } catch {
      return false
    }
  })
  const movePanel = useCallback((moved: PanelId, to: 'top' | 'bottom') => {
    const top = modulesOnTop(moved, to)
    setModulesTop(top)
    try {
      localStorage.setItem('case-column:modules-top', top ? '1' : '0')
    } catch {
      /* storage blocked: the order lasts this visit */
    }
  }, [])
  const startPanelDrag = useCallback(
    (id: PanelId) => (e: ReactPointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button:not([data-grip])')) return // the sort button stays a button
      e.preventDefault() // no text selection from the drag
      followHeader(e, PANEL_TITLE[id], setGhost, id)
      const up = (u: PointerEvent) => {
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        if (u.type !== 'pointerup') return
        const over = document.elementsFromPoint(u.clientX, u.clientY).map((el) => (el as HTMLElement).dataset?.panel as PanelId | undefined).find(Boolean)
        if (over && over !== id) movePanel(id, (over === 'modules') === modulesTop ? 'top' : 'bottom') // take the other window's place
      }
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    },
    [movePanel, modulesTop],
  )
  const [drag, setDrag] = useState<Drag | null>(null)
  const [ghost, setGhost] = useState<Ghost | null>(null)
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
      setPlaced(saved.placed.filter((p) => p.area !== 'right')) // the right column is every module's home now
    } catch {
      /* storage blocked: modules work for this visit only */
    }
    setLoadedKey(key)
  }, [key])
  useEffect(() => {
    if (!key || loadedKey !== key) return
    try {
      localStorage.setItem(key, JSON.stringify({ placed }))
    } catch {
      /* storage blocked or full */
    }
  }, [key, loadedKey, placed])

  const dockAt = useCallback(
    (area: Area | null | undefined, type: ModuleType, pos?: number) => {
      if (!area) return
      if (!canDock(type, open.kind)) return setMessage('Recurrence modules dock on a recurrence: open one first.')
      setMessage('')
      if (area === 'right') return setPlaced((list) => list.filter((p) => p.type !== type)) // back home, into the sidebar's Modules window
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
      followHeader(e, MODULES[type].title, setGhost)
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
  const value = useMemo<Ctx>(() => ({ on: MODULES_ON, placed, follow, modulesTop, movePanel, startPanelDrag, drag, open, setOpen, message, rightSlot, setRightSlot, startDrag, dockAt, remove }), [placed, follow, modulesTop, movePanel, startPanelDrag, drag, open, message, rightSlot, startDrag, dockAt, remove])
  return (
    <ModulesContext.Provider value={value}>
      {children}
      {ghost && (
        <div aria-hidden className="pointer-events-none fixed z-50 flex h-17 items-center gap-2 rounded-lg border border-(--neutral-500) bg-(--neutral-900) px-4 opacity-90 shadow-lg" style={{ left: ghost.x - ghost.dx, top: ghost.y - Math.min(ghost.dy, 48), width: ghost.width }}>
          {ghost.icon && <PanelIcon id={ghost.icon} />}
          <span className="flex-1 truncate text-label text-(--fg-secondary)">{ghost.title}</span>
          <List weight="regular" className="size-4 shrink-0 text-(--neutral-200)" />
        </div>
      )}
    </ModulesContext.Provider>
  )
}
