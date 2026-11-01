import { useEffect, useRef, useState, type RefObject } from 'react'
import { gsap } from 'gsap'

const motion = (el: HTMLElement) => getComputedStyle(el).position === 'absolute' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches // only the desktop side panel slides, and not with reduced motion; on phones it sits in the bottom sheet

/** The side panel slides out from under the agent panel when it mounts (if `slide`) and back under it while `leaving` (owner, 2026-11-01). */
export function useSlide(ref: RefObject<HTMLElement | null>, slide: boolean, leaving: boolean) {
  const slideOnMount = useRef(slide)
  useEffect(() => {
    const el = ref.current
    if (!slideOnMount.current || !el || !motion(el)) return
    const tween = gsap.fromTo(el, { xPercent: -100 }, { xPercent: 0, duration: 0.35, ease: 'power2.out' })
    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'transform' }) // dev StrictMode runs this effect twice: leave no half-slid state
    }
  }, [ref])
  useEffect(() => {
    const el = ref.current
    if (!leaving || !el || !motion(el)) return
    const tween = gsap.to(el, { xPercent: -100, duration: 0.3, ease: 'power2.in' })
    return () => {
      tween.kill()
      gsap.set(el, { xPercent: 0 }) // opened again while leaving
    }
  }, [ref, leaving])
}

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
