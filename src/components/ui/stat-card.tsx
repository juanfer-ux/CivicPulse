import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Trend } from '@/lib/trend'
import { ArrowDown, ArrowRight, ArrowUp, TrendDown } from '@phosphor-icons/react'
import { sparkPoints } from '@/lib/sparkline'

/** The trend mark (Figma Stat Trend `above`, owner, 2026-11-17, fourth pass): just the 14 px arrow in a 24 px box at the right of the name, `red-400` for above; the circle is gone. Figma only redrew `above`; the other three keep their old outlined strip there, so their arrow tones are their old label tones. */
const TREND = {
  above: { Icon: ArrowUp, text: 'Above usual', box: 'size-6 bg-(--red-900)', icon: 'size-3.5 text-(--red-400)' },
  about: { Icon: ArrowRight, text: 'About usual', box: 'size-5 bg-(--blue-900)', icon: 'size-3 text-(--blue-200)' },
  low: { Icon: TrendDown, text: 'Low reporting', box: 'size-5 bg-(--yellow-900)', icon: 'size-3 text-(--yellow-300)' },
  below: { Icon: ArrowDown, text: 'Below usual', box: 'size-5 bg-(--green-900)', icon: 'size-3 text-(--green-400)' },
} as const

/** A number with its name (Figma Stat Card, owner's seventh look 2026-11-17): a `neutral-900` fill, an 8 px radius, 16 px padding all round and 16 px between the header (the name and the 24 px trend mark) and the number row, 121 px high; the number row is 49 px high, its items centered: the number (stat style, now 28 / 28, `brand-primary`) with the "Reports" caption under it, spread top and bottom, and a 32 px graph (8 px on its right, the peak dot), 40 px apart; hover or selected is a 2 px `neutral-600` ring outside the card, so the grid that holds the cards must not clip it (`desk:overflow-visible` in `Dashboard.tsx`). */
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
  const g = series && w > 0 ? sparkPoints(series, w, 32) : null
  return (
    <Tag
      className={`@container flex min-w-0 flex-col gap-4 rounded-[4px] bg-(--neutral-900) px-4 pt-4 pb-5 text-left shadow-[inset_0_0_0_1px_var(--neutral-600)] enabled:hover:shadow-[0_0_0_2px_var(--neutral-500)] ${selected ? "shadow-[0_0_0_2px_var(--neutral-500)]" : ""}`}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!selected } : {})}
    >
      <span className="flex h-6 items-center justify-between gap-2">
        <span className="truncate text-subtitle text-(--neutral-100)">{label}</span>
        {t && (
          <span className={`grid shrink-0 place-items-center rounded-xs ${t.box}`} title={t.text}> {/* Figma Stat Trend (owner, 2026-11-17, latest): a small filled box (radius 2) with the trend icon: above 24 px, `red-900` and `red-400`; about, low and below 20 px, `blue-900` / `blue-200`, `yellow-900` / `yellow-300`, `green-900` / `green-400`; the icon is 14 px in above and 12 in the rest; the Figma glyph `trend-top` is an up arrow (turned to the right for about and down for below), and low is the zigzag `trend-down`: Phosphor `ArrowUp`, `ArrowRight`, `TrendDown`, `ArrowDown` */}
            <t.Icon className={t.icon} aria-hidden />
            <span className="sr-only">{t.text}</span>
          </span>
        )}
      </span>
      <span className="flex h-[49px] items-center gap-10">
          <span className="flex flex-1 basis-0 flex-col justify-between self-stretch">
            <span className="font-display-semi text-stat text-(--brand-primary)">{value}</span>
            <span className="text-meta text-(--neutral-300)">Reports</span>
          </span>
          {series && (
            <span className="hidden h-8 min-w-0 flex-1 basis-0 pr-2 @min-[140px]:block"> {/* Figma Graph (owner, 2026-11-15): 164 px at most, padding included */}
              <span ref={box} className="relative block h-full"> {/* Figma Vector 1 (owner, 2026-11-15, latest): Fill in width and height, so the line is as long as the Graph's inner box (96.5 px in a 257 px card) */}
                {g && (
                  <>
                    <div
                      role="img"
                      aria-label={`Peak: ${Math.max(...series!)} reports`}
                      className="absolute inset-0"
                      // Option 2 (owner, 2026-11-15): the line is a solid-color stroke used as a mask over a CSS gradient (indigo-500 for the first third, blending to indigo-300 at 93 %, solid after), because the SVG gradient stroke looked crackled. 2 px, flat ends, mitered corners, drawn at the real pixel size.
                      style={{
                        background: 'linear-gradient(90deg, var(--indigo-500) 33.2%, var(--indigo-300) 93.3%)',
                        mask: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="56"><polyline points="${g.pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="black" stroke-width="2" stroke-linejoin="miter"/></svg>`)}") 0 0 / ${w}px 56px no-repeat`,
                      }}
                    />
                    {/* the peak: a 6 px dot on the newest point (Figma: indigo-200 since 2026-11-15, it was indigo-300) */}
                    <span className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--indigo-200)" style={{ left: g.pts[g.peak][0], top: g.pts[g.peak][1] }} aria-hidden />
                  </>
                )}
              </span>
            </span>
          )}
      </span>
    </Tag>
  )
}
