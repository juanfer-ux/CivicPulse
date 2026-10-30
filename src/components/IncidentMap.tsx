import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { gsap } from 'gsap'
import { KEEP, mix, token } from '@/lib/tokens'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { PIN_RISE, PROBLEM_COUNT, PROBLEM_OFFSET, PROBLEM_SCALE, addBadges, addProblemMarkers, iconCategory } from '@/lib/markerIcons'
import { labelPoint } from '@/lib/polygons'
import { circleBounds, radiusGroups } from '@/lib/radius'
import type { Area } from '@/lib/agent'
import { GROUPS, groupOf, label, typeOf, type Incident } from '@/lib/incidents'
import { PROBLEM_STATUS, type ProblemRow, type ProblemStatus } from '@/lib/problems'

// Free dark basemap (CARTO / OpenStreetMap), no API key. Swap the URL to change provider.
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Vite bundles the worker (with its shared chunk) so it also loads in production builds.
maplibregl.setWorkerUrl(workerUrl)

/** Zoom where small dots turn into icon badges. */
/** Room kept free around an answer when the map zooms to fit it. Desktop: top = answer banner 44 + 24 + Stat Cards 116 + 24 + filters 36 + 24; bottom = the legend (24 + 26) + 24; the sides 40. Phones: the filter bar on top, the bottom sheet under. */
const fitPadding = (wide: boolean) => (wide ? { top: 268, bottom: 74, left: 40, right: 40 } : { top: 100, bottom: 60, left: 40, right: 40 })

const BADGE_ZOOM = 14
/** Zoom the camera flies to when an incident is opened. */
const INCIDENT_ZOOM = 17
/** Zoom the camera flies to when a persistent problem is opened: close enough that its incidents (a few tens of metres around the marker) show as separate dots around the marker's tile. */
const PROBLEM_ZOOM = 19
/** Below this zoom a problem is a plain circle in its status color, like an incident dot (owner, 2026-10-30: the circle only from far out until about zoom 14); from here it is the tile with its count pill, the same zoom where incident dots become pins. Two tiles that would overlap are not both drawn: the one with fewer occurrences waits until you zoom in. */
const PROBLEM_TILE_ZOOM = 14
const NO_PROBLEMS: ProblemRow[] = []
const MAX_FLY_ZOOM = 3 // motion comfort (owner, 2026-10-30): never animate more than 3 zoom levels; a farther trip jumps the rest first

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
/** Opacity of the locality fill for an answer about localities (owner, 2026-10-27: 4 %). */
const LOCALITY_FILL = 0.04
/** Fill of the locality whose bar is under the pointer in the agent's answer (owner, 2026-10-28: 6 %). */
const LOCALITY_FILL_FOCUS = 0.06
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
  /** Locality whose outline lights up (a bar of the answer is under the pointer). */
  focusCode?: number | null
  /** Locality to zoom to (a bar was clicked); n changes on every click. */
  zoomTo?: { code: number; n: number } | null
  onSelect: (id: string | null) => void
  /** Persistent problems to draw as one marker each (the Problems view); the incidents prop then holds only the open problem's incidents. */
  problems?: ProblemRow[]
  selectedProblemId?: string | null
  onSelectProblem?: (id: string) => void
  /** Set while a problem is open: its incidents then draw as tiny dots in this problem status color (no pins), with the problem's marker in the middle. */
  dotStatus?: ProblemStatus | null
}

