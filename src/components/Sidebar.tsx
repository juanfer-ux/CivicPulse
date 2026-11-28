import { activeRow, type Pick } from '@/lib/sidebarActive'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { useFocusTrap, useRestoreFocus } from '@/lib/useRestoreFocus'
import { useNoSelect, useReleaseGuard } from '@/lib/useNoSelect'
import { Check, CaretDown, CaretRight, Chat, DotsThreeVertical, List, Plus, SidebarSimple, StarFour, FunnelSimple, SignOut, Warning, X } from '@phosphor-icons/react'
import { gsap } from 'gsap'
import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'
import { createPortal } from 'react-dom'
import { useRailSlot } from '@/lib/railSlot'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/auth'
import { GROUPS, PROBLEM_STATUS, PROBLEM_STATUSES, type Group, type ProblemStatus } from '@/lib/statusColors'
import { shortName } from '@/lib/utils'

type Chat = { id: number; title: string; created?: number; updated?: number }
/** The real recurrences and incidents the lists show (shaped by Dashboard, so this file stays free of Supabase); a click flies the map to the row (owner, 2026-11-06). */
export type SidebarRecurrence = { id: string; title: string; category?: string; address?: string; status: ProblemStatus; reference: string; locality?: string; created?: number; updated?: number }
export type SidebarIncident = { id: string; title: string; category?: string; address?: string; reference: string; locality?: string; group: Group; created?: number; updated?: number }
/** The items each conversation touched (the ids of its incidents and recurrences): the sidebar lists only these (owner, 2026-11-08). */
export type ChatItems = { title: string; ids: string[] }[]
/** What is open on the map (a click there or in this menu): its row is the highlighted one. */
export type SidebarSelection = { kind: 'recurrence' | 'incident'; id: string }
type Chats = { agentOff?: boolean; onToggleAgent?: () => void; chats: Chat[]; activeId: number; exploring?: boolean; onPick: (id: number) => void; onNew: () => void; cases: Chat[]; onNewCase: () => void; chatItems?: ChatItems; pinnedIds?: Set<string>; ongoingIds?: string[]; recurrences?: SidebarRecurrence[]; incidents?: SidebarIncident[]; onOpenRecurrence?: (id: string) => void; onOpenIncident?: (id: string) => void; selected?: SidebarSelection | null }

/** The Recurrences list keeps the demo's three recurrences (owner, 2026-11-23: opening another one on the map used to push the yellow Monitoring row out, because the list shows the three most recently updated): the three newest of `pinnedIds`, always, plus the recurrence that is open when it is not one of them. Without `pinnedIds` the list is the three most recently updated, as before. */
export function shownRecurrences<T extends { id: string | number; updated?: number }>(items: T[], pinned: Set<string> | undefined, openId: string | null, ongoing: string[] = []): T[] {
  // Ongoing conversations (owner, 2026-11-23): a recurrence the person typed on or continued goes to row 1, most recent first, and pushes the three down; one only opened and left alone returns to its place.
  const top = ongoing.map((id) => items.find((i) => String(i.id) === id)).filter((i): i is T => !!i)
  const rest = shownRecurrencesBase(items, pinned, openId).filter((i) => !top.includes(i))
  const three = [...top, ...rest].slice(0, 3) // the list keeps three rows (owner, 2026-11-23: with an ongoing one on top the fourth goes away); the open recurrence that is not among them is the only extra
  const open = items.find((i) => openId !== null && String(i.id) === openId)
  return open && !three.includes(open) ? [...three, open] : three
}
function shownRecurrencesBase<T extends { id: string | number; updated?: number }>(items: T[], pinned: Set<string> | undefined, openId: string | null): T[] {
  const newest = (l: T[]) => [...l].sort((a, b) => (b.updated ?? 0) - (a.updated ?? 0))
  if (!pinned || !items.some((i) => pinned.has(String(i.id)))) return newest(items).slice(0, 3)
  const base = newest(items.filter((i) => pinned.has(String(i.id)))).slice(0, 3)
  const extra = items.filter((i) => (typeof i.id !== 'string' || String(i.id) === openId) && !base.some((b) => b.id === i.id)) // the open one, and the person's own "New recurrence" rows (numeric ids)
  return [...base, ...extra]
}

/** The open incident when it is not among the three rows the collapsed Incidents list shows (ongoing ones first, then the section's sort): it is added as a fourth row (owner, 2026-11-23, the same rule as the Recurrences). */
function lastOf<T extends { id: string | number; created?: number; updated?: number }>(items: T[], view: View, ongoing: string[] = [], openId: string): string | null {
  const sorted = sortItems(items, view)
  const top = ongoing.map((id) => sorted.find((i) => String(i.id) === id)).filter((i): i is T => !!i)
  const head = [...top, ...sorted.filter((i) => !top.includes(i))].slice(0, 3)
  return head.some((i) => String(i.id) === openId) || !items.some((i) => String(i.id) === openId) ? null : openId
}

/** DEMO (owner, 2026-11-23): a list (opened by the chevron in its section title) that shows its first three rows collapsed and, expanded, draws batches of BATCH (20) rows as the end of the list scrolls into view (the data is already in memory: this only limits what is drawn). `children` gets how many rows to draw. */
const BATCH = 20
function Growing({ open, total, children }: { open: boolean; total: number; children: (limit: number) => ReactNode }) {
  const [n, setN] = useState(BATCH)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) setN(BATCH) // collapsing starts the next expansion from the first batch
  }, [open])
  useEffect(() => {
    const el = end.current
    const root = el?.closest('[data-radix-scroll-area-viewport]')
    if (!open || n >= total || !el || !root || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setN((x) => x + BATCH), { root, rootMargin: '40px' })
    io.observe(el)
    return () => io.disconnect()
  }, [open, n, total])
  return (
    <>
      {children(open ? Math.min(n, total) : 3)}
      {open && <div ref={end} />}
    </>
  )
}

