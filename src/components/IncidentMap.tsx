import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { gsap } from 'gsap'
import { KEEP, mix, token } from '@/lib/tokens'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { hitsProblemMarker } from '@/lib/markerSizes'
import { PROBLEM_CIRCLE_PX, PROBLEM_SWITCH_ZOOMS, addBadges, addDots, addSelectedRing, addProblemMarkers, iconCategory, selectedRingId } from '@/lib/markerIcons'
import { labelPoint } from '@/lib/polygons'
import { circleAround, circleBounds, radiusGroups } from '@/lib/radius'
import type { Area } from '@/lib/agent'
import { groupOf, label, typeOf, type Incident } from '@/lib/incidents'
import type { ProblemRow } from '@/lib/problems'
import { GROUPS, PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'
import { ProblemHoverCard } from '@/components/ProblemHoverCard'
import { MapZoomControl } from '@/components/MapZoomControl'

// Free dark basemap (CARTO / OpenStreetMap), no API key. Swap the URL to change provider.
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Vite bundles the worker (with its shared chunk) so it also loads in production builds.
maplibregl.setWorkerUrl(workerUrl)

/** Zoom where small dots turn into icon badges. */
/** Room kept free around an answer when the map zooms to fit it. Desktop: top = answer banner 48 + 24 + Stat Cards 116 + 24 + filters 36 + 24; bottom = the legend (24 + 26) + 24; the sides 40. Phones: the filter bar on top, the bottom sheet under. */
/** The free area of the map (owner, 2026-11-06): what no floating component covers. Every floating box carries `data-float`; the ones on the left half or the top or bottom band push the map's own padding in, so the start view, flights and fits all centre on the free area. */
const freePadding = (map: maplibregl.Map) => {
  const box = map.getContainer().getBoundingClientRect()
  const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--map-pad')) || 16
  const p = { top: 0, bottom: 0, left: 0, right: 0 }
  for (const el of document.querySelectorAll('[data-float]')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0 || r.bottom < box.top || r.top > box.bottom) continue
    if (r.left > box.left + box.width * 0.6 && r.height > box.height * 0.3) p.right = Math.max(p.right, box.right - r.left + pad) // a tall box on the right: the modules' column (decision 0049)
    else if (r.right < box.left + box.width * 0.6 && r.height > box.height * 0.4) p.left = Math.max(p.left, r.right - box.left + pad) // a tall box on the left: the panels
    else if (r.top - box.top < box.height / 2) p.top = Math.max(p.top, r.bottom - box.top + pad) // stat cards, filters, banner
    else p.bottom = Math.max(p.bottom, box.bottom - r.top + pad) // chips, timeline
  }
  return p
}
/** Re-reads the panel width: it can change (dragged) without the map's own size changing. */
const setFree = (map: maplibregl.Map) => map.setPadding(map.getContainer().clientWidth > 700 ? freePadding(map) : { top: 100, bottom: 60, left: 0, right: 0 })
const fitPadding = () => ({ top: 40, bottom: 40, left: 40, right: 40 })

