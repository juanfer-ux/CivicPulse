import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useNoSelect } from '@/lib/useNoSelect'

/** The agent panel's minimum from the owner's Figma (Agent Panel: min 650) plus the 12 px that `--agent-w` adds to the panel. The maximum is half the width left beside the sidebar at that moment (owner, 2026-11-12: X / 2 with X = the window minus the sidebar; it replaces Figma's 760), never below the minimum. */
export const AGENT_MIN = 662
export const agentMax = (areaW: number) => Math.max(AGENT_MIN, Math.round(areaW / 2))

/** Drag handle INSIDE the agent panel, along its right edge (owner, 2026-11-12: never outside it; desktop only), in the same `relative` parent as the panel. Reports `--agent-w` in px, always inside the Figma limits; double-click goes back to the automatic width. */
export function AgentResizer({ max, onChange }: { max: number; onChange: (px: number | null) => void }) {
  const [dragging, setDragging] = useState(false)
  const [now, setNow] = useState(0)
  useNoSelect(dragging)
  const ref = useRef<HTMLDivElement>(null)
  const clamp = (px: number) => Math.round(Math.min(max, Math.max(AGENT_MIN, px)))
  const left = () => ref.current!.parentElement!.getBoundingClientRect().left
  const set = (px: number) => { const v = clamp(px); setNow(v); onChange(v) }
  const current = () => { const r = ref.current!.getBoundingClientRect(); return r.right - left() }

  const down = (e: PointerEvent<HTMLDivElement>) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true) }
  const move = (e: PointerEvent<HTMLDivElement>) => { if (dragging) set(e.clientX - left()) }
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
      style={{ left: 'var(--agent-w)' }}
      className="group absolute inset-y-0 z-30 hidden w-3 -translate-x-full cursor-col-resize touch-none select-none outline-none desk:block"
    >
      <div className={`ml-auto h-full w-0.5 transition-colors group-hover:bg-(--neutral-300) group-focus-visible:bg-(--neutral-300) ${dragging ? 'bg-(--neutral-300)' : 'bg-transparent'}`} />
    </div>
  )
}
