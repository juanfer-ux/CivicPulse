import { Clock, MapPin } from '@phosphor-icons/react'
import { Chip } from '@/components/ui/chip'
import { Select } from '@/components/ui/select'
import { GROUPS, type Category, type Group, type Locality } from '@/lib/incidents'
import { ICONS, iconCategory } from '@/lib/markerIcons'

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
      <div className={group}>
        {categories.map((c) => {
          const Icon = ICONS[iconCategory(c.code) as keyof typeof ICONS]
          return (
            <Chip key={c.code} pressed={filters.categories.includes(c.code)} icon={<Icon aria-hidden />} onClick={() => set({ categories: toggle(filters.categories, c.code) })}>
              {c.name}
            </Chip>
          )
        })}
      </div>
      <div className={group}>
        {(Object.keys(GROUPS) as Group[]).map((g) => (
          <Chip
            key={g}
            pressed={filters.statuses.includes(g)}
            count={counts[g]}
            icon={<span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(${GROUPS[g].token})` }} aria-hidden />}
            onClick={() => set({ statuses: toggle(filters.statuses, g) })}
          >
            {GROUPS[g].label}
          </Chip>
        ))}
      </div>
      {isFiltered(filters) && (
        <div className={group}>
          <Chip onClick={() => onChange(NO_FILTERS)}>Clear filters</Chip>
        </div>
      )}
    </div>
  )
}
