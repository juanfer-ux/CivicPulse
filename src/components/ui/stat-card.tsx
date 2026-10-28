import type { ReactNode } from 'react'

/** A number with its name (Figma Stat Card, the top part): `inset` fill, 0.5 px `input` border, 12 px padding; label in `label` / neutral-200, value in `stat` / neutral-100. A button when it has an `onClick`. */
export function StatCard({ label, value, onClick }: { label: ReactNode; value: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      className="flex min-w-0 flex-col gap-1 rounded-sm border-[0.5px] border-input bg-inset p-3 text-left enabled:hover:border-foreground"
      {...(onClick ? { type: 'button' as const, onClick } : {})}
    >
      <span className="truncate text-label text-(--neutral-200)">{label}</span>
      <span className="text-stat text-(--neutral-100)">{value}</span>
    </Tag>
  )
}
