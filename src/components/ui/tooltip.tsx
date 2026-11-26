import type { ComponentProps } from 'react'
import { Tooltip as TooltipPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** shadcn Tooltip (Radix) in our tokens (owner, 2026-11-24): `neutral-800` fill, 0.5 px `neutral-500` line, 4 px radius, `body-sm` text; shows after 150 ms of hover. */
export const TooltipProvider = ({ delayDuration = 150, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) => <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
export function TooltipContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content sideOffset={sideOffset} className={cn('z-50 max-w-60 rounded-sm border-[0.5px] border-(--neutral-500) bg-(--neutral-800) px-3 py-2 text-body-sm text-(--fg-secondary) shadow-lg', className)} {...props} />
    </TooltipPrimitive.Portal>
  )
}
