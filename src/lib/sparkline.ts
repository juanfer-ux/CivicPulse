/** Reports per bucket for a Stat Card's graph (Figma Stat Card, 2026-11-12): the last `bins` x `binDays` days counted back from `end` (the newest report; the data is a fixed set, not live), oldest first. */
export function buckets(times: number[], end: number, bins = 5, binDays = 12): number[] {
  const out = new Array<number>(bins).fill(0)
  for (const t of times) {
    const i = bins - 1 - Math.floor((end - t) / (binDays * 86_400_000))
    if (i >= 0 && i < bins) out[i]++
  }
  return out
}

/** The graph's points in a w x h box (a peak sits at the top, a zero at the bottom) and the index of the peak (the last one wins a tie, it is the newest). */
export function sparkPoints(series: number[], w: number, h: number) {
  const max = Math.max(1, ...series)
  const pts = series.map((v, i) => [(i / Math.max(1, series.length - 1)) * w, h - (v / max) * h] as const)
  return { pts, peak: series.lastIndexOf(Math.max(...series)) }
}
