import type { ComponentProps, ReactNode } from 'react'
import { chipClass, CountBadge } from '@/components/ui/chip'
import { cn } from '@/lib/utils'

/** Figma Selector Chip (1173:4638, owner 2026-11-26): one chip that turns one thing on or off, like Recurrences and Incidents over the map. A pill: default `neutral-900` with no line, hover `neutral-500` with a `neutral-400` line, selected `cobalt-900` with a 1 px `cobalt-700` line and a wider dark outline on its icon, focus a `neutral-100` line and a 3 px `cobalt-400` ring, disabled half opacity. A selected chip does not react to hover (the no-hover-on-active rule). */
const SELECTOR = [
  'rounded-full border-[0.5px] border-transparent hover:border-(--neutral-400) hover:bg-(--neutral-500) disabled:border-(--neutral-400) disabled:bg-(--neutral-900) [&_svg]:text-(--neutral-100)',
  'focus-visible:border-(--neutral-100) focus-visible:ring-(--cobalt-400)',
  'aria-pressed:border aria-pressed:border-(--cobalt-700) aria-pressed:bg-(--cobalt-900) aria-pressed:hover:border-(--cobalt-700) aria-pressed:hover:bg-(--cobalt-900) aria-pressed:[&_svg]:stroke-8',
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
