import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { cn, initials } from '@/lib/utils'

// Initials are semi-bold; sm has no extra spacing, default and lg have 2.2% (Figma: Avatar). The ring is 2.4 px outside, `neutral-400` (owner's Figma, 2026-11-24; it was 2 px `neutral-500`); the `lg` size is 38 px with a 2.28 px ring and 12.35 px initials (it was 40 px; Figma scaled it to 95 %).
const SIZE = { sm: 'size-6 text-[10px]/[13px] tracking-normal', default: 'size-8 text-[12px]/[21px] tracking-[0.022em]', lg: 'size-[38px] text-[12.35px]/[23px] tracking-[0.014em] ring-[2.28px]' } as const

/** Round photo with initials while there is no photo (Figma: Avatar; Base UI Avatar from shadcn). */
export function Avatar({ src, name, size = 'default', className, title }: { src?: string | null; name: string; size?: keyof typeof SIZE; className?: string; title?: string }) {
  return (
    <BaseAvatar.Root data-slot="avatar" title={title} className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--neutral-600) font-semibold text-(--neutral-100) ring-[2.4px] ring-(--neutral-400) select-none', SIZE[size], className)}>
      {src && <BaseAvatar.Image src={src} alt={name} className="size-full object-cover" />}
      <BaseAvatar.Fallback aria-label={name}>{initials(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
