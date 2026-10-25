import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** The header of a section on desktop (Figma: Section Header, shown on Map and Users): title, a small count pill, and the contextual actions on the right. Phones use the top bar instead. */
export function SectionHeader({ title, count, children, className }: { title: string; count?: string; children?: ReactNode; className?: string }) {
  return (
    <header data-slot="section-header" className={cn('hidden h-(--section-header-h) shrink-0 items-center justify-between gap-3 border-b bg-card px-6 desk:flex', className)}>
      <div className="flex items-center gap-3">
        <h1 className="text-heading">{title}</h1>
        {count && <span className="inline-flex h-7 items-center border-l border-(--neutral-400) px-2.5 text-caption text-muted-foreground">{count}</span>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  )
}
