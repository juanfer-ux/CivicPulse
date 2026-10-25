import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { token } from '@/lib/tokens'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { GROUPS, groupOf, label, typeOf, type Incident } from '@/lib/incidents'

// Free dark basemap (CARTO / OpenStreetMap), no API key. Swap the URL to change provider.
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Vite bundles the worker (with its shared chunk) so it also loads in production builds.
maplibregl.setWorkerUrl(workerUrl)

const BOGOTA: [number, number] = [-74.09, 4.65]

// MapLibre needs WebGL2. Without it (GPU acceleration off, some VMs) we show a list instead of crashing.
const WEBGL2 = !!document.createElement('canvas').getContext('webgl2')

interface Props {
  incidents: Incident[]
  selectedId: string | null
  /** Incidents backing the agent's latest answer, ringed in the AI colour. */
  highlightIds: string[]
  onSelect: (id: string | null) => void
}

export function IncidentMap({ incidents, selectedId, highlightIds, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!WEBGL2) return
    const map = new maplibregl.Map({ container: container.current!, style: STYLE, center: BOGOTA, zoom: 11, attributionControl: { compact: true } })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.on('load', () => {
      // The credit starts closed (just the ⓘ) and opens on tap; MapLibre opens it by default and only closes it on the first drag.
      map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      map.addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'incidents',
        type: 'circle',
        source: 'incidents',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 15, 8],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': token('--map-dot-outline'),
        },
      })
      map.addLayer({
        id: 'incident-highlight',
        type: 'circle',
        source: 'incidents',
        filter: ['==', ['get', 'hl'], true],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 12],
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 2,
          'circle-stroke-color': token('--map-answer-ring'),
        },
      })
      map.addLayer({
        id: 'incident-selected',
        type: 'circle',
        source: 'incidents',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 7, 15, 13],
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 2,
          'circle-stroke-color': token('--map-selected-ring'),
        },
      })
      map.on('click', 'incidents', (e) => onSelectRef.current(String(e.features?.[0]?.properties?.id ?? '') || null))
      map.on('mouseenter', 'incidents', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'incidents', () => (map.getCanvas().style.cursor = ''))
      setReady(true)
    })
    mapRef.current = map
    return () => {
      setReady(false)
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const highlight = new Set(highlightIds)
    ;(map.getSource('incidents') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: incidents.map((i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
        properties: { id: i.id, color: token(GROUPS[groupOf(i.status)].token), hl: highlight.has(i.id) },
      })),
    })
  }, [ready, incidents, highlightIds])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setFilter('incident-selected', ['==', ['get', 'id'], selectedId ?? ''])
  }, [ready, selectedId])

  if (!WEBGL2) return <ListFallback incidents={incidents} selectedId={selectedId} onSelect={onSelect} />

  // Wrapper positions the map: maplibre's unlayered CSS overrides Tailwind's `absolute` on the map element itself.
  return (
    <div className="absolute inset-x-0 top-0 bottom-14 desk:top-(--section-header-h) desk:bottom-0 desk:left-(--agent-w)">
      <div ref={container} className="size-full" />
    </div>
  )
}

function ListFallback({ incidents, selectedId, onSelect }: Pick<Props, 'incidents' | 'selectedId' | 'onSelect'>) {
  return (
    <div className="absolute inset-y-0 inset-x-0 overflow-y-auto px-4 pb-16 pt-16 desk:left-[calc(var(--agent-w)+0.5rem)] desk:right-80 desk:pt-[calc(var(--section-header-h)+1.5rem)] desk:pb-4">
      <p className="mb-3 rounded-md border border-warning/50 p-3 text-body-sm text-muted-foreground">
        The map needs WebGL2, which this browser has turned off. In Chrome: Settings → System → turn on “Use graphical
        acceleration when available”, then relaunch. Until then, here is the list of incidents (newest 100).
      </p>
      <ul className="flex flex-col gap-1">
        {incidents.slice(0, 100).map((i) => (
          <li key={i.id}>
            <button
              onClick={() => onSelect(i.id)}
              aria-pressed={i.id === selectedId}
              className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-body-sm hover:bg-accent ${i.id === selectedId ? 'border-ring bg-accent' : 'bg-card/60'}`}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(${GROUPS[groupOf(i.status)].token})` }} aria-hidden />
              <span className="flex-1">
                {i.reference} · {label(typeOf(i))}
              </span>
              <span className="text-meta text-muted-foreground">{new Date(i.occurred_at).toLocaleDateString('en-GB')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
