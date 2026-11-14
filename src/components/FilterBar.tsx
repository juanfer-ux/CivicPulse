import { Car, Circle, DotsThree, Trash, TrafficSignal, Warning, Wheelchair } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import { Chip } from '@/components/ui/chip'
import type { Category } from '@/lib/incidents'
import type { Group, ProblemStatus } from '@/lib/statusColors'

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
  /** Status chips of the Recurrences view (decision 0030); the incident statuses above are untouched. */
  problemStatuses: ProblemStatus[]
  /** What the map shows: recurrences, loose incidents, or (empty) both. */
  types: MapType[]
  days: number
}
export type MapType = 'problems' | 'incidents'
export const NO_FILTERS: Filters = { locality: '', categories: [], statuses: [], problemStatuses: [], types: [], days: 0 }
export const isFiltered = (f: Filters) => !!(f.locality || f.categories.length || f.statuses.length || f.problemStatuses.length || f.types.length || f.days)

/** One icon per category (map pins use the first two). */
export const CATEGORY_ICON: Record<string, ComponentType> = { parking: Car, illegal_dumping: Trash, damaged_infrastructure: TrafficSignal, accessibility: Wheelchair, other: DotsThree }
/** Categories from the brief that have no data yet: shown in the menu, switched off, so the dropdown can be designed with a realistic list. Remove an entry once the category exists in the database. */
export const PLANNED: Category[] = [
  { code: 'damaged_infrastructure', name: 'Damaged Infrastructure' },
  { code: 'accessibility', name: 'Accessibility' },
  { code: 'other', name: 'Others' },
]

/** What the map shows (owner, 2026-10-30): problems, incidents or both. Both is `[]`. */
export const typesOn = (filters: Filters, hasProblems: boolean) => ({
  problems: hasProblems && (!filters.types.length || filters.types.includes('problems')),
  incidents: !hasProblems || !filters.types.length || filters.types.includes('incidents'),
})

/** A 2 px neutral-900 outline around a chip icon (owner, 2026-11-01; it was 1 px and neutral-800): a 4 px stroke in screen pixels (whatever the icon's size) drawn under the fill, so only its outer 2 px shows. */
const ICON_OUTLINE = 'overflow-visible stroke-(--neutral-900) stroke-4 [paint-order:stroke] [&_path]:[vector-effect:non-scaling-stroke]'

/**
 * The two map toggles, merged with the counts (owner, 2026-10-30): "Recurrences 16" and "Incidents 650", at the bottom left of the map where the legend was.
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
        Recurrences
      </Chip>
      <Chip pressed={on.incidents} icon={<Circle weight="fill" className={ICON_OUTLINE} aria-hidden />} count={incidentCount} onClick={() => toggle('incidents')}>
        Incidents
      </Chip>
    </div>
  )
}
