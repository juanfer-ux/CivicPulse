import { IncidentStatusPill } from '@/components/IncidentStatusPill'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'
import type { Group, ProblemStatus } from '@/lib/statusColors'

/** Recurrence Detail Header (owner's Figma, in the Agent Panel frames): the strip under the agent panel's title row while a recurrence or an incident is open. `neutral-800`, 10 px above and below, 32 px at the sides, a 1 px `neutral-600` line under it, 48 px high; at the left the category (`body-medium`, `fg-primary`), a 1 px divider and the reference with the locality (`meta`, `fg-secondary`); at the right the status pill: the recurrence's (`status`) or, for an incident (owner, 2026-11-26), the incident's (`group`). */
export function RecurrenceDetailHeader({ category, reference, locality, status, group }: { category: string; reference: string; locality?: string; status?: ProblemStatus; group?: Group }) {
  return (
    <div data-slot="recurrence-detail-header" className="flex shrink-0 items-center justify-between gap-4 border-b border-(--neutral-600) bg-(--neutral-800) px-8 py-2.5 max-desk:hidden">
      <div className="flex min-w-0 items-center gap-4">
        <p className="truncate text-body-medium leading-5 text-(--fg-primary)">{category}</p>
        <span className="h-3.5 w-px shrink-0 bg-(--neutral-500)" aria-hidden />
        <p className="truncate text-meta leading-5 text-(--fg-secondary)">{reference}{locality ? ` · ${locality}` : ''}</p>
      </div>
      {status ? <ProblemStatusPill status={status} /> : group && <IncidentStatusPill group={group} />}
    </div>
  )
}
