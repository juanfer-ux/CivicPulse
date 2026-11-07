import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { useFocusTrap, useRestoreFocus } from '@/lib/useRestoreFocus'
import { useNoSelect } from '@/lib/useNoSelect'
import { CaretDown, Chat, Compass, DotsThreeVertical, List, Plus, SidebarSimple, FunnelSimple, SignOut, Warning, X } from '@phosphor-icons/react'
import { gsap } from 'gsap'
import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/auth'
import { GROUPS, PROBLEM_STATUS, type Group, type ProblemStatus } from '@/lib/statusColors'
import { shortName } from '@/lib/utils'

type Chat = { id: number; title: string }
/** The real recurrences and incidents the lists show (shaped by Dashboard, so this file stays free of Supabase); a click flies the map to the row (owner, 2026-11-06). */
export type SidebarRecurrence = { id: string; title: string; status: ProblemStatus; reference: string }
export type SidebarIncident = { id: string; title: string; reference: string; group: Group }
/** What is open on the map (a click there or in this menu): its row is the highlighted one. */
export type SidebarSelection = { kind: 'recurrence' | 'incident'; id: string }
type Chats = { chats: Chat[]; activeId: number; exploring?: boolean; onPick: (id: number) => void; onNew: () => void; cases: Chat[]; onNewCase: () => void; recurrences?: SidebarRecurrence[]; incidents?: SidebarIncident[]; onOpenRecurrence?: (id: string) => void; onOpenIncident?: (id: string) => void; selected?: SidebarSelection | null }

/** Example titles so the list looks like a real history (owner, 2026-10-28). They open nothing; delete this list when conversations are saved for real. */
const PLACEHOLDERS = [
  'Parking in Chapinero',
  'Dumping hotspots',
  'Repeated reports in Kennedy',
  'Evening patrol, Usaquén',
  'Blocked ramps near schools',
  'Broken traffic lights, Suba',
  'Recurring locations this month',
  'Accessibility hazards in Engativá',
  'Where to inspect tomorrow',
  'Debris on main roads',
]

/** The three row types of the sidebar (Figma 2026-11-05): Recurrence (warning icon in its status color), Incident (a dot in its status color) and Investigation. */
type RecurrenceRow = { id: string | number; title: string; status: ProblemStatus; reference?: string }

/** Two-line row shared by Recurrence and Incident (Figma Sidebar Item Recurrence / Incident: 224.5 x 50, 6 left, 4 top, 6 bottom, 20 right, a 16 x 40 icon column with the 16 px icon 4 px below its top, 10 px to the text). */
function TwoLineItem({ icon, title, sub, active, tip, onClick }: { icon: ReactNode; title: string; sub: ReactNode; active?: boolean; tip: string; onClick: () => void }) {
  const row = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (active) row.current?.scrollIntoView?.({ block: 'nearest' }) // the open one is always in view, under the sticky section title (scroll-mt-10)
  }, [active])
  return (
    <Button ref={row} variant="ghost" className={`scroll-mt-10 h-[50px] items-start justify-start gap-2.5 pt-[3px] pb-[5px] pl-[5px] pr-[19px] hover:bg-(--neutral-800) ${active ? 'bg-(--neutral-800)' : ''}`} title={tip} aria-current={active || undefined} onClick={onClick}>
      <span className="flex h-10 w-4 shrink-0 items-start justify-center pt-1">{icon}</span>
      <span className="flex h-10 min-w-0 flex-col justify-center gap-0.5 text-left">
        <span className="truncate text-body-sm text-(--neutral-100)">{title}</span>
        <span className="truncate text-caption text-(--neutral-200)">{sub}</span>
      </span>
    </Button>
  )
}

