import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { gsap } from 'gsap'
import { mockChats } from '@/lib/mockChats'
import { Dashboard, type Tab } from '@/components/Dashboard'
import type { Area } from '@/lib/agent'
import { agentDefaultFor, agentMaxFor, AgentResizer } from '@/components/AgentResizer'
import { InvestigatePanel, type Turn } from '@/components/InvestigatePanel'
import { ModulesProvider } from '@/components/modules/ModulesProvider'
import { Sidebar, type SidebarIncident, type SidebarRecurrence, type SidebarSelection } from '@/components/Sidebar'

/** The agent panel's width on desktop: its maximum until the handle is dragged, then that width for this visit only (owner, 2026-11-16: nothing is saved, so every load starts at the maximum). */
const useAgentWidth = () => useState<number | null>(null)

export default function App() {
  const [agentW, setAgentW] = useAgentWidth()
  const [agentOff, setAgentOff] = useState(false) // the agent panel is collapsed to a 44 px rail (owner's try, 2026-11-08; the composer bar was tried first); the panel stays mounted, so the conversation stays
  const [vw, setVw] = useState(window.innerWidth)
  const [sidebarW, setSidebarW] = useState(0) // the sidebar's width right now (0 collapsed): the agent panel leaves the map at least 47 % of the viewport
  useEffect(() => {
    const on = () => {
      setVw(window.innerWidth)
      setSidebarW(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-now')) || 0)
    }
    on()
    window.addEventListener('resize', on)
    window.addEventListener('sidebar-now', on) // sent by Sidebar when it opens, closes or is resized
    return () => (window.removeEventListener('resize', on), window.removeEventListener('sidebar-now', on))
  }, [])
  const maxW = agentMaxFor(vw, sidebarW) // 920 at 1,600 px or below, 1,250 above 2,100, 1,100 between, and never so wide that the map is under 47 % of the viewport (owner, 2026-11-17)
  // The agent panel's width (`--agent-w` on <main>) moves with GSAP (owner, 2026-11-13): when the window or the sidebar change what it may be, it glides to the new width (0.3 s, power2.out, the sidebar's curve); while the handle is dragged it follows the pointer at once.
  const mainRef = useRef<HTMLElement>(null)
  const instant = useRef(true)
  const target = agentOff ? 56 : Math.min(maxW, agentW ?? agentDefaultFor(vw)) // no dragged width yet: it opens at 920, 1,000 or 1,100 by viewport every time the page loads (owner, 2026-11-17)
  useLayoutEffect(() => {
    const el = mainRef.current!
    const was = parseFloat(el.style.getPropertyValue('--agent-w'))
    if (instant.current || !was || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      instant.current = false
      gsap.killTweensOf(el)
      el.style.setProperty('--agent-w', `${target}px`)
      return
    }
    const root = document.documentElement
    root.dataset.resizing = '' // no CSS transition runs behind the tween (the map's chips and filters follow it every frame)
    gsap.to(el, { '--agent-w': `${target}px`, duration: 0.3, ease: 'power2.out', overwrite: true, onComplete: () => delete root.dataset.resizing })
  }, [target])
  const drag = (px: number | null) => { instant.current = px !== null; setAgentW(px) }
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [placesFor, setPlacesFor] = useState<string | null>(null) // the recurrence whose OpenStreetMap places the person asked the agent to draw on the map (owner, 2026-11-23)
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
    setAgentOff(false) // a conversation picked in the sidebar always opens the agent panel (owner, 2026-11-15)
    const last = chats.find((c) => c.id === id)?.turns.findLast((t) => t.result)?.result
    show(last?.highlightIds ?? [], last?.areas, last?.spots) // the map shows the answer of the last question of that conversation
  }
  const [landing, setLanding] = useState(0)
  const newInvestigation = () => { startChat(); setLanding((n) => n + 1) } // the New investigation row also closes the open recurrence or incident, so the panel shows "Welcome back"
  const startChat = () => {
    if (active.turns.length) {
      const id = Math.max(...chats.map((c) => c.id)) + 1
      setChats((cs) => [...cs, { id, turns: [] }])
      setActiveId(id)
    }
    setAgentOff(false) // Explore and a new investigation land on the agent's start, so the panel opens too
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
  const [mockTimes, setMockTimes] = useState<Record<number, { created: number; updated: number }>>({}) // when each mocked conversation started and last changed, for the Investigations sort
  const [loadedAt] = useState(() => Date.now()) // real conversations are newer than every mock one: loaded time + their number
  const seededWith = useRef<number | null>(null) // how many recurrences the mock conversations were built with; null = not built yet
  useEffect(() => {
    // Built as soon as the incidents are in (owner, 2026-11-17: the Incidents list waited for the slower recurrences and took very long), and built once more when the recurrences arrive, so the Recurrences list fills too.
    const n = rows.recurrences.length
    if (!rows.incidents.length || (seededWith.current !== null && (seededWith.current > 0 || n === 0))) return
    seededWith.current = n
    const mocks = mockChats(rows.recurrences, rows.incidents)
    const first = 1001
    const turnsOf = new Map(mocks.map((m, k) => [first + k, m.turns]))
    setChats((cs) => {
      const have = new Set(cs.map((c) => c.id))
      return [...cs.map((c) => (turnsOf.has(c.id) ? { ...c, turns: turnsOf.get(c.id)! } : c)), ...[...turnsOf].filter(([id]) => !have.has(id)).map(([id, turns]) => ({ id, turns }))]
    })
    setMockIds(Object.fromEntries(mocks.map((m, k) => [first + k, m.ids])))
    setMockTimes(Object.fromEntries(mocks.map((m, k) => [first + k, { created: m.created, updated: m.updated }])))
  }, [rows])
  // The sidebar always lists every conversation's items (owner, 2026-11-08: switching conversations must not change the lists); what was opened from the map belongs to the conversation that was open then.
  const idsOf = (c: { id: number; turns: Turn[] }) => [...new Set([...(mockIds[c.id] ?? []), ...(opened[c.id] ?? []), ...c.turns.flatMap((t) => t.result?.highlightIds ?? [])])]
  // A row of the sidebar opens the item on the map and its conversation in the agent panel (owner, 2026-11-08): the open conversation if it holds the item, else the newest one that does. Items no conversation holds leave the panel as it is.
  const open = (kind: 'recurrence' | 'incident') => (id: string) => {
    setAgentOff(false); setFocus((f) => ({ kind, id, n: (f?.n ?? 0) + 1 })) // its conversation is chosen by the effect below (recurrences and incidents alike), for a click on the map and in the menu
  }
  // A recurrence has its own conversation (owner, 2026-11-23): the one the person typed in while it was open, else a mocked or answered one that holds it; with none, the agent panel shows an empty conversation. Typing or continuing makes it ongoing: row 1 of the Recurrences list, the others pushed down; only opened and left alone it goes back to its place.
  const [convOf, setConvOf] = useState<Record<string, number>>({})
  const [ongoing, setOngoing] = useState<string[]>([])
  const histOf = (c: { id: number; turns: Turn[] }) => [...(mockIds[c.id] ?? []), ...c.turns.flatMap((t) => t.result?.highlightIds ?? [])]
  const holderOf = (id: string) => (convOf[id] !== undefined && chats.some((c) => c.id === convOf[id]) ? convOf[id] : [...chats].reverse().find((c) => histOf(c).includes(id))?.id)
  useEffect(() => {
    if (!selection) return
    const h = holderOf(selection.id)
    // Only the conversation changes: `pick` would also put that conversation's last answer on the map (its incidents), and the open recurrence would turn into highlighted incidents (owner, 2026-11-24)
    if (h === undefined) { if (active.turns.length) startChat() } else if (h !== activeId) { setChats((cs) => cs.filter((c) => c.id === h || c.turns.length)); setActiveId(h); setAgentOff(false) }
  }, [selection?.kind, selection?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const typed = (id: number, edit: (t: Turn[]) => Turn[]) => {
    editTurns(id, edit)
    if (selection) { const rid = selection.id; setConvOf((m) => ({ ...m, [rid]: id })); setOngoing((o) => [rid, ...o.filter((x) => x !== rid)]) }
  }
  const chatItems = [
    ...chats
      .map((c) => ({ title: c.turns[0]?.question ?? 'Opened on the map', ids: idsOf(c) }))
      .filter((c) => c.ids.length),
  ]
  const [inspecting, setInspecting] = useState(false) // an incident or problem is open: the sidebar collapses (the 360 px panel overlays the map, which keeps its size; see Dashboard)

  return (
    <ModulesProvider>
    <div className="flex h-svh overflow-hidden bg-(image:--screen-gradient)">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-card focus:px-3 focus:py-2 focus:text-body-sm focus:text-foreground focus:outline focus:outline-2 focus:outline-ring">
        Skip to main content
      </a>
      {/* Flush layout (owner, 2026-10-30): no screen padding, no gaps, square panels divided by a right-side line. */}
      <Sidebar pinnedIds={new Set(Object.values(mockIds).flat())} ongoingIds={ongoing} agentOff={agentOff} onToggleAgent={() => setAgentOff((o) => !o)} chatItems={chatItems} recurrences={rows.recurrences} incidents={rows.incidents} onOpenRecurrence={open('recurrence')} onOpenIncident={open('incident')} selected={selection} chats={[...chats].reverse().filter((c) => c.turns.length).map((c) => ({ id: c.id, title: c.turns[0].question, ...(mockTimes[c.id] ?? { created: loadedAt + c.id, updated: loadedAt + c.id }) }))} activeId={active.id} exploring={active.turns.length === 0} onPick={pick} onNew={newInvestigation} cases={cases} onNewCase={newCase} />
      {/* The agent panel is always 30 % of the browser window width (30vw), no minimum or maximum (owner, 2026-11-08; it was clamp(550px, 38%, 680px), which kept the cards and the composer from breaking on narrow windows). */}
      <main ref={mainRef} id="main-content" tabIndex={-1} className="relative min-w-0 flex-1" style={{ '--map-left': `calc(var(--agent-w) + var(--panel-gap)${inspecting ? ' + 360px + var(--panel-gap)' : ''})` } as CSSProperties}>
        {!agentOff && <AgentResizer max={maxW} onChange={drag} />}
        {/* The map is always the page; the sidebar's conversations only change what the Investigate and Ask panel shows. (The Users page has no entry in the menu for now.) */}
        <div className="contents">
          <Dashboard closeCase={landing} placesFor={placesFor} highlightIds={highlightIds} areas={areas} spots={spots} focusCode={focusCode} zoomTo={zoomTo} onZoomLocality={zoomArea} onClearHighlight={() => show([])} tab={tab} onTab={setTab} onInspect={setInspecting} agentOff={agentOff} onAgentOff={setAgentOff} focus={focus} onRows={setRows} onSelection={setSelection}>
            {/* Phone: only shown on the Investigate tab. Tablet (owner, 2026-11-15) and desktop: always shown; on tablet it is the bottom sheet, collapsible with the sheet's chevron. */}
            <div className={tab === 'ask' ? 'contents' : 'hidden md:max-desk:contents desk:contents'}>
              <InvestigatePanel placesFor={placesFor} onPlaces={setPlacesFor} onCollapse={() => setAgentOff(true)} chatId={active.id} turns={active.turns} onTurns={typed} onHighlight={show} highlightIds={highlightIds} onFocusArea={setFocusCode} onZoomArea={zoomArea} recurrenceId={selection?.kind === 'recurrence' ? selection.id : null} recurrence={selection?.kind === 'recurrence' ? rows.recurrences.find((r) => r.id === selection.id) ?? null : null} emptyFor={selection?.kind ?? null} onOpenRecurrence={open('recurrence')} />
            </div>
          </Dashboard>
        </div>
      </main>
    </div>
    </ModulesProvider>
  )
}
