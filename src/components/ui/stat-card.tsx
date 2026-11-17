import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Trend } from '@/lib/trend'
import { ArrowDown, ArrowRight, ArrowUp, TrendDown } from '@phosphor-icons/react'
import { sparkPoints } from '@/lib/sparkline'

/** The strip under the number (Figma Stat Trend, owner, 2026-11-17): a 20 px circle with a 14 px icon and a label in `caption-medium`, each trend with its own colors. `about` and `below` keep the old arrows: Figma still draws them with the up arrow, which looks unfinished. */
const TREND = {
  above: { Icon: ArrowUp, text: 'Above usual', circle: 'bg-(--red-800)', icon: 'text-(--red-200)', label: 'text-(--red-400)' },
  about: { Icon: ArrowRight, text: 'About usual', circle: 'bg-(--blue-600)', icon: 'text-(--neutral-100)', label: 'text-(--blue-300)' },
  low: { Icon: TrendDown, text: 'Low reporting', circle: 'bg-(--yellow-700)', icon: 'text-(--yellow-300)', label: 'text-(--yellow-500)' },
  below: { Icon: ArrowDown, text: 'Below usual', circle: 'bg-(--blue-600)', icon: 'text-(--neutral-100)', label: 'text-(--green-500)' },
} as const

/** A number with its name (Figma Stat Card, owner's rebuild 2026-11-17): 16 px padding, 12 px between the name, the number row and the trend strip, 143 px high (it was 156 with a 1 px border and a grey strip); the number (stat style 42 / 32) and the graph (48 px high, 12 px on its right, with the peak dot) share the row 40 px apart, bottom aligned; hover or selected is a 2 px `neutral-400` ring outside the card. The "Reports" caption over the number is gone. */
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
  const g = series && w > 0 ? sparkPoints(series, w, 48) : null
  return (
    <Tag
      className={`@container flex min-w-0 flex-col gap-3 rounded-lg bg-(--neutral-900) p-4 text-left enabled:hover:shadow-[0_0_0_2px_var(--neutral-400)] ${selected ? 'shadow-[0_0_0_2px_var(--neutral-400)]' : ''}`}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!selected } : {})}
    >
      <span className="truncate text-subtitle text-(--neutral-100)">{label}</span>
      <span className="flex min-h-12 items-end gap-10">
          <span className="flex flex-1 basis-0 items-end font-display-semi text-stat text-(--neutral-100)">{value}</span>
          {series && (
            <span className="hidden min-w-0 flex-1 basis-0 self-stretch pr-3 @min-[140px]:block"> {/* Figma Graph (owner, 2026-11-15): 164 px at most, padding included */}
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
      {t && (
        <span className="flex items-center gap-2 text-caption-medium"> {/* Figma Stat Trend: a 20 px circle, a 14 px icon, the label; one line */}
          <span className={`grid size-5 shrink-0 place-items-center rounded-full ${t.circle}`}>
            <t.Icon className={`size-3.5 ${t.icon}`} aria-hidden />
          </span>
          <span className={`min-w-0 truncate ${t.label}`} title={t.text}>{t.text}</span>
        </span>
      )}
    </Tag>
  )
}
