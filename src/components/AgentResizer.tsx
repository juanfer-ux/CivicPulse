import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useNoSelect } from '@/lib/useNoSelect'

/** The agent panel's minimum from the owner's Figma (Agent Panel: min 600, it was 650 until 2026-11-13) plus the 12 px that `--agent-w` adds to the panel. The maximum puts the panel's right edge at the exact middle of the window (owner, 2026-11-13), see `agentMax`; never below the minimum. FINAL (owner, 2026-11-13): do not change this rule again. */
export const AGENT_MIN = 612
const EDGE = 0 // px between the handle and the panel's visible right edge, inside its padding (owner, 2026-11-13)
/** The panel you see ends at the middle of the window: half the window minus the sidebar's width at that moment (the sidebar's 12 px margin and the panel's 12 px gap cancel out). */
export const agentMax = (windowW: number, sidebarW: number) => Math.max(AGENT_MIN, Math.round(windowW / 2 - sidebarW))

/** Drag handle INSIDE the agent panel, along its right edge (owner, 2026-11-12: never outside it; desktop only), in the same `relative` parent as the panel. Reports `--agent-w` in px, always inside the Figma limits; double-click goes back to the automatic width. */
export function AgentResizer({ max, onChange }: { max: number; onChange: (px: number | null) => void }) {
  const [dragging, setDragging] = useState(false)
  const [now, setNow] = useState(0)
  useNoSelect(dragging)
  const ref = useRef<HTMLDivElement>(null)
  const clamp = (px: number) => Math.round(Math.min(max, Math.max(AGENT_MIN, px)))
  const left = () => ref.current!.parentElement!.getBoundingClientRect().left
  const pad = () => parseFloat(getComputedStyle(ref.current!).getPropertyValue('--page-pad')) || 0 // the panel's visible right edge is this far inside `--agent-w`
  const set = (px: number) => { const v = clamp(px); setNow(v); onChange(v) }
  const current = () => ref.current!.getBoundingClientRect().right - left() + pad() + EDGE

  const down = (e: PointerEvent<HTMLDivElement>) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true) }
  const move = (e: PointerEvent<HTMLDivElement>) => { if (dragging) set(e.clientX - left() + pad() + EDGE) }
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
      style={{ left: `calc(var(--agent-w) - var(--page-pad) - ${EDGE}px)` }}
      className="group absolute inset-y-0 z-40 hidden w-3 -translate-x-full cursor-col-resize touch-none select-none outline-none desk:block"
    >
      <div className={`ml-auto h-full w-0.5 transition-colors group-hover:bg-ai-border group-focus-visible:bg-ai-border ${dragging ? 'bg-ai-border' : 'bg-transparent'}`} />
    </div>
  )
}
