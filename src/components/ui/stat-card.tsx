import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Trend } from '@/lib/trend'
import { ArrowDown, ArrowRight, ArrowUp, TrendDown } from '@phosphor-icons/react'
import { smoothPath, sparkPoints } from '@/lib/sparkline'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/** The trend mark (Figma Stat Trend, owner 2026-11-27): the arrow alone in a 24 px box at the right of the name, no fill: above `red-400` (14 px), about `blue-400`, low `yellow-400`, below `green-500` (12 px). */
// whole class strings, so Tailwind sees them
const SPARK = '[--spark:linear-gradient(90deg,var(--cobalt-700),var(--cobalt-300)_50.5%)]'
const SPARK_HOVER = 'enabled:hover:shadow-[0_0_0_2px_var(--neutral-400)] enabled:hover:[--spark:linear-gradient(90deg,var(--cobalt-500),var(--cobalt-300)_90.1%)]'
const SPARK_ON = 'shadow-[0_0_0_2px_var(--neutral-400)] [--spark:linear-gradient(90deg,var(--cobalt-500),var(--cobalt-300)_90.1%)]'
const GRAPH_H = 40 // Figma Graph / Vector 1 (owner's Figma, 2026-11-23: 40 px high; 50 in the seventh look of 2026-11-20; 48 in the sixth, 32 before)
const TREND = {
  above: { Icon: ArrowUp, text: 'Above usual', why: 'Reports in the last 30 days are 20 % or more higher than in the 30 days before.', icon: 'size-3.5 text-(--red-400)' },
  about: { Icon: ArrowRight, text: 'About usual', why: 'Reports in the last 30 days are within 20 % of the 30 days before.', icon: 'size-3 text-(--blue-400)' },
  low: { Icon: TrendDown, text: 'Low reporting', why: 'Fewer than 5 reports in the last 60 days: too few to tell a trend.', caution: 'Read the number with caution.', icon: 'size-3 text-(--yellow-400)' },
  below: { Icon: ArrowDown, text: 'Below usual', why: 'Reports in the last 30 days are 20 % or more lower than in the 30 days before.', icon: 'size-3 text-(--green-500)' },
} as const

/** A number with its name (Figma Stat Card, owner 2026-11-27): `neutral-900`, 4 px radius, 16 px padding, 12 px between the header (name and trend mark) and the number row (the number with "Reports" under it, and a 40 px graph). Default: a 1 px `neutral-500` line inside, the graph line `cobalt-700` to `cobalt-300` at the middle. Hover or selected: a 2 px `neutral-400` ring outside (so the grid must not clip it, `desk:overflow-visible` in `Dashboard.tsx`), the line `cobalt-500` to `cobalt-300`. The peak is a 4 px `cobalt-100` dot with a 2 px `neutral-900` ring. */
export function StatCard({ label, value, trend, selected, onClick, series }: { label: ReactNode; value: ReactNode; trend?: Trend; selected?: boolean; onClick?: () => void; series?: number[] }) {
  const Tag = onClick ? 'button' : 'div'
  const t = trend && TREND[trend]
  // The line is drawn at its real pixel size (no stretched viewBox, no non-scaling stroke): a gradient on a stretched, non-scaling stroke looked crackled in Chrome (owner, 2026-11-15).
  const box = useRef<HTMLSpanElement>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [series])
  const g = series && w > 0 ? sparkPoints(series, w, GRAPH_H) : null
  return (
    <Tag
      className={`@container flex min-w-0 flex-col gap-3 rounded-[4px] bg-(--neutral-900) p-4 text-left ${selected ? SPARK_ON : `shadow-[inset_0_0_0_1px_var(--neutral-500)] ${SPARK} ${SPARK_HOVER}`}`}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!selected } : {})}
    >
      <span className="flex h-6 items-center justify-between gap-2 px-px"> {/* Figma Header (owner's Figma, 2026-11-20, fifth look): the name and the trend mark only, 24 px high ("Reports" went back down to the number row) */}
        <span className="truncate text-subtitle text-(--fg-primary)">{label}</span>
        {t && (
          <TooltipProvider><Tooltip><TooltipTrigger asChild>
          <span className="grid size-6 shrink-0 place-items-center"> {/* Figma Stat Trend (owner, 2026-11-17, latest): a small filled box (radius 2) with the trend icon: above 24 px, `red-900` and `red-400`; about, low and below 20 px, `blue-900` / `blue-200`, `yellow-900` / `yellow-300`, `green-900` / `green-400`; the icon is 14 px in above and 12 in the rest; the Figma glyph `trend-top` is an up arrow (turned to the right for about and down for below), and low is the zigzag `trend-down`: Phosphor `ArrowUp`, `ArrowRight`, `TrendDown`, `ArrowDown` */}
            <t.Icon className={t.icon} aria-hidden />
            <span className="sr-only">{t.text}</span>
          </span>
          </TooltipTrigger><TooltipContent side="top" align="end"><p className="text-body-sm-strong text-(--fg-primary)">{t.text}</p><p>{t.why}</p>{'caution' in t && <p className="mt-1 text-body-sm-strong text-(--red-300)">{t.caution}</p>}</TooltipContent></Tooltip></TooltipProvider>
        )}
      </span>
      <span className="flex items-center gap-10 py-1.5"> {/* Figma Data (owner's Figma, 2026-11-20, ninth look, "surgical": items centered, 40 px between the number column and the graph, 6 px of padding above and under it (only under it before), 12 px under the header (20 before); the column is the number (32 px line) with "Reports" (caption) under it, 6 px apart (54 px), the graph 50 px high, so the row is 66 px */}
          <span className="flex flex-1 basis-0 flex-col gap-1.5">
            <span className="font-display-semi text-stat text-(--fg-emphasis)">{value}</span>
            <span className="px-px text-caption text-(--neutral-300)">Reports</span> {/* Figma wraps the label in a frame with 1 px at each side */}
          </span>
          {series && (
            <span className="hidden h-[40px] min-w-0 flex-1 basis-0 pr-2 @min-[140px]:block"> {/* Figma Graph (owner, 2026-11-15): 164 px at most, padding included */}
              <span ref={box} className="relative block h-full"> {/* Figma Vector 1 (owner, 2026-11-15, latest): Fill in width and height, so the line is as long as the Graph's inner box (96.5 px in a 257 px card) */}
                {g && (
                  <>
                    <div
                      role="img"
                      aria-label={`Peak: ${Math.max(...series!)} reports`}
                      className="absolute inset-0"
                      // Option 2 (owner, 2026-11-15): the line is a solid-color stroke used as a mask over a CSS gradient (`--spark`, set by the card's state), because the SVG gradient stroke looked crackled. 2 px, flat ends, mitered corners, drawn at the real pixel size.
                      style={{
                        background: 'var(--spark)',
                        mask: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${GRAPH_H}"><path d="${smoothPath(g.pts)}" fill="none" stroke="black" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`)}") 0 0 / ${w}px ${GRAPH_H}px no-repeat`,
                      }}
                    />
                    {/* the peak: the dot on the newest point */}
                    <span className="absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--cobalt-100) shadow-[0_0_0_2px_var(--neutral-900)]" style={{ left: g.pts[g.peak][0], top: g.pts[g.peak][1] }} aria-hidden />
                  </>
                )}
              </span>
            </span>
          )}
      </span>
    </Tag>
  )
}
