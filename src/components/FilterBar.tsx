import { Car, Circle, Clock, DotsThree, Flag, MapPin, SquaresFour, Trash, TrafficSignal, Warning, Wheelchair, X } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import { Chip } from '@/components/ui/chip'
import { ChipMultiSelect } from '@/components/ui/chip-multi-select'
import { Select } from '@/components/ui/select'
import type { Category, Locality } from '@/lib/incidents'
import { GROUPS, PROBLEM_STATUS, PROBLEM_STATUSES, type Group, type ProblemStatus } from '@/lib/statusColors'

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
  /** What the map shows: persistent problems, loose incidents, or (empty) both. */
  types: MapType[]
  days: number
}
export type MapType = 'problems' | 'incidents'
export const NO_FILTERS: Filters = { locality: '', categories: [], statuses: [], problemStatuses: [], types: [], days: 0 }
export const isFiltered = (f: Filters) => !!(f.locality || f.categories.length || f.statuses.length || f.problemStatuses.length || f.types.length || f.days)

/** One icon per category (map pins use the first two). */
const CATEGORY_ICON: Record<string, ComponentType> = { parking: Car, illegal_dumping: Trash, damaged_infrastructure: TrafficSignal, accessibility: Wheelchair, other: DotsThree }
/** Categories from the brief that have no data yet: shown in the menu, switched off, so the dropdown can be designed with a realistic list. Remove an entry once the category exists in the database. */
const PLANNED: Category[] = [
  { code: 'damaged_infrastructure', name: 'Damaged infrastructure' },
  { code: 'accessibility', name: 'Accessibility' },
  { code: 'other', name: 'Others' },
]

/** What the map shows (owner, 2026-10-30): problems, incidents or both. Both is `[]`. */
const typesOn = (filters: Filters, hasProblems: boolean) => ({
  problems: hasProblems && (!filters.types.length || filters.types.includes('problems')),
  incidents: !hasProblems || !filters.types.length || filters.types.includes('incidents'),
})

/** A 2 px neutral-900 outline around a chip icon (owner, 2026-11-01; it was 1 px and neutral-800): a 4 px stroke in screen pixels (whatever the icon's size) drawn under the fill, so only its outer 2 px shows. */
const ICON_OUTLINE = 'overflow-visible stroke-(--neutral-900) stroke-4 [paint-order:stroke] [&_path]:[vector-effect:non-scaling-stroke]'

/**
 * The two map toggles, merged with the counts (owner, 2026-10-30): "Problems 16" and "Incidents 650", at the bottom left of the map where the legend was.
 * Both are on by default. Switching one off keeps the other on (never an empty map) and drops the statuses chosen for the one that went away, so a hidden filter never keeps narrowing.
 */
export function MapTypeChips({ filters, onChange, problemCount, incidentCount }: { filters: Filters; onChange: (f: Filters) => void; problemCount: number; incidentCount: number }) {
  const on = typesOn(filters, true)
  const toggle = (type: MapType) => {
    const now = [...(on.problems ? ['problems' as const] : []), ...(on.incidents ? ['incidents' as const] : [])]
    const next = now.includes(type) ? now.filter((t) => t !== type) : [...now, type]
    if (!next.length) return
    onChange({
      ...filters,
      types: next.length === 2 ? [] : next,
      ...(next.includes('problems') ? {} : { problemStatuses: [] }),
      ...(next.includes('incidents') ? {} : { statuses: [] }),
    })
  }
  return (
    <div role="group" aria-label="What the map shows" className="flex items-center gap-2">
      <Chip pressed={on.problems} icon={<Warning weight="fill" className={`size-[18px]! ${ICON_OUTLINE}`} aria-hidden />} count={problemCount} onClick={() => toggle('problems')}>
        Problems
      </Chip>
      <Chip pressed={on.incidents} icon={<Circle weight="fill" className={ICON_OUTLINE} aria-hidden />} count={incidentCount} onClick={() => toggle('incidents')}>
        Incidents
      </Chip>
    </div>
  )
}

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
  const { problems: showProblems, incidents: showIncidents } = typesOn(filters, !!problemCounts)
  return (
    <div role="group" aria-label="Filters" className={className}>
      {/* The filters share one 8 px gap and scroll sideways when they do not fit; "Clear filters" stays put at the far right. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
        {/* One Status chip for both kinds (owner, 2026-10-30): incident statuses and problem statuses are different sets, so the menu lists them in two labeled groups. Values are prefixed `p:` / `i:` only to tell the two apart. */}
        <ChipMultiSelect
          aria-label="Status"
          icon={<Flag aria-hidden />}
          all="All statuses"
          noun="statuses"
          value={[...filters.problemStatuses.map((st) => `p:${st}`), ...filters.statuses.map((g) => `i:${g}`)]}
          onValueChange={(v) =>
            set({
              problemStatuses: v.filter((x) => x.startsWith('p:')).map((x) => x.slice(2) as ProblemStatus),
              statuses: v.filter((x) => x.startsWith('i:')).map((x) => x.slice(2) as Group),
            })
          }
          options={[
            ...(showProblems
              ? PROBLEM_STATUSES.map((st) => ({
                  value: `p:${st}`,
                  group: showIncidents ? 'Problems' : undefined,
                  label: PROBLEM_STATUS[st].label,
                  icon: <Warning weight="fill" className="size-4 shrink-0" style={{ color: `var(${PROBLEM_STATUS[st].token})` }} aria-hidden />,
                  hint: String(problemCounts?.[st] ?? 0),
                }))
              : []),
            ...(showIncidents ? (Object.keys(GROUPS) as Group[]) : []).map((g) => ({
              value: `i:${g}`,
              group: showProblems && showIncidents ? 'Incidents' : undefined,
              label: GROUPS[g].label,
              icon: <span className="block size-3 shrink-0 rounded-full" style={{ background: `var(${GROUPS[g].swatch})` }} aria-hidden />,
              hint: String(counts[g]),
            })),
          ]}
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
