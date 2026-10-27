import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { KEEP, mix, token } from '@/lib/tokens'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { PIN_RISE, addBadges, iconCategory } from '@/lib/markerIcons'
import { circleBounds, radiusGroups } from '@/lib/radius'
import type { Area } from '@/lib/agent'
import { GROUPS, groupOf, label, typeOf, type Incident } from '@/lib/incidents'

// Free dark basemap (CARTO / OpenStreetMap), no API key. Swap the URL to change provider.
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Vite bundles the worker (with its shared chunk) so it also loads in production builds.
maplibregl.setWorkerUrl(workerUrl)

/** Zoom where small dots turn into icon badges. */
const BADGE_ZOOM = 14

/** Paint the land with --map-land (true) or leave it invisible (false). */
const LAND_ON = false
/** The Bogotá outline (public/bogota-boundary.geojson, 19 KB). OFF for now (owner, 2026-10-26): nothing is loaded or drawn. Set to true to bring it back. */
const BOGOTA_OUTLINE_ON = false
// Very subtle softness on the roads and their outlines, in pixels (owner, 2026-10-26). 0 = sharp.
const ROAD_BLUR = 0.6
/** Pixels per meter at zoom 0 around Bogotá (512 px tiles), for the answer radius. */
const METERS_TO_PX_Z0 = 1 / (78271.517 * Math.cos((4.65 * Math.PI) / 180))
/** Same for the building outlines, in pixels. */
const BUILDING_BLUR = 2
/** How strong the answer radius fill gets at its edge (Figma: 5.9 % on the Fill layer). */
const ANSWER_FILL_ALPHA = 0.06

const BOGOTA: [number, number] = [-74.09, 4.65]
/** The map always opens here (owner's choice, 2026-10-26). */
const START_ZOOM = 12

// MapLibre needs WebGL2. Without it (GPU acceleration off, some VMs) we show a list instead of crashing.
const WEBGL2 = !!document.createElement('canvas').getContext('webgl2')

interface Props {
  incidents: Incident[]
  selectedId: string | null
  /** Incidents backing the agent's latest answer, ringed in the AI colour. */
  highlightIds: string[]
  /** Localities to outline and shade (an answer about localities); they replace the circles. */
  areas: Area[]
  onSelect: (id: string | null) => void
}

