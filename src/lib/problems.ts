import { supabase } from '@/lib/supabase'
import type { Incident } from '@/lib/incidents'

/** Lifecycle of a persistent problem (decision 0030): its own, separate from the incident statuses. */
export type ProblemStatus = 'active' | 'monitoring' | 'resolved' | 'archived'
export const PROBLEM_STATUSES: ProblemStatus[] = ['active', 'monitoring', 'resolved', 'archived']
/** Label and color token (CSS variable) of each problem status. */
export const PROBLEM_STATUS: Record<ProblemStatus, { label: string; token: string }> = {
  active: { label: 'Active', token: '--map-problem-active' },
  monitoring: { label: 'Monitoring', token: '--map-problem-monitoring' },
  resolved: { label: 'Resolved', token: '--map-problem-resolved' },
  archived: { label: 'Archived', token: '--map-problem-archived' },
}

/** A persistent problem with its derived numbers. Recurrence counts OCCURRENCES, never reports (`reports_n` is intensity only). */
export interface ProblemRow {
  id: string
  reference: string
  title: string
  category: string
  locality_code: number
  lat: number
  lng: number
  location_description: string
  status: ProblemStatus
  occurrences_n: number
  recurrences_n: number
  reports_n: number
  interventions_n: number
  uncertain_n: number
  first_seen: string | null
  last_seen: string | null
  quiet: boolean
}

/** Every problem the signed-in user may see. Throws when the problems layer is not in the database yet (the caller then shows incidents only). */
export async function fetchProblems(): Promise<ProblemRow[]> {
  const [problems, stats] = await Promise.all([
    supabase.from('problems').select('id, reference, title, category, locality_code, lat, lng, location_description, status').is('merged_into', null),
    supabase.from('problem_stats').select('problem_id, occurrences_n, recurrences_n, reports_n, interventions_n, uncertain_n, first_seen, last_seen, quiet'),
  ])
  if (problems.error) throw problems.error
  if (stats.error) throw stats.error
  const byId = new Map((stats.data ?? []).map((s) => [s.problem_id as string, s]))
  return (problems.data ?? []).map((p) => {
    const s = byId.get(p.id as string)
    return {
      ...(p as Omit<ProblemRow, 'occurrences_n' | 'recurrences_n' | 'reports_n' | 'interventions_n' | 'uncertain_n' | 'first_seen' | 'last_seen' | 'quiet'>),
      occurrences_n: Number(s?.occurrences_n ?? 0),
      recurrences_n: Number(s?.recurrences_n ?? 0),
      reports_n: Number(s?.reports_n ?? 0),
      interventions_n: Number(s?.interventions_n ?? 0),
      uncertain_n: Number(s?.uncertain_n ?? 0),
      first_seen: s?.first_seen ?? null,
      last_seen: s?.last_seen ?? null,
      quiet: !!s?.quiet,
    }
  })
}

export interface OccurrenceRow {
  occurrence_id: string
  subject_key: string | null
  ended_at: string | null
  ended_reason: string | null
  reports_n: number
  first_report_at: string | null
  last_report_at: string | null
  boundary_uncertain: boolean
}
export interface LinkRow {
  incident_id: string
  occurrence_id: string | null
  state: 'confirmed' | 'proposed'
  score: number | null
}
export interface InterventionRow {
  id: string
  action_type: string
  agency: string
  performed_at: string
  description: string
  outcome: string | null
}
export interface ProblemEvent {
  kind: string
  created_at: string
}
export interface ProblemDetailData {
  occurrences: OccurrenceRow[]
  links: LinkRow[]
  incidents: Incident[]
  /** Where each report came from, by incident id. */
  sources: Record<string, string>
  interventions: InterventionRow[]
  events: ProblemEvent[]
}

/** Everything the problem panel shows. RLS limits every query to what the user may see. */
export async function fetchProblemDetail(problemId: string): Promise<ProblemDetailData> {
  const [occ, links, ivs, events, platforms] = await Promise.all([
    supabase.from('occurrence_stats').select('occurrence_id, subject_key, ended_at, ended_reason, reports_n, first_report_at, last_report_at, boundary_uncertain').eq('problem_id', problemId).order('first_report_at'),
    supabase.from('incident_current_link').select('incident_id, occurrence_id, state, score').eq('problem_id', problemId).in('state', ['confirmed', 'proposed']),
    supabase.from('interventions').select('id, action_type, agency, performed_at, description, intervention_results(id, outcome)').eq('problem_id', problemId).order('performed_at'),
    supabase.from('problem_events').select('kind, created_at').eq('problem_id', problemId).in('kind', ['resolved', 'reopened']).order('created_at'),
    supabase.from('source_platforms').select('code, name'),
  ])
  for (const r of [occ, links, ivs, events, platforms]) if (r.error) throw r.error
  const linkRows = (links.data ?? []) as LinkRow[]
  const ids = linkRows.map((l) => l.incident_id)
  const [incidents, sources] = ids.length
    ? await Promise.all([
        supabase.from('incidents').select('*').in('id', ids).order('occurred_at'),
        supabase.from('incident_sources').select('incident_id, platform').in('incident_id', ids),
      ])
    : [{ data: [], error: null }, { data: [], error: null }]
  if (incidents.error) throw incidents.error
  if (sources.error) throw sources.error
  const platformName = new Map((platforms.data ?? []).map((p) => [p.code as string, p.name as string]))
  return {
    // oldest first, so "Occurrence n" is the nth time it happened whatever order the server answers in
    occurrences: ((occ.data ?? []).map((o) => ({ ...o, reports_n: Number(o.reports_n) })) as OccurrenceRow[]).sort((a, b) => Date.parse(a.first_report_at ?? '') - Date.parse(b.first_report_at ?? '')),
    links: linkRows,
    incidents: (incidents.data ?? []) as Incident[],
    sources: Object.fromEntries((sources.data ?? []).map((s) => [s.incident_id as string, platformName.get(s.platform as string) ?? String(s.platform)])),
    interventions: (ivs.data ?? []).map((v) => {
      const results = (v.intervention_results ?? []) as { id: number; outcome: string }[]
      return { id: v.id, action_type: v.action_type, agency: v.agency, performed_at: v.performed_at, description: v.description, outcome: results.sort((a, b) => b.id - a.id)[0]?.outcome ?? null }
    }) as InterventionRow[],
    events: (events.data ?? []) as ProblemEvent[],
  }
}
