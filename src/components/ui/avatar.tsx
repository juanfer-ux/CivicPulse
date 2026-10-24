import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { cn, initials } from '@/lib/utils'

// Initials are semi-bold; sm has no extra spacing, default and lg have 2.2% (Figma: Avatar).
const SIZE = { sm: 'size-6 text-[10px]/[13px] tracking-normal', default: 'size-8 text-[12px]/[21px] tracking-[0.022em]', lg: 'size-10 text-[13.5px]/6 tracking-[0.022em]' } as const

/** Round photo with initials while there is no photo (Figma: Avatar; Base UI Avatar from shadcn). */
export function Avatar({ src, name, size = 'default', className, title }: { src?: string | null; name: string; size?: keyof typeof SIZE; className?: string; title?: string }) {
  return (
    <BaseAvatar.Root data-slot="avatar" title={title} className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-foreground select-none', SIZE[size], className)}>
      {src && <BaseAvatar.Image src={src} alt={name} className="size-full object-cover" />}
      <BaseAvatar.Fallback aria-label={name}>{initials(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
