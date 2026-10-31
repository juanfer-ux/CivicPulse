import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

export const AGENT_MIN = 550
export const AGENT_MAX = 800
/** 543.5 px next to the collapsed sidebar at 1,440 px (Figma). */
export const AGENT_DEFAULT = 0.395

/** CSS width of the panel: a share of the space next to the sidebar, never under 550 or over 800 px. */
export const agentWidthCss = (frac: number) => `clamp(${AGENT_MIN}px, ${frac * 100}%, ${AGENT_MAX}px)`

/**
 * Drag handle on the right edge of the docked agent panel (desktop only). It lives in the same `relative` parent
 * as the panel. `frac` is the panel width as a share of that parent, so the panel also scales when the window does.
 */
export function AgentResizer({ frac, onChange }: { frac: number; onChange: (frac: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const active = useRef(false) // read by the move handler without waiting for a re-render
  const [parent, setParent] = useState(0)

  useEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const watch = new ResizeObserver(() => setParent(el.getBoundingClientRect().width))
    watch.observe(el)
    return () => watch.disconnect()
  }, [])

  const px = Math.min(AGENT_MAX, Math.max(AGENT_MIN, frac * parent))
  const setPx = (next: number) => parent > 0 && onChange(Math.min(AGENT_MAX, Math.max(AGENT_MIN, next)) / parent)

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    active.current = true
    setDragging(true)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current) setPx(e.clientX - e.currentTarget.parentElement!.getBoundingClientRect().left)
  }
  const stop = () => {
    active.current = false
    setDragging(false)
  }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setPx(px - 16)
    else if (e.key === 'ArrowRight') setPx(px + 16)
    else if (e.key === 'Home') setPx(AGENT_MIN)
    else if (e.key === 'End') setPx(AGENT_MAX)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize Investigate and Ask"
      aria-valuenow={Math.round(px)}
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
      style={{ left: 'calc(var(--agent-w) + var(--panel-gap) / 2)' }}
      className="group absolute top-0 bottom-0 z-30 hidden w-3 -translate-x-1/2 cursor-col-resize touch-none select-none outline-none desk:block"
    >
      {/* The visible line: thin at rest, ai-border blue on hover, drag or keyboard focus. */}
      <div className={`mx-auto h-full w-0.5 transition-colors group-hover:bg-ai-border group-focus-visible:bg-ai-border ${dragging ? 'bg-ai-border' : 'bg-transparent'}`} />
    </div>
  )
}
