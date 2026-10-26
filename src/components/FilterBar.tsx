import { Car, Clock, DotsThree, MapPin, SquaresFour, Trash, TrafficSignal, Wheelchair } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import { Chip } from '@/components/ui/chip'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
import { Select } from '@/components/ui/select'
import { GROUPS, type Category, type Group, type Locality } from '@/lib/incidents'

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
  days: number
}
export const NO_FILTERS: Filters = { locality: '', categories: [], statuses: [], days: 0 }
export const isFiltered = (f: Filters) => !!(f.locality || f.categories.length || f.statuses.length || f.days)

/** One icon per category (map pins use the first two). */
const CATEGORY_ICON: Record<string, ComponentType> = { parking: Car, illegal_dumping: Trash, damaged_infrastructure: TrafficSignal, accessibility: Wheelchair, other: DotsThree }
/** Categories from the brief that have no data yet: shown in the menu, switched off, so the dropdown can be designed with a realistic list. Remove an entry once the category exists in the database. */
const PLANNED: Category[] = [
  { code: 'damaged_infrastructure', name: 'Damaged infrastructure' },
  { code: 'accessibility', name: 'Accessibility' },
  { code: 'other', name: 'Others' },
]

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

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
  className,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  localities: Locality[]
  categories: Category[]
  counts: Record<Group, number>
  className?: string
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  // Chips are 8 px apart inside a group and the groups 32 px apart, so the three kinds of filter read as three blocks.
  const group = 'flex shrink-0 items-center gap-2'
  return (
    <div role="group" aria-label="Filters" className={className}>
      {/* Statuses first: they are the operator's triage, so they must never scroll out of sight. One segmented block (shared borders), the counts double as the legend of the map dots. */}
      <div className="flex shrink-0 items-center">
        {(Object.keys(GROUPS) as Group[]).map((g) => (
          <Chip
            key={g}
            pressed={filters.statuses.includes(g)}
            count={counts[g]}
            icon={<span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(${GROUPS[g].token})` }} aria-hidden />}
            className="relative -ml-px rounded-none first:ml-0 first:rounded-l-sm last:rounded-r-sm aria-pressed:z-10"
            onClick={() => set({ statuses: toggle(filters.statuses, g) })}
          >
            {GROUPS[g].label}
          </Chip>
        ))}
      </div>
      <div className={group}>
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
      {isFiltered(filters) && (
        <div className={group}>
          <Chip onClick={() => onChange(NO_FILTERS)}>Clear filters</Chip>
        </div>
      )}
    </div>
  )
}
