import type { ReactNode } from 'react'
import { AuthPage } from '@/components/AuthPage'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'

const Screen = ({ children }: { children: ReactNode }) => (
  <main className="grid min-h-svh place-items-center bg-background p-4">{children}</main>
)

/** Guards the whole app: signed out → login; signed in without an active role → waiting screen. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, profile, signOut } = useAuth()

  if (session === undefined || (session && profile === undefined)) {
    return (
      <Screen>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Screen>
    )
  }
  if (!session) return <AuthPage />

  if (!profile?.role || !profile.is_active) {
    return (
      <Screen>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Access pending</CardTitle>
            <CardDescription>
              {session.user.email} has no active role yet. A Super Admin must assign one before you can see any data.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </CardFooter>
        </Card>
      </Screen>
    )
  }
  return children
}