export function IncidentMap({ incidents, selectedId, highlightIds, areas, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!WEBGL2) return
    const map = new maplibregl.Map({ container: container.current!, style: STYLE, center: BOGOTA, zoom: START_ZOOM, attributionControl: { compact: true } })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    // On first entry the container can still be settling its size when the map is created, so once the style has loaded we re-measure it and set the start view again, unless the person has already moved the map.
    let moved = false
    map.on('movestart', (e) => e.originalEvent && (moved = true))
    map.on('load', async () => {
      map.resize()
      if (!moved) map.jumpTo({ center: BOGOTA, zoom: START_ZOOM })
      await addBadges(map)
      // Place and street names stay in Spanish (the local names): the CARTO style asks for English first.
      for (const l of map.getStyle().layers) {
        if (l.type === 'symbol' && JSON.stringify(l.layout?.['text-field']).includes('name:en')) map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:es'], ['get', 'name']])
      }
      // Land, parks and background (Figma map/land). LAND_ON is false for now (owner, 2026-10-26): the land layers are hidden, as if invisible, and the page color shows through. Set it to true to paint them with --map-land.
      for (const id of ['background', 'landcover', 'landuse', 'landuse_residential', 'park_national_park', 'park_nature_reserve']) {
        if (!map.getLayer(id)) continue
        if (LAND_ON) map.setPaintProperty(id, id === 'background' ? 'background-color' : 'fill-color', token('--map-land'))
        else map.setLayoutProperty(id, 'visibility', 'none')
      }
      // Streets use our own colors (--map-roads, --map-main-roads) instead of CARTO's: find the style's road lines by their original color.
      const roads: Record<string, string> = { 'rgba(65, 71, 88, 1)': token('--map-roads'), 'rgba(83, 86, 102, 1)': token('--map-main-roads') }
      for (const l of map.getStyle().layers) {
        const c = l.type === 'line' ? map.getPaintProperty(l.id, 'line-color') : null
        if (typeof c === 'string' && roads[c]) {
          map.setPaintProperty(l.id, 'line-color', roads[c])
          map.setPaintProperty(l.id, 'line-blur', ROAD_BLUR)
        }
      }
      // Outlines and thin lines (Figma Map colors sheet): CARTO's colors replaced by our tokens, group by group. Sizes stay CARTO's.
      const lines: Record<string, string> = {
        boundary_state: '--map-boundary',
        boundary_county: '--map-boundary-county',
        boundary_country_outline: '--map-boundary-country',
        tunnel_path: '--map-paths',
        road_path: '--map-paths',
        road_path_areas: '--map-paths',
        bridge_path: '--map-paths',
        rail: '--map-rail',
        tunnel_rail: '--map-rail',
        'aeroway-runway': '--map-airport',
        'aeroway-taxiway': '--map-airport',
      }
      for (const l of map.getStyle().layers) {
        if (l.type === 'line') {
          const old = JSON.stringify(map.getPaintProperty(l.id, 'line-color'))
          // Road outlines are the "case" layers: CARTO's #232323 ones are the major roads, the rest (#1a1a1a) tunnels, minor roads and bridges.
          const name = lines[l.id] ?? (l.id.includes('case') ? (old.includes('#232323') ? '--map-road-outlines' : '--map-road-outlines-minor') : null)
          if (name) map.setPaintProperty(l.id, 'line-color', token(name))
          if (l.id.includes('case')) map.setPaintProperty(l.id, 'line-blur', ROAD_BLUR)
        }
        if (l.type === 'symbol' && map.getPaintProperty(l.id, 'text-halo-width')) map.setPaintProperty(l.id, 'text-halo-color', token('--map-label-halo'))
      }
      if (map.getLayer('building-top')) {
        map.setPaintProperty('building-top', 'fill-color', token('--map-buildings'))
        // Fills can't blur, so the 1 px outline becomes a soft line layer on the same source, with the same fade-in and offset.
        map.setPaintProperty('building-top', 'fill-outline-color', 'transparent')
        const top = map.getLayer('building-top') as unknown as { source: string; sourceLayer: string }
        map.addLayer({
          id: 'building-outline',
          type: 'line',
          source: top.source,
          'source-layer': top.sourceLayer,
          minzoom: 13,
          paint: {
            'line-color': token('--map-building-outlines'),
            'line-width': 1,
            'line-blur': BUILDING_BLUR,
            'line-opacity': map.getPaintProperty('building-top', 'fill-opacity'),
            'line-translate': map.getPaintProperty('building-top', 'fill-translate'),
          },
        })
      }
      // The credit starts closed (just the ⓘ) and opens on tap; MapLibre opens it by default and only closes it on the first drag.
      map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      // The city's outline: one line from OpenStreetMap (public/bogota-boundary.geojson), under the incidents.
      if (BOGOTA_OUTLINE_ON) {
        map.addSource('bogota', { type: 'geojson', data: new URL('/bogota-boundary.geojson', location.href).href })
        map.addLayer({ id: 'bogota-border', type: 'line', source: 'bogota', paint: { 'line-color': token('--map-bogota-border'), 'line-width': 1.5, 'line-blur': ROAD_BLUR } })
      }
      map.addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'incidents',
        type: 'circle',
        source: 'incidents',
        maxzoom: BADGE_ZOOM,
        paint: {
          'circle-radius': ['step', ['zoom'], 3, 12, 5], // 6 px across below zoom 12, 10 px from 12 (until the pins)
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': token('--map-dot-outline'),
        },
      })
      // From zoom 14 (owner's choice, 2026-10-26) the dots become big badges with the category's icon, like Waze.
      map.addLayer({
        id: 'incident-badges',
        type: 'symbol',
        source: 'incidents',
        minzoom: BADGE_ZOOM,
        layout: {
          'icon-image': ['concat', 'badge-', ['get', 'icon'], '-', ['get', 'group']],
          'icon-size': ['interpolate', ['linear'], ['zoom'], BADGE_ZOOM, 0.4, 15, 0.6, 18, 0.8],
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
        },
      })
      // Rule (owner, 2026-10-26): the selected incident always shows its pin with the category icon, at any zoom, and it is always the top level. It has its own layer above the badges at every zoom, because symbol-sort-key only orders pins inside one map tile, so a neighbouring pin from another tile could still cover the selected one.
      map.addLayer({
        id: 'incident-selected-pin',
        type: 'symbol',
        source: 'incidents',
        filter: ['==', ['get', 'id'], ''],
        layout: {
          'icon-image': ['concat', 'badge-', ['get', 'icon'], '-', ['get', 'group']],
          'icon-size': ['interpolate', ['linear'], ['zoom'], BADGE_ZOOM, 0.4, 15, 0.6, 18, 0.8],
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
        },
      })
      // The agent's answer (owner, 2026-10-27): one incident radius per group of incidents instead of one ring per incident. Its size is in meters, so it is a real area at every zoom. It draws under the dots and pins.
      map.addSource('answer-radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      // Figma Incident Radius (agent): a radial gradient fill, clear up to half the radius and strongest at the edge, and a 1 px ring. A circle layer cannot hold a gradient, so the fill is three bands (outer half of the radius) stacked as wide strokes, each a bit stronger than the one inside it.
      // Under the basemap's place and street names (owner, 2026-10-27), so the names stay readable inside a radius; still above roads, land and buildings.
      const underLabels = map.getStyle().layers.find((l) => l.type === 'symbol')?.id
      const px = (f: number) => ['interpolate', ['exponential', 2], ['zoom'], 0, ['*', ['get', 'r'], METERS_TO_PX_Z0 * f], 22, ['*', ['get', 'r'], METERS_TO_PX_Z0 * 2 ** 22 * f]] as never
      const BANDS = [[0.5, 0.667], [0.667, 0.833], [0.833, 1]] // from the radius' center, as fractions of it
      BANDS.forEach(([from, to], i) =>
        map.addLayer(
          {
            id: `answer-radius-fill-${i}`,
            type: 'circle',
            source: 'answer-radius',
            paint: {
              'circle-radius': px((from + to) / 2),
              'circle-opacity': 0,
              'circle-stroke-width': px(to - from),
              'circle-stroke-color': token('--map-answer-radius'),
              'circle-stroke-opacity': (ANSWER_FILL_ALPHA * (i + 1)) / BANDS.length,
            },
          },
          underLabels,
        ),
      )
      map.addLayer(
        {
          id: 'answer-radius-ring',
          type: 'circle',
          source: 'answer-radius',
          paint: { 'circle-radius': px(1), 'circle-opacity': 0, 'circle-stroke-width': 1, 'circle-stroke-color': token('--map-answer-radius-ring') },
        },
        underLabels,
      )
      // An answer about localities (owner, 2026-10-27): the localities themselves are outlined in the radius ring color and shaded with the radius fill color, stronger for a higher count, with their names in neutral-100. No circles then.
      // The locality fill sits just above the land (owner, 2026-10-27), under the water, roads, buildings and names, so none of those are hidden; the outline is drawn on top of everything.
      const layers = map.getStyle().layers
      const LAND = ['background', 'landcover', 'landuse', 'landuse_residential', 'park_national_park', 'park_nature_reserve']
      const aboveLand = layers[Math.max(...LAND.map((id) => layers.findIndex((l) => l.id === id))) + 1]?.id ?? underLabels
      map.addSource('answer-areas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer(
        {
          id: 'answer-areas-fill',
          type: 'fill',
          source: 'answer-areas',
          paint: { 'fill-color': token('--map-locality-fill'), 'fill-opacity': ['interpolate', ['linear'], ['get', 'v'], 0, 0.11, 1, 0.4] },
        },
        aboveLand,
      )
      map.addLayer(
        { id: 'answer-areas-line', type: 'line', source: 'answer-areas', paint: { 'line-color': token('--map-locality-line'), 'line-width': 1.5 } },
        'incidents', // the outline is on top of the whole basemap (owner, 2026-10-27), so roads and water do not cut it; only the names and the incidents are above it
      )
      map.addLayer(
        {
          id: 'answer-areas-name',
          type: 'symbol',
          source: 'answer-areas',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': (underLabels && (map.getLayoutProperty(underLabels, 'text-font') as string[])) || ['Montserrat Regular'],
            'text-size': 13,
            'text-allow-overlap': false,
          },
          paint: { 'text-color': token('--neutral-100'), 'text-halo-color': token('--neutral-900'), 'text-halo-width': 1.5 },
        },
        'incidents',
      )
      map.addLayer({
        id: 'incident-selected',
        type: 'circle',
        source: 'incidents',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          // The selected incident is always a pin (see 'incident-selected-pin'), so its ring always wraps the pin's circle, at any zoom.
          'circle-radius': ['interpolate', ['linear'], ['zoom'], BADGE_ZOOM, 19, 15, 24, 18, 33],
          'circle-color': 'rgba(0,0,0,0)',
          'circle-translate': ['interpolate', ['linear'], ['zoom'], BADGE_ZOOM, ['literal', [0, -0.4 * PIN_RISE]], 15, ['literal', [0, -0.6 * PIN_RISE]], 18, ['literal', [0, -0.8 * PIN_RISE]]],
          'circle-stroke-width': 2,
          'circle-stroke-color': token('--map-selected-ring'),
        },
      })
      // A click on an incident selects it; a click anywhere else on the map clears the selection.
      map.on('click', (e) => {
        const hit = map.queryRenderedFeatures(e.point, { layers: ['incident-selected-pin', 'incidents', 'incident-badges'] })[0]
        onSelectRef.current(hit ? String(hit.properties.id) : null)
      })
      for (const layer of ['incident-selected-pin', 'incidents', 'incident-badges']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'))
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''))
      }
      setReady(true)
    })
    mapRef.current = map
    const clear = (e: KeyboardEvent) => e.key === 'Escape' && onSelectRef.current(null)
    window.addEventListener('keydown', clear)
    return () => {
      window.removeEventListener('keydown', clear)
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
        properties: { id: i.id, color: token(GROUPS[groupOf(i.status)].token), dim: mix(token(GROUPS[groupOf(i.status)].token), token('--map-background'), KEEP), group: groupOf(i.status), icon: iconCategory(i.category), hl: highlight.has(i.id) },
      })),
    })
  }, [ready, incidents, highlightIds])

  // When an answer arrives the map moves to show all of it (owner, 2026-10-27), clear of the banner, the filters and the summary card.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !highlightIds.length || areas.length) return
    const highlight = new Set(highlightIds)
    const pts = incidents.filter((i) => highlight.has(i.id))
    if (!pts.length) return
    const bounds = new maplibregl.LngLatBounds([pts[0].lng, pts[0].lat], [pts[0].lng, pts[0].lat])
    for (const i of pts) bounds.extend([i.lng, i.lat])
    for (const c of radiusGroups(pts)) for (const corner of circleBounds(c)) bounds.extend(corner) // the circles too, not only their incidents
    const wide = map.getContainer().clientWidth > 700
    map.fitBounds(bounds, { padding: { top: wide ? 120 : 100, bottom: wide ? 40 : 60, left: 40, right: wide ? 320 : 40 }, maxZoom: 15, duration: 700 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the answer changes, not when filters change the list
  }, [ready, highlightIds])

  // The localities of an answer: load the boundaries once, draw the listed ones (shade by count) and move the map to show them all.
  const localities = useRef<{ features: { properties: { code: number; name: string }; geometry: { coordinates: unknown } }[] } | null>(null)
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const source = map.getSource('answer-areas') as maplibregl.GeoJSONSource
    if (!areas.length) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    let stale = false
    ;(async () => {
      localities.current ??= await fetch('/bogota-localities.geojson').then((r) => r.json())
      if (stale || !localities.current) return
      const max = Math.max(...areas.map((a) => a.value))
      const value = new Map(areas.map((a) => [a.code, a.value]))
      const features = localities.current.features.filter((f) => value.has(f.properties.code)).map((f) => ({ ...f, properties: { ...f.properties, v: value.get(f.properties.code)! / max } }))
      source.setData({ type: 'FeatureCollection', features } as never)
      const bounds = new maplibregl.LngLatBounds()
      const extend = (c: unknown): void => {
        if (Array.isArray(c) && typeof c[0] === 'number') bounds.extend(c as [number, number])
        else (c as unknown[]).forEach(extend)
      }
      for (const f of features) extend(f.geometry.coordinates)
      if (!bounds.isEmpty()) {
        const wide = map.getContainer().clientWidth > 700
        map.fitBounds(bounds, { padding: { top: wide ? 120 : 100, bottom: wide ? 40 : 60, left: 40, right: wide ? 320 : 40 }, maxZoom: 13, duration: 700 })
      }
    })()
    return () => {
      stale = true
    }
  }, [ready, areas])

  // One radius per group of incidents behind the agent's answer.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const highlight = new Set(highlightIds)
    const circles = highlightIds.length && !areas.length ? radiusGroups(incidents.filter((i) => highlight.has(i.id))) : []
    ;(map.getSource('answer-radius') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: circles.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lng, c.lat] }, properties: { r: c.radius } })),
    })
  }, [ready, incidents, highlightIds, areas])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setFilter('incident-selected', ['==', ['get', 'id'], selectedId ?? ''])
    map.setFilter('incident-selected-pin', ['==', ['get', 'id'], selectedId ?? ''])
  }, [ready, selectedId])

  // While the agent's answer is shown (owner, 2026-10-26) the incidents that are not part of it are hidden, not toned down.
  // While an incident is selected every other dot or pin is toned down toward the land color (same hue, so its status stays readable), and the focused one draws on top.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const answer = highlightIds.length ? ['get', 'hl'] : null
    map.setFilter('incidents', answer as never)
    map.setFilter('incident-badges', answer as never)
    const focus = selectedId ? ['==', ['get', 'id'], selectedId] : null
    const own = ['get', 'color']
    const ownBadge = ['concat', 'badge-', ['get', 'icon'], '-', ['get', 'group']]
    map.setPaintProperty('incidents', 'circle-color', (focus ? ['case', focus, own, ['get', 'dim']] : own) as never)
    map.setLayoutProperty('incident-badges', 'icon-image', (focus ? ['case', focus, ownBadge, ['concat', 'badge-', ['get', 'icon'], '-dim-', ['get', 'group']]] : ownBadge) as never)
    map.setLayoutProperty('incident-badges', 'symbol-sort-key', (focus ? ['case', focus, 1, 0] : 0) as never)
  }, [ready, selectedId, highlightIds])

  if (!WEBGL2) return <ListFallback incidents={incidents} selectedId={selectedId} onSelect={onSelect} />

  // Wrapper positions the map: maplibre's unlayered CSS overrides Tailwind's `absolute` on the map element itself.
  return (
    <div className="absolute inset-x-0 top-0 bottom-14 bg-(image:--map-background-gradient) bg-fixed desk:top-(--section-header-h) desk:bottom-0 desk:left-(--agent-w)">
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
