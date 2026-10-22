import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

export const AGENT_MIN = 360
export const AGENT_MAX = 800
export const AGENT_DEFAULT = 543.5

/** Drag handle on the right edge of the docked agent panel (desktop only). Lives in the same `relative` parent as the panel; `width` is the panel width in px. */
export function AgentResizer({ width, onChange }: { width: number; onChange: (px: number) => void }) {
  const [dragging, setDragging] = useState(false)
  const origin = useRef(0)
  const active = useRef(false) // read by the move handler without waiting for a re-render

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    origin.current = e.currentTarget.parentElement!.getBoundingClientRect().left
    active.current = true
    setDragging(true)
  }
  const stop = () => {
    active.current = false
    setDragging(false)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current) onChange(e.clientX - origin.current)
  }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') onChange(width - 16)
    else if (e.key === 'ArrowRight') onChange(width + 16)
    else if (e.key === 'Home') onChange(AGENT_MIN)
    else if (e.key === 'End') onChange(AGENT_MAX)
    else return
    e.preventDefault()
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize Investigate and Ask"
      aria-valuenow={Math.round(width)}
      aria-valuemin={AGENT_MIN}
      aria-valuemax={AGENT_MAX}
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={key}
      onDoubleClick={() => onChange(AGENT_DEFAULT)}
      style={{ left: 'var(--agent-w)' }}
      className="group absolute inset-y-0 z-30 hidden w-3 -translate-x-1/2 cursor-col-resize touch-none select-none outline-none desk:block"
    >
      {/* The visible line: thin at rest, ai-border blue on hover, drag or keyboard focus. */}
      <div className={`mx-auto h-full w-0.5 transition-colors group-hover:bg-ai-border group-focus-visible:bg-ai-border ${dragging ? 'bg-ai-border' : 'bg-transparent'}`} />
    </div>
  )
}
