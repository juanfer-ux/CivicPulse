import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react'
import { DotOutline, DotsThreeVertical, List, Plus, SidebarSimple, SignOut, X, type IconProps } from '@phosphor-icons/react'
import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { shortName } from '@/lib/utils'

type Chat = { id: number; title: string }
type Chats = { chats: Chat[]; activeId: number; onPick: (id: number) => void; onNew: () => void; cases: Chat[]; onNewCase: () => void }

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

/** The tiny bullet that marks a conversation or a case in a list (Figma icon/bullet): Phosphor DotOutline, fill weight, always solid, `neutral-300`. */
const Bullet = (props: IconProps) => <DotOutline {...props} weight="fill" className={`${props.className ?? ""} text-(--neutral-400)`} />

const WIDTH_KEY = 'sidebar-width'
const SIDEBAR_MIN = 260 // Figma min width of the expanded Sidebar (2026-10-29); it was 266, 262, 240
const SIDEBAR_MAX = 380 // Figma max width (was 340)
const SIDEBAR_DEFAULT = 284 // the width drawn in Figma
const clampWidth = (n: number) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, n))
const readWidth = () => {
  try {
    const v = Number(localStorage.getItem(WIDTH_KEY))
    return v ? clampWidth(v) : SIDEBAR_DEFAULT
  } catch {
    return SIDEBAR_DEFAULT
  }
}

/** Drag handle on the right edge of the expanded desktop sidebar, like the agent panel's (260 to 380 px, double-click resets to 284). */
function SidebarResizer({ width, onChange }: { width: number; onChange: (px: number) => void }) {
  const [dragging, setDragging] = useState(false)
  const active = useRef(false)
  const down = (e: PointerEvent<HTMLDivElement>) => {
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
const read = () => {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-[5.6px]'}`}>
      <img src={mark} alt="" width={30} height={30} className="shrink-0" />
      {!collapsed && <img src={wordmark} alt="Civic Pulse" width={112} height={9} className="shrink-0" />}
    </div>
  )
}

/** The menu behind the hamburger in the account row (Figma 2026-10-29): Sign out. `side` = where the popover opens. */
function AccountMenu({ onSignOut, side }: { onSignOut: () => void; side: 'above' | 'right' }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <Button variant="ghost" size="icon" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <DotsThreeVertical className={`size-5 ${side === 'above' ? 'text-(--white)' : ''}`} />
      </Button>
      {open && (
        <div className={`absolute z-40 w-40 rounded-sm border bg-card p-1 ${side === 'above' ? 'right-0 bottom-full mb-2' : 'bottom-0 left-full ml-3'}`}>
          <Button variant="ghost" className="h-8 w-full justify-start gap-2 px-3 hover:bg-sidebar" onClick={onSignOut}>
            <SignOut className="size-5 shrink-0" /> Sign out
          </Button>
        </div>
      )}
    </div>
  )
}

/** Phone top bar brand (Figma Mobile Top Bar): 32 px ring and the 118.5 x 9 wordmark, centered. */
function MobileBrand() {
  return (
    <div className="flex items-center gap-2">
      <img src={mark} alt="" width={32} height={32} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" width={118.5} height={9} className="shrink-0" />
    </div>
  )
}

function NavItem({ icon: Icon, label, active, collapsed, onClick }: { icon: ComponentType<IconProps>; label: string; active?: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" className={`hover:bg-sidebar ${active ? 'bg-sidebar' : ''} ${collapsed ? 'h-11 w-10 gap-2 px-2 justify-center' : 'h-8 gap-0 justify-start pl-0 pr-5'}`} title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Button>
  )
}

