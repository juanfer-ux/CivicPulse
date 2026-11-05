import { useEffect, useState } from 'react'

/** Keeps the last value on screen for `ms` after it becomes null, so an exit animation can play. `slide` is true when the value appears from nothing (not when it replaces another). */
export function useHeld<T>(value: T | null, ms: number) {
  const [held, setHeld] = useState<{ value: T | null; slide: boolean }>({ value, slide: !!value })
  const leaving = !value && !!held.value
  useEffect(() => {
    if (value || !held.value) return
    const t = setTimeout(() => setHeld({ value: null, slide: false }), ms)
    return () => clearTimeout(t)
  }, [value, held.value, ms, setHeld])
  if (value && value !== held.value) setHeld({ value, slide: !held.value })
  return { value: value ?? held.value, leaving, slide: held.slide }
}
