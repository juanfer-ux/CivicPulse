import { useState, type ReactNode } from 'react'
import { ArrowUp, CaretDown, CaretLeft, ChatCircle, Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/**
 * Ways to collapse the agent panel and bring it back (owner, 2026-11-08). Dev-only gallery at /#agent-collapse: every mini screen is live, click the buttons to collapse and expand it. Scaled-down mock (sidebar, agent panel, map with stat cards); nothing here changes the app.
 */

const SIDEBAR = 56 // px: sidebar width in the mock
const PANEL = 210 // px: agent panel width in the mock

const Frame = ({ name, note, children }: { name: string; note: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div>
      <p className="text-label">{name}</p>
      <p className="text-meta text-muted-foreground">{note}</p>
    </div>
    {children}
  </div>
)

/** The mock screen: map gradient with dots, the sidebar, and the stat cards, which start `left` px from the edge so you can see whether the map is pushed or covered. */
const Screen = ({ left, children }: { left: number; children: ReactNode }) => (
  <div className="relative h-[320px] overflow-hidden rounded-lg border-[0.5px] border-(--neutral-500)" style={{ background: 'var(--screen-gradient)' }}>
    {[[52, 40], [64, 62], [40, 72], [78, 30], [88, 66]].map(([x, y]) => (
      <span key={`${x}${y}`} className="absolute size-2 rounded-full bg-(--yellow-300)" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden />
    ))}
    <div className="absolute top-2 bottom-2 left-2 rounded-lg bg-(--neutral-700)" style={{ width: SIDEBAR - 8 }} aria-hidden />
    <div className="absolute top-2 right-2 flex gap-2 transition-[left] duration-300" style={{ left: left + 8 }} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-10 flex-1 rounded-sm bg-(--neutral-800)" />
      ))}
    </div>
    {children}
  </div>
)

/** The panel itself: header with the collapse button, a short conversation, the composer. */
const Panel = ({ onCollapse, icon = <CaretLeft />, label = 'Collapse agent' }: { onCollapse: () => void; icon?: ReactNode; label?: string }) => (
  <div className="flex h-full flex-col gap-2 p-3">
    <div className="flex items-center justify-between">
      <p className="text-caption-medium text-(--neutral-200)">Agent</p>
      <Button size="icon" variant="ghost" aria-label={label} onClick={onCollapse} className="size-6">
        {icon}
      </Button>
    </div>
    <div className="ml-auto h-6 w-3/4 rounded-sm bg-(--neutral-500)" />
    <div className="h-14 w-full rounded-sm bg-(--neutral-700)" />
    <div className="mt-auto h-8 rounded-sm bg-(--neutral-700)" />
  </div>
)

const panelBox = 'absolute top-2 bottom-2 overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--neutral-900)_90%,transparent)] backdrop-blur-[32px] transition-[width,opacity,transform] duration-300'

/** 2: a narrow rail next to the sidebar that stays visible. */
function Rail() {
  const [open, setOpen] = useState(true)
  const w = open ? PANEL : 44
  return (
    <Screen left={SIDEBAR + w}>
      <div className={panelBox} style={{ left: SIDEBAR, width: w }}>
        {open ? (
          <Panel onCollapse={() => setOpen(false)} />
        ) : (
          <button type="button" aria-label="Open agent" onClick={() => setOpen(true)} className="flex h-full w-full flex-col items-center gap-3 py-3 text-(--neutral-200) hover:text-(--neutral-100)">
            <Sparkle className="size-4" />
            <span className="relative">
              <ChatCircle className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-(--indigo-300)" aria-hidden />
            </span>
            <span className="text-caption [writing-mode:vertical-rl]">Ask the agent</span>
          </button>
        )}
      </div>
    </Screen>
  )
}

/** 3: a round launcher floating over the map, bottom left; the panel opens as a floating card. */
function Launcher() {
  const [open, setOpen] = useState(true)
  return (
    <Screen left={open ? SIDEBAR + PANEL : SIDEBAR}>
      <div className={panelBox} style={{ left: SIDEBAR, width: PANEL, opacity: open ? 1 : 0, transform: open ? 'none' : 'translateY(16px) scale(0.96)', pointerEvents: open ? 'auto' : 'none' }}>
        <Panel onCollapse={() => setOpen(false)} icon={<CaretDown />} label="Minimize agent" />
      </div>
      {!open && (
        <button type="button" aria-label="Open agent" onClick={() => setOpen(true)} className="absolute bottom-4 grid size-11 place-items-center rounded-full bg-(--neutral-900) text-(--neutral-100) shadow-lg" style={{ left: SIDEBAR + 8 }}>
          <Sparkle weight="fill" className="size-5" />
          <span className="absolute top-0 right-0 size-2.5 rounded-full bg-(--indigo-300)" aria-hidden />
        </button>
      )}
    </Screen>
  )
}

/** 4: collapses to just the composer, a pill at the bottom; typing or clicking opens the whole conversation. */
function ComposerBar() {
  const [open, setOpen] = useState(true)
  return (
    <Screen left={open ? SIDEBAR + PANEL : SIDEBAR}>
      <div className={panelBox} style={{ left: SIDEBAR, width: PANEL, opacity: open ? 1 : 0, transform: open ? 'none' : 'translateY(24px)', pointerEvents: open ? 'auto' : 'none' }}>
        <Panel onCollapse={() => setOpen(false)} icon={<CaretDown />} label="Minimize agent" />
      </div>
      {!open && (
        <button type="button" aria-label="Open agent" onClick={() => setOpen(true)} className="absolute bottom-3 flex h-10 w-[260px] items-center justify-between rounded-full bg-(--neutral-900) pr-1.5 pl-4 text-left text-body-sm text-(--neutral-300)" style={{ left: SIDEBAR + 8 }}>
          What do you want to investigate?
          <span className="grid size-7 place-items-center rounded-full bg-(--neutral-600) text-(--neutral-100)">
            <ArrowUp className="size-3.5" />
          </span>
        </button>
      )}
    </Screen>
  )
}

export function AgentCollapseGallery() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 p-8">
      <header>
        <h1 className="text-heading">Collapsing the agent panel</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">Three ways to hide the agent panel and bring it back. Every mini screen is live: use the chevron in the panel to collapse it, then use whatever it leaves behind to open it again. The panel never covers the map: the stat cards slide aside when it opens and back when it collapses. The same shortcut (Cmd+J) would toggle it in all of them.</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-2">
        <Frame name="2 · Rail" note="Collapsed: a 44 px rail stays next to the sidebar with the agent icon, an unread dot and a vertical label. Always visible, costs 44 px.">
          <Rail />
        </Frame>
        <Frame name="3 · Launcher bubble" note="Collapsed: a round button bottom left over the map, with a dot when an answer is waiting. The panel comes back and pushes the cards aside. Familiar from chat widgets.">
          <Launcher />
        </Frame>
        <Frame name="4 · Composer bar" note="Collapsed: only the question box stays at the bottom of the map. Click or type to open the whole conversation. Keeps asking one tap away.">
          <ComposerBar />
        </Frame>
      </div>
    </main>
  )
}
