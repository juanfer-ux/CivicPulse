import type { ComponentProps, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/** Figma Alert (page Data display): an icon, an optional title and a description. Variants: default (`neutral-600`, 0.5 px `neutral-500` line), destructive (`red-400`, dark text), ai (`neutral-800`, 0.5 px `indigo-400` line) and info (owner, 2026-11-17: the agent panel's summary card, `blue-800` and the text `indigo-100` (owner's Figma, 2026-11-17; it was `indigo-800` and `brand-primary`), 4 px radius, 16 px above and below, the icon in `indigo-300` and the text in `brand-primary`, no title; the icon is at the top, not centered, since the text can run to three lines: owner's Figma, 2026-11-17). */
const alert = cva('flex w-full items-start text-body-sm', {
  variants: {
    variant: {
      default: 'gap-3 rounded-lg border-[0.5px] border-(--neutral-500) bg-(--neutral-600) px-4 py-3 text-(--neutral-200)',
      destructive: 'gap-3 rounded-lg bg-(--red-400) px-4 py-3 text-(--neutral-900)',
      ai: 'gap-3 rounded-lg border-[0.5px] border-(--indigo-400) bg-(--neutral-800) px-4 py-3 text-(--neutral-100)',
      info: 'items-start gap-4 rounded-sm bg-(--blue-800) px-3 py-4 text-(--indigo-100)',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Alert({ variant, icon, title, className, children, ...props }: { icon?: ReactNode; title?: string } & VariantProps<typeof alert> & Omit<ComponentProps<'div'>, 'title'>) {
  return (
    <div role="status" className={cn(alert({ variant }), className)} {...props}>
      {icon && <span className={variant === 'info' ? 'flex shrink-0 px-2' : 'mt-0.5 flex shrink-0'}>{icon}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <p className={cn('text-body-sm-strong', variant === 'default' || variant === 'ai' ? 'text-(--neutral-100)' : '')}>{title}</p>}
        <p>{children}</p>
      </div>
    </div>
  )
}
