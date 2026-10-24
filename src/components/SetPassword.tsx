import { useState, type FormEvent } from 'react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const MIN = 8

/** Shown once, after someone follows their invitation email: the link signs them in, this sets the password they will use next time. */
export function SetPassword({ onDone }: { onDone: () => void }) {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password'))
    if (password.length < MIN) return setError(`Use at least ${MIN} characters.`)
    if (password !== String(form.get('confirm'))) return setError('The two passwords do not match.')
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password, data: { password_set: true } })
    setBusy(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background p-4">
      <Card className="w-full max-w-sm gap-10">
        <Logo className="px-(--card-spacing)" />
        <CardHeader>
          <CardTitle>Set up your account</CardTitle>
          <CardDescription>Choose the password you will use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <Input value={String(session?.user.user_metadata?.full_name ?? '')} aria-label="Name" disabled readOnly />
              <Input value={session?.user.email ?? ''} aria-label="Email" disabled readOnly />
              <Input name="password" type="password" placeholder="Password" aria-label="Password" autoComplete="new-password" required />
              <Input name="confirm" type="password" placeholder="Repeat password" aria-label="Repeat password" autoComplete="new-password" required />
              {error && (
                <p role="alert" className="text-body-sm text-incident">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save and continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
