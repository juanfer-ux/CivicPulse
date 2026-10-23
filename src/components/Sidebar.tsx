import { useEffect, useState, type ComponentType } from 'react'
import { Group, LogOut, Map as MapIcon, Menu, SidebarCollapse, SidebarExpand, Xmark } from 'iconoir-react'
import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/users'

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
    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-1'}`}>
      <img src={mark} alt="" width={38} height={38} className="shrink-0" />
      {!collapsed && <img src={wordmark} alt="Civic Pulse" width={140} height={11} className="shrink-0" />}
    </div>
  )
}

function NavItem({ icon: Icon, label, active, collapsed, onClick }: { icon: ComponentType<{ className?: string }>; label: string; active?: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} className={`gap-2 px-2 ${collapsed ? 'w-10 justify-center' : 'justify-start'}`} title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} onClick={onClick}>
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
      <div className={collapsed ? 'self-center' : ''}>
        <Brand collapsed={collapsed} />
      </div>
      {toggleItem}
      <nav className={`flex flex-col gap-3 ${collapsed ? 'items-center' : ''}`}>
        <NavItem icon={MapIcon} label="Map" active={view === 'map'} collapsed={collapsed} onClick={() => onView('map')} />
        {can('manage_users') && <NavItem icon={Group} label="Users" active={view === 'users'} collapsed={collapsed} onClick={() => onView('users')} />}
      </nav>
      <div className={`mt-auto flex flex-col gap-4 ${collapsed ? 'items-center' : ''}`}>
        {!collapsed && profile && (
          <div className="px-2 text-body">
            <p className="truncate font-medium">{profile.full_name || 'Signed in'}</p>
            <p className="truncate text-meta text-muted-foreground">{profile.role ? ROLE_LABELS[profile.role] : ''}</p>
          </div>
        )}
        <NavItem icon={LogOut} label="Sign out" collapsed={collapsed} onClick={signOut} />
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
            <Button variant="ghost" className={`gap-2 px-2 ${collapsed ? 'w-10 justify-center' : 'justify-start'}`} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} onClick={toggle}>
              {collapsed ? <SidebarExpand className="size-5 shrink-0" /> : <SidebarCollapse className="size-5 shrink-0" />}
              {!collapsed && 'Collapse'}
            </Button>
          }
        />
      </aside>

      {/* Phones: slim top bar with a menu button, and the menu slides in from the left. */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-[49px] items-center justify-between border-b bg-sidebar/90 px-3 backdrop-blur desk:hidden">
        <Brand collapsed={false} />
        <Button size="icon" variant="ghost" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 desk:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 border-r bg-card">
            <Button size="icon" variant="ghost" className="absolute right-2 top-2" aria-label="Close menu" onClick={() => setOpen(false)}>
              <Xmark className="size-5" />
            </Button>
            <Menu_ collapsed={false} view={view} onView={go} />
          </aside>
        </div>
      )}
    </>
  )
}
