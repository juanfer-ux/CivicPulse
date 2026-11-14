import type { ReactNode } from 'react'
import { SquaresFour, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { CATEGORY_ICON, NO_FILTERS, PERIODS, PLANNED, isFiltered, typesOn, type Filters } from '@/components/FilterBar'
import type { Category, Locality } from '@/lib/incidents'
import { GROUPS, PROBLEM_STATUS, PROBLEM_STATUSES, type Group, type ProblemStatus } from '@/lib/statusColors'

/** How many filters are set (the number on the Filters button). */
export const filterCount = (f: Filters) => [f.locality, f.days, ...f.categories, ...f.statuses, ...f.problemStatuses].filter(Boolean).length

const toggle = <T,>(list: T[], v: T, on: boolean) => (on ? [...list, v] : list.filter((x) => x !== v))

function Check({ checked, disabled, onChange, children, hint }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; children: ReactNode; hint?: string }) {
  return (
    <label className={`flex items-center gap-2 text-body-sm ${disabled ? 'cursor-not-allowed text-(--neutral-300)' : 'cursor-pointer text-(--neutral-100)'}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-4 shrink-0 cursor-pointer rounded-[2px] accent-(--neutral-100) disabled:cursor-not-allowed" />
      {children}
      {hint && <span className="ml-auto text-(--neutral-300)">{hint}</span>}
    </label>
  )
}
const Fieldset = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-label text-(--neutral-100)">{title}</legend>
    {children}
  </fieldset>
)

/**
 * The Filters side panel (owner, 2026-11-14): every map filter in one panel that slides in from the right like Create user (Figma Side Panel: 420 px, `neutral-900`, 32 px padding, a title in display-sm over a subtitle, a ghost Close button). Filters apply as they are ticked; the footer clears them or closes the panel with the number of results.
 * The status lists carry their counts (computed with every other filter applied) and follow what the map shows: recurrence statuses when recurrences are on, incident statuses when incidents are.
 */
export function FiltersPanel({
  filters,
  onChange,
  onClose,
  results,
  localities,
  categories,
  counts,
  problemCounts,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onClose: () => void
  results: number
  localities: Locality[]
  categories: Category[]
  counts: Record<Group, number>
  problemCounts?: Record<ProblemStatus, number>
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const { problems: showProblems, incidents: showIncidents } = typesOn(filters, !!problemCounts)
  return (
    <aside aria-label="Filters" className="flex h-full w-[420px] max-w-full flex-col border-l border-(--neutral-500) bg-(--neutral-900)">
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-8">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-3">
            <h2 className="font-display-semi text-display-sm text-(--brand-primary)">Filters</h2>
            <p className="text-body-sm text-(--neutral-200)">Narrow what the map and the agent show.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-label">
            Time
            <Select value={String(filters.days)} onValueChange={(v) => set({ days: Number(v) })} options={PERIODS.map((p) => ({ value: String(p.days), label: p.label }))} aria-label="Time" />
          </label>
          <label className="flex flex-col gap-1.5 text-label">
            Localities
            <Select value={filters.locality} onValueChange={(locality) => set({ locality })} options={[{ value: '', label: 'All localities' }, ...localities.map((l) => ({ value: String(l.code), label: l.name }))]} aria-label="Localities" />
          </label>
        </div>
        <Fieldset title="Categories">
          {[...categories, ...PLANNED.filter((p) => !categories.some((c) => c.code === p.code))].map((c) => {
            const Icon = CATEGORY_ICON[c.code] ?? SquaresFour
            const planned = !categories.some((x) => x.code === c.code)
            return (
              <Check key={c.code} checked={filters.categories.includes(c.code)} disabled={planned} hint={planned ? 'Soon' : undefined} onChange={(on) => set({ categories: toggle(filters.categories, c.code, on) })}>
                <span className="grid shrink-0 text-(--neutral-200) [&>svg]:size-4" aria-hidden>
                  <Icon />
                </span>
                {c.name}
              </Check>
            )
          })}
        </Fieldset>
        {showProblems && (
          <Fieldset title="Recurrence status">
            {PROBLEM_STATUSES.map((s) => (
              <Check key={s} checked={filters.problemStatuses.includes(s)} hint={String(problemCounts?.[s] ?? 0)} onChange={(on) => set({ problemStatuses: toggle(filters.problemStatuses, s, on) })}>
                <Warning weight="fill" className="size-4 shrink-0" style={{ color: `var(${PROBLEM_STATUS[s].token})` }} aria-hidden /> {/* the recurrence's warning triangle in its status color, as in the old status chip and on the map */}
                {PROBLEM_STATUS[s].label}
              </Check>
            ))}
          </Fieldset>
        )}
        {showIncidents && (
          <Fieldset title="Incident status">
            {(Object.keys(GROUPS) as Group[]).map((g) => (
              <Check key={g} checked={filters.statuses.includes(g)} hint={String(counts[g])} onChange={(on) => set({ statuses: toggle(filters.statuses, g, on) })}>
                <span className="block size-3 shrink-0 rounded-full" style={{ background: `var(${GROUPS[g].swatch})` }} aria-hidden />
                {GROUPS[g].label}
              </Check>
            ))}
          </Fieldset>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-(--neutral-600) px-8 py-4">
        <Button type="button" variant="ghost" size="sm" disabled={!isFiltered(filters)} onClick={() => onChange(NO_FILTERS)}>
          Clear filters
        </Button>
        <Button type="button" onClick={onClose}>
          Show {results} {results === 1 ? 'result' : 'results'}
        </Button>
      </div>
    </aside>
  )
}
