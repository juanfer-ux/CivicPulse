import type { ReactNode } from 'react'
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
  const g = series && sparkPoints(series, 112, 56)
  return (
    <Tag
      className={`@container flex h-[156px] min-w-0 flex-col overflow-hidden rounded-lg border text-left enabled:hover:border-(--neutral-300) ${selected ? 'border-(--neutral-300)' : 'border-input'}`}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!selected } : {})}
    >
      <span className="flex w-full flex-col gap-2 bg-(--neutral-900) px-3 pt-4 pb-5">
        <span className="truncate text-subtitle text-(--neutral-100)">{label}</span>
        <span className="flex items-end justify-between gap-2">
          <span className="flex flex-1 basis-0 flex-col gap-2">
            <span className="text-caption text-(--neutral-200)">Reports</span>
            <span className="text-stat text-(--neutral-100)">{value}</span>
          </span>
          {g && (
            <span className="hidden min-w-0 flex-1 basis-0 self-stretch px-4 @min-[140px]:block">
              <span className="relative block h-full">
                <svg viewBox="0 0 112 56" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" role="img" aria-label={`Peak: ${Math.max(...series!)} reports`}>
                  <polyline points={g.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--indigo-500)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* the peak: a 6 px dot that keeps its size however long the line is (Figma: indigo-300) */}
                <span className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--indigo-300)" style={{ left: `${(g.pts[g.peak][0] / 112) * 100}%`, top: `${(g.pts[g.peak][1] / 56) * 100}%` }} aria-hidden />
              </span>
            </span>
          )}
        </span>
      </span>
      {t && (
        <span className="flex w-full items-center gap-1.5 bg-(--neutral-700) px-2.5 py-1.5 text-meta text-(--neutral-100)">
          <t.Icon className="size-3.5 shrink-0" aria-hidden />
          {t.text}
        </span>
      )}
    </Tag>
  )
}
