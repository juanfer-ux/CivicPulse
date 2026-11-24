import { Warning } from '@phosphor-icons/react'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'

/** The status of a recurrence as a pill (Figma **Recurrence Status Pill**, 2026-11-24, status = active, monitoring, resolved, archived): the warning triangle in the status color and the status name, on the status' dark fill with a 1 px 700-step border; full radius, 16 / 6 px padding, 8 px between the triangle and the name (owner, 2026-11-24, it was 10), `body-sm-strong` with a 13 px line (the pill is 27 px high). It was a 4 px radius pill with 8 / 4 px padding until 2026-11-24. */
export function ProblemStatusPill({ status }: { status: ProblemStatus }) {
  const s = PROBLEM_STATUS[status]
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-body-sm-strong leading-[13px]" style={{ background: `var(${s.pill.bg})`, color: `var(${s.pill.text})`, borderColor: `var(${s.pill.border})` }}>
      <Warning weight="fill" className="size-3.5 shrink-0" style={{ color: `var(${s.token})` }} aria-hidden />
      {s.label}
    </span>
  )
}
