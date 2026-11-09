import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { mockChats } from '@/lib/mockChats'
import { Dashboard, type Tab } from '@/components/Dashboard'
import type { Area } from '@/lib/agent'
import { InvestigatePanel, type Turn } from '@/components/InvestigatePanel'
import { Sidebar, type SidebarIncident, type SidebarRecurrence, type SidebarSelection } from '@/components/Sidebar'

export default function App() {
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [spots, setSpots] = useState<string[][]>([]) // the answer is about specific spots (the incident ids of each): one radius around each, no locality outlines
  const show = (ids: string[], a: Area[] = [], s: string[][] = []) => {
    setHighlightIds(ids)
    setAreas(a)
    setSpots(s)
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
    show(last?.highlightIds ?? [], last?.areas, last?.spots) // the map shows the answer of the last question of that conversation
  }
  const startChat = () => {
    if (active.turns.length) {
      const id = Math.max(...chats.map((c) => c.id)) + 1
      setChats((cs) => [...cs, { id, turns: [] }])
      setActiveId(id)
    }
    show([])
  }
  // Recurrences (sidebar): the plus adds one to the list; there is no page for it yet.
  const [cases, setCases] = useState<{ id: number; title: string }[]>([])
  const newCase = () => setCases((cs) => [{ id: (cs[0]?.id ?? 0) + 1, title: `New recurrence ${(cs[0]?.id ?? 0) + 1}` }, ...cs])
  const zoomArea = (code: number) => setZoomTo((z) => ({ code, n: (z?.n ?? 0) + 1 }))
  const [tab, setTab] = useState<Tab>('explore')
  const [rows, setRows] = useState<{ recurrences: SidebarRecurrence[]; incidents: SidebarIncident[] }>({ recurrences: [], incidents: [] })
  const [selection, setSelection] = useState<SidebarSelection | null>(null)
  const [focus, setFocus] = useState<{ kind: 'recurrence' | 'incident'; id: string; n: number } | null>(null)
  // What each conversation touched (owner, 2026-11-08): the incidents behind its answers, plus whatever was opened from the map or the menu. The sidebar lists only these.
  const [opened, setOpened] = useState<Record<number, string[]>>({}) // opened from the map or the menu, kept with the conversation that was open at the time
  useEffect(() => {
    if (selection && !(opened[active.id] ?? []).includes(selection.id)) setOpened((o) => ({ ...o, [active.id]: [...(o[active.id] ?? []), selection.id] })) // eslint-disable-line react-hooks/set-state-in-effect
  }, [selection, opened, active.id])
  // The mocked conversations for the demo (src/lib/mockChats.ts): seeded once the rows are loaded, so clicking one opens a real conversation in the agent panel.
  const [mockIds, setMockIds] = useState<Record<number, string[]>>({})
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !rows.incidents.length) return
    seeded.current = true
    const mocks = mockChats(rows.recurrences, rows.incidents)
    const first = 1001
    setChats((cs) => [...cs, ...mocks.map((m, k) => ({ id: first + k, turns: m.turns }))])
    setMockIds(Object.fromEntries(mocks.map((m, k) => [first + k, m.ids])))
  }, [rows])
  // The sidebar always lists every conversation's items (owner, 2026-11-08: switching conversations must not change the lists); what was opened from the map belongs to the conversation that was open then.
  const idsOf = (c: { id: number; turns: Turn[] }) => [...new Set([...(mockIds[c.id] ?? []), ...(opened[c.id] ?? []), ...c.turns.flatMap((t) => t.result?.highlightIds ?? [])])]
  // A row of the sidebar opens the item on the map and its conversation in the agent panel (owner, 2026-11-08): the open conversation if it holds the item, else the newest one that does. Items no conversation holds leave the panel as it is.
  const open = (kind: 'recurrence' | 'incident') => (id: string) => {
    const holder = idsOf(active).includes(id) ? active : [...chats].reverse().find((c) => idsOf(c).includes(id))
    if (holder && holder.id !== active.id) pick(holder.id)
    setFocus((f) => ({ kind, id, n: (f?.n ?? 0) + 1 }))
  }
  const chatItems = [
    ...chats
      .map((c) => ({ title: c.turns[0]?.question ?? 'Opened on the map', ids: idsOf(c) }))
      .filter((c) => c.ids.length),
  ]
  const [agentOff, setAgentOff] = useState(false) // the agent panel is collapsed to a 44 px rail (owner's try, 2026-11-08; the composer bar was tried first); the panel stays mounted, so the conversation stays
  const [inspecting, setInspecting] = useState(false) // an incident or problem is open: the sidebar collapses (the 360 px panel overlays the map, which keeps its size; see Dashboard)

  return (
    <div className="flex h-svh overflow-hidden bg-(image:--screen-gradient)">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-card focus:px-3 focus:py-2 focus:text-body-sm focus:text-foreground focus:outline focus:outline-2 focus:outline-ring">
        Skip to main content
      </a>
      {/* Flush layout (owner, 2026-10-30): no screen padding, no gaps, square panels divided by a right-side line. */}
      <Sidebar collapse={inspecting} chatItems={chatItems} recurrences={rows.recurrences} incidents={rows.incidents} onOpenRecurrence={open('recurrence')} onOpenIncident={open('incident')} selected={selection} chats={[...chats].reverse().map((c) => ({ id: c.id, title: c.turns[0]?.question ?? 'New investigation' }))} activeId={active.id} exploring={active.turns.length === 0} onPick={pick} onNew={startChat} cases={cases} onNewCase={newCase} />
      {/* The agent panel is always 30 % of the browser window width (30vw), no minimum or maximum (owner, 2026-11-08; it was clamp(550px, 38%, 680px), which kept the cards and the composer from breaking on narrow windows). */}
      <main id="main-content" tabIndex={-1} className="relative min-w-0 flex-1" style={{ '--agent-w': agentOff ? '56px' : 'min(30vw, 590px)', '--map-left': `calc(var(--agent-w) + var(--panel-gap)${inspecting ? ' + 360px + var(--panel-gap)' : ''})` } as CSSProperties}>
        {/* The map is always the page; the sidebar's conversations only change what the Investigate and Ask panel shows. (The Users page has no entry in the menu for now.) */}
        <div className="contents">
          <Dashboard highlightIds={highlightIds} areas={areas} spots={spots} focusCode={focusCode} zoomTo={zoomTo} onZoomLocality={zoomArea} onClearHighlight={() => show([])} tab={tab} onTab={setTab} onInspect={setInspecting} agentOff={agentOff} onAgentOff={setAgentOff} focus={focus} onRows={setRows} onSelection={setSelection}>
            {/* Mobile: only shown on the Investigate tab. Desktop: always shown. */}
            <div className={tab === 'ask' ? 'contents' : 'hidden desk:contents'}>
              <InvestigatePanel chatId={active.id} turns={active.turns} onTurns={editTurns} onHighlight={show} highlightIds={highlightIds} onFocusArea={setFocusCode} onZoomArea={zoomArea} />
            </div>
          </Dashboard>
        </div>
      </main>
    </div>
  )
}
