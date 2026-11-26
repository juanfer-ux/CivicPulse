import { GROUPS, type Group } from '@/lib/statusColors'

/** The status of an incident as a pill (Figma **Incident Status Pill**, 2026-11-25): the same shape as the recurrence's, with a round 8 px dot because incidents are circles on the map. */
export function IncidentStatusPill({ group }: { group: Group }) {
  const g = GROUPS[group]
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-sm px-3 py-2 text-body-sm-strong leading-[13px]" style={{ background: `var(${g.pill.bg})`, color: `var(${g.pill.text})` }}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: `var(${g.swatch})` }} aria-hidden />
      {g.label}
    </span>
  )
}
