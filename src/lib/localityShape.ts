// The outline of a locality as a tiny SVG path (owner's idea, 2026-11-07): for the Stat Card, so a locality's size and shape can be read at a glance.
// No imports, so the tests can load it without Supabase.

type Pt = [number, number]
export interface LocalityFeature {
  properties: { code: number }
  geometry: { type: string; coordinates: unknown }
}
export interface Shape {
  /** SVG path data, from (0, 0) to (w, h). */
  d: string
  w: number
  h: number
}

const COS = Math.cos((4.65 * Math.PI) / 180) // Bogotá's latitude: a degree of longitude is shorter than one of latitude

/** The outer ring of the largest polygon, in flat x / y (north up). */
function outerRing(g: LocalityFeature['geometry']): Pt[] {
  const polys = (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]) as Pt[][][]
  const size = (r: Pt[]) => Math.max(...r.map((p) => p[0])) - Math.min(...r.map((p) => p[0]))
  const ring = polys.map((p) => p[0]).reduce((a, b) => (size(b) > size(a) ? b : a))
  return ring.map(([lng, lat]) => [lng * COS, -lat])
}

/** Douglas-Peucker: drops the points that move the line by less than `tol`. */
export function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts
  const [a, b] = [pts[0], pts[pts.length - 1]]
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  let far = -1
  let at = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / len
    if (d > far) [far, at] = [d, i]
  }
  if (far <= tol) return [a, b]
  return [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)]
}

/** A closed ring starts and ends on the same point, which Douglas-Peucker cannot use as a baseline: split it at the point farthest from the start and simplify both halves. */
function simplifyRing(ring: Pt[], tol: number): Pt[] {
  let at = 0
  let far = -1
  ring.forEach((p, i) => {
    const d = Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1])
    if (d > far) [far, at] = [d, i]
  })
  return [...simplify(ring.slice(0, at + 1), tol).slice(0, -1), ...simplify(ring.slice(at), tol)]
}

/**
 * One path per locality, drawn inside a `box` px square.
 * `shared` false: every outline fills its box (shape only). `shared` true: one scale for all, set by the largest of `ref`
 * (all of them by default), so a small locality is drawn small; one bigger than the box is shrunk to fit it.
 */
/** Every outline `height` px tall, its width following its own proportion (owner's request, 2026-11-07). */
export function localityShapesByHeight(features: LocalityFeature[], height: number): Map<number, Shape> {
  const out = new Map<number, Shape>()
  for (const f of features) {
    const ring = outerRing(f.geometry)
    const x0 = Math.min(...ring.map((p) => p[0]))
    const y0 = Math.min(...ring.map((p) => p[1]))
    const scale = height / (Math.max(...ring.map((p) => p[1])) - y0)
    const pts = simplifyRing(ring.map(([x, y]): Pt => [(x - x0) * scale, (y - y0) * scale]), 0.3)
    out.set(f.properties.code, { d: `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`, w: Math.max(...pts.map((p) => p[0])), h: Math.max(...pts.map((p) => p[1])) })
  }
  return out
}

export function localityShapes(features: LocalityFeature[], box: number, shared: boolean, ref?: number[]): Map<number, Shape> {
  const rings = features.map((f) => ({ code: f.properties.code, ring: outerRing(f.geometry) }))
  const extent = (r: Pt[]) => Math.max(Math.max(...r.map((p) => p[0])) - Math.min(...r.map((p) => p[0])), Math.max(...r.map((p) => p[1])) - Math.min(...r.map((p) => p[1])))
  const biggest = Math.max(...rings.filter((r) => !ref || ref.includes(r.code)).map((r) => extent(r.ring)))
  const out = new Map<number, Shape>()
  for (const { code, ring } of rings) {
    const scale = Math.min(box / extent(ring), shared ? box / biggest : Infinity)
    const x0 = Math.min(...ring.map((p) => p[0]))
    const y0 = Math.min(...ring.map((p) => p[1]))
    const pts = simplifyRing(ring.map(([x, y]): Pt => [(x - x0) * scale, (y - y0) * scale]), 0.3)
    const w = Math.max(...pts.map((p) => p[0]))
    const h = Math.max(...pts.map((p) => p[1]))
    out.set(code, { d: `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`, w, h })
  }
  return out
}
