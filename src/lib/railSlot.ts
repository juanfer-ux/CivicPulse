import { useSyncExternalStore } from 'react'

/** Where the collapsed sidebar's rail is drawn: inside the agent panel (owner's Figma, 2026-11-17). The panel registers its slot here and the sidebar portals into it. */
let slot: HTMLElement | null = null
const listeners = new Set<() => void>()

export const setRailSlot = (el: HTMLElement | null) => {
  if (slot === el) return
  slot = el
  listeners.forEach((l) => l())
}
export const useRailSlot = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => slot,
  )
