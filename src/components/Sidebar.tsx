import { useEffect, useState, type ComponentType } from 'react'
import { List, MapTrifold, SidebarSimple, SignOut, UsersThree, X } from '@phosphor-icons/react'
import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/users'
import { shortName } from '@/lib/utils'

export type View = 'map' | 'users'

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

/** `flush` = no side padding when expanded (Figma: Sign out lines up with the user row above it). */
function NavItem({ icon: Icon, label, active, collapsed, flush, onClick }: { icon: ComponentType<{ className?: string }>; label: string; active?: boolean; collapsed: boolean; flush?: boolean; onClick: () => void }) {
  return (
    <Button variant={collapsed && active ? 'secondary' : 'ghost'} className={`h-11 ${collapsed ? 'w-10 gap-2 px-2 justify-center' : `gap-4 justify-start hover:bg-sidebar ${active ? 'bg-sidebar' : ''} ${flush ? 'px-0' : 'px-3'}`}`} title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon className="size-5 shrink-0" />
      {!collapsed && label}
    </Button>
  )
}

/** The menu itself: logo, sections, and who is signed in. Used by the desktop column and the phone slide-out. */
function Menu_({ collapsed, view, onView, toggleItem }: { collapsed: boolean; view: View; onView: (v: View) => void; toggleItem?: React.ReactNode }) {
  const { profile, can, signOut } = useAuth()
  return (
    <div className="flex h-full flex-col gap-8 px-3 py-4">
      <div className={`flex flex-col gap-4 ${collapsed ? 'self-center' : ''}`}>
        <Brand collapsed={collapsed} />
        <hr className="border-t" />
      </div>
      {toggleItem}
      <nav className={`flex flex-col gap-3 ${collapsed ? 'items-center' : ''}`}>
        <NavItem icon={MapTrifold} label="Map" active={view === 'map'} collapsed={collapsed} onClick={() => onView('map')} />
        {can('manage_users') && <NavItem icon={UsersThree} label="Users" active={view === 'users'} collapsed={collapsed} onClick={() => onView('users')} />}
      </nav>
      <div className={`mt-auto flex flex-col gap-4 ${collapsed ? 'items-center' : ''}`}>
        {!collapsed && profile && (
          <div className="flex items-center gap-3 text-body-sm desk:hidden">
            <Avatar name={profile.full_name || 'Signed in'} />
            <div className="min-w-0">
              <p className="truncate">{shortName(profile.full_name) || 'Signed in'}</p>
              <p className="truncate text-meta text-muted-foreground">{profile.role ? ROLE_LABELS[profile.role] : ''}</p>
            </div>
          </div>
        )}
        <NavItem icon={SignOut} label="Sign out" flush collapsed={collapsed} onClick={signOut} />
      </div>
    </div>
  )
}

export function Sidebar({ view, onView }: { view: View; onView: (v: View) => void }) {
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
  const go = (v: View) => {
    onView(v)
    setOpen(false)
  }

  return (
    <>
      {/* Desktop: a column on the left, expanded or icons only. */}
      <aside className={`hidden shrink-0 border-r bg-card transition-[width] desk:block ${collapsed ? 'w-[64.5px]' : 'w-54'}`}>
        <Menu_
          collapsed={collapsed}
          view={view}
          onView={onView}
          toggleItem={
            <Button variant="ghost" className={collapsed ? 'h-11 w-10 gap-2 px-2 justify-center' : 'h-11 gap-4 px-3 justify-start hover:bg-sidebar'} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} onClick={toggle}>
              {collapsed ? <SidebarSimple className="size-5 shrink-0 -scale-x-100" /> : <SidebarSimple className="size-5 shrink-0" />}
              {!collapsed && 'Collapse'}
            </Button>
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
            <Menu_ collapsed={false} view={view} onView={go} />
          </aside>
        </div>
      )}
    </>
  )
}