/** The items of a section in its view: one list, or grouped by status, ordered as the view says. */
function ViewList<T extends { id: string | number; created?: number; updated?: number }>({ items, view, group, order, labels, primary, row, limit, batched, flat, first, last }: { first?: string[]; last?: string | null; items: T[]; view: View; group: (t: T) => string; order: string[]; labels: Record<string, string>; primary: string; row: (t: T) => ReactNode; limit?: number; batched?: boolean; flat?: boolean }) {
  // `limit`: only that many rows show, and only those (owner, 2026-11-09: the Incidents list shows 5); the section title still counts them all.
  // `batched` (DEMO, owner 2026-11-23): By status, every group keeps its full count and draws its own rows in batches; View all draws `limit` rows, grown by the caller's infinite scroll.
  const byView = sortItems(items, view)
  const top = (first ?? []).map((id) => byView.find((i) => String(i.id) === id)).filter((i): i is T => !!i)
  const tail = last ? byView.find((i) => String(i.id) === last && !top.includes(i)) : undefined
  const sorted = first || last ? [...top, ...byView.filter((i) => !top.includes(i) && i !== tail), ...(tail ? [tail] : [])] : byView // owner, 2026-11-23: an ongoing recurrence is row 1, the one open from the map and not in the top 3 is always the last row, whatever the sort
  if (flat) return <>{sorted.map(row)}</> // collapsed: just the rows, no group titles (a closed group would hide one)
  if (limit && !batched) return <>{[...(tail ? sorted.slice(0, -1) : sorted).slice(0, limit), ...(tail ? [tail] : [])].map(row)}</> // collapsed: the latest few, no group titles
  if (view.group === 'status') return <Groups items={sorted} newest group={group} order={order} labels={labels} primary={primary} row={row} batch={batched} />
  return <>{(limit ? sorted.slice(0, limit) : sorted).map(row)}</>
}

/** A list grouped by status (owner, 2026-11-08): every group has its own title with a caret and a count; the first (Active, Pending) is open and the later ones start collapsed. Active, Monitoring, Resolved, Archived for recurrences; Pending, Reviewing, Approved, Rejected for incidents. */
/** One open group's rows, drawn BATCH at a time as the end of the group scrolls into view (DEMO, owner 2026-11-23: "load by clusters"): each group is its own cluster with its own infinite scroll; the group's title still counts all its rows. */
function GroupRows<T extends { id: string | number }>({ rows, row }: { rows: T[]; row: (t: T) => ReactNode }) {
  const [n, setN] = useState(BATCH)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = end.current
    const root = el?.closest('[data-radix-scroll-area-viewport]')
    if (n >= rows.length || !el || !root || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setN((x) => x + BATCH), { root, rootMargin: '40px' })
    io.observe(el)
    return () => io.disconnect()
  }, [n, rows.length])
  return (
    <>
      {rows.slice(0, n).map(row)}
      {n < rows.length && <div ref={end} />}
    </>
  )
}

function Groups<T extends { id: string | number }>({ items, group, order, labels, primary, row, newest, batch }: { batch?: boolean; items: T[]; group: (t: T) => string; order: string[]; labels: Record<string, string>; primary: string; row: (t: T) => ReactNode; newest: boolean }) {
  const [open, setOpen] = useState<Set<string>>(new Set([primary]))
  const toggle = (g: string) => setOpen((o) => (o.has(g) ? new Set([...o].filter((x) => x !== g)) : new Set([...o, g])))
  return (
    <>
      {order
        .map((g) => [g, items.filter((t) => group(t) === g)] as const)
        .filter(([, l]) => l.length)
        .map(([g, l]) => (
          <div key={g} className="flex flex-col gap-1">
            <Button variant="ghost" className="h-7 justify-start gap-1 px-1 text-caption-medium text-(--fg-secondary) hover:bg-(--neutral-700) aria-expanded:bg-(--neutral-600)" aria-expanded={open.has(g)} onClick={() => toggle(g)}>
              {open.has(g) ? <CaretDown weight="regular" className="size-3" aria-hidden /> : <CaretRight weight="regular" className="size-3" aria-hidden />}
              {labels[g]} · {l.length}
            </Button>
            {open.has(g) && (batch ? <GroupRows rows={newest ? l : [...l].reverse()} row={row} /> : (newest ? l : [...l].reverse()).map(row))}
          </div>
        ))}
    </>
  )
}


/** The three row types of the sidebar (Figma 2026-11-05): Recurrence (warning icon in its status color), Incident (a dot in its status color) and Investigation. */
type RecurrenceRow = { id: string | number; title: string; status: ProblemStatus; reference?: string; locality?: string; category?: string; address?: string }

/** The second line of a row (owner's Figma, 2026-11-26): the incident type in `caption-medium`, 10 px, the reference; both `fg-tertiary` since 2026-11-27. */
const SubLine = ({ category, reference }: { category?: string; reference: string }) => (
  <span className="flex min-w-0 gap-2.5">
    {category && <span className="shrink-0 text-caption-medium">{category}</span>}
    <span className="truncate">{reference}</span>
  </span>
)

/** Two-line row shared by Recurrence and Incident (Figma Sidebar Item Recurrence / Incident, 2026-11-12: 51 high, 6 left, 3 top, 8 bottom, 20 right; active = neutral-900, hover = neutral-600 (owner's Figma, 2026-11-12; hover was neutral-800), a 16 x 40 icon column with the 16 px icon 4 px below its top, 10 px to the text). */
function TwoLineItem({ icon, title, sub, active, tip, onClick }: { icon: ReactNode; title: string; sub: ReactNode; active?: boolean; tip: string; onClick: () => void }) {
  const row = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (active) row.current?.scrollIntoView?.({ block: 'nearest' }) // the open one is always in view, under the sticky section title (scroll-mt-10)
  }, [active])
  return (
    <Button ref={row} variant="ghost" className={`scroll-mt-10 h-[60px] items-start justify-start gap-2.5 p-2 pr-5 focus-visible:border-(--neutral-300) ${active ? 'bg-(--neutral-900) hover:bg-(--neutral-900)' : 'hover:bg-(--neutral-600)'}`} title={tip} aria-current={active || undefined} onClick={onClick}>
      <span className={`flex h-10 w-4 shrink-0 items-start justify-center pt-0.5`}>{icon}</span>
      <span className={`flex h-11 justify-center min-w-0 flex-col text-left`}>
        <span className="flex min-w-0 flex-col gap-1">
          <span className={`truncate text-body-sm ${active ? 'text-(--fg-emphasis)' : 'text-(--fg-secondary)'}`}>{title}</span>
          <span className="flex h-5 items-center truncate text-caption text-(--fg-tertiary)"><span className="truncate">{sub}</span></span>
        </span>
      </span>
    </Button>
  )
}

