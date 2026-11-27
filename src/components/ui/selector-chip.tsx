import type { ComponentProps, ReactNode } from 'react'
import { chipClass, CountBadge } from '@/components/ui/chip'
import { cn } from '@/lib/utils'

/** Figma Selector Chip (1173:4638, owner 2026-11-27, latest): one chip that turns one thing on or off, like Recurrences and Incidents over the map. 8 px radius, label `fg-primary`, icon `neutral-200`. default `neutral-800` with a `neutral-500` line; hover no fill, a `neutral-400` line and an `fg-emphasis` label; selected `neutral-500` with a `black` line and a wider `neutral-800` outline on its icon; focus `neutral-900` with a 4 px `neutral-500` ring; disabled `neutral-600`, `neutral-400` line, `neutral-100` icon, half opacity. The 1 px lines do not take layout space (11 px padding + 1). A selected chip does not react to hover (the no-hover-on-active rule). */
const SELECTOR = [
  'rounded-lg border border-(--neutral-500) bg-(--neutral-800) px-[11px] text-(--fg-primary) hover:border-(--neutral-400) hover:bg-transparent hover:text-(--fg-emphasis) disabled:text-(--fg-primary) disabled:border-(--neutral-400) disabled:bg-(--neutral-600) [&_svg]:text-(--neutral-200) disabled:[&_svg]:text-(--neutral-100)',
  'focus-visible:border-transparent focus-visible:bg-(--neutral-900) focus-visible:ring-4 focus-visible:ring-(--neutral-500)',
  'aria-pressed:border-(--black) aria-pressed:bg-(--neutral-500) aria-pressed:hover:border-(--black) aria-pressed:hover:bg-(--neutral-500) aria-pressed:hover:text-(--fg-primary) aria-pressed:[&_svg]:stroke-8 aria-pressed:[&_svg]:stroke-(--neutral-800)',
]

export function SelectorChip({
  selected,
  icon,
  count,
  className,
  children,
  ...props
}: { selected?: boolean; icon?: ReactNode; count?: number } & Omit<ComponentProps<'button'>, 'aria-pressed'>) {
  return (
    <button type="button" aria-pressed={selected} className={cn(chipClass, SELECTOR, className)} {...props}>
      {icon}
      {children}
      {count != null && <CountBadge>{count}</CountBadge>}
    </button>
  )
}
