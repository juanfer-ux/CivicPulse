import { supabase } from '@/lib/supabase'

export type RecommendationStatus = 'proposed' | 'needs_second_approval' | 'approved' | 'rejected'

export interface Draft {
  locality_code: number
  category: string
  title: string
  problem: string
  period_start: string
  period_end: string
  /** Counts and incident ids copied from SQL tool output, never written by a model. */
  evidence: Record<string, unknown>
  limitations: string
  proposed_intervention: string
}

export interface Recommendation extends Draft {
  id: string
  status: RecommendationStatus
  created_by: string
  created_at: string
}

export interface Decision {
  id: string
  recommendation_id: string
  decided_by: string
  decision: 'approved' | 'rejected'
  explanation: string | null
  decided_at: string
}

export interface AuditEvent {
  id: number
  actor: string | null
  action: string
  entity: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

/** RLS limits every query below to the user's locality scope; the browser never needs the service role. */
export async function listRecommendations() {
  const [recs, decisions] = await Promise.all([
    supabase.from('recommendations').select('*').order('created_at', { ascending: false }),
    supabase.from('decisions').select('*').order('decided_at', { ascending: true }),
  ])
  if (recs.error) throw recs.error
  if (decisions.error) throw decisions.error
  const recommendations = recs.data as Recommendation[]
  const decided = decisions.data as Decision[]

  // Names are readable only for yourself (or everyone, as super admin); others show as "an operator".
  const ids = [...new Set([...recommendations.map((r) => r.created_by), ...decided.map((d) => d.decided_by)])]
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids)
  const names = new Map((profiles ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? 'Unnamed']))
  return { recommendations, decisions: decided, names }
}

export async function propose(draft: Draft) {
  const { error } = await supabase.from('recommendations').insert(draft)
  if (error) throw error
}

/** Inserting a decision is atomic with the status change and the audit event (database trigger). */
export async function decide(recommendationId: string, decision: 'approved' | 'rejected', explanation: string) {
  const { error } = await supabase
    .from('decisions')
    .insert({ recommendation_id: recommendationId, decision, explanation: explanation.trim() || null })
  if (error) throw error
}

/** Super admins see every audit event; everyone else only their own. */
export async function listAudit() {
  const { data, error } = await supabase
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15)
  if (error) throw error
  return data as AuditEvent[]
}
