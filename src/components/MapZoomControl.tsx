import { useEffect, useState } from 'react'
import { Compass, House, Minus, Plus, Stack } from '@phosphor-icons/react'

/** What the control needs from the map (MapLibre's Map has all of it), so tests can pass a stand-in. */
export interface ZoomableMap {
  getZoom(): number
  zoomTo(zoom: number, options?: { duration: number }): unknown
  zoomIn(): unknown
  zoomOut(): unknown
  flyTo(options: { center: [number, number]; zoom: number; duration?: number; bearing?: number; pitch?: number }): unknown
  on(type: 'zoom' | 'rotate' | 'pitch', listener: () => void): unknown
  off(type: 'zoom' | 'rotate' | 'pitch', listener: () => void): unknown
  // rotate and tilt (owner, 2026-11-15): optional so a stand-in map without them still works
  getBearing?(): number
  getPitch?(): number
  easeTo?(options: { bearing?: number; pitch?: number; duration?: number }): unknown
}

/** How far the map tilts when the tilt button is pressed (MapLibre's own limit is 60). */
const TILT = 55

const BTN = 'grid size-[29px] place-items-center text-(--neutral-200) hover:bg-(--neutral-400) active:bg-(--neutral-600) focus-visible:shadow-[inset_0_0_0_1.5px_var(--foreground)] disabled:opacity-50 disabled:hover:bg-transparent outline-none'

/**
 * The map's zoom control, like Google's (owner, 2026-11-07): a button that goes back to the default view, then plus, a vertical slider and minus.
 * The slider is a native range input, so the keyboard works (arrows, Home, End) and a screen reader hears "Zoom"; a tick marks the default zoom.
 * The slider is hidden on phones (pinch does it); the buttons stay. Same look as the old two-button control (Figma Map Zoom): neutral-500 fill, 4 px radius.
 */
export function MapZoomControl({ map, min, max, home }: { map: ZoomableMap | null; min: number; max: number; home: { center: [number, number]; zoom: number } }) {
  const [zoom, setZoom] = useState(home.zoom)
  const [view, setView] = useState({ bearing: 0, pitch: 0 })
  useEffect(() => {
    if (!map) return
    const sync = () => {
      setZoom(map.getZoom())
      setView({ bearing: map.getBearing?.() ?? 0, pitch: map.getPitch?.() ?? 0 })
    }
    sync()
    for (const e of ['zoom', 'rotate', 'pitch'] as const) map.on(e, sync)
    return () => void (['zoom', 'rotate', 'pitch'] as const).forEach((e) => map.off(e, sync))
  }, [map])
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const tick = ((home.zoom - min) / (max - min)) * 100
  return (
    <div className="map-zoom absolute right-[14px] z-10 flex flex-col gap-2">
      <div className="flex flex-col overflow-hidden rounded-sm bg-(--neutral-500)">
        <button type="button" className={BTN} aria-label="Back to the default view" title="Back to the default view" onClick={() => map?.flyTo({ ...home, bearing: 0, pitch: 0, duration: still ? 0 : 800 })}>
          <House className="size-3.5" aria-hidden />
        </button>
        <button type="button" className={BTN} aria-label="Point north and level the map" title="Point north and level the map (right-drag the map to rotate and tilt it)" onClick={() => map?.easeTo?.({ bearing: 0, pitch: 0, duration: still ? 0 : 400 })}>
          <Compass className="size-3.5 transition-transform" style={{ transform: `rotate(${-view.bearing}deg)` }} aria-hidden />
        </button>
        <button type="button" className={BTN} aria-label={view.pitch > 1 ? 'Level the map' : 'Tilt the map'} title={view.pitch > 1 ? 'Level the map' : 'Tilt the map'} aria-pressed={view.pitch > 1} onClick={() => map?.easeTo?.({ pitch: view.pitch > 1 ? 0 : TILT, duration: still ? 0 : 400 })}>
          <Stack className="size-3.5" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col overflow-hidden rounded-sm bg-(--neutral-500)">
        <button type="button" className={BTN} aria-label="Zoom in" title="Zoom in" disabled={zoom >= max - 0.01} onClick={() => map?.zoomIn()}>
          <Plus className="size-2.5" weight="bold" aria-hidden />
        </button>
        <div className="relative hidden h-[112px] justify-center desk:flex">
          <input
            type="range"
            className="zoom-slider"
            aria-label="Zoom"
            min={min}
            max={max}
            step={0.05}
            value={Math.min(max, Math.max(min, zoom))}
            onChange={(e) => map?.zoomTo(Number(e.target.value), { duration: 0 })}
          />
          <span className="pointer-events-none absolute left-1 h-px w-[5px] bg-(--neutral-100)" style={{ bottom: `calc(8px + (100% - 16px) * ${tick / 100})` }} aria-hidden title="Default zoom" />
        </div>
        <button type="button" className={BTN} aria-label="Zoom out" title="Zoom out" disabled={zoom <= min + 0.01} onClick={() => map?.zoomOut()}>
          <Minus className="size-2.5" weight="bold" aria-hidden />
        </button>
      </div>
      {import.meta.env.DEV && <span className="text-center text-caption text-(--neutral-300)" title="Map zoom (dev server only)">z {zoom.toFixed(2)}</span>} {/* the zoom number, only on the dev server (owner, 2026-11-15) */}
    </div>
  )
}