/** One sidebar section (Figma Recurrences / Incidents / Investigations): a title row with its own sort button and plus, then the list. Each section sorts on its own. */
/** How a list of items is shown (owner, 2026-11-08): everything in one list or grouped by status, ordered by last update or by creation date, newest or oldest first. Starts as one list by last update. */
type View = { group: 'all' | 'status'; sort: 'updated' | 'created'; newest: boolean }
const DEFAULT_VIEW: View = { group: 'all', sort: 'updated', newest: true }
function sortItems<T extends { created?: number; updated?: number }>(items: T[], v: View): T[] {
  const key = v.sort === 'created' ? 'created' : 'updated'
  const l = [...items].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
  return v.newest ? l : l.reverse()
}

/** The view menu behind the funnel button: View all or By status, Last updated or Date created, newest or oldest first. */
function ViewMenu({ view, onChange, onClose, groups = true }: { view: View; onChange: (v: View) => void; onClose: () => void; groups?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // A press on the button that opened the menu is not "outside": that button's own click closes the menu (owner, 2026-11-23: the second click closed it on pointer down and the click opened it again).
    const down = (e: globalThis.PointerEvent) => !box.current?.contains(e.target as Node) && !(e.target as Element).closest?.('[aria-haspopup="menu"]') && onClose()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => (document.removeEventListener('pointerdown', down), document.removeEventListener('keydown', key))
  }, [onClose])
  const Item = ({ label, on, pick }: { label: string; on: boolean; pick: () => void }) => (
    <Button role="menuitemradio" aria-checked={on} variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-body-sm hover:bg-(--neutral-800)" onClick={pick}>
      <span className="flex size-4 items-center justify-center">{on && <Check weight="regular" className="size-3.5" aria-hidden />}</span>
      {label}
    </Button>
  )
  const Label = ({ children }: { children: ReactNode }) => <p className="px-2 pt-1 pb-0.5 text-caption-medium text-(--neutral-300)">{children}</p>
  return (
    <div ref={box} role="menu" aria-label="View options" className="absolute top-full right-0 z-20 mt-1 w-52 rounded-sm border border-(--neutral-500) bg-(--neutral-900) p-1 shadow-lg">
      {groups && (
        <>
          <Label>View</Label>
          <Item label="View all" on={view.group === 'all'} pick={() => onChange({ ...view, group: 'all' })} />
          <Item label="By status" on={view.group === 'status'} pick={() => onChange({ ...view, group: 'status' })} />
        </>
      )}
      <Label>Sort by</Label>
      <Item label="Last updated" on={view.sort === 'updated'} pick={() => onChange({ ...view, sort: 'updated' })} />
      <Item label="Date created" on={view.sort === 'created'} pick={() => onChange({ ...view, sort: 'created' })} />
      <Label>Order</Label>
      <Item label="Newest first" on={view.newest} pick={() => onChange({ ...view, newest: true })} />
      <Item label="Oldest first" on={!view.newest} pick={() => onChange({ ...view, newest: false })} />
    </div>
  )
}

