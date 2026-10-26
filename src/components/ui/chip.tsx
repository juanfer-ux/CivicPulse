import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Filter Chip look (Figma: Filter Chip): 36 px, square-ish like the rest of the system, `card` surface; pressed = `secondary` fill and a lighter border. Shared by the toggle chips and the Select chip variant. */
export const chipClass =
  'inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-sm border border-input bg-card/95 px-3 text-button-sm text-foreground outline-none select-none hover:bg-secondary focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-pressed:border-closed aria-pressed:bg-secondary data-active:border-closed data-active:bg-secondary data-popup-open:border-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground aria-pressed:[&_svg]:text-foreground data-active:[&_svg]:text-foreground'

/** A toggle: on or off. `icon` sits on the left, `count` after the label. */
export function Chip({
  pressed,
  icon,
  count,
  className,
  children,
  ...props
}: { pressed?: boolean; icon?: ReactNode; count?: number } & Omit<ComponentProps<'button'>, 'aria-pressed'>) {
  return (
    <button type="button" aria-pressed={pressed} className={cn(chipClass, className)} {...props}>
      {icon}
      {children}
      {count != null && <span className="text-muted-foreground">{count}</span>}
    </button>
  )
}
