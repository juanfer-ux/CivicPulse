import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { cn, initials } from '@/lib/utils'

// Initials are semi-bold; sm has no extra spacing, default and lg have 2.2% (Figma: Avatar). A `cobalt-900` fill and a `cobalt-300` ring outside: 2.4 px on sm, 3 on default, 3.4 on lg (owner's Figma, 2026-11-27; `neutral-600` and a `neutral-400` ring before). The `lg` size is 38 px with 12.35 px initials.
const SIZE = { sm: 'size-6 text-[10px]/[13px] tracking-normal ring-[2.4px]', default: 'size-8 text-[12px]/[21px] tracking-[0.022em] ring-[3px]', lg: 'size-[38px] text-[12.35px]/[23px] tracking-[0.014em] ring-[3.4px]' } as const

/** Round photo with initials while there is no photo (Figma: Avatar; Base UI Avatar from shadcn). */
export function Avatar({ src, name, size = 'default', className, title }: { src?: string | null; name: string; size?: keyof typeof SIZE; className?: string; title?: string }) {
  return (
    <BaseAvatar.Root data-slot="avatar" title={title} className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--cobalt-900) font-semibold text-(--fg-primary) ring-(--cobalt-300) select-none', SIZE[size], className)}>
      {src && <BaseAvatar.Image src={src} alt={name} className="size-full object-cover" />}
      <BaseAvatar.Fallback aria-label={name}>{initials(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
