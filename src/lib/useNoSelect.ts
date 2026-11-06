import { useEffect } from 'react'

/** While a drag is on, nothing on the page can be selected (Safari and Chrome both start a text selection when a resize handle is dragged), and the cursor stays a column resize. */
export function useNoSelect(on: boolean) {
  useEffect(() => {
    if (!on) return
    const s = document.body.style
    s.setProperty('user-select', 'none')
    s.setProperty('-webkit-user-select', 'none')
    s.setProperty('cursor', 'col-resize')
    return () => {
      s.removeProperty('user-select')
      s.removeProperty('-webkit-user-select')
      s.removeProperty('cursor')
    }
  }, [on])
}
