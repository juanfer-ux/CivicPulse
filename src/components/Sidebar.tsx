import { useEffect, useState, type ComponentType } from 'react'
import { List, Plus, SidebarSimple, SignOut, X, type IconProps } from '@phosphor-icons/react'
import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'
import { Avatar } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/role-badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/users'
import { shortName } from '@/lib/utils'

type Chat = { id: number; title: string }
type Chats = { chats: Chat[]; activeId: number; onPick: (id: number) => void; onNew: () => void }

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

/** The tiny bullet that marks a conversation in the list (Figma icon/bullet): a 6 px dot in the 20 px icon slot. */
function Bullet() {
  return (
    <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
      <span className="size-1.5 rounded-full bg-current" />
    </span>
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
    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-[7.13px]'}`}>
      <img src={mark} alt="" width={38} height={38} className="shrink-0" />
      {!collapsed && <img src={wordmark} alt="Civic Pulse" width={140} height={11} className="shrink-0" />}
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
    <Button variant="ghost" className={`hover:bg-sidebar ${active ? 'bg-sidebar' : ''} ${collapsed ? 'h-11 w-10 gap-2 px-2 justify-center' : 'h-8 gap-2.5 justify-start px-3'}`} title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon className="size-5 shrink-0" weight={active ? 'fill' : 'regular'} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Button>
  )
}

/** The menu itself, as in Figma Sidebar (2026-10-28): logo, a full-width divider, the Investigations and Cases groups, then who is signed in and Sign out. Used by the desktop column and the phone slide-out. */
function Menu_({ collapsed, chats, activeId, onPick, onNew, toggleItem }: Chats & { collapsed: boolean; toggleItem?: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const title = 'flex h-8 items-center px-3 text-section-label uppercase text-(--neutral-300)'
  return (
    <div className={`flex h-full flex-col gap-8 py-4 ${collapsed ? 'items-center px-5' : ''}`}>
      <div className={`flex flex-col gap-4 ${collapsed ? 'self-center' : ''}`}>
        <div className={collapsed ? '' : 'px-4'}>
          <Brand collapsed={collapsed} />
        </div>
        <hr className="border-t" />
      </div>
      {toggleItem}
      {!collapsed && (
        <nav className="flex min-h-0 flex-col gap-4 overflow-y-auto px-0.5">
          <div className="flex items-center justify-between pr-1">
            <p className={title}>Investigations</p>
            <Button size="icon" variant="ghost" className="size-6" aria-label="New investigation" title="New investigation" onClick={onNew}>
              <Plus className="size-4" />
            </Button>
          </div>
          <NavItem icon={Bullet} label={chats.find((c) => c.id === activeId)?.title ?? 'New investigation'} active collapsed={false} onClick={() => onPick(activeId)} />
          <div className="flex flex-col gap-0.5">
            {chats
              .filter((c) => c.id !== activeId)
              .map((c) => (
                <NavItem key={c.id} icon={Bullet} label={c.title} collapsed={false} onClick={() => onPick(c.id)} />
              ))}
            {PLACEHOLDERS.map((t) => (
              <NavItem key={t} icon={Bullet} label={t} collapsed={false} onClick={() => {}} />
            ))}
          </div>
        </nav>
      )}
      {!collapsed && (
        <section className="flex flex-col gap-2.5 px-0.5">
          <p className={title}>Cases</p>
          <p className="px-3 text-meta text-muted-foreground">No cases yet.</p>
        </section>
      )}
      <div className={`mt-auto flex flex-col gap-4 ${collapsed ? 'items-center' : ''}`}>
        {!collapsed && profile && (
          <>
            <div className="flex items-center gap-3 px-4 desk:hidden">
              <Avatar name={profile.full_name || 'Signed in'} />
              <div className="min-w-0 text-body-sm">
                <p className="truncate">{shortName(profile.full_name) || 'Signed in'}</p>
                <p className="truncate text-meta text-muted-foreground">{profile.role ? ROLE_LABELS[profile.role] : ''}</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 px-4 desk:flex">
              <Avatar name={profile.full_name || 'Signed in'} title={shortName(profile.full_name) || 'Signed in'} />
              <RoleBadge role={profile.role} />
            </div>
          </>
        )}
        <div className={collapsed ? '' : 'px-0.5'}>
          <NavItem icon={SignOut} label="Sign out" collapsed={collapsed} onClick={signOut} />
        </div>
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
  const phone: Chats = { ...props, onPick: (id) => (props.onPick(id), setOpen(false)), onNew: () => (props.onNew(), setOpen(false)) }

  return (
    <>
      {/* Desktop: a column on the left, expanded or icons only. */}
      <aside className={`hidden shrink-0 border-r bg-card transition-[width] desk:block ${collapsed ? 'w-[81px]' : 'w-60'}`}>
        <Menu_
          {...props}
          collapsed={collapsed}
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
