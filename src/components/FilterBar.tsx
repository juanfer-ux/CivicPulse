import { Car, Clock, DotsThree, Flag, MapPin, SquaresFour, Trash, TrafficSignal, Wheelchair, X } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import { Chip } from '@/components/ui/chip'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
import { Select } from '@/components/ui/select'
import { GROUPS, type Category, type Group, type Locality } from '@/lib/incidents'
import { PROBLEM_STATUS, PROBLEM_STATUSES, type ProblemStatus } from '@/lib/problems'

export const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 0, label: 'All time' },
]

export interface Filters {
  locality: string
  categories: string[]
  statuses: Group[]
  /** Status chips of the Problems view (decision 0030); the incident statuses above are untouched. */
  problemStatuses: ProblemStatus[]
  days: number
}
export const NO_FILTERS: Filters = { locality: '', categories: [], statuses: [], problemStatuses: [], days: 0 }
export const isFiltered = (f: Filters) => !!(f.locality || f.categories.length || f.statuses.length || f.problemStatuses.length || f.days)

/** One icon per category (map pins use the first two). */
const CATEGORY_ICON: Record<string, ComponentType> = { parking: Car, illegal_dumping: Trash, damaged_infrastructure: TrafficSignal, accessibility: Wheelchair, other: DotsThree }
/** Categories from the brief that have no data yet: shown in the menu, switched off, so the dropdown can be designed with a realistic list. Remove an entry once the category exists in the database. */
const PLANNED: Category[] = [
  { code: 'damaged_infrastructure', name: 'Damaged infrastructure' },
  { code: 'accessibility', name: 'Accessibility' },
  { code: 'other', name: 'Others' },
]

/**
 * The map filters as one row of chips (Figma: Filter Bar). Locality and Period open a menu; categories and
 * statuses are toggles you can combine; the status chips carry their counts (computed with every other filter applied).
 */
export function FilterBar({
  filters,
  onChange,
  localities,
  categories,
  counts,
  problemCounts,
  className,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  localities: Locality[]
  categories: Category[]
  counts: Record<Group, number>
  /** Set in the Problems view: the status chip then lists the problem statuses, with their counts. */
  problemCounts?: Record<ProblemStatus, number>
  className?: string
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  return (
    <div role="group" aria-label="Filters" className={className}>
      {/* The filters share one 8 px gap and scroll sideways when they do not fit; "Clear filters" stays put at the far right. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
        <ChipMultiSelect
          aria-label="Status"
          icon={<Flag aria-hidden />}
          all="All statuses"
          noun="statuses"
          value={problemCounts ? filters.problemStatuses : filters.statuses}
          onValueChange={(v) => set(problemCounts ? { problemStatuses: v as ProblemStatus[] } : { statuses: v as Group[] })}
          options={
            problemCounts
              ? PROBLEM_STATUSES.map((st) => ({
                  value: st,
                  label: PROBLEM_STATUS[st].label,
                  icon: <span className="block size-2.5 shrink-0 rounded-full" style={{ background: `var(${PROBLEM_STATUS[st].token})` }} aria-hidden />,
                  hint: String(problemCounts[st]),
                }))
              : (Object.keys(GROUPS) as Group[]).map((g) => ({
                  value: g,
                  label: GROUPS[g].label,
                  icon: <span className="block size-2.5 shrink-0 rounded-full" style={{ background: `var(${GROUPS[g].token})` }} aria-hidden />,
                  hint: String(counts[g]),
                }))
          }
        />
        <Select
          chip
          aria-label="Locality"
          icon={<MapPin aria-hidden />}
          active={!!filters.locality}
          value={filters.locality}
          onValueChange={(locality) => set({ locality })}
          options={[{ value: '', label: 'All localities' }, ...localities.map((l) => ({ value: String(l.code), label: l.name }))]}
        />
        <ChipMultiSelect
          aria-label="Category"
          icon={<SquaresFour aria-hidden />}
          all="All categories"
          noun="categories"
          value={filters.categories}
          onValueChange={(categories) => set({ categories })}
          options={[...categories, ...PLANNED.filter((p) => !categories.some((c) => c.code === p.code))].map((c) => {
            const Icon = CATEGORY_ICON[c.code] ?? SquaresFour
            const planned = !categories.some((x) => x.code === c.code)
            return { value: c.code, label: c.name, icon: <Icon aria-hidden />, disabled: planned, hint: planned ? 'Soon' : undefined }
          })}
        />
        <Select
          chip
          aria-label="Period"
          icon={<Clock aria-hidden />}
          active={!!filters.days}
          value={String(filters.days)}
          onValueChange={(v) => set({ days: Number(v) })}
          options={PERIODS.map((p) => ({ value: String(p.days), label: p.label }))}
        />
      </div>
      <Chip icon={<X aria-hidden />} title="Clear filters" disabled={!isFiltered(filters)} onClick={() => onChange(NO_FILTERS)}>
        <span className="max-desk:sr-only">Clear filters</span>
      </Chip>
    </div>
  )
}
