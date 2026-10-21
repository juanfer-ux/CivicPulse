import { useEffect, useState, type ComponentType } from 'react'
import { FlaskConical, LogOut, MapIcon, Menu, PanelLeftClose, PanelLeftOpen, Users, X } from 'lucide-react'
import mark from '@/assets/logo-mark.svg'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/users'

export type View = 'map' | 'users'

const KEY = 'sidebar-collapsed'
const read = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <img src={mark} alt="" className="size-8 shrink-0" />
      {!collapsed && <span className="text-sm font-semibold tracking-[0.2em] whitespace-nowrap text-foreground">CIVIC PULSE</span>}
    </div>
  )
}

function NavItem({ icon: Icon, label, active, collapsed, onClick }: { icon: ComponentType<{ className?: string }>; label: string; active?: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} className="justify-start gap-2 px-2" title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon className="size-4 shrink-0" />
      {!collapsed && label}
    </Button>
  )
}

/** The menu itself: logo, sections, and who is signed in. Used by the desktop column and the phone slide-out. */
function Menu_({ collapsed, view, onView, footerExtra }: { collapsed: boolean; view: View; onView: (v: View) => void; footerExtra?: React.ReactNode }) {
  const { profile, can, signOut } = useAuth()
  return (
    <div className="flex h-full flex-col gap-4 p-2">
      <Brand collapsed={collapsed} />
      <nav className="flex flex-col gap-1">
        <NavItem icon={MapIcon} label="Map" active={view === 'map'} collapsed={collapsed} onClick={() => onView('map')} />
        {can('manage_users') && <NavItem icon={Users} label="Users" active={view === 'users'} collapsed={collapsed} onClick={() => onView('users')} />}
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground" title="Synthetic data">
          <FlaskConical className="size-4 shrink-0" />
          {!collapsed && 'Synthetic data'}
        </div>
        {!collapsed && profile && (
          <div className="px-2 text-sm">
            <p className="truncate font-medium">{profile.full_name || 'Signed in'}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.role ? ROLE_LABELS[profile.role] : ''}</p>
          </div>
        )}
        <NavItem icon={LogOut} label="Sign out" collapsed={collapsed} onClick={signOut} />
        {footerExtra}
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
      <aside className={`hidden shrink-0 border-r bg-sidebar transition-[width] desk:block ${collapsed ? 'w-14' : 'w-56'}`}>
        <Menu_
          collapsed={collapsed}
          view={view}
          onView={onView}
          footerExtra={
            <Button variant="ghost" className="justify-start gap-2 px-2" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} title={collapsed ? 'Expand menu' : 'Collapse menu'} onClick={toggle}>
              {collapsed ? <PanelLeftOpen className="size-4 shrink-0" /> : <PanelLeftClose className="size-4 shrink-0" />}
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
          <aside className="relative h-full w-64 border-r bg-sidebar">
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
