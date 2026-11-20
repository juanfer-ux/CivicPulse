/** Reports per bucket for a Stat Card's graph (Figma Stat Card, 2026-11-12): the last `bins` x `binDays` days counted back from `end` (the newest report; the data is a fixed set, not live), oldest first. */
export function buckets(times: number[], end: number, bins = 5, binDays = 12): number[] {
  const out = new Array<number>(bins).fill(0)
  for (const t of times) {
    const i = bins - 1 - Math.floor((end - t) / (binDays * 86_400_000))
    if (i >= 0 && i < bins) out[i]++
  }
  return out
}

/** The graph's points in a w x h box (owner, 2026-11-20: the line fills the box like Figma's Vector 1, its lowest point on the bottom edge and its peak on the top, 1 px in each way for the 2 px stroke; it used to put a zero at the bottom, so a series that never reaches zero floated above it) and the index of the peak (the last one wins a tie, it is the newest). A flat series sits at the bottom. */
export function sparkPoints(series: number[], w: number, h: number) {
  const lo = Math.min(...series)
  const span = Math.max(...series) - lo
  const pts = series.map((v, i) => [(i / Math.max(1, series.length - 1)) * w, span ? h - 1 - ((v - lo) / span) * (h - 2) : h - 1] as const)
  return { pts, peak: series.lastIndexOf(Math.max(...series)) }
}
