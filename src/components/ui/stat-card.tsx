import type { ReactNode } from 'react'
import type { Trend } from '@/lib/trend'
import { ArrowDown, ArrowRight, ArrowUp, TrendDown } from '@phosphor-icons/react'

const TREND = {
  above: { Icon: ArrowUp, text: 'Above usual' },
  about: { Icon: ArrowRight, text: 'About usual' },
  low: { Icon: TrendDown, text: 'Low reporting*' },
  below: { Icon: ArrowDown, text: 'Below usual' },
} as const

/** A number with its name and, below it in the same card, how it compares with usual (Figma Stat Card): `inset` top with the label in `label` / neutral-200 and the value in `stat` / neutral-100, then a `secondary` strip with a trend icon and text in `meta`. 0.5 px `input` border, 4 px radius. A button when it has an `onClick`. */
export function StatCard({ label, value, trend, onClick }: { label: ReactNode; value: ReactNode; trend?: Trend; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  const t = trend && TREND[trend]
  return (
    <Tag
      className="flex min-w-0 flex-col overflow-hidden rounded-sm border-[0.5px] border-input text-left enabled:hover:border-foreground"
      {...(onClick ? { type: 'button' as const, onClick } : {})}
    >
      <span className="flex w-full flex-col gap-1 bg-inset p-3">
        <span className="truncate text-label text-(--neutral-200)">{label}</span>
        <span className="text-stat text-(--neutral-100)">{value}</span>
      </span>
      {t && (
        <span className="flex w-full items-center gap-1.5 bg-secondary px-2.5 py-1.5 text-meta text-(--neutral-100)">
          <t.Icon className="size-3.5 shrink-0" aria-hidden />
          {t.text}
        </span>
      )}
    </Tag>
  )
}
