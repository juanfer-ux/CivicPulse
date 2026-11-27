import type { ComponentProps, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/** Figma Alert (page Data display, 6:40; owner 2026-11-27): an icon, an optional title, a description, an optional `action` and, separate from it, an optional close button (`onClose`; Figma Show close). 6 px corners (8 on info), 20 px above and below, 16 at the sides, 12 px from the icon to the text, 24 px to the action and the close button; the title is `fg-primary`, the description `fg-secondary`, in `body-strong` / `body` on default and info and `body-sm-strong` / `body-sm` on destructive and success; the variant colors the box, its line and the icon. Default: `black`, 1 px `neutral-700`, icon `cobalt-300`. Destructive: `red-900`, 1 px `red-800`, `red-400`. Success: `green-900`, 1 px `green-800`, `green-500`. Info: `indigo-900`, 0.5 px `indigo-700`, `cobalt-300`. */
const alert = cva('flex w-full items-start gap-6 px-4 py-5 text-(--fg-secondary)', {
  variants: {
    variant: {
      default: 'text-body rounded-md border border-(--neutral-700) bg-(--black) [--alert-icon:var(--cobalt-300)]',
      destructive: 'text-body-sm rounded-md border border-(--red-800) bg-(--red-900) [--alert-icon:var(--red-400)]',
      success: 'text-body-sm rounded-md border border-(--green-800) bg-(--green-900) [--alert-icon:var(--green-500)]',
      info: 'text-body rounded-lg border-[0.5px] border-(--indigo-700) bg-(--indigo-900) [--alert-icon:var(--cobalt-300)]',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Alert({ variant, icon, title, action, onClose, className, children, ...props }: { icon?: ReactNode; title?: string; action?: ReactNode; onClose?: () => void } & VariantProps<typeof alert> & Omit<ComponentProps<'div'>, 'title'>) {
  return (
    <div role="status" className={cn(alert({ variant }), className)} {...props}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {icon && <span className="grid size-[22px] shrink-0 place-items-center text-(--alert-icon)">{icon}</span>}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {title && <p className={cn('text-(--fg-primary)', variant === 'destructive' || variant === 'success' ? 'text-body-sm-strong' : 'text-body-strong')}>{title}</p>}
          <p>{children}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onClose && (
        <button type="button" aria-label="Close" onClick={onClose} className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-sm text-(--neutral-200) outline-none hover:bg-(--neutral-600) focus-visible:ring-3 focus-visible:ring-ring/50">
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