/** One sidebar section (Figma Recurrences / Incidents / Investigations): a title row with its own sort button and plus, then the list. Each section sorts on its own. */
function Section<T>({ title, items, addLabel, onAdd, pb = 'pb-3', row }: { title: string; items: T[]; addLabel: string; onAdd?: () => void; pb?: string; row: (t: T) => ReactNode }) {
  const [newest, setNewest] = useState(true)
  // The title row sticks at the top while its section scrolls (owner, 2026-11-06) and then gets a bottom line: it sticks 1 px above the viewport (-top-px), so it is clipped (ratio < 1) only while stuck.
  const head = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = head.current
    const root = el?.closest('[data-radix-scroll-area-viewport]')
    if (!el || !root || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setStuck(!!e.rootBounds && e.boundingClientRect.top < e.rootBounds.top), { root, threshold: [1] })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div className={`flex flex-col gap-2 px-1.5 pt-2 ${pb}`}>
      <div ref={head} className={`sticky -top-px z-10 flex h-8 items-center gap-2.5 border-b-[1px] bg-(--neutral-700) pr-1.5 pl-2.5 ${stuck ? 'border-(--neutral-600)' : 'border-transparent'}`}>
        <p className="flex-1 text-caption-medium text-(--neutral-200)">{title}</p>
        {/* Figma "Actions": the sort and plus buttons side by side with no gap (2 x 32 px). */}
        <div className="flex">
          <Button size="icon" variant="ghost" className="size-8" aria-label={`${title}: ${newest ? 'newest first. Show oldest first' : 'oldest first. Show newest first'}`} title={newest ? 'Newest first' : 'Oldest first'} onClick={() => setNewest((n) => !n)}>
            <FunnelSimple weight="regular" className="size-4 text-(--neutral-100)" />
          </Button>
          <Button size="icon" variant="ghost" className="size-8" aria-label={addLabel} title={addLabel} onClick={onAdd}>
            <Plus weight="regular" className="size-4 text-(--neutral-100)" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 px-1">{(newest ? items : [...items].reverse()).map(row)}</div>
    </div>
  )
}

const WIDTH_KEY = 'sidebar-width'
const SIDEBAR_MIN = 245 // min width of the expanded Sidebar (owner, 2026-10-30; it was 260, 266, 262, 240, briefly 220)
const SIDEBAR_MAX = 380 // Figma max width (was 340)
const SIDEBAR_DEFAULT = 300 // the width it opens at (owner, 2026-11-05; it was 245, and 284 before), also the width drawn in Figma
const clampWidth = (n: number) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, n))
const readWidth = () => {
  try {
    const v = Number(localStorage.getItem(WIDTH_KEY))
    return v ? clampWidth(v) : SIDEBAR_DEFAULT
  } catch {
    return SIDEBAR_DEFAULT
  }
}

/** Drag handle on the right edge of the expanded desktop sidebar, like the agent panel's (245 to 380 px, double-click resets to 300). */
function SidebarResizer({ width, onChange }: { width: number; onChange: (px: number) => void }) {
  const [dragging, setDragging] = useState(false)
  useNoSelect(dragging)
  const active = useRef(false)
  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault() // no text selection from the drag
    e.currentTarget.setPointerCapture(e.pointerId)
    active.current = true
    setDragging(true)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current) onChange(e.clientX - e.currentTarget.parentElement!.getBoundingClientRect().left)
  }
  const stop = () => {
    active.current = false
    setDragging(false)
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
      onKeyDown={key}
      onDoubleClick={() => onChange(SIDEBAR_DEFAULT)}
      className="group absolute top-0 right-0 bottom-0 z-30 w-3 translate-x-1/2 cursor-col-resize touch-none select-none outline-none"
    >
      <div className={`mx-auto h-full w-0.5 transition-colors group-hover:bg-ai-border group-focus-visible:bg-ai-border ${dragging ? 'bg-ai-border' : 'bg-transparent'}`} />
    </div>
  )
}

