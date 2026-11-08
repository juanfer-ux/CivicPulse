import { sentenceCase, titleCase } from '@/lib/titleCase'
import { supabase } from '@/lib/supabase'
import type { Group } from '@/lib/statusColors'

export type IncidentStatus =
  | 'received'
  | 'under_review'
  | 'validated'
  | 'rejected'
  | 'duplicate'
  | 'intervention_proposed'
  | 'intervention_approved'
  | 'intervention_rejected'
  | 'resolved'

export interface Incident {
  id: string
  reference: string
  title: string
  description: string
  locality_code: number
  lat: number
  lng: number
  location_description: string
  occurred_at: string
  reported_at: string
  vehicle_type: string
  category: string
  /** Parking only. Other categories use `subtype`. */
  obstruction_subtype: string | null
  subtype: string | null
  ai_classification: string | null
  ai_confidence: number | null
  uncertainty_flags: string[]
  validation_status: string
  status: IncidentStatus
  outcome: string | null
  is_synthetic: boolean
}

export interface Locality {
  code: number
  name: string
}

export const STATUSES: IncidentStatus[] = [
  'received',
  'under_review',
  'validated',
  'intervention_proposed',
  'intervention_approved',
  'intervention_rejected',
  'resolved',
  'rejected',
  'duplicate',
]

/** The incident's type, whichever category it belongs to. */
export const typeOf = (i: Pick<Incident, 'subtype' | 'obstruction_subtype'>) =>
  i.subtype ?? i.obstruction_subtype ?? 'unknown'

/** The database writes some text in lowercase: titles, places and classifications in Title Case, descriptions and outcomes as sentences. Done once, where the data is loaded, so every screen shows the same. */
export const polishIncident = (i: Incident): Incident => ({
  ...i,
  ...(i.title && { title: titleCase(i.title) }),
  ...(i.description && { description: sentenceCase(i.description) }),
  ...(i.location_description && { location_description: titleCase(i.location_description) }),
  ...(i.ai_classification && { ai_classification: titleCase(i.ai_classification) }),
  ...(i.outcome && { outcome: sentenceCase(i.outcome) }),
})

export interface Category {
  code: string
  name: string
}

/** The four statuses people see (map dots, counts); the nine database states stay as they are. */
export function groupOf(status: IncidentStatus): Group {
  if (status === 'received') return 'pending'
  if (status === 'under_review') return 'reviewing'
  if (status === 'rejected' || status === 'duplicate' || status === 'intervention_rejected') return 'rejected'
  return 'approved'
}

/** A code as text in Title Case: "human_rejected" is "Human Rejected". */
export const label = (value: string) => titleCase(value.replace(/_/g, ' '))

/** RLS decides which rows come back: a user only receives incidents in their scope. */
export async function fetchDashboardData() {
  const [incidents, localities, categories] = await Promise.all([
    supabase.from('incidents').select('*').order('occurred_at', { ascending: false }).limit(1000),
    supabase.from('localities').select('code, name').order('code'),
    supabase.from('incident_categories').select('code, name').eq('active', true).order('code'),
  ])
  if (incidents.error) throw incidents.error
  if (localities.error) throw localities.error
  if (categories.error) throw categories.error
  return {
    incidents: (incidents.data as Incident[]).map(polishIncident),
    localities: localities.data as Locality[],
    categories: (categories.data as Category[]).map((c) => ({ ...c, name: titleCase(c.name) })),
  }
}

export async function fetchLocalities() {
  const { data, error } = await supabase.from('localities').select('code, name').order('code')
  if (error) throw error
  return data as Locality[]
}
