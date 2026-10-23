import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { cn, initials } from '@/lib/utils'

const SIZE = { sm: 'size-6 text-caption', default: 'size-8 text-meta', lg: 'size-10 text-body' } as const

/** Round photo with initials while there is no photo (Figma: Avatar; Base UI Avatar from shadcn). */
export function Avatar({ src, name, size = 'default', className }: { src?: string | null; name: string; size?: keyof typeof SIZE; className?: string }) {
  return (
    <BaseAvatar.Root data-slot="avatar" className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-medium text-foreground select-none', SIZE[size], className)}>
      {src && <BaseAvatar.Image src={src} alt={name} className="size-full object-cover" />}
      <BaseAvatar.Fallback aria-label={name}>{initials(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
