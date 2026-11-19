import type { ComponentProps, ReactNode } from 'react'
import { chipClass, CountBadge } from '@/components/ui/chip'
import { cn } from '@/lib/utils'

/** Figma Selector Chip (owner, 2026-11-17): one chip that turns one thing on or off, like Recurrences and Incidents over the map. States: default (off), hover (`neutral-500` fill), selected (`indigo-700` fill, a 1 px `indigo-500` line; owner's Figma, 2026-11-17, it was a 2 px `neutral-300` line on `neutral-900`), focus, disabled. A selected chip does not react to hover (the no-hover-on-active rule). The look of the shared chip, plus the selected state. */
export function SelectorChip({
  selected,
  icon,
  count,
  className,
  children,
  ...props
}: { selected?: boolean; icon?: ReactNode; count?: number } & Omit<ComponentProps<'button'>, 'aria-pressed'>) {
  return (
    <button type="button" aria-pressed={selected} className={cn(chipClass, 'aria-pressed:border-(--indigo-500) aria-pressed:bg-(--indigo-700) aria-pressed:hover:bg-(--indigo-700)', className)} {...props}>
      {icon}
      {children}
      {count != null && <CountBadge>{count}</CountBadge>}
    </button>
  )
}
