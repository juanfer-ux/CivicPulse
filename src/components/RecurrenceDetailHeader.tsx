import { Warning } from '@phosphor-icons/react'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'

/** Recurrence Detail Header (owner's Figma, 2026-11-24, in the Agent Panel frame): the strip under the agent panel's title row while a recurrence is open. `neutral-800`, 16 px above and below, 32 px at the sides, a 1 px `neutral-700` line under it; at the left the category (`body-medium`, `neutral-100`), a 1 px divider and the reference with the locality (`meta`, `neutral-200`); at the right the status pill (full radius, 16 / 6 px padding, 10 px between the triangle and the name, `body-sm-strong`). */
export function RecurrenceDetailHeader({ category, reference, locality, status }: { category: string; reference: string; locality?: string; status: ProblemStatus }) {
  const s = PROBLEM_STATUS[status]
  return (
    <div data-slot="recurrence-detail-header" className="flex shrink-0 items-center justify-between gap-4 border-b border-(--neutral-700) bg-(--neutral-800) px-8 py-4 max-desk:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <p className="truncate text-body-medium leading-5 text-(--neutral-100)">{category}</p>
        <span className="h-3.5 w-px shrink-0 bg-(--neutral-500)" aria-hidden />
        <p className="truncate text-meta leading-5 text-(--neutral-200)">{reference}{locality ? ` · ${locality}` : ''}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-1.5 text-body-sm-strong" style={{ background: `var(${s.pill.bg})`, color: `var(${s.pill.text})`, borderColor: `var(${s.pill.border})` }}>
        <Warning weight="fill" className="size-3.5 shrink-0" style={{ color: `var(${s.token})` }} aria-hidden />
        {s.label}
      </span>
    </div>
  )
}