/** One sidebar section (Figma Recurrences / Incidents / Investigations): a title row with its own view button and plus, then the list. Each section has its own view. Recurrences and Incidents (`views`) get the view menu; Investigations just flips newest and oldest. */
function Section<T>({ title, items, addLabel, onAdd, row, children, empty, views, noGroups, limit, expanded, onExpand }: { expanded?: boolean; onExpand?: (open: boolean) => void; limit?: number; title: string; items: T[]; addLabel: string; onAdd?: () => void; row?: (t: T) => ReactNode; children?: (view: View) => ReactNode; empty?: string; views?: boolean; noGroups?: boolean }) {
  const [view, setView] = useState<View>(DEFAULT_VIEW)
  const [menu, setMenu] = useState(false)
  const newest = view.newest
  // The title row sticks at the top while its section scrolls (owner, 2026-11-06) and then gets a bottom line: it sticks 1 px above the viewport (-top-px), so it is clipped (ratio < 1) only while stuck.
  const head = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  // while its view menu is open the title row sits above the next section's sticky title, which used to paint over the menu's last rows (owner's screenshot, 2026-11-23)
  useEffect(() => {
    const el = head.current
    const root = el?.closest('[data-radix-scroll-area-viewport]')
    if (!el || !root || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setStuck(!!e.rootBounds && e.boundingClientRect.top < e.rootBounds.top), { root, threshold: [1] })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div className={`flex flex-col gap-2 py-2 pr-1 pl-1`}> {/* 8 px above and below and between, 4 at each side (owner's Figma, 2026-11-23; the right was 10, with the sidebar frame's own 16 px next to it), in all three sections (owner's Figma, 2026-11-17, latest) */}
      <div ref={head} className={`group/title sticky -top-px ${menu ? 'z-30' : 'z-10'} flex items-center gap-2.5 pl-2 ${noGroups ? 'pr-1.5' : 'pr-2'} ${stuck ? 'h-12 -mb-4 border-b-[0.5px] border-(--neutral-500) bg-(--neutral-700) pb-4' : 'h-8 border-b border-transparent bg-(--neutral-800)'}`}> {/* stuck at the top: 16 px more padding below, 48 px high (owner, 2026-11-23: 8, then 10, then 16); the negative margin keeps the rows under it where they were, so nothing jumps */}
        {onExpand ? (
          <button type="button" className="flex flex-1 cursor-pointer items-center gap-1 text-left text-caption-medium text-(--neutral-300) outline-none hover:text-(--fg-primary) focus-visible:text-(--fg-primary)" aria-expanded={!!expanded} aria-label={`${title}: ${expanded ? 'show less' : 'show all'}`} title={expanded ? 'Show less' : 'Show all'} onClick={() => onExpand(!expanded)}>
            {title}
            {expanded ? <CaretDown weight="regular" className="size-3.5" aria-hidden /> : <CaretRight weight="regular" className="size-3.5" aria-hidden />} {/* closed: an arrow to the right, open: down, like the group titles (owner, 2026-11-23) */}
          </button>
        ) : (
          <p className="flex-1 text-caption-medium text-(--neutral-300)">{title}</p>
        )}
        {/* Figma "Actions": the view and plus buttons side by side with no gap (2 x 32 px). */}
        <div className="relative flex opacity-0 transition-opacity group-hover/title:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100 [@media(hover:none)]:opacity-100"> {/* the buttons show only while the pointer is over the section title (owner, 2026-11-17); they stay while one has keyboard focus or its menu is open, and on touch screens */}
          {views ? (
            <Button size="icon" variant="ghost" className="size-8" aria-label={`${title}: view options`} aria-haspopup="menu" aria-expanded={menu} title="View options" onClick={() => setMenu((m) => !m)}>
              <FunnelSimple weight="regular" className="size-4 text-(--neutral-100)" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="size-8" aria-label={`${title}: ${newest ? 'newest first. Show oldest first' : 'oldest first. Show newest first'}`} title={newest ? 'Newest first' : 'Oldest first'} onClick={() => setView((v) => ({ ...v, newest: !v.newest }))}>
              <FunnelSimple weight="regular" className="size-4 text-(--neutral-100)" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="size-8" aria-label={addLabel} title={addLabel} onClick={onAdd}>
            <Plus weight="regular" className="size-4 text-(--neutral-100)" />
          </Button>
          {menu && <ViewMenu view={view} groups={!noGroups} onChange={(v) => (setView(v), setMenu(false))} onClose={() => setMenu(false)} />}
        </div>
      </div>
      <div className={`flex flex-col ${noGroups ? 'gap-0.5' : 'gap-1'}`}>{children ? children(view) : row && (newest ? items : [...items].reverse()).slice(0, limit).map(row)}{empty && !items.length && <p className="px-2 pb-1 text-caption text-(--neutral-300)">{empty}</p>}</div>
    </div>
  )
}

const WIDTH_KEY = 'sidebar-width'
const SIDEBAR_MIN = 260 // 260 (owner's Figma, 2026-11-23: the Sidebar component's minimum width; 300 before); 300 again (owner, 2026-11-17, after 320 for a day: the Figma frame is 320 wide); 320 before; 320 in the big sidebar pass of 2026-11-17 (Figma 320 wide), 300 earlier that day; min width of the expanded Sidebar (owner's Figma, 2026-11-17: 300, as drawn; 260 since 2026-11-12; it was 245 since 2026-10-30, 260, 266, 262, 240, briefly 220)
const SIDEBAR_MAX = 400 // 400 since 2026-11-17 (the Figma component's max width); 380 before; Figma max width (was 340)
const SIDEBAR_DEFAULT = 300 // 300 again (owner, 2026-11-17); 320 before; 320 (Figma, 2026-11-17), 300 earlier that day; the width it opens at (owner's Figma, 2026-11-17: 300; 260 since 2026-11-12; it was 300, 245 and 284 before)
const clampWidth = (n: number) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, n))
/** The sidebar follows the window (owner, 2026-11-23): 15 % of its width, kept between the minimum and the maximum (270 px at 1,800, 400 px from about 2,670). A drag sets it by hand until the window changes again. */
export const widthFor = (viewportW: number) => clampWidth(Math.round(viewportW * 0.15))
const readWidth = () => {
  try {
    const v = Number(localStorage.getItem(WIDTH_KEY))
    return v ? clampWidth(v) : SIDEBAR_DEFAULT
  } catch {
    return SIDEBAR_DEFAULT
  }
}

/** Drag handle on the right edge of the expanded desktop sidebar, like the agent panel's (260 to 380 px, double-click resets to 260). */
function SidebarResizer({ width, onChange }: { width: number; onChange: (px: number) => void }) {
  const [dragging, setDragging] = useState(false)
  useNoSelect(dragging)
  const active = useRef(false)
  const stop = () => {
    active.current = false
    setDragging(false)
  }
  useReleaseGuard(dragging, stop)
  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault() // no text selection from the drag
    e.currentTarget.setPointerCapture(e.pointerId)
    active.current = true
    setDragging(true)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!active.current) return
    if (e.buttons === 0) return stop() // the button is up but no pointerup arrived: the drag is over
    onChange(e.clientX - e.currentTarget.parentElement!.getBoundingClientRect().left)
  }
  const key = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') onChange(width - 16)
    else if (e.key === 'ArrowRight') onChange(width + 16)
    else if (e.key === 'Home') onChange(SIDEBAR_MIN)
    else if (e.key === 'End') onChange(SIDEBAR_MAX)
    else return
    e.preventDefault()
  }
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the menu"
      aria-valuenow={Math.round(width)}
      aria-valuemin={SIDEBAR_MIN}
      aria-valuemax={SIDEBAR_MAX}
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={key}
      onDoubleClick={() => onChange(SIDEBAR_DEFAULT)}
      className="group absolute top-0 right-0 bottom-0 z-30 w-3 translate-x-1/2 cursor-col-resize touch-none select-none outline-none"
    >
      <div className={`mx-auto h-full w-0.5 transition-colors group-hover:bg-ai-border group-focus-visible:bg-ai-border ${dragging ? 'bg-ai-border' : 'bg-transparent'}`} />
    </div>
  )
}