export function IncidentMap({ incidents, selectedId, highlightIds, areas, focusCode, zoomTo, onSelect, problems = NO_PROBLEMS, selectedProblemId = null, onSelectProblem, dotStatus = null }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const onSelectProblemRef = useRef(onSelectProblem)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelect
    onSelectProblemRef.current = onSelectProblem
  }, [onSelect, onSelectProblem])

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
      await addProblemMarkers(map)
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
      // Rivers and lakes (Figma map/water, map/waterway).
      map.setPaintProperty('water', 'fill-color', token('--map-water'))
      map.setPaintProperty('waterway', 'line-color', token('--map-waterway'))
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
      // An answer about localities (owner, 2026-10-27): the localities themselves are outlined in the radius ring color and filled with the radius fill color (LOCALITY_FILL, the same 4 % for every locality), with their names in neutral-100. No circles then.
      // The locality fill sits above the roads and under the names (owner, 2026-10-27), so it tints everything under it evenly and each locality reads as one shade; the outline is drawn on top of everything.
      map.addSource('answer-areas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      // One point per locality for its name: a polygon source repeats the name in every map tile it crosses.
      map.addSource('answer-area-names', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer(
        {
          id: 'answer-areas-fill',
          type: 'fill',
          source: 'answer-areas',
          paint: { 'fill-color': token('--map-locality-fill'), 'fill-opacity': LOCALITY_FILL },
        },
        underLabels,
      )
      map.addLayer(
        { id: 'answer-areas-line', type: 'line', source: 'answer-areas', paint: { 'line-color': token('--map-locality-line'), 'line-width': 1.4 } },
        underLabels, // the outline is above every road, water and building (owner, 2026-10-27) but under every text (owner, 2026-10-28): the basemap's place and street names, and ours, are always the top layer
      )
      map.addLayer(
        { id: 'answer-areas-focus', type: 'line', source: 'answer-areas', filter: ['==', ['get', 'code'], -1], paint: { 'line-color': token('--map-locality-line-focus'), 'line-width': 1.4 } },
        underLabels,
      )
      map.addLayer(
        {
          id: 'answer-areas-name',
          type: 'symbol',
          source: 'answer-area-names',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular'], // upright, like the basemap's own place names (the first label layer is italic: waterways)
            'text-size': 12.5,
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
      // Persistent problems (decision 0030; Figma Problem Marker): one marker per problem, a light disc with the occurrence count over it, a status-colored ring and a category badge. The incidents of the open problem draw with the normal incident layers.
      map.addSource('problems', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      // Zoomed out: one circle per problem in its status color, a little bigger than an incident dot so problems stand out from the rest.
      map.addLayer({
        id: 'problem-dots',
        type: 'circle',
        source: 'problems',
        maxzoom: PROBLEM_TILE_ZOOM,
        paint: {
          'circle-radius': ['step', ['zoom'], 5, 12, 7], // 10 px across below zoom 12, 14 px from 12
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': token('--map-dot-outline'),
        },
      })
      map.addLayer({
        id: 'problem-markers',
        type: 'symbol',
        source: 'problems',
        minzoom: PROBLEM_TILE_ZOOM,
        layout: {
          'icon-image': ['concat', 'problem-', ['get', 'category'], '-', ['get', 'status']],
          'icon-size': PROBLEM_SCALE,
          'icon-offset': PROBLEM_OFFSET, // puts the tile, not the whole image with its count pill, on the spot
          'icon-allow-overlap': false, // a tile that would sit on another one waits for more zoom, so no two numbers ever pile up
          'symbol-sort-key': ['*', -1, ['get', 'count']], // and the problem with more occurrences wins the place
          'text-field': ['to-string', ['get', 'count']],
          'text-font': ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular'],
          'text-size': 12.5,
          'text-allow-overlap': false,
        },
        // The number sits on the pill at the tile's upper right (the text is centered on the spot, so it is moved by the pill's offset).
        paint: { 'text-color': token('--neutral-100'), 'text-translate': PROBLEM_COUNT },
      })
      // Layer order, top to bottom (owner, 2026-10-28): all the text (the basemap's names, then ours), the dots and pins, the locality highlights (fill, outline, radius), and under them the rest of the basemap. The basemap's text layers sit under our dots by default, so lift them to the top.
      const ours = new Set(['incident-badges', 'incident-selected-pin', 'answer-areas-name', 'problem-markers'])
      for (const l of map.getStyle().layers) if (l.type === 'symbol' && !ours.has(l.id)) map.moveLayer(l.id)
      map.moveLayer('answer-areas-name')
      map.moveLayer('problem-markers')

      // A click on an incident selects it; a click anywhere else on the map clears the selection.
      map.on('click', (e) => {
        const problem = map.queryRenderedFeatures(e.point, { layers: ['problem-markers', 'problem-dots'] })[0]
        if (problem) return onSelectProblemRef.current?.(String(problem.properties.id))
        const hit = map.queryRenderedFeatures(e.point, { layers: ['incident-selected-pin', 'incidents', 'incident-badges'] })[0]
        onSelectRef.current(hit ? String(hit.properties.id) : null)
      })
      for (const layer of ['incident-selected-pin', 'incidents', 'incident-badges', 'problem-markers', 'problem-dots']) {
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
    const dot = dotStatus ? token(PROBLEM_STATUS[dotStatus].token) : null // an open problem's incidents all take the problem's color
    ;(map.getSource('incidents') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: incidents.map((i) => {
        const color = dot ?? token(GROUPS[groupOf(i.status)].token)
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
          properties: { id: i.id, color, dim: mix(color, token('--map-background'), KEEP), group: groupOf(i.status), icon: iconCategory(i.category), hl: highlight.has(i.id) },
        }
      }),
    })
  }, [ready, incidents, highlightIds, dotStatus])
  // An open problem shows its incidents as tiny dots at every zoom (no pins: a stack of identical pins is harder to read than dots around the marker).
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const dots = !!dotStatus
    map.setLayerZoomRange('incidents', 0, dots ? 24 : BADGE_ZOOM)
    map.setLayoutProperty('incident-badges', 'visibility', dots ? 'none' : 'visible')
    map.setPaintProperty('incidents', 'circle-radius', (dots ? 3.5 : ['step', ['zoom'], 3, 12, 5]) as never)
  }, [ready, dotStatus])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    ;(map.getSource('problems') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: problems.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id, count: p.occurrences_n, category: iconCategory(p.category), status: p.status, color: token(PROBLEM_STATUS[p.status].token) },
      })),
    })
  }, [ready, problems])
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
    map.fitBounds(bounds, { padding: fitPadding(wide), maxZoom: 15, duration: 700 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the answer changes, not when filters change the list
  }, [ready, highlightIds])

  // The localities of an answer: load the boundaries once, draw the listed ones (shade by count) and move the map to show them all.
  const localities = useRef<{ features: { properties: { code: number; name: string }; geometry: { type: string; coordinates: unknown } }[] } | null>(null)
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const source = map.getSource('answer-areas') as maplibregl.GeoJSONSource
    const names = map.getSource('answer-area-names') as maplibregl.GeoJSONSource
    // The basemap writes "Localidad X" for the same localities: hide it while ours are shown, so each name appears once.
    if (map.getLayer('place_suburbs')) map.setLayoutProperty('place_suburbs', 'visibility', areas.length ? 'none' : 'visible')
    if (!areas.length) {
      source.setData({ type: 'FeatureCollection', features: [] })
      names.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    let stale = false
    ;(async () => {
      localities.current ??= await fetch('/bogota-localities.geojson').then((r) => r.json())
      if (stale || !localities.current) return
      const wanted = new Set(areas.map((a) => a.code))
      const features = localities.current.features.filter((f) => wanted.has(f.properties.code))
      source.setData({ type: 'FeatureCollection', features } as never)
      names.setData({
        type: 'FeatureCollection',
        features: features.map((f) => ({ type: 'Feature', properties: { name: f.properties.name }, geometry: { type: 'Point', coordinates: labelPoint(f.geometry.type, f.geometry.coordinates) } })),
      })
      const bounds = new maplibregl.LngLatBounds()
      const extend = (c: unknown): void => {
        if (Array.isArray(c) && typeof c[0] === 'number') bounds.extend(c as [number, number])
        else (c as unknown[]).forEach(extend)
      }
      for (const f of features) extend(f.geometry.coordinates)
      if (!bounds.isEmpty()) {
        const wide = map.getContainer().clientWidth > 700
        map.fitBounds(bounds, { padding: fitPadding(wide), maxZoom: 13, duration: 700 })
      }
    })()
    return () => {
      stale = true
    }
  }, [ready, areas])

  // A bar of the answer under the pointer: its locality's outline turns bright.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setFilter('answer-areas-focus', ['==', ['get', 'code'], focusCode ?? -1])
    map.setPaintProperty('answer-areas-fill', 'fill-opacity', ['case', ['==', ['get', 'code'], focusCode ?? -1], LOCALITY_FILL_FOCUS, LOCALITY_FILL])
  }, [ready, focusCode, areas])

  // A bar of the answer clicked: zoom in on that locality.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !zoomTo) return
    let stale = false
    ;(async () => {
      // The boundaries are also needed when no answer is on the map (a Stat Card was clicked), so load them here too.
      localities.current ??= await fetch('/bogota-localities.geojson').then((r) => r.json())
      const f = localities.current?.features.find((x) => x.properties.code === zoomTo.code)
      if (stale || !f) return
      const bounds = new maplibregl.LngLatBounds()
      const extend = (c: unknown): void => {
        if (Array.isArray(c) && typeof c[0] === 'number') bounds.extend(c as [number, number])
        else (c as unknown[]).forEach(extend)
      }
      extend(f.geometry.coordinates)
      const wide = map.getContainer().clientWidth > 700
      map.fitBounds(bounds, { padding: fitPadding(wide), maxZoom: 14, duration: 700 })
    })()
    return () => {
      stale = true
    }
  }, [ready, zoomTo])

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

  // Test (owner, 2026-10-30): opening an incident flies the camera to it with GSAP, easing the centre and the zoom together; any touch of the map stops it. Closing it flies back to where the map was before (a conscious decision to leave it).
  const home = useRef<{ lng: number; lat: number; zoom: number } | null>(null)
  useEffect(() => {
    const map = mapRef.current
    const target = selectedId ? incidents.find((i) => i.id === selectedId) : selectedProblemId ? problems.find((p) => p.id === selectedProblemId) : null
    if (!ready || !map) return
    const from = { lng: map.getCenter().lng, lat: map.getCenter().lat, zoom: map.getZoom() }
    let to: typeof from | null = null
    if (target) {
      home.current ??= { ...from }
      to = { lng: target.lng, lat: target.lat, zoom: Math.max(from.zoom, selectedId ? INCIDENT_ZOOM : PROBLEM_ZOOM) }
    } else if (home.current) {
      to = home.current
      home.current = null
    }
    if (!to) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dz = to.zoom - from.zoom
    if (Math.abs(dz) > MAX_FLY_ZOOM) {
      from.zoom = to.zoom - Math.sign(dz) * MAX_FLY_ZOOM
      map.jumpTo({ zoom: from.zoom })
    }
    const tween = gsap.to(from, {
      ...to,
      duration: still ? 0 : 0.5 + 0.4 * (Math.abs(to.zoom - from.zoom) / MAX_FLY_ZOOM), // 0.5 s for a short hop up to 0.9 s for the longest
      ease: 'sine.inOut', // peak speed 5 zoom levels/s and a soft start; power2.out peaked at 10 and started at full speed
      onUpdate: () => map.jumpTo({ center: [from.lng, from.lat], zoom: from.zoom }),
    })
    const stop = () => tween.kill()
    // On the container, not map.on, so the zoom buttons and the keyboard stop it too (the tween's jumpTo would override them).
    const box = map.getContainer()
    const events = ['pointerdown', 'wheel', 'keydown'] as const
    for (const e of events) box.addEventListener(e, stop, { passive: true })
    return () => {
      tween.kill()
      for (const e of events) box.removeEventListener(e, stop)
    }
  }, [ready, selectedId, selectedProblemId]) // eslint-disable-line react-hooks/exhaustive-deps -- only a new selection moves the camera, not a filter change

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
    <div role="region" aria-label="Incident map" className="absolute inset-x-0 top-0 bottom-14 desk:top-(--section-header-h) desk:bottom-0 desk:left-[var(--map-left)] desk:overflow-hidden">
      <div ref={container} className="size-full" />
    </div>
  )
}

function ListFallback({ incidents, selectedId, onSelect }: Pick<Props, 'incidents' | 'selectedId' | 'onSelect'>) {
  return (
    <div role="region" aria-label="Incident list" className="absolute inset-y-0 inset-x-0 overflow-y-auto px-4 pb-16 pt-16 desk:left-[calc(var(--map-left)+0.5rem)] desk:right-80 desk:pt-[calc(var(--section-header-h)+1.5rem)] desk:pb-4">
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
