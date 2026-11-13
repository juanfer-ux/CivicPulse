import { Warning } from '@phosphor-icons/react'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'

/** The status of a problem as a pill (Figma Recurrence Card and Recurrence Panel, 2026-11-02): the warning triangle in the status color and the status name, on the status' dark fill with a 1 px 700-step border (owner's Figma, 2026-11-12: 4 px radius, 8 px / 4 px padding, `body-sm-strong`). */
export function ProblemStatusPill({ status }: { status: ProblemStatus }) {
  const s = PROBLEM_STATUS[status]
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-1 text-body-sm-strong" style={{ background: `var(${s.pill.bg})`, color: `var(${s.pill.text})`, borderColor: `var(${s.pill.border})` }}>
      <Warning weight="fill" className="size-3.5 shrink-0" style={{ color: `var(${s.token})` }} aria-hidden />
      {s.label}
    </span>
  )
}
