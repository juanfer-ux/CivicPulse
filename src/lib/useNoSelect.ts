import { useEffect, useRef } from 'react'

/** While a resize handle is dragged: nothing on the page can be selected (Safari and Chrome both start a text selection), the cursor stays a column resize, and no transition runs, so the map's chips and filters follow at once instead of gliding behind the handle (`html[data-resizing]` in index.css). */
export function useNoSelect(on: boolean) {
  useEffect(() => {
    if (!on) return
    const s = document.body.style
    document.documentElement.dataset.resizing = ''
    s.setProperty('user-select', 'none')
    s.setProperty('-webkit-user-select', 'none')
    s.setProperty('cursor', 'col-resize')
    return () => {
      s.removeProperty('user-select')
      s.removeProperty('-webkit-user-select')
      s.removeProperty('cursor')
      delete document.documentElement.dataset.resizing
    }
  }, [on])
}

/** A drag must always end (audit of the "stuck drag" bug, 2026-11-17): the handle's own pointerup is not enough. If the pointer is released outside the window, the window loses focus, the tab is hidden, or the handle disappears mid-drag (the viewport crosses the desktop breakpoint, the sidebar collapses), the browser sends no pointerup to it and the drag, the no-select and the column cursor stayed on until the next click. While `on`, the window's own pointerup, pointercancel, blur and a hidden tab end it too. */
export function useReleaseGuard(on: boolean, stop: () => void) {
  const last = useRef(stop)
  last.current = stop
  useEffect(() => {
    if (!on) return
    const end = () => last.current()
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    window.addEventListener('blur', end)
    document.addEventListener('visibilitychange', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      window.removeEventListener('blur', end)
      document.removeEventListener('visibilitychange', end)
    }
  }, [on])
}