/** The menu itself, as in Figma Sidebar (2026-10-29): a 70 px header with the logo and the collapse button, the Investigations and Cases groups, and at the bottom the account row. Used by the desktop column and the phone slide-out. */
function Menu_({ collapsed, chats, activeId, onPick, onNew, cases, onNewCase, toggleItem, onToggle }: Chats & { collapsed: boolean; toggleItem?: React.ReactNode; onToggle?: () => void }) {
  const { profile, session, signOut } = useAuth()
  const name = shortName(profile?.full_name) || 'Signed in'
  const email = session?.user?.email
  const title = 'flex h-8 items-center text-section-label uppercase text-(--neutral-200)'
  const plus = (label: string, onClick: () => void) => (
    <Button size="icon" variant="ghost" className="size-8" aria-label={label} title={label} onClick={onClick}>
      <Plus className="size-4 text-(--white)" />
    </Button>
  )
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex min-h-0 flex-col gap-4">
        <div className={`flex h-[70px] shrink-0 items-center border-b ${collapsed ? 'justify-center border-(--neutral-500)' : 'justify-between border-(--neutral-400) px-3'}`}>
          <Brand collapsed={collapsed} />
          {!collapsed && onToggle && (
            <Button variant="ghost" className="h-11 w-10 gap-2 px-2 justify-center" aria-label="Collapse menu" title="Collapse menu" onClick={onToggle}>
              <SidebarSimple className="size-5 shrink-0" />
            </Button>
          )}
        </div>
        {!collapsed && (
          <div className="flex min-h-0 flex-col gap-8 overflow-y-auto px-2.5 py-4">
            <nav className="flex flex-col gap-4">
              <div className="flex items-center justify-between pl-2.5 pr-1.5">
                <p className={title}>Investigations</p>
                {plus('New investigation', onNew)}
              </div>
              <div className="flex flex-col gap-0.5">
                {chats.map((c) => (
                  <NavItem key={c.id} icon={Bullet} label={c.title} active={c.id === activeId} collapsed={false} onClick={() => onPick(c.id)} />
                ))}
                {PLACEHOLDERS.map((t) => (
                  <NavItem key={t} icon={Bullet} label={t} collapsed={false} onClick={() => {}} />
                ))}
              </div>
            </nav>
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between pl-2.5 pr-1.5">
                <p className={title}>Cases</p>
                {plus('New case', onNewCase)}
              </div>
              {cases.length ? (
                <div className="flex flex-col gap-0.5">
                  {cases.map((c) => (
                    <NavItem key={c.id} icon={Bullet} label={c.title} collapsed={false} onClick={() => {}} />
                  ))}
                </div>
              ) : (
                <p className="pl-2.5 text-meta text-muted-foreground">No cases yet.</p>
              )}
            </section>
          </div>
        )}
      </div>
      {collapsed && <div className="flex justify-center">{toggleItem}</div>}
      <div className={`flex shrink-0 flex-col border-t border-(--neutral-400) py-4 ${collapsed ? 'items-center gap-3' : ''}`}>
        {collapsed ? (
          <>
            <AccountMenu onSignOut={signOut} side="right" />
            <Avatar name={profile?.full_name || 'Signed in'} size="lg" title={name} />
          </>
        ) : (
          <div className="flex items-center gap-3 py-1 pl-4 pr-5">
            <Avatar name={profile?.full_name || 'Signed in'} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-body-strong text-(--neutral-100)">{name}</p>
              {email && <p className="truncate text-caption text-(--neutral-200)">{email}</p>}
            </div>
            <AccountMenu onSignOut={signOut} side="above" />
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar(props: Chats) {
  const [collapsed, setCollapsed] = useState(read)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  const [width, setWidth] = useState(readWidth)
  const changeWidth = (px: number) => {
    const w = clampWidth(px)
    setWidth(w)
    try {
      localStorage.setItem(WIDTH_KEY, String(w))
    } catch {
      /* works without storage */
    }
  }

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? '0' : '1')
      } catch {
        /* works without storage */
      }
      return !c
    })
  // On phones the menu closes after a choice.
  const phone: Chats = { ...props, onPick: (id) => (props.onPick(id), setOpen(false)), onNew: () => (props.onNew(), setOpen(false)), onNewCase: () => (props.onNewCase(), setOpen(false)) }

  return (
    <>
      {/* Desktop: a column on the left, expanded or icons only. */}
      <aside style={{ width: collapsed ? 81 : width }} className="relative hidden shrink-0 border-r bg-card desk:block desk:rounded-lg">
        {!collapsed && <SidebarResizer width={width} onChange={changeWidth} />}
        <Menu_
          {...props}
          collapsed={collapsed}
          onToggle={toggle}
          toggleItem={
            collapsed && (
              <Button variant="ghost" className="h-11 w-10 gap-2 px-2 justify-center" aria-label="Expand menu" title="Expand menu" onClick={toggle}>
                <SidebarSimple className="size-5 shrink-0 -scale-x-100" />
              </Button>
            )
          }
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
      {open && (
        <div className="fixed inset-0 z-40 desk:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 border-r bg-card">
            <Button size="icon" variant="ghost" className="absolute right-2 top-2" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </Button>
            <Menu_ {...phone} collapsed={false} />
          </aside>
        </div>
      )}
    </>
  )
}
