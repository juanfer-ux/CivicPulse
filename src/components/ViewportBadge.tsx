import { useEffect, useState } from 'react'

/** The browser's viewport in a corner (owner, 2026-11-17: to see the breakpoints while testing): width × height in CSS pixels, top right, non-interactive. */
export function ViewportBadge() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return (
    <div aria-hidden className="pointer-events-none fixed top-1 right-2 z-50 rounded-xs bg-(--neutral-900)/80 px-1.5 text-[11px]/4 tracking-[0.05em] text-(--neutral-300) tabular-nums">
      {size.w} × {size.h}
    </div>
  )
}
