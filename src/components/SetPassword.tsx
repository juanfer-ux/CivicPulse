import { useState, type FormEvent } from 'react'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const MIN = 8

/** Shown once, after someone follows their invitation email: the link signs them in, this sets the password they will use next time. */
export function SetPassword({ onDone }: { onDone: () => void }) {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Marks the password fields as invalid and points them at the error message (WCAG 3.3.1).
  const invalid = error ? ({ 'aria-invalid': true, 'aria-describedby': 'auth-error' } as const) : {}

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
    <AuthLayout>
      {/* Figma Auth Card (set up): header, fields and button are 64 px apart; fields 12 px. */}
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-16">
          <CardHeader className="gap-2 px-0">
            <CardTitle asChild className="text-stat">
              <h1>Set up your account</h1>
            </CardTitle>
            <CardDescription>Choose the password you will use to sign in.</CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <Input value={String(session?.user.user_metadata?.full_name ?? '')} disabled readOnly />
            </Field>
            <Field label="Email">
              <Input value={session?.user.email ?? ''} disabled readOnly />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" required {...invalid} />
            </Field>
            <Field label="Repeat password">
              <Input name="confirm" type="password" placeholder="Type it again" autoComplete="new-password" required {...invalid} />
            </Field>
            {error && (
              <p id="auth-error" role="alert" className="text-body-sm text-incident">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save and continue'}
          </Button>
        </form>
      </CardContent>
    </AuthLayout>
  )
}
