import { useState } from 'react'
import { Dashboard, type Tab } from '@/components/Dashboard'
import { InvestigatePanel } from '@/components/InvestigatePanel'
import { UsersAdmin } from '@/components/UsersAdmin'
import { Sidebar, type View } from '@/components/Sidebar'
import { useAuth } from '@/lib/auth'

export default function App() {
  const { can } = useAuth()
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [tab, setTab] = useState<Tab>('explore')
  const [view, setView] = useState<View>('map')
  const showUsers = view === 'users' && can('manage_users')

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar view={showUsers ? 'users' : 'map'} onView={setView} />
      <main className="relative min-w-0 flex-1">
        {/* Kept mounted while the Users page is open, so the map and the agent's answer are still there on return. */}
        <div className={showUsers ? 'hidden' : 'contents'}>
          <Dashboard highlightIds={highlightIds} tab={tab} onTab={setTab}>
            {/* Mobile: only shown on the Investigate tab. Desktop: always shown. */}
            <div className={tab === 'ask' ? 'contents' : 'hidden md:contents'}>
              <InvestigatePanel onHighlight={setHighlightIds} />
            </div>
          </Dashboard>
        </div>
        {showUsers && <UsersAdmin />}
      </main>
    </div>
  )
}
