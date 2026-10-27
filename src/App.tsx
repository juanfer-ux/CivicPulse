import { useCallback, useState, type CSSProperties } from 'react'
import { Dashboard, type Tab } from '@/components/Dashboard'
import type { Area } from '@/lib/agent'
import { InvestigatePanel } from '@/components/InvestigatePanel'
import { UsersAdmin } from '@/components/UsersAdmin'
import { Sidebar, type View } from '@/components/Sidebar'
import { AGENT_DEFAULT, AgentResizer, agentWidthCss } from '@/components/AgentResizer'
import { useAuth } from '@/lib/auth'

const AGENT_KEY = 'agent-width-share'

/** Width of the docked Investigate and Ask panel on desktop, as a share of the space next to the sidebar: draggable, remembered per browser. */
function useAgentWidth() {
  const [width, setWidth] = useState(() => {
    try {
      const v = Number(localStorage.getItem(AGENT_KEY))
      return v > 0.1 && v < 0.9 ? v : AGENT_DEFAULT
    } catch {
      return AGENT_DEFAULT
    }
  })
  const change = useCallback((share: number) => {
    setWidth(share)
    try {
      localStorage.setItem(AGENT_KEY, String(share))
    } catch {
      /* works without storage */
    }
  }, [])
  return [width, change] as const
}

export default function App() {
  const { can } = useAuth()
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const show = (ids: string[], a: Area[] = []) => {
    setHighlightIds(ids)
    setAreas(a)
  }
  const [focusCode, setFocusCode] = useState<number | null>(null) // a bar of the answer is under the pointer: its locality lights up on the map
  const [zoomTo, setZoomTo] = useState<{ code: number; n: number } | null>(null) // a bar was clicked: the map zooms to that locality (n makes a second click on the same bar count)
  const [tab, setTab] = useState<Tab>('explore')
  const [view, setView] = useState<View>('map')
  const showUsers = view === 'users' && can('manage_users')
  const [agentWidth, setAgentWidth] = useAgentWidth()

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar view={showUsers ? 'users' : 'map'} onView={setView} />
      <main className="relative min-w-0 flex-1" style={{ '--agent-w': agentWidthCss(agentWidth) } as CSSProperties}>
        {/* Kept mounted while the Users page is open, so the map and the agent's answer are still there on return. */}
        <div className={showUsers ? 'hidden' : 'contents'}>
          <Dashboard highlightIds={highlightIds} areas={areas} focusCode={focusCode} zoomTo={zoomTo} onClearHighlight={() => show([])} tab={tab} onTab={setTab}>
            {/* Mobile: only shown on the Investigate tab. Desktop: always shown. */}
            <div className={tab === 'ask' ? 'contents' : 'hidden desk:contents'}>
              <InvestigatePanel onHighlight={show} highlightIds={highlightIds} onFocusArea={setFocusCode} onZoomArea={(code) => setZoomTo((z) => ({ code, n: (z?.n ?? 0) + 1 }))} />
            </div>
          </Dashboard>
        </div>
        {showUsers ? <UsersAdmin /> : <AgentResizer frac={agentWidth} onChange={setAgentWidth} />}
      </main>
    </div>
  )
}