const BADGE_ZOOM = 13 // from here the plain squares become squares with the category icon (owner, 2026-10-30; was 14)
/** Zoom the camera flies to when an incident is opened. */
const INCIDENT_ZOOM = 15
/** Zoom the camera flies to when a recurrence is opened: close enough that its incidents (a few tens of metres around the marker) show as separate dots around the marker's tile. */
const PROBLEM_ZOOM = 18
const DOTS_ZOOM = 14 // from here every problem's incidents show as dots
/** The closest the map zooms (owner, 2026-10-30). The basemap has no more detail past zoom 15, so more zoom only stretches it. */
const MAX_ZOOM = 18
/** The map cannot zoom out past this (owner, 2026-10-30: zoom 11): Bogotá and its surroundings, no further. */
const MIN_ZOOM = 11
const NO_PROBLEMS: ProblemRow[] = []
/** The recurrence marker's image by zoom; with `sel` (the open recurrence's id) every other recurrence gets the toned-down image (opaque, like the incidents'). */
const problemImage = (sel: string | null) => ['step', ['zoom'], ...PROBLEM_CIRCLE_PX.flatMap((px, i) => { const id = (dim: boolean) => ['concat', 'problem-', ['get', 'category'], dim ? '-dim-' : '-', ['get', 'status'], `-${px}`]; return [...(i ? [PROBLEM_SWITCH_ZOOMS[i - 1]] : []), sel ? ['case', ['==', ['get', 'id'], sel], id(false), id(true)] : id(false)] })] as never
/** The plain square's image: one per size (step 0 below zoom 12, step 1 from 12); with `focus` (an expression) every incident but the focused one gets the toned-down image. */
const dotImage = (focus?: unknown[]) => {
  const id = (step: number, dim: boolean) => ['concat', 'dot-', dim ? 'dim-' : '', ['get', 'group'], `-${step}`]
  const at = (step: number) => (focus ? ['case', focus, id(step, false), id(step, true)] : id(step, false))
  return ['step', ['zoom'], at(0), 12, at(1)] as never
}
/** The square marker's image by zoom: step 0 below zoom 14, step 1 from 14 (BADGE_STEPS). With `focus` (an expression), every incident but the focused one gets the toned-down image. The zoom step stays at the top of the expression, as MapLibre requires. */
const badgeImage = (focus?: unknown[]) => {
  const id = (step: number, dim: boolean) => ['concat', 'badge-', ['get', 'icon'], dim ? '-dim-' : '-', ['get', 'group'], `-${step}`]
  const at = (step: number) => (focus ? ['case', focus, id(step, false), id(step, true)] : id(step, false))
  return ['step', ['zoom'], at(0), 14, at(1)] as never
}
const NO_DOTS = new Map<string, ProblemStatus>()
const NO_IDS: string[] = []
const MAX_FLY_ZOOM = 3 // motion comfort: the fly's length is scaled by the zoom distance in units of this many levels (owner, 2026-10-30: it was also the most animated, a farther trip jumping the rest first; 2026-10-31: the whole trip is animated)

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
/** Recurrence radius: its size in meters around the marker. */
const PROBLEM_RADIUS_M = 60
const PROBLEM_FILL_ALPHA = 0.024 // the radius fill and ring follow the owner's Figma Incident Radius (2026-10-30): fill 2.4 %, ring 0.5 px at 35 %...
const PROBLEM_RING_ALPHA = 0.2 // the ring is drawn 1 px wide at 20 % because a 0.5 px line at 35 % (the Figma value) is the same brightness but crackles on screen: half a pixel cannot be drawn evenly (measured: brightness varied 1 to 51 along the circle, against 9 to 36 for 1 px)
const PROBLEM_FILL_ALPHA_NEAR = 0.035 // ...and from zoom 16 up (owner, 2026-10-30) fill 3.5 % and ring 50 %, reached evenly over zoom 14 to 16
const PROBLEM_RING_ALPHA_NEAR = 0.5
const PROBLEM_ALPHA_ZOOM: [number, number] = [14, 16] // fill, ring opacity and ring weight change evenly from zoom 14 to 16 (owner, 2026-10-30: progressive, no jump)
const PROBLEM_RING_PX = 1
const PROBLEM_GLOW_ALPHA = 0.05 // the inner glow of a recurrence's ring (owner, 2026-11-07, from the /#glow gallery): thin bands inside the ring, easing in toward the edge, in the status color; the edge band's opacity
const PROBLEM_GLOW_N = 16 // thin bands so no step shows (4 wide ones looked like rings)
const PROBLEM_GLOW_BANDS = Array.from({ length: PROBLEM_GLOW_N }, (_, i) => [0.4 + (0.6 * i) / PROBLEM_GLOW_N, 0.4 + (0.6 * (i + 1)) / PROBLEM_GLOW_N]) // from the center, as fractions of the radius
/** While a recurrence is open (owner, 2026-11-09) everything of the other recurrences (ring, fill, glow, marker, pulse, dots) is toned down to KEEP, like the other incidents when one incident is open; `sel` is the open recurrence's id. */
const dimmed = (v: number, sel: string | null) => (sel ? ['case', ['==', ['get', 'id'], sel], v, v * KEEP] : v) as never
const ringFill = (sel: string | null) => ['interpolate', ['linear'], ['zoom'], PROBLEM_ALPHA_ZOOM[0], dimmed(PROBLEM_FILL_ALPHA, sel), PROBLEM_ALPHA_ZOOM[1], dimmed(PROBLEM_FILL_ALPHA_NEAR, sel)] as never
const ringStroke = (sel: string | null) => ['interpolate', ['linear'], ['zoom'], PROBLEM_ALPHA_ZOOM[0], dimmed(PROBLEM_RING_ALPHA, sel), PROBLEM_ALPHA_ZOOM[1], dimmed(PROBLEM_RING_ALPHA_NEAR, sel)] as never
const glowAlpha = (i: number) => PROBLEM_GLOW_ALPHA * ((i + 1) / PROBLEM_GLOW_N) ** 2
const PROBLEM_RING_BLUR = 0.01 // the ring's circle-blur (owner, 2026-11-01), relative to its radius (1 = fully soft): about 0.4 px at the smallest ring and 1 px at a 100 px radius; softens the edge a little
const PROBLEM_RADIUS_ZOOM = 11 // the radius shows from the start (owner, 2026-10-30; it faded in from zoom 12): the map's minimum zoom
const PROBLEM_RADIUS_RAMP_ZOOM = 12 // below this it keeps its starting size on screen, and it grows from here
const PROBLEM_RADIUS_FULL_ZOOM = 14 // and reaches the minimum size on screen here
const PROBLEM_RADIUS_MIN_PX = 36 // from the full-opacity zoom it never draws smaller than this on screen (the marker is 20 px in radius)
const PROBLEM_RADIUS_START_PX = 72 // its size on screen up to the ramp zoom (owner, 2026-10-30: bigger at the start, it was 20, 48, then 60), shrinking to the minimum at zoom 14
/** The recurrence ring's radius in px at each whole zoom (72 px up to zoom 12, shrinking to 36 at 14, then its real size of 60 m); the ring layers and the pulse both read it. */
const PROBLEM_STOPS = Array.from({ length: 12 }, (_, k) => {
  const z = PROBLEM_RADIUS_ZOOM + k
  const floor = PROBLEM_RADIUS_START_PX + (PROBLEM_RADIUS_MIN_PX - PROBLEM_RADIUS_START_PX) * Math.min(1, Math.max(0, (z - PROBLEM_RADIUS_RAMP_ZOOM) / (PROBLEM_RADIUS_FULL_ZOOM - PROBLEM_RADIUS_RAMP_ZOOM)))
  return [z, Math.max(floor, PROBLEM_RADIUS_M * METERS_TO_PX_Z0 * 2 ** z)] as const
})
/** The same curve at any zoom: MapLibre's exponential (base 2) interpolation between the stops. */
const problemRingPx = (zoom: number) => {
  const z = Math.min(Math.max(zoom, PROBLEM_STOPS[0][0]), PROBLEM_STOPS[PROBLEM_STOPS.length - 1][0] - 1e-9)
  const i = PROBLEM_STOPS.findIndex(([zk], k) => z >= zk && z < PROBLEM_STOPS[k + 1][0])
  const [z0, v0] = PROBLEM_STOPS[i]
  const [z1, v1] = PROBLEM_STOPS[i + 1]
  return v0 + (v1 - v0) * ((2 ** (z - z0) - 1) / (2 ** (z1 - z0) - 1))
}

