import type { Group, ProblemStatus } from '@/lib/statusColors'

/**
 * Filter options with their counts (owner, 2026-11-15): for every option of the Filters panel, how many results the map would show if that option were chosen with every other filter kept, so a combination that leaves nothing shows 0 and its option is switched off. Kept free of Supabase and React so a test can read it.
 */
export interface FacetRow {
  problem: boolean // a recurrence (true) or a loose incident (false)
  locality: number
  category: string
  at: number | null // when it was last reported (a recurrence) or happened (an incident)
  group?: Group // incidents
  status?: ProblemStatus // recurrences
}
export interface FacetFilters {
  locality: string
  categories: string[]
  statuses: Group[]
  problemStatuses: ProblemStatus[]
  days: number
}
const DAY = 86_400_000

/** The same rules the map applies: locality, categories, a time window, then the statuses of its own kind. */
export function matches(r: FacetRow, f: FacetFilters, now: number): boolean {
  if (f.locality && r.locality !== Number(f.locality)) return false
  if (f.categories.length && !f.categories.includes(r.category)) return false
  if (f.days && !(r.at !== null && r.at >= now - f.days * DAY)) return false
  if (r.problem) return !f.problemStatuses.length || f.problemStatuses.includes(r.status as ProblemStatus)
  return !f.statuses.length || f.statuses.includes(r.group as Group)
}

export const countWhere = (rows: FacetRow[], f: FacetFilters, now: number) => rows.filter((r) => matches(r, f, now)).length

/** Counts for the three option lists that choose one thing: a locality, a category, a time window. */
export function facetCounts(rows: FacetRow[], f: FacetFilters, now: number, localities: number[], categories: string[], periods: number[]) {
  return {
    locality: Object.fromEntries(localities.map((c) => [String(c), countWhere(rows, { ...f, locality: String(c) }, now)])) as Record<string, number>,
    category: Object.fromEntries(categories.map((c) => [c, countWhere(rows, { ...f, categories: [c] }, now)])) as Record<string, number>,
    days: Object.fromEntries(periods.map((d) => [String(d), countWhere(rows, { ...f, days: d }, now)])) as Record<string, number>,
  }
}
