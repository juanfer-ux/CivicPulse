import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { arrivedByInvite, supabase } from '@/lib/supabase'

/** The three active roles. Permissions per role live in the database (role_permissions); see docs/roles-and-permissions.md. */
export type AppRole = 'super_admin' | 'locality_admin' | 'specialist_operator'

/** Actions a role may be allowed. Mirrors role_permissions.action. */
export type Action =
  | 'view_incidents'
  | 'view_media'
  | 'ask_agent'
  | 'propose_recommendation'
  | 'decide_recommendation'
  | 'escalate_recommendation'
  | 'review_escalations'
  | 'assign_incidents'
  | 'view_team'
  | 'view_audit_own'
  | 'view_audit_all'
  | 'manage_users'
  | 'manage_settings'

export interface Profile {
  full_name: string | null
  role: AppRole | null
  is_active: boolean
}

interface AuthState {
  /** undefined while the first session check is running */
  session: Session | null | undefined
  /** undefined while loading, null if the row is missing */
  profile: Profile | null | undefined
  /** True if the user's role allows the action. The database enforces it; this only drives the screen. */
  can: (action: Action) => boolean
  signOut: () => Promise<void>
  /** True right after following an invitation link, until the person has chosen a password. */
  needsPassword: boolean
  passwordSet: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [fetched, setFetched] = useState<{ id: string; data: Profile | null } | null>(null)
  const [needsPassword, setNeedsPassword] = useState(arrivedByInvite)
  const [fetchedPerms, setFetchedPerms] = useState<{ role: AppRole; actions: Set<string> } | null>(null)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let stale = false
    supabase
      .from('profiles')
      .select('full_name, role, is_active')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!stale) setFetched({ id: userId, data })
      })
    return () => {
      stale = true
    }
  }, [userId])

  // Derived, so a different user never sees the previous user's profile.
  const profile: Profile | null | undefined =
    session === undefined ? undefined : !userId ? null : fetched?.id === userId ? fetched.data : undefined

  const role = profile?.role ?? null
  useEffect(() => {
    if (!role) return
    let stale = false
    supabase
      .from('role_permissions')
      .select('action')
      .eq('role', role)
      .then(({ data }) => {
        if (!stale) setFetchedPerms({ role, actions: new Set((data ?? []).map((r) => r.action as string)) })
      })
    return () => {
      stale = true
    }
  }, [role])
  const permissions = role && fetchedPerms?.role === role ? fetchedPerms.actions : undefined
  const can = (action: Action) => permissions?.has(action) ?? false

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <AuthContext value={{ session, profile, can, signOut, needsPassword, passwordSet: () => setNeedsPassword(false) }}>{children}</AuthContext>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
