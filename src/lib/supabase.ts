import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. See .env.example.')
}

// A key pasted with a placeholder like "sb_publishable_…" (a real "…" character) fails later with a cryptic
// "non ISO-8859-1 code point" fetch error. Catch it here with a clear message.
if (!/^[\x21-\x7e]+$/.test(key)) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY contains characters that are not valid in a key (for example "…" or a space). Paste the full key from Supabase, then redeploy.',
  )
}

// A "forgot password" email link opens the app with "type=recovery" in the address. Note it now: the client removes it from the address once it has read the session.
// (Invited people are recognised by their account instead, see needsPassword in auth.tsx.)
export const arrivedByRecovery = /[#&]type=recovery\b/.test(window.location.hash)

export const supabase = createClient(url, key)
