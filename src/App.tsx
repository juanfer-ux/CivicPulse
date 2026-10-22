import { useCallback, useState, type CSSProperties } from 'react'
import { Dashboard, type Tab } from '@/components/Dashboard'
import { InvestigatePanel } from '@/components/InvestigatePanel'
import { UsersAdmin } from '@/components/UsersAdmin'
import { Sidebar, type View } from '@/components/Sidebar'
import { AGENT_DEFAULT, AGENT_MAX, AGENT_MIN, AgentResizer } from '@/components/AgentResizer'
import { useAuth } from '@/lib/auth'

const AGENT_KEY = 'agent-width'

/** Width of the docked Investigate and Ask panel on desktop: draggable, remembered per browser. */
function useAgentWidth() {
  const [width, setWidth] = useState(() => {
    try {
      const v = Number(localStorage.getItem(AGENT_KEY))
      return v >= AGENT_MIN && v <= AGENT_MAX ? v : AGENT_DEFAULT
    } catch {
      return AGENT_DEFAULT
    }
  })
  const change = useCallback((px: number) => {
    const next = Math.round(Math.min(AGENT_MAX, Math.max(AGENT_MIN, px)))
    setWidth(next)
    try {
      localStorage.setItem(AGENT_KEY, String(next))
    } catch {
      /* works without storage */
    }
  }, [])
  return [width, change] as const
}

export default function App() {
  const { can } = useAuth()
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [tab, setTab] = useState<Tab>('explore')
  const [view, setView] = useState<View>('map')
  const showUsers = view === 'users' && can('manage_users')
  const [agentWidth, setAgentWidth] = useAgentWidth()

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar view={showUsers ? 'users' : 'map'} onView={setView} />
      <main className="relative min-w-0 flex-1" style={{ '--agent-w': `${agentWidth}px` } as CSSProperties}>
        {/* Kept mounted while the Users page is open, so the map and the agent's answer are still there on return. */}
        <div className={showUsers ? 'hidden' : 'contents'}>
          <Dashboard highlightIds={highlightIds} tab={tab} onTab={setTab}>
            {/* Mobile: only shown on the Investigate tab. Desktop: always shown. */}
            <div className={tab === 'ask' ? 'contents' : 'hidden desk:contents'}>
              <InvestigatePanel onHighlight={setHighlightIds} />
            </div>
          </Dashboard>
        </div>
        {showUsers ? <UsersAdmin /> : <AgentResizer width={agentWidth} onChange={setAgentWidth} />}
      </main>
    </div>
  )
}