const BOGOTA: [number, number] = [-74.09, 4.65]
const NO_SPOTS: string[][] = []
const SPOT_MIN_PX = 72 // radius on screen of a repeated location's circle at the farthest zoom (twice the recurrence ring's minimum; owner, 2026-11-08: bigger), so every spot is visible from the whole-city view
const SPOT_MIN_M = 120 // and its real size when zoomed in (twice the recurrence's 60 m)
/** One radius per group of incidents; for spots, one circle per spot around all its reports (at least 120 m). */
const spotGroups = (pts: (Incident)[], spots: string[][]) =>
  spots.length ? spots.map((ids) => pts.filter((i) => ids.includes(i.id))).filter((g) => g.length).map((g) => circleAround(g, SPOT_MIN_M)) : radiusGroups(pts)

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
  /** The answer is about specific spots: one small radius (like a recurrence's) around each spot. */
  spots?: string[][]
  /** Locality whose outline lights up (a bar of the answer is under the pointer). */
  focusCode?: number | null
  /** Locality to zoom to (a bar was clicked); n changes on every click. */
  zoomTo?: { code: number; n: number } | null
  onSelect: (id: string | null) => void
  /** Recurrences to draw as one marker each (the Recurrences view); the incidents prop then holds only the open problem's incidents. */
  problems?: ProblemRow[]
  selectedProblemId?: string | null
  /** A report of the open recurrence opened in its history (owner, 2026-11-09): its dot gets the ring, the other dots of the recurrence tone down; the camera does not move. */
  openReportId?: string | null
  onSelectProblem?: (id: string) => void
  /** Fires when a camera flight to a selection ends (or a touch stops it): the problem panel waits for it before it slides in. */
  onFlightEnd?: () => void
  /** Pixels at the map's left edge that a side panel covers (the map no longer shrinks for the panel): the camera keeps the target centered in the part that shows. */
  /** Incidents that belong to a problem, with its status: they draw as tiny dots in that status color (no pins) around the problem's marker, always from zoom 14 and at every zoom for the open problem. */
  dotStatusById?: Map<string, ProblemStatus>
  /** Ids of the open problem's incidents: their dots show at every zoom. */
  problemIncidentIds?: string[]
}

