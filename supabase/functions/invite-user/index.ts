// Super Admin invites a person by email (docs/roles-and-permissions.md, section 5; decision 0011).
// Runs on Supabase's servers: the admin key below is injected by Supabase and never reaches the browser.
// Deploy: Supabase Dashboard → Edge Functions → invite-user (keep "Verify JWT" on), or `supabase functions deploy invite-user`.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ROLES = ['super_admin', 'locality_admin', 'specialist_operator']
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply({ error: 'Use POST.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  // Acts as the caller: the existing access rules (RLS) apply to everything done with this client.
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 1. Who is calling, and may they manage users?
  const { data: auth } = await caller.auth.getUser()
  if (!auth.user) return reply({ error: 'Sign in first.' }, 401)
  const { data: allowed } = await caller.rpc('has_permission', { p_action: 'manage_users' })
  if (allowed !== true) return reply({ error: 'Only a Super Admin can invite people.' }, 403)
  // "You can only grant access you have": today only a Super Admin (all localities, all categories) passes.
  const { data: me } = await caller.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
  if (me?.role !== 'super_admin') return reply({ error: 'You cannot grant more access than you have.' }, 403)

  // 2. Validate input.
  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const fullName = String(body?.full_name ?? '').trim()
  const role = String(body?.role ?? '')
  const localities: number[] = Array.isArray(body?.localities) ? body.localities.map(Number) : []
  const specialty = String(body?.specialty ?? '')
  if (!fullName) return reply({ error: 'Name is required.' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: 'Enter a valid email.' }, 400)
  if (!ROLES.includes(role)) return reply({ error: 'Choose a role.' }, 400)

  if (role !== 'super_admin') {
    if (!localities.length) return reply({ error: 'Choose at least one locality.' }, 400)
    const { data: known } = await caller.from('localities').select('code').in('code', localities)
    if ((known?.length ?? 0) !== new Set(localities).size) return reply({ error: 'Unknown locality.' }, 400)
  }
  let categories: string[] = []
  if (role === 'specialist_operator') {
    const { data: cats } = await caller
      .from('incident_categories')
      .select('code')
      .eq('specialization', specialty)
      .eq('active', true)
    categories = (cats ?? []).map((c) => c.code)
    if (!categories.length) return reply({ error: 'Choose a specialty that has categories.' }, 400)
  }

  // 3. Create the account and send the invitation email. The handle_new_user trigger creates the profile.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: typeof body?.redirect_to === 'string' ? body.redirect_to : undefined,
  })
  if (inviteError || !invited.user) {
    const taken = /already|registered|exists/i.test(inviteError?.message ?? '')
    return reply({ error: taken ? 'That email is already registered.' : (inviteError?.message ?? 'Could not send the invitation.') }, taken ? 409 : 500)
  }
  const id = invited.user.id

  // 4. Assign role and access as the caller, so the existing triggers audit it with the right actor.
  try {
    const set = await caller.from('profiles').update({ role }).eq('id', id).select('id')
    if (set.error || !set.data?.length) throw new Error(set.error?.message ?? 'Could not set the role.')
    if (role !== 'super_admin') {
      const r = await caller.from('user_locality_access').insert(localities.map((c) => ({ user_id: id, locality_code: c })))
      if (r.error) throw new Error(r.error.message)
    }
    if (categories.length) {
      const r = await caller.from('user_incident_type_access').insert(categories.map((c) => ({ user_id: id, category: c })))
      if (r.error) throw new Error(r.error.message)
    }
    const log = await admin.from('audit_events').insert({
      actor: auth.user.id,
      action: 'user_invited',
      entity: 'user',
      entity_id: id,
      details: { email, role, localities, specialty: specialty || null },
    })
    if (log.error) throw new Error(log.error.message)
  } catch (e) {
    await admin.auth.admin.deleteUser(id) // leave no half-made user behind
    return reply({ error: `Invitation cancelled: ${(e as Error).message}` }, 500)
  }
  return reply({ id })
})
