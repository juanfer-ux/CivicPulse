import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useNoSelect } from '@/lib/useNoSelect'

/** The agent panel's minimum from the owner's Figma (Agent Panel: min 600, it was 650 until 2026-11-13); `--agent-w` is the panel's visible width since the 12 px page padding around it was removed (owner, 2026-11-15; it was 612 for 600 visible). The maximum puts the panel's right edge at the exact middle of the window (owner, 2026-11-13), see `agentMax`; never below the minimum. FINAL (owner, 2026-11-13): do not change this rule again. */
export const AGENT_MIN = 900 // the whole panel, the 70 px rail included (owner, 2026-11-17; it was 600, Figma's number; 720 was tried and rolled back the same day)
const EDGE = 0 // px between the handle and the panel's visible right edge, inside its padding (owner, 2026-11-13)
/** The panel you see ends at the middle of the window: half the window minus the sidebar's width at that moment (the sidebar's 12 px margin and the panel's 12 px gap cancel out). */
export const AGENT_MAX = 1100 // the most the handle can drag it to (owner, 2026-11-17; 920, 880 and the middle of the window before)
/** The width the panel opens at on every load, landing and map, for a viewport this wide (owner, 2026-11-17): 920 at 1,600 px or below, 1,000 from 1,601 to 2,100, 1,100 above 2,100. Nothing is saved between visits; dragging the handle changes it until the next load. */
export const agentDefaultFor = (viewportW: number) => (viewportW <= 1600 ? 920 : viewportW > 2100 ? 1100 : 1000)
export const NARROW_VIEWPORT = '(max-width: 1600px)' // at 1,600 px or below (owner, 2026-11-17) the maximum is 920 and the sidebar steps aside while the filters are open
export const AGENT_MAX_NARROW = 920
export const AGENT_MAX_WIDE = 1250 // above 2,100 px (owner, 2026-11-17; it was 1,920 for a few minutes)
/** The most the agent panel may be for a viewport this wide: 920 at 1,600 px or below, 1,250 above 2,100, 1,100 between (owner, 2026-11-17). */
const byViewport = (viewportW: number) => (viewportW <= 1600 ? AGENT_MAX_NARROW : viewportW > 2100 ? AGENT_MAX_WIDE : AGENT_MAX)
export const MAP_MIN_SHARE = 0.47 // the map area (everything to the right of the agent panel) is at least 47 % of the viewport at every size (owner, 2026-11-17)
export const AGENT_FLOOR = AGENT_MIN // the panel never goes under its minimum (900); where that leaves the map under 47 % the minimum wins and the sidebar has to give way
/** The most the agent panel may be: the table by viewport, but never so wide that the map area drops under 47 % of the viewport (`sidebarW` is the sidebar's width right now, 0 collapsed). */
export const agentMaxFor = (viewportW: number, sidebarW = 0) => Math.min(byViewport(viewportW), Math.max(AGENT_FLOOR, Math.floor(viewportW * (1 - MAP_MIN_SHARE) - sidebarW)))

/** Drag handle INSIDE the agent panel, along its right edge (owner, 2026-11-12: never outside it; desktop only), in the same `relative` parent as the panel. Reports `--agent-w` in px, always inside the Figma limits; double-click goes back to the automatic width. */
export function AgentResizer({ max, onChange }: { max: number; onChange: (px: number | null) => void }) {
  const [dragging, setDragging] = useState(false)
  const [now, setNow] = useState(0)
  useNoSelect(dragging)
  const ref = useRef<HTMLDivElement>(null)
  const clamp = (px: number) => Math.round(Math.min(max, Math.max(AGENT_MIN, px)))
  const left = () => ref.current!.parentElement!.getBoundingClientRect().left
  const set = (px: number) => { const v = clamp(px); setNow(v); onChange(v) }
  const current = () => ref.current!.getBoundingClientRect().right - left() + EDGE

  const down = (e: PointerEvent<HTMLDivElement>) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true) }
  const move = (e: PointerEvent<HTMLDivElement>) => { if (dragging) set(e.clientX - left() + EDGE) }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') set(current() - 16)
    else if (e.key === 'ArrowRight') set(current() + 16)
    else if (e.key === 'Home') set(AGENT_MIN)
    else if (e.key === 'End') set(max)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the agent panel"
      aria-valuenow={now || undefined}
      aria-valuemin={AGENT_MIN}
      aria-valuemax={max}
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={key}
      onDoubleClick={() => { setNow(0); onChange(null) }}
      style={{ left: `calc(var(--agent-w) - ${EDGE}px)` }}
      className="group absolute inset-y-0 z-40 hidden w-3 -translate-x-full cursor-col-resize touch-none select-none outline-none desk:block"
    >
      <div className={`ml-auto h-full w-0.5 transition-colors group-hover:bg-ai-border group-focus-visible:bg-ai-border ${dragging ? 'bg-ai-border' : 'bg-transparent'}`} />
    </div>
  )
}