const KEY = 'sidebar-collapsed'
const COLLAPSED_W = 64
const read = () => {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

/** Collapsed, the logo mark is the expand button: on hover or focus it swaps for the panel icon (owner, 2026-10-30). */
function Brand({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  if (collapsed && onToggle)
    return (
      <Button variant="ghost" className="group size-11 p-0" aria-label="Expand menu" title="Expand menu" onClick={onToggle}>
        <img src={mark} alt="" width={30.8} height={30.8} className="shrink-0 group-hover:hidden group-focus-visible:hidden" />
        <SidebarSimple className="hidden size-5 shrink-0 -scale-x-100 group-hover:block group-focus-visible:block" />
      </Button>
    )
  return (
    <div className={`flex items-center gap-[6.4px] ${collapsed ? '' : 'pl-[5.85px]'}`}>
      <img src={mark} alt="" width={30.8} height={30.8} className="shrink-0" />
      {!collapsed && <img src={wordmark} alt="Civic Pulse" width={125.9} height={9.56} className="shrink-0" />}
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
        // Collapsed sidebar (owner, 2026-10-30): the profile itself is the button, with a small down chevron badge on its top right so it reads as a menu. No extra height: the area stays as tall as the expanded one.
        <button type="button" aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="group relative cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {avatar}
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-(--neutral-500) text-(--neutral-100) ring-2 ring-(--neutral-900) group-hover:bg-(--white) group-hover:text-(--neutral-900) group-focus-visible:bg-(--white) group-focus-visible:text-(--neutral-900)">
            <CaretDown weight="bold" className="size-2.5" aria-hidden />
          </span>
        </button>
      ) : (
        <Button variant="ghost" size="icon" aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <DotsThreeVertical className={`size-5 ${side === 'above' ? 'text-(--white)' : ''}`} />
        </Button>
      )}
      {open && (
        <div role="menu" className={`absolute z-40 w-40 rounded-sm border bg-card p-1 ${side === 'above' ? 'right-0 bottom-full mb-2' : 'bottom-0 left-full ml-3'}`}>
          <Button role="menuitem" variant="ghost" className="h-8 w-full justify-start gap-2 px-3 hover:bg-sidebar" onClick={onSignOut}>
            <SignOut className="size-5 shrink-0" /> Sign out
          </Button>
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
function Menu_({ collapsed, chats, activeId, exploring, onPick, onNew, cases, onNewCase, recurrences: real = [], incidents = [], onOpenRecurrence, onOpenIncident, selected, onToggle }: Chats & { collapsed: boolean; onToggle?: () => void }) {
  const { profile, session, signOut } = useAuth()
  const name = shortName(profile?.full_name) || 'Signed in'
  const email = session?.user?.email
  const [caseId, setCaseId] = useState<number | null>(null) // the local "New recurrence" row last clicked (the real rows follow `selected`)
  const [query, setQuery] = useState('')
  const hit = (t: string) => t.toLowerCase().includes(query.trim().toLowerCase())
  const recurrences: RecurrenceRow[] = [...cases.map((c): RecurrenceRow => ({ id: c.id, title: c.title, status: 'active' })), ...real].filter((c) => hit(c.title) || hit(c.reference ?? ''))
  const investigations = [...chats.map((c) => ({ key: c.id, title: c.title, id: c.id })), ...PLACEHOLDERS.map((t) => ({ key: t, title: t, id: null }))].filter((c) => hit(c.title)).reverse() // chats arrive oldest first, the list shows newest first
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex min-h-0 flex-col">
        <div className={`flex h-[70px] shrink-0 items-center desk:rounded-tl-lg ${collapsed ? 'justify-center bg-(--neutral-900)' : 'justify-between bg-(--neutral-700) px-3'}`}>
          <Brand collapsed={collapsed} onToggle={onToggle} />
          {!collapsed && onToggle && (
            <Button variant="ghost" className="h-11 w-10 gap-2 px-2 justify-center" aria-label="Collapse menu" title="Collapse menu" onClick={onToggle}>
              <SidebarSimple className="size-5 shrink-0" />
            </Button>
          )}
        </div>
        {!collapsed && (
          <>
            {/* Figma: 16 px above, 12 below, 16 between; the search is 36 px high and the Explore row 40 px, both 14 px from the edge (owner's Figma, 2026-11-05). */}
            <div className="flex shrink-0 flex-col gap-4 border-b border-(--neutral-500) px-1.5 pt-4 pb-3">
              <div className="px-2">
                <Input type="search" aria-label="Search the menu" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 bg-(--neutral-600) border-(--neutral-400) text-body-sm" />
              </div>
              {/* Explore takes you to the agent's landing (owner, 2026-11-05): a fresh empty investigation, and the map clears the last answer. An empty one already open is reused, so clicking it twice adds nothing. */}
              <Button variant="ghost" aria-current={exploring ? 'page' : undefined} className={`h-10 w-full justify-start gap-3 px-[7px] text-body-sm-medium text-(--neutral-100) hover:bg-(--neutral-800) ${exploring ? 'bg-(--neutral-800)' : ''}`} onClick={onNew}>
                <Compass weight="regular" className="size-6 shrink-0 text-(--neutral-200)" aria-hidden />
                Explore
              </Button>
            </div>
            <ScrollArea className="min-h-0 flex-1" viewportClassName="[&>div]:!block">
              <div className="flex flex-col gap-2.5 py-2">
                <Section title="Recurrences" items={recurrences} addLabel="New recurrence" onAdd={onNewCase} pb="pb-2.5" row={(c) => (
                  <TwoLineItem key={c.id} active={c.id === caseId || (selected?.kind === 'recurrence' && selected.id === c.id)} tip={`${c.title} (${PROBLEM_STATUS[c.status].label})`} onClick={() => (typeof c.id === 'string' ? onOpenRecurrence?.(c.id) : setCaseId(c.id))} title={c.title}
                    icon={<Warning weight="fill" className="size-4" style={{ color: `var(${PROBLEM_STATUS[c.status].token})` }} aria-hidden />}
                    sub={c.reference ? <>{c.reference} · <span className="text-caption-strong">{PROBLEM_STATUS[c.status].label}</span></> : 'Not linked to a recurrence yet'} />
                )} />
                <Section title="Incidents" items={incidents.filter((i) => hit(i.title) || hit(i.reference))} addLabel="New incident" row={(i) => (
                  <TwoLineItem key={i.id} active={selected?.kind === 'incident' && selected.id === i.id} tip={`${i.title} (${GROUPS[i.group].label})`} onClick={() => onOpenIncident?.(i.id)} title={i.title} icon={<span className="grid size-4 place-items-center" aria-hidden><span className="size-3 rounded-full" style={{ background: `var(${GROUPS[i.group].swatch})` }} /></span>} sub={<>{i.reference} · <span className="text-caption-strong">{GROUPS[i.group].label}</span></>} />
                )} />
                <Section title="Investigations" items={investigations} addLabel="New investigation" onAdd={onNew} row={(c) => (
                  <Button key={c.key} variant="ghost" className={`h-[30px] items-center justify-start gap-2.5 py-1 pl-1.5 pr-5 text-body-sm hover:bg-(--neutral-800) ${c.id === activeId && !exploring ? 'bg-(--neutral-800)' : ''}`} aria-current={c.id === activeId || undefined} onClick={() => c.id !== null && onPick(c.id)}>
                    <Chat weight="regular" className="size-4 shrink-0 text-(--neutral-300)" aria-hidden />
                    <span className="truncate">{c.title}</span>
                  </Button>
                )} />
              </div>
            </ScrollArea>
          </>
        )}
      </div>
      <div className={`flex shrink-0 flex-col border-t border-(--neutral-400) ${collapsed ? 'min-h-[85px] items-center justify-center' : 'py-4'}`}>
        {collapsed ? (
          <>
            <AccountMenu onSignOut={signOut} side="right" avatar={<Avatar name={profile?.full_name || 'Signed in'} size="lg" title={name} />} />
          </>
        ) : (
          <div className="flex items-center gap-3 py-1 pl-4 pr-5">
            <Avatar name={profile?.full_name || 'Signed in'} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
              <p className="truncate text-body-strong text-(--neutral-100)">{name}</p>
              {email && <p className="truncate text-caption-medium text-(--neutral-200)">{email}</p>}
            </div>
            <AccountMenu onSignOut={signOut} side="above" />
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar({ collapse, ...props }: Chats & { collapse?: boolean }) {
  const [collapsed, setCollapsed] = useState(read)
  const autoCollapsed = useRef(false) // we collapsed it for an incident, so closing the incident expands it again (unless the owner toggled it meanwhile)
  useEffect(() => {
    if (collapse) {
      setCollapsed((c) => {
        autoCollapsed.current = !c
        return true
      })
    } else if (autoCollapsed.current) {
      autoCollapsed.current = false
      setCollapsed(false)
    }
  }, [collapse])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  const [width, setWidth] = useState(readWidth)
  const aside = useRef<HTMLElement>(null)
  const shownWidth = useRef(0) // the width on the last render: where a collapse or expand starts from (a drag changes it without animating)
  // Collapse and expand: a quick GSAP tween of the width (0.2 s); the content is clipped while it runs.
  useLayoutEffect(() => {
    const el = aside.current
    const to = collapsed ? COLLAPSED_W : width
    if (el && shownWidth.current && shownWidth.current !== to && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(el, { width: shownWidth.current, overflow: 'hidden' }, { width: to, duration: 0.2, ease: 'power2.out', clearProps: 'overflow' })
    }
  }, [collapsed]) // eslint-disable-line react-hooks/exhaustive-deps -- only the toggle animates, not a drag of the width
  useLayoutEffect(() => {
    shownWidth.current = collapsed ? COLLAPSED_W : width
  })
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
    autoCollapsed.current = false
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? '0' : '1')
      } catch {
        /* works without storage */
      }
      return !c
    })
  }
  // On phones the menu closes after a choice.
  const phone: Chats = { ...props, onPick: (id) => (props.onPick(id), setOpen(false)), onNew: () => (props.onNew(), setOpen(false)), onNewCase: () => (props.onNewCase(), setOpen(false)), onOpenRecurrence: (id) => (props.onOpenRecurrence?.(id), setOpen(false)), onOpenIncident: (id) => (props.onOpenIncident?.(id), setOpen(false)) }

  return (
    <>
      {/* Desktop: a column on the left, expanded or icons only. */}
      <aside ref={aside} style={{ width: collapsed ? COLLAPSED_W : width }} className={`relative hidden shrink-0 desk:m-(--page-pad) desk:mr-0 desk:block desk:rounded-l-lg ${collapsed ? 'bg-(--neutral-900)' : 'bg-(--neutral-700)'}`}>
        {!collapsed && <SidebarResizer width={width} onChange={changeWidth} />}
        <Menu_
          {...props}
          collapsed={collapsed}
          onToggle={toggle}
        />
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