/** MapLibre caps the canvas at 4096 px by default and quietly lowers the pixel ratio to fit, so a wide window (the owner's 3440 px monitor: 2576 px of map × 2 = 5152) drew at 1.59x and the crisp marker edges crackled again (2026-11-05). Allow what this GPU can do. */
const MAX_CANVAS = (() => {
  const gl = document.createElement('canvas').getContext('webgl2')
  const max = gl ? (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) : 4096
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  return Math.min(Math.max(max, 4096), 16384)
})()

export function IncidentMap({ incidents, selectedId, highlightIds, areas, spots = NO_SPOTS, focusCode, zoomTo, onSelect, problems = NO_PROBLEMS, selectedProblemId = null, openReportId = null, onSelectProblem, onFlightEnd, dotStatusById = NO_DOTS, problemIncidentIds = NO_IDS }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const onSelectProblemRef = useRef(onSelectProblem)
  const onFlightEndRef = useRef(onFlightEnd)
  const [ready, setReady] = useState(false)
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)

  useEffect(() => {
    onSelectRef.current = onSelect
    onSelectProblemRef.current = onSelectProblem
    onFlightEndRef.current = onFlightEnd
  }, [onSelect, onSelectProblem, onFlightEnd])

  useEffect(() => {
    if (!WEBGL2) return
    const map = new maplibregl.Map({ container: container.current!, style: STYLE, center: BOGOTA, zoom: START_ZOOM, minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, attributionControl: { compact: true }, canvasContextAttributes: { antialias: true }, pixelRatio: Math.max(2, window.devicePixelRatio), maxCanvasSize: [MAX_CANVAS, MAX_CANVAS] }) // (owner, 2026-10-30, edges looked crackled) antialias smooths the edges of lines, outlines and shapes, and pixelRatio draws the map at twice the screen's resolution on ordinary 1x screens, which the browser then shrinks smoothly; the marker images are drawn for pixelRatio 2
    // On first entry the container can still be settling its size when the map is created, so once the style has loaded we re-measure it and set the start view again, unless the person has already moved the map.
    let moved = false
    map.on('movestart', (e) => e.originalEvent && (moved = true))
    map.on('load', async () => {
      map.resize()
      setFree(map)
      map.on('resize', () => setFree(map))
      if (!moved) map.jumpTo({ center: BOGOTA, zoom: START_ZOOM })
      await addBadges(map)
      addDots(map)
      addSelectedRing(map)
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
        type: 'symbol',
        source: 'incidents',
        maxzoom: BADGE_ZOOM,
        layout: {
          'icon-image': dotImage(),
          // plain squares (owner, 2026-10-30): 8 px across below zoom 12, 10 px from 12 up to 13 (until the markers). Each size is its own image drawn at that size (PLAIN_PX), so the image is shown as it is, not shrunk.
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
        paint: { 'icon-opacity': 0.85 },
      })
      // The open problem's own incidents (owner, 2026-10-30): small dots in the problem's status color at every zoom, around its marker (no pins: a stack of identical pins is harder to read than dots).
      map.addLayer({
        id: 'problem-incident-dots',
        type: 'circle',
        source: 'incidents',
        filter: ['==', ['get', 'pi'], true],
        paint: {
          'circle-radius': 5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1,
          'circle-stroke-color': token('--map-dot-outline'),
          // the open problem's dots show at every zoom, the others only from zoom 14
          'circle-opacity': ['step', ['zoom'], ['case', ['get', 'po'], 1, 0], DOTS_ZOOM, 1],
          'circle-stroke-opacity': ['step', ['zoom'], ['case', ['get', 'po'], 1, 0], DOTS_ZOOM, 1],
        },
      })
      // From zoom 14 (owner's choice, 2026-10-26) the dots become big badges with the category's icon, like Waze.
      map.addLayer({
        id: 'incident-badges',
        type: 'symbol',
        source: 'incidents',
        minzoom: BADGE_ZOOM,
        layout: {
          'icon-image': badgeImage(),
          'icon-size': 1, // square markers (owner, 2026-10-30): 24 px from zoom 13, 30 px from 14 up (BADGE_STEPS); each size is its own image, shown as it is
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
          'icon-image': badgeImage(),
          'icon-size': 1, // square markers (owner, 2026-10-30): 24 px from zoom 13, 30 px from 14 up (BADGE_STEPS); each size is its own image, shown as it is
          'icon-allow-overlap': true,
        },
      })
      // The agent's answer (owner, 2026-10-27): one incident radius per group of incidents instead of one ring per incident. Its size is in meters, so it is a real area at every zoom. It draws under the dots and pins.
      map.addSource('answer-radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      // Figma Incident Radius (agent): a radial gradient fill, clear up to half the radius and strongest at the edge, and a 1 px ring. A circle layer cannot hold a gradient, so the fill is three bands (outer half of the radius) stacked as wide strokes, each a bit stronger than the one inside it.
      // Under the basemap's place and street names (owner, 2026-10-27), so the names stay readable inside a radius; still above roads, land and buildings.
      const underLabels = map.getStyle().layers.find((l) => l.type === 'symbol')?.id
      const px = (f: number) => ['interpolate', ['exponential', 2], ['zoom'], ...Array.from({ length: 23 }, (_, z) => [z, ['max', ['*', ['get', 'r'], METERS_TO_PX_Z0 * 2 ** z * f], ['*', ['get', 'minpx'], f]]]).flat()] as never // zoom must stay the input of the top-level interpolate; minpx: a spot's circle never draws smaller than this on screen, so it shows at every zoom
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
      // Recurrence radius (owner, 2026-10-30): the same radius look as the agent's answer, one per problem in its status color, so a problem reads as an area and not just a marker. Real meters, under the dots and names.
      map.addSource('problem-radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      // From the first zoom (11, owner 2026-10-30; it used to fade in from 12) at full strength: 72 px in radius up to zoom 12, shrinking to 36 px at zoom 14, then to its real size (60 m, about 50 px in radius at zoom 17). Until the real size is bigger it never draws under that minimum on screen.
      const problemPx = (f: number) => ['interpolate', ['exponential', 2], ['zoom'], ...PROBLEM_STOPS.flatMap(([z, v]) => [z, v * f])] as never
      // The look is the owner's Figma Incident Radius (2026-10-30): a flat fill at 2.4 % and a ring, in the problem's status color; the ring is drawn 1 px at 20 % (the same brightness as the Figma 0.5 px at 35 %, without the crackle); from zoom 16 up the fill is 3.5 % and the ring 1 px at 50 % (reached evenly over zoom 14 to 16).
      map.addLayer(
        { id: 'problem-radius-fill', type: 'circle', source: 'problem-radius', minzoom: PROBLEM_RADIUS_ZOOM, paint: { 'circle-radius': problemPx(1), 'circle-color': ['get', 'color'], 'circle-opacity': ringFill(null) } },
        underLabels,
      )
      map.addLayer(
        { id: 'problem-radius-ring', type: 'circle', source: 'problem-radius', minzoom: PROBLEM_RADIUS_ZOOM, paint: { 'circle-radius': problemPx(1), 'circle-opacity': 0, 'circle-blur': PROBLEM_RING_BLUR, 'circle-stroke-width': PROBLEM_RING_PX, 'circle-stroke-color': ['get', 'color'], 'circle-stroke-opacity': ringStroke(null) } },
        underLabels,
      )
      // Inner glow (owner, 2026-11-07): the same stacked-strokes trick as the answer radius, inside the ring of every recurrence, strongest at the edge. A few static circle layers, nothing animated.
      PROBLEM_GLOW_BANDS.forEach(([from, to], i) =>
        map.addLayer(
          {
            id: `problem-radius-glow-${i}`,
            type: 'circle',
            source: 'problem-radius',
            minzoom: PROBLEM_RADIUS_ZOOM,
            paint: { 'circle-radius': problemPx((from + to) / 2), 'circle-opacity': 0, 'circle-stroke-width': problemPx(to - from), 'circle-stroke-color': ['get', 'color'], 'circle-stroke-opacity': glowAlpha(i) },
          },
          underLabels,
        ),
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
        type: 'symbol',
        source: 'incidents',
        filter: ['==', ['get', 'id'], ''],
        layout: {
          // The selected incident is always a marker (see 'incident-selected-pin'); its ring is a square (owner, 2026-10-30) around it, at any zoom: 10 px bigger than the marker, 34 px across below zoom 14, 40 from 14.
          'icon-image': ['step', ['zoom'], selectedRingId(0), 14, selectedRingId(1)],
          'icon-size': 1,
          'icon-allow-overlap': true,
        },
      })
      // A strong glow only on the selected incident (owner, 2026-11-07; the selected recurrence marker has none, tried and removed the same day): two soft halos (a wide faint one and a tight bright one) in its own status color. A halo is a blurred stroke starting at the marker's edge, so the light shows around it (a plain blurred disc hides behind the marker). Their filter matches one feature, so they draw one shape; under every dot and marker.
      const haloLayer = (id: string, source: string, radius: unknown, width: number, opacity: number, blur: number) =>
        map.addLayer({ id, type: 'circle', source, filter: ['==', ['get', 'id'], ''], paint: { 'circle-radius': radius as never, 'circle-opacity': 0, 'circle-stroke-width': width, 'circle-stroke-color': ['get', 'color'], 'circle-stroke-opacity': opacity, 'circle-blur': blur } }, 'problem-incident-dots')
      const INCIDENT_GLOW_ALPHA = 0.06 // owner, 2026-11-07: both halos at 0.06 (they were 0.7 and 1)
      haloLayer('incident-selected-glow', 'incidents', 17, 56, INCIDENT_GLOW_ALPHA, 0.8)
      haloLayer('incident-selected-glow-core', 'incidents', 17, 24, INCIDENT_GLOW_ALPHA, 0.7)
      // Recurrences (decision 0030; Figma Recurrence Marker): one marker per problem, a light disc with the occurrence count over it, a status-colored ring and a category badge. The incidents of the open problem draw with the normal incident layers.
      map.addSource('problems', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'problem-markers',
        type: 'symbol',
        source: 'problems',
        layout: {
          // The circle follows a smooth curve by zoom (28 px at zoom 12 and below, 32 at 13, 42 from 14; PROBLEM_CIRCLE_BY_ZOOM), drawn as one crisp image per 2 px (PROBLEM_CIRCLE_PX) so no image is ever shrunk by a fraction, which made the outlines look crackled (owner, 2026-10-30). Each image is centered on its circle, so no offset is needed.
          'icon-image': problemImage(null),
          'icon-size': 1,
          'icon-allow-overlap': true, // a problem is never hidden; where markers overlap, the one with more occurrences draws on top
          'symbol-sort-key': ['get', 'count'],
        },
      })
      // Layer order, top to bottom (owner, 2026-10-30; it was text on top): the problems, the selected incident's ring and pin, the incident markers and dots, then all the text (the basemap's names, then ours), the locality highlights (fill, outline, radius), and under them the rest of the basemap. Nothing draws over an incident or a problem, not even a street name. The basemap's text layers sit under our dots by default, so lift them first, then lift ours over them.
      const ours = new Set(['incident-badges', 'incident-selected-pin', 'answer-areas-name', 'problem-markers'])
      for (const l of map.getStyle().layers) if (l.type === 'symbol' && !ours.has(l.id)) map.moveLayer(l.id)
      for (const id of ['answer-areas-name', 'problem-incident-dots', 'incidents', 'incident-badges', 'incident-selected-pin', 'incident-selected', 'problem-markers']) map.moveLayer(id)

      // A click on an incident selects it; a click anywhere else on the map clears the selection.
      map.on('click', (e) => {
        // A problem counts only if the tap is on its visible circle or triangle, not in the empty corners of its image; a finger also gets a small box (12 px) around the tap to find the nearest incident (owner, 2026-11-01).
        const size = PROBLEM_CIRCLE_PX[PROBLEM_SWITCH_ZOOMS.filter((w) => map.getZoom() >= w).length]
        const problem = map.queryRenderedFeatures(e.point, { layers: ['problem-markers'] }).find((f) => {
          const at = map.project((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
          return hitsProblemMarker(e.point.x - at.x, e.point.y - at.y, size)
        })
        if (problem) return onSelectProblemRef.current?.(String(problem.properties.id))
        const pad = window.matchMedia('(pointer: coarse)').matches ? 12 : 0
        const box: [[number, number], [number, number]] = [[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]]
        const dist = (f: maplibregl.MapGeoJSONFeature) => {
          const at = map.project((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
          return Math.hypot(e.point.x - at.x, e.point.y - at.y)
        }
        const hit = map.queryRenderedFeatures(box, { layers: ['incident-selected-pin', 'incidents', 'incident-badges', 'problem-incident-dots'] }).sort((a, b) => dist(a) - dist(b))[0]
        onSelectRef.current(hit ? String(hit.properties.id) : null)
      })
      for (const layer of ['incident-selected-pin', 'incidents', 'incident-badges', 'problem-incident-dots', 'problem-markers']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'))
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''))
      }
      // The small problem card follows the pointer over a problem, circle or marker, at any zoom.
      for (const layer of ['problem-markers']) {
        map.on('mousemove', layer, (e) => setHover(e.features?.[0] ? { id: String(e.features[0].properties.id), x: e.point.x, y: e.point.y } : null))
        map.on('mouseleave', layer, () => setHover(null))
      }
      setReady(true)
    })
    mapRef.current = map
    const clear = (e: KeyboardEvent) => e.key === 'Escape' && onSelectRef.current(null)
    const onFloat = () => map.loaded() && setFree(map) // a floating box appeared or went without the map resizing (the modules' column)
    window.addEventListener('keydown', clear)
    window.addEventListener('civic:float', onFloat)
    return () => {
      window.removeEventListener('keydown', clear)
      window.removeEventListener('civic:float', onFloat)
      setReady(false)
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const highlight = new Set(highlightIds)
    const own = new Set(problemIncidentIds)
    ;(map.getSource('incidents') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: incidents.map((i) => {
        const ps = dotStatusById.get(i.id)
        const pi = !!ps
        const color = ps ? token(PROBLEM_STATUS[ps].token) : token(GROUPS[groupOf(i.status)].token)
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
          properties: { id: i.id, color, dim: mix(color, token('--map-background'), KEEP), group: groupOf(i.status), icon: iconCategory(i.category), hl: highlight.has(i.id), pi, po: own.has(i.id) },
        }
      }),
    })
  }, [ready, incidents, highlightIds, dotStatusById, problemIncidentIds])

  // Recurrences: one marker each, whatever the zoom.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    ;(map.getSource('problems') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: problems.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id, count: p.occurrences_n, category: iconCategory(p.category), status: p.status },
      })),
    })
    ;(map.getSource('problem-radius') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: problems.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id, r: PROBLEM_RADIUS_M, color: token(PROBLEM_STATUS[p.status].token) },
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
    for (const c of spotGroups(pts, spots)) for (const corner of circleBounds(c)) bounds.extend(corner) // the circles too, not only their incidents
    setFree(map)
    map.fitBounds(bounds, { padding: fitPadding(), maxZoom: 15, duration: 700 })
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
        setFree(map)
    map.fitBounds(bounds, { padding: fitPadding(), maxZoom: 13, duration: 700 })
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
      setFree(map)
    map.fitBounds(bounds, { padding: fitPadding(), maxZoom: 14, duration: 700 })
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
    const circles = highlightIds.length && !areas.length ? spotGroups(incidents.filter((i) => highlight.has(i.id)), spots) : []
    ;(map.getSource('answer-radius') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: circles.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lng, c.lat] }, properties: { r: c.radius, minpx: spots.length ? SPOT_MIN_PX : 0 } })),
    })
  }, [ready, incidents, highlightIds, areas, spots])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setFilter('incident-selected', ['==', ['get', 'id'], selectedId ?? openReportId ?? ''])
    map.setFilter('incident-selected-pin', ['==', ['get', 'id'], selectedId ?? ''])
    for (const id of ['incident-selected-glow', 'incident-selected-glow-core']) map.setFilter(id, ['==', ['get', 'id'], selectedId ?? ''])
  }, [ready, selectedId, openReportId])

  // A very subtle pulse around the ring of every Active recurrence (owner, 2026-11-07): a thin ring in the status color that grows a little and fades, a few seconds apart, each one out of step with the others. DOM markers with a CSS animation (index.css), so the map is not redrawn for it; each is sized to the ring at the current zoom.
  const pulses = useRef(new Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>())
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const live = problems.filter((p) => p.status === 'active')
    const have = pulses.current
    for (const [id, m] of have) {
      if (live.some((p) => p.id === id)) continue
      m.marker.remove()
      have.delete(id)
    }
    const size = () => `${2 * problemRingPx(map.getZoom())}px`
    live.forEach((p, i) => {
      if (have.has(p.id)) return
      const el = document.createElement('div')
      el.className = 'problem-pulse'
      el.style.setProperty('--c', token(PROBLEM_STATUS[p.status].token))
      el.style.setProperty('--d', `${(i * 1.3) % 5}s`)
      el.style.setProperty('--s', size())
      have.set(p.id, { marker: new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map), el })
    })
    const onZoom = () => {
      const s = size()
      for (const { el } of have.values()) el.style.setProperty('--s', s)
    }
    map.on('zoom', onZoom)
    return () => void map.off('zoom', onZoom)
  }, [ready, problems])

  // The open recurrence's look (owner, 2026-11-09): its ring, marker, pulse and incident dots stay as they are, the other recurrences are toned down to KEEP (their dots keep the dim color of the incidents' own tone-down); nothing is dimmed when none is open.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const sel = selectedProblemId
    map.setPaintProperty('problem-radius-fill', 'circle-opacity', ringFill(sel))
    map.setPaintProperty('problem-radius-ring', 'circle-stroke-opacity', ringStroke(sel))
    PROBLEM_GLOW_BANDS.forEach((_, i) => map.setPaintProperty(`problem-radius-glow-${i}`, 'circle-stroke-opacity', dimmed(glowAlpha(i), sel)))
    map.setLayoutProperty('problem-markers', 'icon-image', problemImage(sel))
    map.setPaintProperty('problem-incident-dots', 'circle-color', (sel ? (openReportId ? ['case', ['==', ['get', 'id'], openReportId], ['get', 'color'], ['get', 'dim']] : ['case', ['get', 'po'], ['get', 'color'], ['get', 'dim']]) : ['get', 'color']) as never)
    for (const [id, { el }] of pulses.current) el.style.opacity = sel && id !== sel ? String(KEEP) : ''
  }, [ready, selectedProblemId, openReportId, problems])

  // Test (owner, 2026-10-30): opening an incident flies the camera to it with GSAP, easing the centre and the zoom together; any touch of the map stops it. Closing it flies back to where the map was before (a conscious decision to leave it).
  const home = useRef<{ lng: number; lat: number; zoom: number } | null>(null)
  useEffect(() => {
    const map = mapRef.current
    const target = selectedId ? incidents.find((i) => i.id === selectedId) : selectedProblemId ? problems.find((p) => p.id === selectedProblemId) : null
    if (!ready || !map) return
    setFree(map)
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
    const dz = to.zoom - from.zoom // the whole trip is animated, however far (owner, 2026-10-31: the instant jump to 3 levels short felt like starting from somewhere else)
    const start = { ...from }
    // The center moves with the zoom's own growth (2^zoom), so the target keeps drifting steadily toward the middle of the screen instead of swinging outward first.
    const share = (p: number) => (Math.abs(dz) < 1e-6 ? p : (2 ** (dz * p) - 1) / (2 ** dz - 1))
    const progress = { p: 0 }
    const tween = gsap.to(progress, {
      p: 1,
      onComplete: () => onFlightEndRef.current?.(),
      duration: still ? 0 : Math.min(1.2, 0.5 + 0.4 * (Math.abs(dz) / MAX_FLY_ZOOM)), // 0.5 s for a short hop up to 1.2 s for the longest
      ease: 'sine.inOut', // peak speed 5 zoom levels/s and a soft start; power2.out peaked at 10 and started at full speed
      onUpdate: () => {
        const u = share(progress.p)
        map.jumpTo({ center: [start.lng + (to.lng - start.lng) * u, start.lat + (to.lat - start.lat) * u], zoom: start.zoom + dz * progress.p })
      },
    })
    const stop = () => {
      if (tween.isActive()) {
        tween.kill()
        onFlightEndRef.current?.()
      }
    }
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
    // the open problem's incidents have their own dot layer; the normal dot and pin layers skip them (and, while an answer shows, keep only its incidents)
    const normal = ['!=', ['get', 'pi'], true]
    const filter = (answer ? ['all', normal, answer] : normal) as never
    map.setFilter('incidents', filter)
    map.setFilter('incident-badges', filter)
    const focus = selectedId ? ['==', ['get', 'id'], selectedId] : selectedProblemId ? ['==', ['get', 'po'], true] : null // an open recurrence: only its incidents stay lit (they draw in their own dot layer), every other incident is toned down
    map.setLayoutProperty('incidents', 'icon-image', dotImage(focus ?? undefined))
    map.setLayoutProperty('incident-badges', 'icon-image', badgeImage(focus ?? undefined))
    map.setLayoutProperty('incident-badges', 'symbol-sort-key', (focus ? ['case', focus, 1, 0] : 0) as never)
  }, [ready, selectedId, selectedProblemId, highlightIds])

  if (!WEBGL2) return <ListFallback incidents={incidents} selectedId={selectedId} onSelect={onSelect} />

  // Wrapper positions the map: maplibre's unlayered CSS overrides Tailwind's `absolute` on the map element itself.
  return (
    <div role="region" aria-label="Incident map" className="absolute inset-x-0 top-0 bottom-14 desk:top-(--section-header-h) desk:bottom-0 desk:overflow-hidden">
      <div ref={container} className="size-full" />
      <MapZoomControl map={ready ? mapRef.current : null} min={MIN_ZOOM} max={MAX_ZOOM} home={{ center: BOGOTA, zoom: START_ZOOM }} />
      {hover && problems.some((p) => p.id === hover.id) && (
        <ProblemHoverCard
          problem={problems.find((p) => p.id === hover.id)!}
          className="absolute z-30"
          // to the right of the pointer, or to its left near the right edge, and kept above the bottom edge
          style={{
            top: Math.max(8, Math.min(hover.y - 12, (container.current?.clientHeight ?? 0) - 130)),
            ...(hover.x > (container.current?.clientWidth ?? 0) - 290 ? { right: (container.current?.clientWidth ?? 0) - hover.x + 18 } : { left: hover.x + 18 }),
          }}
        />
      )}
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
              <span className="size-3 shrink-0 rounded-full" style={{ background: `var(${GROUPS[groupOf(i.status)].swatch})` }} aria-hidden />
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
