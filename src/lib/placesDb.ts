import { supabase } from '@/lib/supabase'
import type { Place } from '@/lib/places'

/** The stored places around a recurrence, nearest first (table `recurrence_places`, filled by supabase/seed/recurrence_places.sql; experiment, owner 2026-11-20). Kept apart from `places.ts` so that file stays free of Supabase for the tests. A missing table or no access rejects; no rows is a valid answer. */
export async function fetchRecurrencePlaces(problemId: string): Promise<Place[]> {
  const { data, error } = await supabase.from('recurrence_places').select('source_ref, kind, name, label, lat, lng, dist_m').eq('problem_id', problemId).order('dist_m')
  if (error) throw error
  return (data ?? []).map((r) => ({ id: r.source_ref, kind: r.kind, name: r.name, label: r.label, lat: r.lat, lng: r.lng, dist: r.dist_m }))
}
