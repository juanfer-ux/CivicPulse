import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/MultiSelect'
import { Input } from '@/components/ui/input'
import { useAuth, type AppRole } from '@/lib/auth'
import {
  ROLES,
  ROLE_LABELS,
  fetchUserAdminData,
  inviteUser,
  setCategories,
  setLocalities,
  specialtyOf,
  statusOf,
  updateProfile,
  validateInvite,
  type AdminData,
  type InviteForm,
  type UserRow,
  type UserStatus,
} from '@/lib/users'

const STATUS_LABEL: Record<UserStatus, string> = { pending: 'Pending', active: 'Active', off: 'Off' }
const STATUS_VARIANT: Record<UserStatus, 'default' | 'secondary' | 'outline'> = {
  pending: 'default',
  active: 'secondary',
  off: 'outline',
}
const SELECT =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 [&>option]:bg-card'

const ASIDE = 'max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-[49px] max-md:z-20 md:w-[420px] md:shrink-0 md:border-l bg-card'
const localities = (n: number) => `${n} ${n === 1 ? 'locality' : 'localities'}`

export function UsersAdmin() {
  const { session } = useAuth()
  const meId = session?.user.id
  const [data, setData] = useState<AdminData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pendingOnly, setPendingOnly] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchUserAdminData().then(setData, (e: Error) => setError(e.message))
  }, [])

  /** After an invitation: reload the list and open the new person's panel. */
  const invited = async (id: string) => {
    setData(await fetchUserAdminData())
    setCreating(false)
    setOpenId(id)
  }

  const patch = useCallback(
    (id: string, change: Partial<UserRow>) =>
      setData((d) => d && { ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...change } : u)) }),
    [],
  )

  const rows = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.users
      .filter((u) => (!q || `${u.full_name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q)) && (!roleFilter || u.role === roleFilter))
      .filter((u) => !pendingOnly || statusOf(u) === 'pending')
      .sort((a, b) => Number(statusOf(b) === 'pending') - Number(statusOf(a) === 'pending'))
  }, [data, search, roleFilter, pendingOnly])

  const open = data?.users.find((u) => u.id === openId)
  const pendingCount = data?.users.filter((u) => statusOf(u) === 'pending').length ?? 0

  return (
    <div className="absolute inset-0 overflow-hidden bg-background max-md:pt-[49px]">
      <div className="flex h-full">
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold">Users</h1>
              <p className="text-sm text-muted-foreground">
                {data ? `${data.users.length} ${data.users.length === 1 ? 'person' : 'people'}, ${pendingCount} waiting for a role` : 'Loading…'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setOpenId(null)
                  setCreating(true)
                }}
              >
                Create user
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input className="max-w-xs" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={`${SELECT} w-auto`} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />
              Pending only
            </label>
          </div>

          {error && <p className="text-sm text-destructive">Could not load users: {error}</p>}

          {data && (
            <table className="w-full text-left text-sm max-md:block">
              <thead className="text-xs text-muted-foreground max-md:hidden">
                <tr className="border-b">
                  {['Name', 'Email', 'Role', 'Status', 'Localities', 'Categories'].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="max-md:flex max-md:flex-col max-md:gap-2">
                {rows.map((u) => {
                  const status = statusOf(u)
                  return (
                    <tr
                      key={u.id}
                      onClick={() => {
                        setCreating(false)
                        setOpenId(u.id)
                      }}
                      className={`cursor-pointer border-b hover:bg-muted/50 max-md:grid max-md:grid-cols-2 max-md:gap-1 max-md:rounded-lg max-md:border max-md:bg-card max-md:p-3 ${openId === u.id ? 'bg-muted/50' : ''}`}
                    >
                      <td className="px-3 py-2 font-medium max-md:col-span-2 max-md:p-0">{u.full_name || 'No name'}</td>
                      <td className="px-3 py-2 text-muted-foreground max-md:col-span-2 max-md:truncate max-md:p-0">{u.email}</td>
                      <td className="px-3 py-2 max-md:p-0">
                        {u.role ? ROLE_LABELS[u.role] : '—'}
                        {u.role === 'specialist_operator' && <span className="block text-xs text-muted-foreground">{specialtyOf(u, data).join(', ') || 'No specialty yet'}</span>}
                      </td>
                      <td className="px-3 py-2 max-md:p-0">
                        <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                        {u.invitation_pending && <span className="ml-2 text-xs text-muted-foreground">Invited</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-md:p-0">{u.role === 'super_admin' ? 'All' : localities(u.localities.length)}</td>
                      <td className="px-3 py-2 text-muted-foreground max-md:p-0">{u.role === 'super_admin' ? 'All' : u.categories.length ? u.categories.map(categoryName(data)).join(', ') : '—'}</td>
                    </tr>
                  )
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      No one matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {creating && data && <InvitePanel data={data} onClose={() => setCreating(false)} onInvited={invited} />}
        {open && data && !creating && (
          <UserPanel key={open.id} user={open} data={data} isMe={open.id === meId} onPatch={patch} onClose={() => setOpenId(null)} />
        )}
      </div>
    </div>
  )
}

const categoryName = (data: AdminData) => (code: string) => data.categories.find((c) => c.code === code)?.name ?? code

function UserPanel({
  user,
  data,
  isMe,
  onPatch,
  onClose,
}: {
  user: UserRow
  data: AdminData
  isMe: boolean
  onPatch: (id: string, change: Partial<UserRow>) => void
  onClose: () => void
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  /** Runs one save; shows the result in words. The database has the final say (RLS, last-Super-Admin guard). */
  const save = async (job: () => Promise<void>, change: Partial<UserRow>, done: string) => {
    setBusy(true)
    try {
      await job()
      onPatch(user.id, change)
      setMsg({ ok: true, text: done })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save.' })
    } finally {
      setBusy(false)
    }
  }

  const localityOptions = data.localities.map((l) => ({ value: l.code, label: l.name }))
  const toggleCategory = (code: string, on: boolean) => {
    const wanted = on ? [...user.categories, code] : user.categories.filter((c) => c !== code)
    return save(() => setCategories(user.id, user.categories, wanted), { categories: wanted.sort() }, 'Categories saved.')
  }

  const status = statusOf(user)
  const names = user.categories.map(categoryName(data))
  const summary =
    user.invitation_pending
      ? 'Invitation sent: they get access as soon as they accept it.'
      : status === 'pending'
      ? 'Sees nothing yet: waiting for a role.'
      : user.role === 'super_admin'
        ? 'Sees everything and manages users.'
        : !user.localities.length
          ? 'Sees nothing yet: no localities assigned.'
          : user.role === 'specialist_operator' && !names.length
            ? 'Sees nothing yet: no categories assigned.'
            : `Can see ${localities(user.localities.length)}, ${user.role === 'specialist_operator' ? names.join(' + ') : 'all categories'}.`

  return (
    <aside className={ASIDE}>
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{user.full_name || 'No name'}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <p className="rounded-lg bg-muted/50 p-3 text-sm">{summary}</p>
        {user.role === 'specialist_operator' && <p className="text-sm">Specialty: {specialtyOf(user, data).join(', ') || 'none yet'}</p>}
        {isMe && <p className="text-xs text-muted-foreground">This is you: your own role and status are locked so you cannot lock yourself out.</p>}

        <label className="flex flex-col gap-1 text-sm">
          Role
          <select
            className={SELECT}
            disabled={busy || isMe}
            value={user.role ?? ''}
            onChange={(e) => {
              const role = e.target.value as AppRole
              void save(() => updateProfile(user.id, { role }), { role }, `Role set to ${ROLE_LABELS[role]}.`)
            }}
          >
            {!user.role && <option value="">Pending: choose a role</option>}
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={busy || isMe || !user.role}
            checked={user.is_active}
            onChange={(e) => {
              const is_active = e.target.checked
              void save(() => updateProfile(user.id, { is_active }), { is_active }, is_active ? 'Account switched on.' : 'Account switched off.')
            }}
          />
          Account active
        </label>

        {user.role !== 'super_admin' && (
          <div className="flex flex-col gap-1 text-sm">
            Localities
            <MultiSelect
              noun="localities"
              options={localityOptions}
              selected={user.localities}
              disabled={busy || !user.role}
              onChange={(next) => save(() => setLocalities(user.id, user.localities, next), { localities: [...next].sort((x, y) => x - y) }, 'Localities saved.')}
            />
          </div>
        )}

        {user.role === 'specialist_operator' && (
          <fieldset className="flex flex-col gap-3" disabled={busy}>
            <legend className="text-sm font-medium">Categories</legend>
            {data.specializations.map((s) => {
              const cats = data.categories.filter((c) => c.specialization === s.code)
              return (
                <div key={s.code} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                  {cats.length ? (
                    cats.map((c) => (
                      <label key={c.code} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={user.categories.includes(c.code)} onChange={(e) => toggleCategory(c.code, e.target.checked)} />
                        {c.name}
                      </label>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories yet</span>
                  )}
                </div>
              )
            })}
          </fieldset>
        )}

        <p role="status" className={`min-h-5 text-sm ${msg?.ok === false ? 'text-destructive' : 'text-muted-foreground'}`}>
          {busy ? 'Saving…' : msg?.text}
        </p>
      </div>
    </aside>
  )
}

function InvitePanel({ data, onClose, onInvited }: { data: AdminData; onClose: () => void; onInvited: (id: string) => Promise<void> }) {
  const [form, setForm] = useState<InviteForm>({ full_name: '', email: '', role: '', localities: [], categories: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (change: Partial<InviteForm>) => setForm((f) => ({ ...f, ...change }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = validateInvite(form)
    if (problem) return setError(problem)
    setBusy(true)
    setError(null)
    try {
      await onInvited(await inviteUser(form))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the invitation.')
      setBusy(false)
    }
  }

  const toggleCategory = (code: string, on: boolean) => set({ categories: on ? [...form.categories, code] : form.categories.filter((c) => c !== code) })
  const specialty = specialtyOf({ role: form.role || null, categories: form.categories }, data).join(', ')

  return (
    <aside className={ASIDE}>
      <form onSubmit={submit} className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Create user</h2>
            <p className="text-sm text-muted-foreground">They get an email to set their own password.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Name
          <Input value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select className={SELECT} value={form.role} onChange={(e) => set({ role: e.target.value as AppRole | '' })}>
            <option value="">Choose a role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>

        {form.role === 'super_admin' && <p className="rounded-lg bg-muted/50 p-3 text-sm">Super Admins see everything and manage users, so no zone is needed.</p>}

        {(form.role === 'locality_admin' || form.role === 'specialist_operator') && (
          <div className="flex flex-col gap-1 text-sm">
            Zone{form.role === 'locality_admin' ? ' to administer' : 's'}
            <MultiSelect
              noun="zones"
              options={data.localities.map((l) => ({ value: l.code, label: l.name }))}
              selected={form.localities}
              onChange={(localities) => set({ localities })}
            />
          </div>
        )}

        {form.role === 'specialist_operator' && (
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">Specialty and categories</legend>
            {data.specializations.map((sp) => {
              const cats = data.categories.filter((c) => c.specialization === sp.code)
              return (
                <div key={sp.code} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{sp.name}</span>
                  {cats.length ? (
                    cats.map((c) => (
                      <label key={c.code} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.categories.includes(c.code)} onChange={(e) => toggleCategory(c.code, e.target.checked)} />
                        {c.name}
                      </label>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories yet</span>
                  )}
                </div>
              )
            })}
            {specialty && <span className="text-xs text-muted-foreground">Specialty: {specialty}</span>}
          </fieldset>
        )}

        <p role="alert" className="min-h-5 text-sm text-destructive">
          {error}
        </p>
        <Button type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send invitation'}
        </Button>
      </form>
    </aside>
  )
}
