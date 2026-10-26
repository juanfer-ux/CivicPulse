import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { token } from '@/lib/tokens'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { addBadges, iconCategory } from '@/lib/markerIcons'
import { GROUPS, groupOf, label, typeOf, type Incident } from '@/lib/incidents'

// Free dark basemap (CARTO / OpenStreetMap), no API key. Swap the URL to change provider.
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Vite bundles the worker (with its shared chunk) so it also loads in production builds.
maplibregl.setWorkerUrl(workerUrl)

/** Zoom where small dots turn into icon badges. */
const BADGE_ZOOM = 12

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
    map.on('load', async () => {
      await addBadges(map)
      // Place and street names stay in Spanish (the local names): the CARTO style asks for English first.
      for (const l of map.getStyle().layers) {
        if (l.type === 'symbol' && JSON.stringify(l.layout?.['text-field']).includes('name:en')) map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:es'], ['get', 'name']])
      }
      // Land, parks and background use the --map-land token (Figma map/land) instead of CARTO's #0E0E0E.
      for (const id of ['background', 'landcover', 'landuse', 'park_national_park', 'park_nature_reserve']) {
        if (map.getLayer(id)) map.setPaintProperty(id, id === 'background' ? 'background-color' : 'fill-color', token('--map-land'))
      }
      // The credit starts closed (just the ⓘ) and opens on tap; MapLibre opens it by default and only closes it on the first drag.
      map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      map.addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'incidents',
        type: 'circle',
        source: 'incidents',
        maxzoom: BADGE_ZOOM,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, BADGE_ZOOM, 5],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': token('--map-dot-outline'),
        },
      })
      // From zoom 12 (owner's choice, 2026-10-26) the dots become big badges with the category's icon, like Waze.
      map.addLayer({
        id: 'incident-badges',
        type: 'symbol',
        source: 'incidents',
        minzoom: BADGE_ZOOM,
        layout: {
          'icon-image': ['concat', 'badge-', ['get', 'icon'], '-', ['get', 'group']],
          'icon-size': ['interpolate', ['linear'], ['zoom'], BADGE_ZOOM, 0.4, 15, 0.6, 18, 0.8],
          'icon-allow-overlap': true,
        },
      })
      map.addLayer({
        id: 'incident-highlight',
        type: 'circle',
        source: 'incidents',
        filter: ['==', ['get', 'hl'], true],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, BADGE_ZOOM, 9, BADGE_ZOOM + 0.01, 17, 15, 22, 18, 31],
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
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 6, BADGE_ZOOM, 10, BADGE_ZOOM + 0.01, 19, 15, 24, 18, 33],
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 2,
          'circle-stroke-color': token('--map-selected-ring'),
        },
      })
      map.on('click', ['incidents', 'incident-badges'], (e) => onSelectRef.current(String(e.features?.[0]?.properties?.id ?? '') || null))
      for (const layer of ['incidents', 'incident-badges']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'))
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''))
      }
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
        properties: { id: i.id, color: token(GROUPS[groupOf(i.status)].token), group: groupOf(i.status), icon: iconCategory(i.category), hl: highlight.has(i.id) },
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
