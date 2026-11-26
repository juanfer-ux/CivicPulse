import { Warning } from '@phosphor-icons/react'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'

/** The status of a recurrence as a pill (Figma **Recurrence Status Pill**, 2026-11-24, status = active, monitoring, resolved, archived): the warning triangle in the status color and the status name, on the status' dark fill; no border (owner, 2026-11-25), 4 px radius, 12 / 8 px padding (owner, 2026-11-25; 16 / 6 before), 8 px between the triangle and the name (owner, 2026-11-24, it was 10), `body-sm-strong` with a 13 px line (the pill is 28 px high since 2026-11-26; archived text is `fg-secondary`). On 2026-11-24 it was fully round with a border; before that a 4 px radius pill with 8 / 4 px padding. */
export function ProblemStatusPill({ status }: { status: ProblemStatus }) {
  const s = PROBLEM_STATUS[status]
  return (
    <span className="inline-flex h-7 w-fit items-center gap-2 rounded-sm px-3 text-body-sm-strong leading-[13px]" style={{ background: `var(${s.pill.bg})`, color: `var(${s.pill.text})` }}>
      <Warning weight="fill" className="size-3.5 shrink-0" style={{ color: `var(${s.token})` }} aria-hidden />
      {s.label}
    </span>
  )
}
