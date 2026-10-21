import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const signup = mode === 'signup'
  const formRef = useRef<HTMLFormElement>(null)

  /** Emails a link to choose a new password (also how an invited person gets back in if the invitation link was already used). */
  async function forgot() {
    const email = String(new FormData(formRef.current!).get('email')).trim()
    if (!email) return setError('Enter your email above first.')
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
    <main className="grid min-h-svh place-items-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Logo className="mb-9 ml-2" /> {/* Figma: 40px from logo row to title (4px header gap + 36px) */}
          <CardTitle>{signup ? 'Create account' : 'Sign in'}</CardTitle>
          <CardDescription>
            {signup
              ? 'New accounts have no access until a Super Admin assigns a role.'
              : 'Civic Operations Agent. Synthetic data only.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
            {signup && <Input name="name" placeholder="Full name" aria-label="Full name" autoComplete="name" required />}
            <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required />
            <Input
              name="password"
              type="password"
              placeholder="Password (min. 8 characters)"
              aria-label="Password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
            {error && (
              <p role="alert" className="text-body text-incident">
                {error}
              </p>
            )}
            {notice && <p className="text-body text-muted-foreground">{notice}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode(signup ? 'signin' : 'signup')
                setError(null)
                setNotice(null)
              }}
            >
              {signup ? 'I already have an account' : 'Create an account'}
            </Button>
            {!signup && (
              <Button type="button" variant="link" size="sm" disabled={busy} onClick={forgot}>
                Forgot password?
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
