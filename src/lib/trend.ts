/** How a locality's last 30 days compare with the 30 before (Figma Stat Card, trend: above, about, low, below). `low` = too few reports to judge, so the number comes with a caution. */
export type Trend = 'above' | 'about' | 'low' | 'below'
/** The rule for `Trend`: under 5 reports in the 60 days is "low"; then +20 % or more is above, -20 % or less is below. */
export function trendOf(recent: number, before: number): Trend {
  if (recent + before < 5) return 'low'
  if (recent > before * 1.2) return 'above'
  if (recent < before * 0.8) return 'below'
  return 'about'
}

