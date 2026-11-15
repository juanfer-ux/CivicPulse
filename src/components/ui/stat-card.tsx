import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Trend } from '@/lib/trend'
import { ArrowDown, ArrowRight, ArrowUp, TrendDown } from '@phosphor-icons/react'
import { sparkPoints } from '@/lib/sparkline'

const TREND = {
  above: { Icon: ArrowUp, text: 'Above usual' },
  about: { Icon: ArrowRight, text: 'About usual' },
  low: { Icon: TrendDown, text: 'Low reporting*' },
  below: { Icon: ArrowDown, text: 'Below usual' },
} as const

/** A number with its name (Figma sizing, 2026-11-12: the card is a fixed 154 px tall plus its 1 px border, which Figma now draws OUTSIDE (156 px in all); the value column and the graph both Fill the row's width, the graph fills the 56 px height of the value column) and, below it in the same card, how it compares with usual (Figma Stat Card, 2026-11-12): a `neutral-900` top with the label (`subtitle`, 16 Medium, neutral-100), the caption "Reports" (neutral-200) over the value in `stat`, and on the right a graph of the last 60 days in five steps (a 2.4 px `indigo-500` line, its peak marked with a 6 px `indigo-300` dot; it replaces the locality outline), then a `neutral-700` strip with a trend icon and text in `meta`. 1 px `input` (neutral-400) border at rest, 8 px radius. When `selected` (its locality is the one filtered) it keeps the hover highlight (a `neutral-300` border). A button when it has an `onClick`. The graph shrinks with the card (it is 112 px wide in the 257 px Figma card, about 60 px in the 158 px map cards) and hides under 140 px. */
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
  const g = series && w > 0 ? sparkPoints(series, w, 56) : null
  return (
    <Tag
      className={`@container flex h-[156px] min-w-0 flex-col overflow-hidden rounded-lg border text-left enabled:hover:border-(--neutral-300) ${selected ? 'border-(--neutral-300)' : 'border-input'}`}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!selected } : {})}
    >
      <span className="flex w-full flex-col gap-2 bg-(--neutral-900) px-3 pt-4 pb-5">
        <span className="truncate text-subtitle text-(--neutral-100)">{label}</span>
        <span className="flex min-h-14 items-end justify-between gap-2"> {/* 56 px as in Figma: the graph is 56 px high, so the row keeps it now that the number is 24 px high (stat style 32 / 24, 2026-11-15) */}
          <span className="flex flex-1 basis-0 flex-col gap-2">
            <span className="text-caption text-(--neutral-200)">Reports</span>
            <span className="text-stat text-(--neutral-100)">{value}</span>
          </span>
          {series && (
            <span className="hidden max-w-[164px] min-w-0 flex-1 basis-0 self-stretch px-4 @min-[140px]:block"> {/* Figma Graph (owner, 2026-11-15): 164 px at most, padding included */}
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
      </span>
      {t && (
        <span className="flex w-full flex-1 items-center gap-1.5 bg-(--neutral-700) px-2.5 py-1.5 text-meta text-(--neutral-100)">
          <t.Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 truncate" title={t.text}>{t.text}</span> {/* one line: in a narrow card "Low reporting*" wrapped and its second line was clipped (owner, 2026-11-15) */}
        </span>
      )}
    </Tag>
  )
}
