import type { ComponentProps } from 'react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { Check, Minus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/** shadcn Checkbox (Radix) in our tokens, a try in the gallery (`/#components`): 16 px, radius 4, `neutral-400` outline on `neutral-900`; checked or mixed = `neutral-100` fill with a `neutral-900` mark. Phosphor icons, like the Select. */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer grid size-4 shrink-0 cursor-pointer place-items-center rounded-xs border border-(--neutral-400) bg-(--neutral-900) text-(--neutral-900) outline-none hover:border-(--neutral-300) focus-visible:border-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-(--neutral-100) data-[state=checked]:bg-(--neutral-100) data-[state=indeterminate]:border-(--neutral-100) data-[state=indeterminate]:bg-(--neutral-100)',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-items-center">
        {props.checked === 'indeterminate' ? <Minus weight="regular" className="size-3" aria-hidden /> : <Check weight="regular" className="size-3" aria-hidden />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
