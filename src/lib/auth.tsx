import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type AppRole =
  | 'super_admin'
  | 'locality_admin'
  | 'sector_admin'
  | 'specialist_operator'
  | 'general_operator'

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
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [fetched, setFetched] = useState<{ id: string; data: Profile | null } | null>(null)

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

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <AuthContext value={{ session, profile, signOut }}>{children}</AuthContext>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
