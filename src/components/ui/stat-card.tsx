import type { ReactNode } from 'react'
import type { Trend } from '@/lib/trend'
import { ArrowDown, ArrowRight, ArrowUp, TrendDown } from '@phosphor-icons/react'
import { LocalityOutline } from '@/components/ui/locality-outline'
import type { Shape } from '@/lib/localityShape'

const TREND = {
  above: { Icon: ArrowUp, text: 'Above usual' },
  about: { Icon: ArrowRight, text: 'About usual' },
  low: { Icon: TrendDown, text: 'Low reporting*' },
  below: { Icon: ArrowDown, text: 'Below usual' },
} as const

/** A number with its name and, below it in the same card, how it compares with usual (Figma Stat Card): `inset` top (with, when given a `shape`, the outline of the locality 72 px on the right) with the label in `label` / neutral-200 and the value in `stat` / neutral-100, then a `neutral-700` strip (it was `secondary`, neutral-500, until the owner's Figma of 2026-11-07) with a trend icon and text in `meta`. 0.5 px `input` (neutral-400) border at rest (back since 2026-11-07), 4 px radius. When `selected` (its locality is the one filtered) it keeps the hover highlight (a `neutral-300` border, it was `foreground` until 2026-11-07) and nothing else changes. A button when it has an `onClick`. */
export function StatCard({ label, value, trend, selected, onClick, shape }: { label: ReactNode; value: ReactNode; trend?: Trend; selected?: boolean; onClick?: () => void; shape?: Shape }) {
  const Tag = onClick ? 'button' : 'div'
  const t = trend && TREND[trend]
  return (
    <Tag
      className={`@container flex min-w-0 flex-col overflow-hidden rounded-sm border-[0.5px] text-left enabled:hover:border-(--neutral-300) ${selected ? 'border-(--neutral-300)' : 'border-input'}`}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!selected } : {})}
    >
      <span className={`relative flex w-full flex-col gap-2 bg-inset pt-4 pb-5 pl-3 ${shape ? 'pr-3 @min-[160px]:pr-[78px]' : 'pr-3'}`}>
        <span className="truncate text-label text-(--neutral-200)">{label}</span>
        <span className="text-stat text-(--neutral-100)">{value}</span>
        {/* The outline of the locality (owner, 2026-11-07): only its shape, 72 px, centered on the right, a neutral-300 line and a faint fill (the owner's pick from /#locality, 2026-11-07; first it was the indigo map look at 64 px); it shows how big or small the locality is. 8 px from the right edge. Only from about 162 px of card width up ("Chapinero" needs the room, and the 165 px cards of the Figma map screens just fit it): narrower, the label keeps it. */}
        {shape && (
          <span className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 @min-[160px]:block">
            <LocalityOutline shape={shape} box={72} look="fill" />
          </span>
        )}
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
