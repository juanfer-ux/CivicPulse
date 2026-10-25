import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AuthLayout } from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'

const NEED_EMAIL = 'Enter your email above first.'
/** Marks a field as invalid and points it at the error message (WCAG 3.3.1). */
const invalid = (on: boolean) => (on ? { 'aria-invalid': true, 'aria-describedby': 'auth-error' } as const : {})

export function AuthPage() {
  // Sign-up is not offered for now (no button opens it); the setter comes back with the "Create an account" button.
  const [mode] = useState<'signin' | 'signup'>('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const signup = mode === 'signup'
  const formRef = useRef<HTMLFormElement>(null)

  /** Emails a link to choose a new password (also how an invited person gets back in if the invitation link was already used). */
  async function forgot() {
    const email = String(new FormData(formRef.current!).get('email')).trim()
    if (!email) return setError(NEED_EMAIL)
    setBusy(true)
    setError(null)
    setNotice(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setBusy(false)
    if (error) setError(error.message)
    else setNotice('If that email has an account, we sent a link to choose a new password.')
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    setBusy(true)
    setError(null)
    setNotice(null)
    const { data, error } = signup
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: String(form.get('name')).trim() } },
        })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
    // With "Confirm email" on, sign-up returns no session: tell the user to confirm.
    else if (signup && !data.session) setNotice('Check your email to confirm your account, then sign in.')
  }

  return (
    <AuthLayout mobileLogo>
      {/* Figma Auth Card (sign in): one centered block; header, fields and actions 40 px apart, buttons 12 px. */}
      <CardContent>
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-10">
          <div className="flex flex-col gap-10">
            <CardHeader className="gap-2 px-0">
              <CardTitle asChild className="text-stat">
                <h1>{signup ? 'Create account' : 'Sign in'}</h1>
              </CardTitle>
              <CardDescription>
                {signup
                  ? 'New accounts have no access until a Super Admin assigns a role.'
                  : 'Welcome to the Civic Ops. Agent Platform'}
              </CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-3">
              {signup && <Input name="name" placeholder="Full name" aria-label="Full name" autoComplete="name" required />}
              <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required {...invalid(!!error)} />
              <Input
                name="password"
                type="password"
                placeholder="Password (min. 8 characters)"
                aria-label="Password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                minLength={8}
                required
                {...invalid(!!error && error !== NEED_EMAIL)}
              />
              {error && (
                <p id="auth-error" role="alert" className="text-body-sm text-incident">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="text-body-sm text-muted-foreground">
                  {notice}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </Button>
            {!signup && (
              <Button type="button" variant="link" size="sm" disabled={busy} onClick={forgot}>
                Forgot password?
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </AuthLayout>
  )
}
