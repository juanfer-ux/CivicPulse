import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/users'

/** The role of a person as a small outline badge (Figma: Role Badge). No role yet shows "Pending" in muted text. */
export function RoleBadge({ role, className }: { role: AppRole | null | undefined; className?: string }) {
  return (
    <span
      data-slot="role-badge"
      className={cn(
        'inline-flex w-fit shrink-0 items-center justify-center rounded-xs border border-input bg-sidebar px-2 py-1 text-[11px]/[12.5px] font-medium whitespace-nowrap',
        role ? 'text-foreground' : 'text-muted-foreground',
        className
      )}
    >
      {role ? ROLE_LABELS[role] : 'Pending'}
    </span>
  )
}
