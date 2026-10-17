import { supabase } from '@/lib/supabase'
import type { AppRole } from '@/lib/auth'
import type { Locality } from '@/lib/incidents'

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  locality_admin: 'Locality (Zone) Admin',
  specialist_operator: 'Specialist Operator',
}
export const ROLES = Object.keys(ROLE_LABELS) as AppRole[]

export interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  role: AppRole | null
  is_active: boolean
  created_at: string
  localities: number[]
  categories: string[]
}
export interface Specialization {
  code: string
  name: string
  sort: number
}
export interface CategoryRow {
  code: string
  name: string
  specialization: string
}
export interface AdminData {
  users: UserRow[]
  localities: Locality[]
  categories: CategoryRow[]
  specializations: Specialization[]
}

export type UserStatus = 'pending' | 'active' | 'off'
/** New sign-ups have no role yet: "pending". */
export const statusOf = (u: Pick<UserRow, 'role' | 'is_active'>): UserStatus =>
  !u.role ? 'pending' : u.is_active ? 'active' : 'off'

/** What to insert and what to delete to turn `current` into `wanted`. */
export function diffCodes<T>(current: T[], wanted: T[]) {
  const have = new Set(current)
  const want = new Set(wanted)
  return { add: wanted.filter((x) => !have.has(x)), remove: current.filter((x) => !want.has(x)) }
}

/** Everything the Users screen shows. RLS: only users with 'manage_users' get all rows. */
export async function fetchUserAdminData(): Promise<AdminData> {
  const [profiles, locAccess, catAccess, localities, categories, specializations] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, is_active, created_at').order('created_at', { ascending: false }),
    supabase.from('user_locality_access').select('user_id, locality_code'),
    supabase.from('user_incident_type_access').select('user_id, category'),
    supabase.from('localities').select('code, name').order('code'),
    supabase.from('incident_categories').select('code, name, specialization').order('code'),
    supabase.from('specializations').select('code, name, sort').order('sort'),
  ])
  for (const r of [profiles, locAccess, catAccess, localities, categories, specializations]) if (r.error) throw r.error

  const locs = new Map<string, number[]>()
  for (const r of locAccess.data ?? []) locs.set(r.user_id, [...(locs.get(r.user_id) ?? []), r.locality_code])
  const cats = new Map<string, string[]>()
  for (const r of catAccess.data ?? []) cats.set(r.user_id, [...(cats.get(r.user_id) ?? []), r.category])

  return {
    users: (profiles.data ?? []).map((p) => ({
      ...(p as Omit<UserRow, 'localities' | 'categories'>),
      localities: (locs.get(p.id) ?? []).sort((a, b) => a - b),
      categories: (cats.get(p.id) ?? []).sort(),
    })),
    localities: localities.data as Locality[],
    categories: categories.data as CategoryRow[],
    specializations: specializations.data as Specialization[],
  }
}

/** Zero updated rows means row-level security refused it: say so instead of failing silently. */
export async function updateProfile(id: string, patch: { role?: AppRole | null; is_active?: boolean }) {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Not allowed to change this user.')
}

export async function setLocalities(userId: string, current: number[], wanted: number[]) {
  const { add, remove } = diffCodes(current, wanted)
  if (add.length) {
    const { error } = await supabase.from('user_locality_access').insert(add.map((c) => ({ user_id: userId, locality_code: c })))
    if (error) throw error
  }
  if (remove.length) {
    const { error } = await supabase.from('user_locality_access').delete().eq('user_id', userId).in('locality_code', remove)
    if (error) throw error
  }
}

export async function setCategories(userId: string, current: string[], wanted: string[]) {
  const { add, remove } = diffCodes(current, wanted)
  if (add.length) {
    const { error } = await supabase.from('user_incident_type_access').insert(add.map((c) => ({ user_id: userId, category: c })))
    if (error) throw error
  }
  if (remove.length) {
    const { error } = await supabase.from('user_incident_type_access').delete().eq('user_id', userId).in('category', remove)
    if (error) throw error
  }
}

export interface InviteForm {
  full_name: string
  email: string
  role: AppRole | ''
  localities: number[]
  specialty: string
}

/** Specialties that grant at least one category (Infrastructure has none yet, so it cannot be assigned). */
export const assignableSpecialties = (d: Pick<AdminData, 'categories'>) => new Set(d.categories.map((c) => c.specialization))

/** Specialty of a person, shown from the categories they hold. */
export const specialtyOf = (u: Pick<UserRow, 'role' | 'categories'>, d: Pick<AdminData, 'categories' | 'specializations'>) =>
  u.role !== 'specialist_operator'
    ? []
    : d.specializations
        .filter((s) => d.categories.some((c) => c.specialization === s.code && u.categories.includes(c.code)))
        .map((s) => s.name)

/** Returns the first problem in plain words, or null when the form can be sent. */
export function validateInvite(f: InviteForm, specialties: Set<string>): string | null {
  if (!f.full_name.trim()) return 'Enter the name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'Enter a valid email.'
  if (!f.role) return 'Choose a role.'
  if (f.role !== 'super_admin' && !f.localities.length) return 'Choose at least one locality.'
  if (f.role === 'specialist_operator' && !specialties.has(f.specialty)) return 'Choose the specialty.'
  return null
}

/** Sends the invitation through the server function (the admin key lives only there). Returns the new user's id. */
export async function inviteUser(f: InviteForm): Promise<string> {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      full_name: f.full_name.trim(),
      email: f.email.trim(),
      role: f.role,
      localities: f.role === 'super_admin' ? [] : f.localities,
      specialty: f.role === 'specialist_operator' ? f.specialty : '',
      redirect_to: window.location.origin,
    },
  })
  if (error) {
    // A non-2xx answer carries the function's message in the response body.
    const detail = await (error as { context?: Response }).context?.json().catch(() => null)
    throw new Error(detail?.error ?? error.message)
  }
  return (data as { id: string }).id
}
