import { supabase } from '@/lib/supabase'
import { orderPlaces, type Place } from '@/lib/places'

/** The stored places around a recurrence, nearest first, low-value kinds last: the agent's tool `tool_recurrence_places` (SECURITY INVOKER, needs `ask_agent`), over the table `recurrence_places` filled by supabase/seed/recurrence_places.sql (owner, 2026-11-20 and 23). Kept apart from `places.ts` so that file stays free of Supabase for the tests. A missing function or no access rejects; no rows is a valid answer. */
export async function fetchRecurrencePlaces(problemId: string): Promise<Place[]> {
  const { data, error } = await supabase.rpc('tool_recurrence_places', { p_problem_id: problemId })
  if (error) throw new Error(error.message)
  return orderPlaces((data ?? []).map((r: { source_ref: string; kind: Place['kind']; name: string; label: string; lat: number; lng: number; dist_m: number }) => ({ id: r.source_ref, kind: r.kind, name: r.name, label: r.label, lat: r.lat, lng: r.lng, dist: r.dist_m })))
}
