import { Warning } from '@phosphor-icons/react'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'

/** The status of a problem as a pill (Figma Recurrence Card and Recurrence Panel, 2026-11-02): the warning triangle in the status color and the status name, on the status' dark fill. */
export function ProblemStatusPill({ status }: { status: ProblemStatus }) {
  const s = PROBLEM_STATUS[status]
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-[6px] px-2.5 py-1 text-body-sm-medium" style={{ background: `var(${s.pill.bg})`, color: `var(${s.pill.text})` }}>
      <Warning weight="fill" className="size-4 shrink-0" style={{ color: `var(${s.token})` }} aria-hidden />
      {s.label}
    </span>
  )
}
