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
 * group: centered on the group, as wide as it needs to cover every point plus `pad`, never under `min`.
 * Used for the agent's answer: one radius per cluster instead of one ring per incident.
 */
export function radiusGroups(points: { lng: number; lat: number }[], link = 1200, min = 150, pad = 80): Circle[] {
  const dist = (a: { lng: number; lat: number }, b: { lng: number; lat: number }) => Math.hypot((a.lng - b.lng) * M_LNG, (a.lat - b.lat) * M_LAT)
  const parent = points.map((_, i) => i)
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i])))
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) if (dist(points[i], points[j]) <= link) parent[root(i)] = root(j)
  const groups = new Map<number, typeof points>()
  points.forEach((p, i) => groups.set(root(i), [...(groups.get(root(i)) ?? []), p]))
  return [...groups.values()].map((g) => {
    const c = { lng: g.reduce((s, p) => s + p.lng, 0) / g.length, lat: g.reduce((s, p) => s + p.lat, 0) / g.length }
    return { ...c, radius: Math.max(min, Math.max(...g.map((p) => dist(c, p))) + pad) }
  })
}
