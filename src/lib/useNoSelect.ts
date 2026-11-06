import { useEffect } from 'react'

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
