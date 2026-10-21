import { supabase } from '@/lib/supabase'

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

export interface Category {
  code: string
  name: string
}

/** Status groups and the color token each one uses (CSS variable name; the map resolves it with token() because MapLibre needs a literal color). */
export const GROUPS = {
  pending: { label: 'Needs review', token: '--warning' },
  active: { label: 'Validated / in progress', token: '--incident' },
  closed: { label: 'Closed', token: '--closed' },
} as const
export type Group = keyof typeof GROUPS

export function groupOf(status: IncidentStatus): Group {
  if (status === 'received' || status === 'under_review') return 'pending'
  if (status === 'validated' || status === 'intervention_proposed' || status === 'intervention_approved') {
    return 'active'
  }
  return 'closed'
}

export const label = (value: string) => {
  const text = value.replace(/_/g, ' ')
  return text[0].toUpperCase() + text.slice(1)
}

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
    incidents: incidents.data as Incident[],
    localities: localities.data as Locality[],
    categories: categories.data as Category[],
  }
}

export async function fetchLocalities() {
  const { data, error } = await supabase.from('localities').select('code, name').order('code')
  if (error) throw error
  return data as Locality[]
}
