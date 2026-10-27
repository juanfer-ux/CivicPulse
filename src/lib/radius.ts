/** One incident radius: a circle that covers a group of incidents, in meters. */
export interface Circle {
  lng: number
  lat: number
  radius: number
}

const M_LAT = 110_574 // meters per degree of latitude near Bogotá
const M_LNG = 111_320 * Math.cos((4.65 * Math.PI) / 180)

/**
 * Groups points that are within `link` meters of each other (directly or through other points) and returns one circle per
 * wide group: centered on the group, big enough to cover every point plus `pad`, never under `min`.
 * A group whose circle is narrower than `minShow` is a tight hotspot and gets no circle of its own (owner, 2026-10-27), but
 * every point must end up inside a circle (owner, 2026-10-27): its points join the nearest wide group, which grows to cover them.
 * With no wide group at all there are no circles and the incidents show as plain pins.
 */
export function radiusGroups(points: { lng: number; lat: number }[], link = 1200, min = 150, pad = 80, minShow = 400): Circle[] {
  type P = { lng: number; lat: number }
  const dist = (a: P, b: P) => Math.hypot((a.lng - b.lng) * M_LNG, (a.lat - b.lat) * M_LAT)
  const circle = (g: P[]): Circle => {
    const c = { lng: g.reduce((s, p) => s + p.lng, 0) / g.length, lat: g.reduce((s, p) => s + p.lat, 0) / g.length }
    return { ...c, radius: Math.max(min, Math.max(...g.map((p) => dist(c, p))) + pad) }
  }
  const parent = points.map((_, i) => i)
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i])))
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) if (dist(points[i], points[j]) <= link) parent[root(i)] = root(j)
  const groups = new Map<number, P[]>()
  points.forEach((p, i) => groups.set(root(i), [...(groups.get(root(i)) ?? []), p]))
  const all = [...groups.values()]
  const wide = all.filter((g) => circle(g).radius >= minShow)
  if (!wide.length) return []
  const centers = wide.map(circle)
  for (const g of all) {
    if (wide.includes(g)) continue
    for (const p of g) {
      let k = 0
      centers.forEach((c, i) => { if (dist(p, c) < dist(p, centers[k])) k = i })
      wide[k].push(p)
    }
  }
  return wide.map(circle)
}

/** West, south, east, north of a circle, in degrees: lets the map fit the whole circle, not only its points. */
export const circleBounds = (c: Circle): [[number, number], [number, number]] => [
  [c.lng - c.radius / M_LNG, c.lat - c.radius / M_LAT],
  [c.lng + c.radius / M_LNG, c.lat + c.radius / M_LAT],
]
