import { useCallback, useState, type CSSProperties } from 'react'
import { Dashboard, type Tab } from '@/components/Dashboard'
import type { Area } from '@/lib/agent'
import { InvestigatePanel, type Turn } from '@/components/InvestigatePanel'
import { Sidebar } from '@/components/Sidebar'
import { AGENT_DEFAULT, AgentResizer, agentWidthCss } from '@/components/AgentResizer'

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
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const show = (ids: string[], a: Area[] = []) => {
    setHighlightIds(ids)
    setAreas(a)
  }
  const [focusCode, setFocusCode] = useState<number | null>(null) // a bar of the answer is under the pointer: its locality lights up on the map
  const [zoomTo, setZoomTo] = useState<{ code: number; n: number } | null>(null) // a bar was clicked: the map zooms to that locality (n makes a second click on the same bar count)
  // The conversations with Investigate and Ask (the sidebar's Investigations): each keeps its own questions and answers. They live in memory, like the single conversation did before.
  const [chats, setChats] = useState<{ id: number; turns: Turn[] }[]>([{ id: 1, turns: [] }])
  const [activeId, setActiveId] = useState(1)
  const active = chats.find((c) => c.id === activeId) ?? chats[0]
  const editTurns = (id: number, edit: (t: Turn[]) => Turn[]) => setChats((cs) => cs.map((c) => (c.id === id ? { ...c, turns: edit(c.turns) } : c)))
  const pick = (id: number) => {
    setChats((cs) => cs.filter((c) => c.id === id || c.turns.length)) // an empty new investigation you leave is dropped
    setActiveId(id)
    const last = chats.find((c) => c.id === id)?.turns.findLast((t) => t.result)?.result
    show(last?.highlightIds ?? [], last?.areas) // the map shows the answer of the last question of that conversation
  }
  const startChat = () => {
    if (active.turns.length) {
      const id = Math.max(...chats.map((c) => c.id)) + 1
      setChats((cs) => [...cs, { id, turns: [] }])
      setActiveId(id)
    }
    show([])
  }
  // Cases (sidebar): the plus adds a case to the list; there is no case page yet.
  const [cases, setCases] = useState<{ id: number; title: string }[]>([])
  const newCase = () => setCases((cs) => [{ id: (cs[0]?.id ?? 0) + 1, title: `New case ${(cs[0]?.id ?? 0) + 1}` }, ...cs])
  const zoomArea = (code: number) => setZoomTo((z) => ({ code, n: (z?.n ?? 0) + 1 }))
  const [tab, setTab] = useState<Tab>('explore')
  const [agentWidth, setAgentWidth] = useAgentWidth()

  return (
    <div className="flex h-svh overflow-hidden bg-background desk:p-3">
      <Sidebar chats={[...chats].reverse().map((c) => ({ id: c.id, title: c.turns[0]?.question ?? 'New investigation' }))} activeId={active.id} onPick={pick} onNew={startChat} cases={cases} onNewCase={newCase} />
      <main className="relative min-w-0 flex-1" style={{ '--agent-w': agentWidthCss(agentWidth) } as CSSProperties}>
        {/* The map is always the page; the sidebar's conversations only change what the Investigate and Ask panel shows. (The Users page has no entry in the menu for now.) */}
        <div className="contents">
          <Dashboard highlightIds={highlightIds} areas={areas} focusCode={focusCode} zoomTo={zoomTo} onZoomLocality={zoomArea} onClearHighlight={() => show([])} tab={tab} onTab={setTab}>
            {/* Mobile: only shown on the Investigate tab. Desktop: always shown. */}
            <div className={tab === 'ask' ? 'contents' : 'hidden desk:contents'}>
              <InvestigatePanel chatId={active.id} turns={active.turns} onTurns={editTurns} onHighlight={show} highlightIds={highlightIds} onFocusArea={setFocusCode} onZoomArea={zoomArea} />
            </div>
          </Dashboard>
        </div>
        <AgentResizer frac={agentWidth} onChange={setAgentWidth} />
      </main>
    </div>
  )
}
