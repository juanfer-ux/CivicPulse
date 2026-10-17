import { useState } from 'react'
import { Dashboard, type Tab } from '@/components/Dashboard'
import { InvestigatePanel } from '@/components/InvestigatePanel'
import { UsersAdmin } from '@/components/UsersAdmin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export default function App() {
  const { profile, can, signOut } = useAuth()
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [tab, setTab] = useState<Tab>('explore')
  const [view, setView] = useState<'map' | 'users'>('map')
  const showUsers = view === 'users' && can('manage_users')

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      {/* Kept mounted while the Users page is open, so the map and the agent's answer are still there on return. */}
      <div className={showUsers ? 'hidden' : 'contents'}>
        <Dashboard highlightIds={highlightIds} tab={tab} onTab={setTab}>
          {/* Mobile: only shown on the Investigate tab. Desktop: always shown. */}
          <div className={tab === 'ask' ? 'contents' : 'hidden md:contents'}>
            <InvestigatePanel onHighlight={setHighlightIds} />
          </div>
        </Dashboard>
      </div>
      {showUsers && <UsersAdmin onBack={() => setView('map')} />}

      <header className="absolute inset-x-0 top-0 flex items-center justify-between border-b bg-sidebar/90 px-4 py-3 backdrop-blur">
        <span className="text-sm font-semibold tracking-[0.2em] whitespace-nowrap text-foreground">CIVIC PULSE</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <Badge variant="secondary">Synthetic data</Badge>
          <Badge variant="outline" className="max-sm:hidden">
            {profile?.role?.replace('_', ' ')}
          </Badge>
          {can('manage_users') && (
            <Button size="sm" variant="outline" onClick={() => setView(showUsers ? 'map' : 'users')}>
              {showUsers ? 'Map' : 'Users'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
    </div>
  )
}
