import type { ComponentProps, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/** Figma Alert (page Data display): an icon, an optional title and a description. Variants: default (`neutral-600`, 0.5 px `neutral-500` line), destructive (`red-400`, dark text), ai (`neutral-800`, 0.5 px `cobalt-400` line) and info (owner, 2026-11-23: the agent panel's summary card is `cobalt-900` with `neutral-100` text, an `cobalt-200` icon and an 8 px radius, no line; 2026-11-17 it was `blue-800` and the text `cobalt-100` (owner's Figma, 2026-11-17; it was `cobalt-800` and `brand-primary`), 4 px radius, 16 px above and below, the icon in `cobalt-300` and the text in `brand-primary`, no title; the icon is at the top, not centered, since the text can run to three lines: owner's Figma, 2026-11-17). */
const alert = cva('flex w-full items-start text-body-sm', {
  variants: {
    variant: {
      default: 'gap-3 rounded-lg border-[0.5px] border-(--neutral-500) bg-(--neutral-600) px-4 py-3 text-(--fg-secondary)',
      destructive: 'gap-3 rounded-lg bg-(--red-400) px-4 py-3 text-(--neutral-900)',
      ai: 'gap-3 rounded-lg border-[0.5px] border-(--cobalt-400) bg-(--neutral-800) px-4 py-3 text-(--fg-primary)',
      info: 'items-start gap-4 rounded-lg border-[0.5px] border-(--cobalt-600) bg-(--cobalt-900)/69 p-4 text-(--fg-secondary)',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Alert({ variant, icon, title, action, className, children, ...props }: { icon?: ReactNode; title?: string; action?: ReactNode } & VariantProps<typeof alert> & Omit<ComponentProps<'div'>, 'title'>) {
  return (
    <div role="status" className={cn(alert({ variant }), className)} {...props}>
      {icon && <span className={variant === 'info' ? 'flex w-4 shrink-0 justify-center' : 'mt-0.5 flex shrink-0'}>{icon}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <p className={cn('text-body-sm-strong', variant === 'default' || variant === 'ai' ? 'text-(--fg-primary)' : '')}>{title}</p>}
        <p>{children}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>} {/* Figma Action (owner, 2026-11-23): a small secondary button at the right end of every variant, hidden in Figma and not rendered unless a caller passes one */}
    </div>
  )
}
