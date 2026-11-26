import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import type { ProblemStatus } from '@/lib/statusColors'

/** Recurrence Detail Header (owner's Figma, 2026-11-24, in the Agent Panel frame): the strip under the agent panel's title row while a recurrence is open. `neutral-800`, 10 px above and below (it was 16), 32 px at the sides, a 1 px `neutral-600` line under it (it was `neutral-700`), 16 px around the divider (it was 12), 48 px high; at the left the category (`body-medium`, `neutral-100`), a 1 px divider and the reference with the locality (`meta`, `neutral-200`); at the right the status pill (full radius, 16 / 6 px padding, 10 px between the triangle and the name, `body-sm-strong`). */
export function RecurrenceDetailHeader({ category, reference, locality, status }: { category: string; reference: string; locality?: string; status: ProblemStatus }) {
  return (
    <div data-slot="recurrence-detail-header" className="flex shrink-0 items-center justify-between gap-4 border-b border-(--neutral-600) bg-(--neutral-800) px-8 py-2.5 max-desk:hidden">
      <div className="flex min-w-0 items-center gap-4">
        <p className="truncate text-body-medium leading-5 text-(--fg-primary)">{category}</p>
        <span className="h-3.5 w-px shrink-0 bg-(--neutral-500)" aria-hidden />
        <p className="truncate text-meta leading-5 text-(--fg-secondary)">{reference}{locality ? ` · ${locality}` : ''}</p>
      </div>
      <ProblemStatusPill status={status} />
    </div>
  )
}
