type Ring = [number, number][]

const area = (r: Ring) => Math.abs(r.reduce((s, [x, y], i) => s + x * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * y, 0) / 2)

function inside(x: number, y: number, rings: Ring[]) {
  let c = false
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i]
    const [xj, yj] = r[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function edgeDistance(x: number, y: number, rings: Ring[]) {
  let best = Infinity
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [ax, ay] = r[j]
    const [bx, by] = r[i]
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)))
    best = Math.min(best, Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))))
  }
  return best
}

/**
 * One point inside a locality, as far from its edge as a grid search finds, to hang a single name on.
 * A polygon source gets its name drawn once per map tile it crosses, so the name goes on a point instead.
 * `coordinates` is a GeoJSON Polygon or MultiPolygon; the largest polygon is used.
 */
export function labelPoint(type: string, coordinates: unknown): [number, number] {
  const polys = (type === 'MultiPolygon' ? coordinates : [coordinates]) as Ring[][]
  const rings = polys.reduce((a, b) => (area(b[0]) > area(a[0]) ? b : a))
  const xs = rings[0].map((p) => p[0])
  const ys = rings[0].map((p) => p[1])
  let box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
  let best: [number, number] = [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2]
  let bestD = -1
  for (let pass = 0; pass < 2; pass++) {
    const N = 24
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const x = box.x0 + ((box.x1 - box.x0) * i) / N
      const y = box.y0 + ((box.y1 - box.y0) * j) / N
      if (!inside(x, y, rings)) continue
      const d = edgeDistance(x, y, rings)
      if (d > bestD) {
        bestD = d
        best = [x, y]
      }
    }
    const dx = (box.x1 - box.x0) / 12
    const dy = (box.y1 - box.y0) / 12
    box = { x0: best[0] - dx, x1: best[0] + dx, y0: best[1] - dy, y1: best[1] + dy }
  }
  return best
}