const COLLAPSED_W = 0 // collapsed, the sidebar disappears (owner, 2026-11-17): the agent panel's header shows the logo and the expand button instead; it was a 60 px rail (56 and 64 before)
/** The sidebar always starts expanded (owner, 2026-11-19; it started collapsed from 2026-11-16, and before that collapsed under 1,800 px or by what was saved in this browser). Dropping under 1,800 px while open collapses it, and growing back to 1,800 px or more opens it again (owner, 2026-11-23), but only if the resize collapsed it; the toggle stays the person's own choice. */
const NARROW = '(max-width: 1799.98px)'

/** The logo. The expand button is not here any more: collapsed, it is in the agent panel's title row, left of "Explore" (owner, 2026-11-17; before, the logo mark swapped for it on hover). */
function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-[11.72px] ${collapsed ? '' : 'px-2'}`}> {/* Figma Sidebar > Logo (owner, 2026-11-27): expanded, a 34 px mark and the 138.93 x 10.55 wordmark, 11.72 px apart, 8 px at the sides; collapsed, the 40 px mark */}
      <img src={mark} alt="" width={collapsed ? 40 : 34} height={collapsed ? 40 : 34} className="shrink-0" />
      {!collapsed && <img src={wordmark} alt="Civic Pulse" width={138.93} height={10.55} className="shrink-0" />}
    </div>
  )
}

/** The menu behind the hamburger in the account row (Figma 2026-10-29): Sign out. `side` = where the popover opens. */
function AccountMenu({ onSignOut, side, avatar }: { onSignOut: () => void; side: 'above' | 'right'; avatar?: ReactNode }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])
  return (
    <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      {avatar ? (
        // Collapsed sidebar (owner, 2026-10-30): the profile itself is the button, (the small chevron badge on its top right is gone: owner's Figma, 2026-11-17) so it reads as a menu (the badge sticks out 8 px past the avatar's right edge, 4 px above it: owner's Figma, 2026-11-16). No extra height: the area stays as tall as the expanded one.
        <button type="button" aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="group relative cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {avatar}
        </button>
      ) : (
        <Button variant="ghost" size="icon" className="-mx-2" /* the 20 px icon sits where Figma has it; the button keeps its hit area */ aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <DotsThreeVertical className={`size-5 ${side === 'above' ? 'text-(--white)' : ''}`} />
        </Button>
      )}
      {open && (
        <div role="menu" className={`absolute z-40 w-48 rounded-sm border bg-popover p-1 ${side === 'above' ? 'right-0 bottom-full mb-2' : 'bottom-0 left-full ml-3'}`}>
          <Button role="menuitem" variant="ghost" className="h-8 w-full justify-start gap-2 px-3 hover:bg-sidebar" onClick={onSignOut}>
            <SignOut className="size-5 shrink-0" /> Sign out
          </Button>
          {/* The map credit (required by OpenStreetMap and CARTO) moved here from the map's corner on desktop (owner, 2026-11-09). */}
          <p className="border-t px-3 pt-2 pb-1 text-meta text-muted-foreground">
            Map data © <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, © <a className="underline" href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>. Car model “<a className="underline" href="https://sketchfab.com/3d-models/2022-honda-hr-v-ehev-e9128a46adc34e5e995ab7e8ad36339c" target="_blank" rel="noreferrer">2022 Honda HR-V e:Hev</a>” by tonielpro520 on Sketchfab, <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, simplified for the map.
          </p>
        </div>
      )}
    </div>
  )
}

/** Phone top bar brand (Figma Mobile Top Bar): 29 px ring mark and the 118.5 x 9 wordmark, centered. */
function MobileBrand() {
  return (
    <div className="flex items-center gap-2">
      <img src={mark} alt="" width={29} height={29} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" width={118.5} height={9} className="shrink-0" />
    </div>
  )
}

/** The menu itself, as in Figma Sidebar (2026-10-29): a 70 px header with the logo and the collapse button, the Investigations and Cases groups, and at the bottom the account row. Used by the desktop column and the phone slide-out. */
function Menu_({ collapsed, chats, activeId, exploring, onPick, onNew, cases, onNewCase, recurrences: real = [], incidents = [], chatItems = [], pinnedIds, ongoingIds, onOpenRecurrence, onOpenIncident, selected, onToggle }: Chats & { collapsed: boolean; onToggle?: () => void }) {
  const { profile, session, signOut } = useAuth()
  const name = shortName(profile?.full_name) || 'Signed in'
  const email = session?.user?.email
  const selKey = selected ? selected.kind + selected.id : ''
  const [local, setLocal] = useState<(Pick & { sel: string }) | null>(null) // the row last clicked (Explore, an investigation, the local "New recurrence" row) and which recurrence or incident was open then: it stays the active row until a different one is opened, even while the old one is still open on the map
  const act = activeRow({ selected, pick: local && local.sel === selKey ? local : null, exploring: !!exploring, activeId })
  const noCase = <A extends unknown[]>(f?: (...a: A) => void) => (...a: A) => { setLocal(null); f?.(...a) }
  const pickRow = <A extends unknown[]>(p: Pick, f?: (...a: A) => void) => (...a: A) => { setLocal({ ...p, sel: selKey }); f?.(...a) }
  const [incOpen, setIncOpen] = useState(false) // the Incidents chevron (DEMO)
  const [query, setQuery] = useState('')
  const hit = (t: string) => t.toLowerCase().includes(query.trim().toLowerCase())
  // Only what a conversation touched is listed (owner, 2026-11-08); the map still shows everything.
  const convs = chatItems
  const tags = new Map<string, string[]>()
  convs.forEach((c) => c.ids.forEach((id) => tags.set(id, [...(tags.get(id) ?? []), c.title])))
  const recurrences: RecurrenceRow[] = [...cases.map((c): RecurrenceRow => ({ id: c.id, title: c.title, status: 'active' })), ...real.filter((r) => tags.has(r.id))].filter((c) => hit(c.title) || hit(c.address ?? '') || hit(c.reference ?? ''))
  const allRecurrences: RecurrenceRow[] = [...cases.map((c): RecurrenceRow => ({ id: c.id, title: c.title, status: 'active' })), ...real].filter((c) => hit(c.title) || hit(c.address ?? '') || hit(c.reference ?? '')) // DEMO (owner, 2026-11-23): every recurrence, like the incidents
  const [recOpen, setRecOpen] = useState(false) // the Recurrences chevron (DEMO)
  const incidentRows = incidents.filter((i) => hit(i.title) || hit(i.address ?? '') || hit(i.reference)) // DEMO (owner, 2026-11-23): every incident, drawn 3 at a time collapsed and in batches of 30 when expanded; it was only the ones a conversation touched
  const investigations = chats.map((c) => ({ key: c.id, title: c.title, id: c.id, created: c.created, updated: c.updated })).filter((c) => hit(c.title)) // sorted by the section's own view (newest first by default)
  const [invOpen, setInvOpen] = useState(false) // the Investigations chevron
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex min-h-0 flex-col">
        <div className={`flex shrink-0 items-center desk:rounded-tl-lg ${collapsed ? 'h-17 justify-center bg-(--neutral-900)' : 'h-[70px] justify-between bg-(--neutral-800) px-2.5'}`}>
          <Brand collapsed={collapsed} />
          {!collapsed && onToggle && (
            <Button variant="ghost" className="h-11 w-10 gap-2 px-2 justify-center" aria-label="Collapse menu" title="Collapse menu" onClick={onToggle}>
              <SidebarSimple weight="regular" className="size-5 shrink-0" />
            </Button>
          )}
        </div>
        {!collapsed && (
          <>
            {/* Figma: 16 px above, 12 below, 16 between; the search is 36 px high and the Explore row 40 px, both 14 px from the edge (owner's Figma, 2026-11-05). */}
            <div className="flex shrink-0 flex-col"> {/* Figma `main` (owner, 2026-11-26): the header (search, 16 px from the edges, 24 above and below, a 1.4 px `neutral-700` line under it), then 16 px to New investigation (48 px high, 16 px from the edges, 8 above and below) */}
              <div className="flex flex-col">
                <div className="mx-2 border-b-[1.4px] border-(--neutral-700) px-2.5 py-6"><div className="relative"> {/* the browser's own clear button is hidden: the × is the Phosphor X (owner, 2026-11-24: only Phosphor icons) */}
                  <Input type="search" aria-label="Search the menu" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 border-[0.5px] bg-(--neutral-700) border-(--neutral-400) pr-9 text-body-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none" />
                  {query && (
                    <Button variant="ghost" size="icon" aria-label="Clear search" className="absolute top-2 right-1 size-7" onClick={() => setQuery('')}>
                      <X weight="regular" className="size-4 text-(--neutral-200)" aria-hidden />
                    </Button>
                  )}
                </div></div>
                {/* Explore takes you to the agent's landing (owner, 2026-11-05): a fresh empty investigation, and the map clears the last answer. An empty one already open is reused, so clicking it twice adds nothing. */}
                <div className="mx-2 mt-4 py-2"> {/* Figma (owner, 2026-11-27): the New investigation row fills the width, 8 px from the edges like the sections */}
                <Button variant="ghost" aria-current={act.kind === 'explore' ? 'page' : undefined} className={`h-12 w-full justify-start gap-3 px-2 text-body-sm-medium text-(--fg-primary) ${act.kind === 'explore' ? 'bg-(--neutral-900) hover:bg-(--neutral-900)' : 'hover:bg-(--neutral-600)'}`} onClick={pickRow({ kind: 'explore' }, onNew)}>
                  <span className="grid size-6 shrink-0 place-items-center" aria-hidden><StarFour weight="regular" className="size-[18.3px] text-(--neutral-200)" /></span>
                  New investigation
                </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="min-h-0 flex-1" viewportClassName="[&>div]:!block">
              <div className="flex flex-col gap-3 px-2 pt-3"> {/* Figma (owner, 2026-11-27): 8 px at both sides (6), 12 px under New investigation and between sections */}
                <Section title="Recurrences" expanded={recOpen} onExpand={setRecOpen} items={allRecurrences} addLabel="New recurrence" onAdd={onNewCase} views empty="Nothing here yet. Ask the agent, or open a marker on the map.">
                  {(view) => (
                    <Growing open={recOpen} total={allRecurrences.length}>{(limit) => (
                    <ViewList items={recOpen ? allRecurrences : shownRecurrences(recurrences, pinnedIds, selected?.kind === 'recurrence' ? selected.id : null, ongoingIds)} first={recOpen ? undefined : ongoingIds} last={recOpen || selected?.kind !== 'recurrence' || ongoingIds?.includes(selected.id) || shownRecurrences(recurrences, pinnedIds, null, ongoingIds).some((i) => String(i.id) === selected.id) ? null : selected.id} limit={recOpen ? limit : undefined} flat={!recOpen} batched={recOpen && view.group === 'status'} view={view} group={(c) => c.status} order={PROBLEM_STATUSES} primary="active" labels={Object.fromEntries(PROBLEM_STATUSES.map((st) => [st, PROBLEM_STATUS[st].label]))} row={(c) => (
                      <TwoLineItem key={c.id} active={act.kind === 'case' ? c.id === act.id : act.kind === 'recurrence' && c.id === act.id} tip={`${c.address ?? c.title} (${PROBLEM_STATUS[c.status].label})`} onClick={() => (typeof c.id === 'string' ? noCase(onOpenRecurrence)(c.id) : setLocal({ kind: 'case', id: c.id, sel: selKey }))} title={c.address ?? c.title} /* the first line is the address only; the type is on the second line (owner, 2026-11-26) */
                        icon={<Warning weight="fill" className="mt-0.5 size-4" style={{ color: `var(${PROBLEM_STATUS[c.status].token})` }} aria-hidden />}
                        sub={c.reference ? <SubLine category={c.category} reference={c.reference} /> : 'Not linked to a recurrence yet'} />
                    )} />
                    )}</Growing>
                  )}
                </Section>
                <Section title="Incidents" expanded={incOpen} onExpand={setIncOpen} items={incidentRows} addLabel="New incident" views empty="Nothing here yet. Incidents an answer points to, or that you open, appear here.">
                  {(view) => (
                    <Growing open={incOpen} total={incidentRows.length}>{(limit) => (
                    <ViewList items={incidentRows} first={incOpen ? undefined : ongoingIds} last={incOpen || selected?.kind !== 'incident' ? null : lastOf(incidentRows, view, ongoingIds, selected.id)} limit={limit} batched={incOpen && view.group === 'status'} view={view} group={(i) => i.group} order={Object.keys(GROUPS)} primary="pending" labels={Object.fromEntries(Object.entries(GROUPS).map(([g, v]) => [g, v.label]))} row={(i) => (
                      <TwoLineItem key={i.id} active={act.kind === 'incident' && act.id === i.id} tip={`${i.address ?? i.title} (${GROUPS[i.group].label})`} onClick={() => noCase(onOpenIncident)(i.id)} title={i.address ?? i.title} icon={<span className="grid size-4 place-items-center" aria-hidden><span className="size-2 rounded-full" style={{ background: `var(${GROUPS[i.group].swatch})` }} /></span>} sub={<SubLine category={i.category} reference={i.reference} />} />
                    )} />
                    )}</Growing>
                  )}
                </Section>
                <Section title="Investigations" expanded={invOpen} onExpand={setInvOpen} items={investigations} addLabel="New investigation" onAdd={onNew} views noGroups>
                  {(view) => (
                    <Growing open={invOpen} total={investigations.length}>{(limit) => (
                    <ViewList items={investigations} limit={invOpen ? limit : 3} view={{ ...view, group: 'all' }} group={() => ''} order={[]} labels={{}} primary="" row={(c) => (
                  <Button key={c.key} variant="ghost" className={`h-9 items-center justify-start gap-2.5 py-2 pr-5 pl-2 focus-visible:border-(--neutral-300) text-body-sm ${act.kind === 'chat' && c.id === act.id ? 'bg-(--neutral-900) hover:bg-(--neutral-900)' : 'hover:bg-(--neutral-600)'}`} aria-current={act.kind === 'chat' && c.id === act.id ? 'true' : undefined} onClick={() => pickRow({ kind: 'chat', id: c.id }, onPick)(c.id)}>
                    <Chat weight="regular" className={`size-4 shrink-0 ${act.kind === 'chat' && c.id === act.id ? 'text-(--neutral-200)' : 'text-(--neutral-300)'}`} aria-hidden />
                    <span className={`truncate ${act.kind === 'chat' && c.id === act.id ? 'text-(--fg-emphasis)' : 'text-(--fg-secondary)'}`}>{c.title}</span>
                  </Button>
                )} />
                    )}</Growing>
                  )}
                </Section>
              </div>
            </ScrollArea>
          </>
        )}
      </div>
      <div className={`flex shrink-0 flex-col border-t-[0.5px] border-(--neutral-600) py-5 ${collapsed ? 'items-center justify-center' : ''}`}> {/* Figma User (owner, 2026-11-27): 20 px above and below, 12 at the sides, a `neutral-600` line on top, the large avatar */}
        {collapsed ? (
          <>
            <AccountMenu onSignOut={signOut} side="right" avatar={<Avatar name={profile?.full_name || 'Signed in'} title={name} />} />
          </>
        ) : (
          <div className="flex items-center gap-3 px-3"> {/* 12 px between the account details and the menu icon; the avatar and the text are 20 px apart */}
            <div className="flex min-w-0 flex-1 items-center gap-5 px-1.5">
              <Avatar size="lg" name={profile?.full_name || 'Signed in'} /> {/* the large one, 38 px (owner's Figma, 2026-11-27) */}
              <div className="flex min-w-0 flex-1 flex-col pb-1">
                <p className="truncate text-body-sm-strong text-(--fg-primary)">{name}</p>
                {email && <p className="truncate text-caption-medium text-(--fg-secondary)">{email}</p>}
              </div>
            </div>
            <AccountMenu onSignOut={signOut} side="above" />
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar(props: Chats & { initialCollapsed?: boolean }) { // initialCollapsed only lets the tests choose
  const [collapsed, setCollapsed] = useState(props.initialCollapsed ?? false)
  const [open, setOpen] = useState(false)

  // Resizing the window (owner, 2026-11-23): dropping under 1,800 px collapses an open sidebar, and growing back to 1,800 px or more opens it again at its own width, but only if the resize collapsed it; one the person collapsed (or expanded) themselves stays as they left it.
  const live = useRef({ collapsed, agentOff: props.agentOff })
  live.current = { collapsed, agentOff: props.agentOff }
  const auto = useRef(false)
  useEffect(() => {
    const mq = window.matchMedia?.(NARROW) // jsdom (the tests) has no matchMedia
    if (!mq) return
    const on = (e: MediaQueryListEvent) => {
      if (e.matches) {
        if (!live.current.collapsed) (auto.current = true, setCollapsed(true))
      } else if (auto.current) {
        auto.current = false
        setCollapsed(false)
      }
    }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  const [width, setWidth] = useState(readWidth)
  useEffect(() => {
    const on = () => setWidth(widthFor(window.innerWidth))
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const aside = useRef<HTMLElement>(null)
  const shownWidth = useRef(-1) // the width on the last render: where a collapse or expand starts from (a drag changes it without animating)
  // Collapse and expand: a GSAP tween of the width, 0.32 s (owner, 2026-11-08: a little slower than the 0.2 s before), the same opening and closing; the content is clipped while it runs.
  useLayoutEffect(() => {
    const el = aside.current
    const to = collapsed ? COLLAPSED_W : width
    if (el && shownWidth.current >= 0 && shownWidth.current !== to && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(el, { width: shownWidth.current, overflow: 'hidden' }, { width: to, duration: 0.32, ease: 'power2.out', clearProps: 'overflow' })
    }
  }, [collapsed]) // eslint-disable-line react-hooks/exhaustive-deps -- only the toggle animates, not a drag of the width
  useLayoutEffect(() => {
    shownWidth.current = collapsed ? COLLAPSED_W : width
  })
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute('data-sidebar-collapsed', collapsed) // the agent panel's rail shows only while this is set
    document.documentElement.style.setProperty('--sidebar-now', `${collapsed ? 0 : width}px`) // read by App: the agent panel's maximum leaves the map 47 % of the viewport
    window.dispatchEvent(new Event('sidebar-now'))
  }, [collapsed, width])
  // At any width (owner, 2026-11-23; before, 1,600 px or below with the agent panel open): opening the filters collapses an expanded sidebar, and closing them (or applying) brings it back as it was, only if the filters collapsed it.
  const stepped = useRef(false)
  useEffect(() => {
    const on = (e: Event) => {
      const open = (e as CustomEvent<boolean>).detail
      if (open && !live.current.collapsed) {
        stepped.current = true
        setCollapsed(true)
      } else if (!open && stepped.current) {
        stepped.current = false
        setCollapsed(false) // the width is kept, so it comes back to its own size
      }
    }
    window.addEventListener('filters-open', on)
    return () => window.removeEventListener('filters-open', on)
  }, [])
  useEffect(() => {
    const expand = () => ((auto.current = false), setCollapsed(false)) // it opens at the width it had (owner, 2026-11-26; before, always at the minimum)
    window.addEventListener('sidebar-expand', expand) // sent by the expand button in the agent panel's title row
    return () => window.removeEventListener('sidebar-expand', expand)
  }, [])
  const changeWidth = (px: number) => {
    const w = clampWidth(px)
    setWidth(w)
    try {
      localStorage.setItem(WIDTH_KEY, String(w))
    } catch {
      /* works without storage */
    }
  }

  const toggle = () => {
    auto.current = false // a choice of the person's, so a later resize leaves it alone
    setCollapsed(!collapsed) // the width is kept, so expanding opens it as it was (owner, 2026-11-26; before, always at the minimum)
  }
  // On phones the menu closes after a choice.
  const phone: Chats = { ...props, onPick: (id) => (props.onPick(id), setOpen(false)), onNew: () => (props.onNew(), setOpen(false)), onNewCase: () => (props.onNewCase(), setOpen(false)), onOpenRecurrence: (id) => (props.onOpenRecurrence?.(id), setOpen(false)), onOpenIncident: (id) => (props.onOpenIncident?.(id), setOpen(false)) }

  const railSlot = useRailSlot()
  // The collapsed sidebar is its logo box in the agent panel's header row (owner's Figma, 2026-11-20; a 70 px rail down the panel before): the logo expands the sidebar.
  const rail =
    collapsed && railSlot
      ? createPortal(
          <Button variant="ghost" className="group h-17 w-16 rounded-none border-b-[0.5px] border-(--neutral-600) bg-(--black) p-0 hover:bg-(--black)" aria-label="Expand menu" title="Expand menu" onClick={toggle}> {/* Figma Header's "Logo _Collapsed Container" (owner's Figma, 2026-11-20): 64 x 68, `black`, 12 px at the sides around the 40 px logo, a 0.5 px `neutral-700` line under it and none at its right */}
            <img src={mark} alt="" width={40} height={40} className="shrink-0 group-hover:hidden group-focus-visible:hidden" />
            <SidebarSimple weight="regular" className="hidden size-5 -scale-x-100 group-hover:block group-focus-visible:block" aria-hidden />
          </Button>,
          railSlot,
        )
      : null
  return (
    <>
      {rail}
      {/* Desktop: a column on the left; collapsed, it is 0 wide and its rail is inside the agent panel. */}
      <aside ref={aside} style={{ width: collapsed ? COLLAPSED_W : width }} inert={collapsed} className={`relative z-40 hidden shrink-0 overflow-hidden desk:block bg-(--neutral-800) ${collapsed ? '' : 'border-r-[0.5px] border-r-(--neutral-500)'}`}> {/* Figma Sidebar (owner, 2026-11-25): a 0.5 px `neutral-500` line at its right edge (`neutral-400` for a few minutes); none while collapsed (width 0) */}
        {!collapsed && <SidebarResizer width={width} onChange={changeWidth} />}
        <div className="h-full" style={{ width }}> {/* the menu stays mounted at its own width and the aside clips it, so collapsing and expanding are the same slide, one the reverse of the other (owner, 2026-11-17); a collapsed one is inert */}
          <Menu_ {...props} collapsed={false} onToggle={toggle} />
        </div>
      </aside>

      {/* Phones: slim top bar with a menu button, and the menu slides in from the left. */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-[49px] items-center justify-between border-b bg-sidebar px-3 desk:hidden">
        <Button size="icon" variant="ghost" aria-label="Open menu" onClick={() => setOpen(true)}>
          <List className="size-5" />
        </Button>
        <MobileBrand />
        <span className="size-(--control-icon)" aria-hidden /> {/* Figma keeps an invisible second button so the logo stays centered. */}
      </header>
      {open && <MobileMenu phone={phone} onClose={() => setOpen(false)} />}
    </>
  )
}

/** The slide-in mobile menu: a true modal overlay (it has a backdrop), so it gets the full dialog treatment. */
function MobileMenu({ phone, onClose }: { phone: Chats; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null)
  useRestoreFocus(panel)
  useFocusTrap(panel)
  return (
    <div className="fixed inset-0 z-40 desk:hidden">
      <button aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menu" className="relative h-full w-64 border-r bg-card outline-none">
        <Button size="icon" variant="ghost" className="absolute right-2 top-2" aria-label="Close menu" onClick={onClose}>
          <X className="size-5" />
        </Button>
        <Menu_ {...phone} collapsed={false} />
      </aside>
    </div>
  )
}
