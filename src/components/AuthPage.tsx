import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/Logo'
import authImage from '@/assets/auth-image.png'
import { supabase } from '@/lib/supabase'

/** Placeholder value proposition shown next to the sign-in card on desktop. The picture is src/assets/auth-image.png: replace the file to change it. */
const VALUE_PROP = "AI Multi-Agent civic intelligence system that helps city departments see what's happening on their streets, decide what matters most, and act on it."

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
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_90%_90%_at_70%_30%,var(--neutral-500),var(--neutral-700))] p-4 desk:items-stretch desk:justify-start">
      <section className="relative hidden min-w-[850px] flex-1 items-end overflow-hidden rounded-lg bg-sidebar p-12 desk:flex">
        <img src={authImage} alt="" className="absolute inset-0 size-full object-cover object-left-top" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent,var(--neutral-900))]" />
        <p className="relative max-w-[754px] text-[32px] leading-[42px] font-normal text-foreground">{VALUE_PROP}</p>
      </section>
      <div className="flex w-full items-center justify-center desk:min-w-[450px] desk:max-w-[800px] desk:flex-1 desk:px-16">
        <Card className="w-full max-w-[360px] gap-16 border-0 bg-transparent">
          <Logo compact className="px-(--card-spacing)" />
          <CardContent>
            {/* Figma Auth Card (sign in): blocks 64 px apart; header and fields 24 px apart, fields and actions 12 px inside. */}
            <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-16">
              <div className="flex flex-col gap-6">
                <CardHeader className="px-0">
                  <CardTitle>{signup ? 'Create account' : 'Sign in'}</CardTitle>
                  <CardDescription>
                    {signup
                      ? 'New accounts have no access until a Super Admin assigns a role.'
                      : 'Civic Operations Agent.'}
                  </CardDescription>
                </CardHeader>
                <div className="flex flex-col gap-3">
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
                    <p role="alert" className="text-body-sm text-incident">
                      {error}
                    </p>
                  )}
                  {notice && <p className="text-body-sm text-muted-foreground">{notice}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-3">
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
