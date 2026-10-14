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
  obstruction_subtype: string
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

export const SUBTYPES = [
  'sidewalk',
  'pedestrian_access',
  'prohibited_zone',
  'access_ramp',
  'intersection',
  'other_public_space',
]

/** Map colours (MapLibre needs literals; they match the --warning, --incident and muted tokens). */
export const GROUPS = {
  pending: { label: 'Needs review', color: '#EF9700' },
  active: { label: 'Validated / in progress', color: '#FFA08F' },
  closed: { label: 'Closed', color: '#7A7A7A' },
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
  const [incidents, localities] = await Promise.all([
    supabase.from('incidents').select('*').order('occurred_at', { ascending: false }).limit(1000),
    supabase.from('localities').select('code, name').order('code'),
  ])
  if (incidents.error) throw incidents.error
  if (localities.error) throw localities.error
  return { incidents: incidents.data as Incident[], localities: localities.data as Locality[] }
}

export async function fetchLocalities() {
  const { data, error } = await supabase.from('localities').select('code, name').order('code')
  if (error) throw error
  return data as Locality[]
}
