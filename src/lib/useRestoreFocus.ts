import { useEffect, type RefObject } from 'react'

/** Moves focus into a panel when it mounts, and back to whatever was focused before, when it unmounts. */
export function useRestoreFocus(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => before?.focus()
  }, [ref])
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab from leaving the element, for a true modal overlay (one with a backdrop). */
export function useFocusTrap(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const atEdge = e.shiftKey ? document.activeElement === first : document.activeElement === last
      if (atEdge) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [ref])
}
