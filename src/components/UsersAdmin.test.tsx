import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersAdmin } from '@/components/UsersAdmin'
import { makeSupabaseMock } from '@/test/mockSupabase'

vi.mock('@/lib/auth', () => ({ useAuth: () => ({ session: { user: { id: 'super-1' } } }) }))

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
const { supabase } = await import('@/lib/supabase')

const PROFILES = [
  { id: 'super-1', full_name: 'Ada Admin', email: 'ada@example.com', role: 'super_admin', is_active: true, invitation_pending: false, created_at: '2026-01-01' },
  { id: 'spec-1', full_name: 'Sam Specialist', email: 'sam@example.com', role: 'specialist_operator', is_active: true, invitation_pending: false, created_at: '2026-01-02' },
]
const LOCALITIES = [{ code: 1, name: 'Usaquén' }, { code: 8, name: 'Kennedy' }]
const CATEGORIES = [{ code: 'parking', name: 'Obstructive parking', specialization: 'mobility' }]
const SPECIALIZATIONS = [{ code: 'mobility', name: 'Mobility', sort: 0 }]

function setupMock(overrides: Record<string, { data: unknown; error: unknown }> = {}) {
  const mock = makeSupabaseMock({
    profiles: { data: PROFILES, error: null },
    user_locality_access: { data: [{ user_id: 'spec-1', locality_code: 8 }], error: null },
    user_incident_type_access: { data: [{ user_id: 'spec-1', category: 'parking' }], error: null },
    localities: { data: LOCALITIES, error: null },
    incident_categories: { data: CATEGORIES, error: null },
    specializations: { data: SPECIALIZATIONS, error: null },
    ...overrides,
  })
  Object.assign(supabase, mock)
  return mock
}

describe('UsersAdmin', () => {
  beforeEach(() => setupMock())
  afterEach(() => vi.clearAllMocks())

  it('loads and lists every user from Supabase, never hitting a real database', async () => {
    render(<UsersAdmin />)
    expect(await screen.findByText('Ada Admin')).toBeInTheDocument()
    expect(screen.getByText('Sam Specialist')).toBeInTheDocument()
    expect(supabase.from).toHaveBeenCalledWith('profiles')
  })

  it('creates a user: the invite form validates, then calls the invite-user function', async () => {
    const user = userEvent.setup()
    render(<UsersAdmin />)
    await screen.findByText('Ada Admin')

    await user.click(screen.getAllByRole('button', { name: 'Create user' })[0])
    const panel = screen.getByRole('heading', { name: 'Create user' }).closest('aside')!

    // Submitting empty shows a validation error and never calls Supabase.
    await user.click(within(panel).getByRole('button', { name: 'Send invitation' }))
    expect(await within(panel).findByRole('alert')).toHaveTextContent('Enter the name.')
    expect(supabase.functions.invoke).not.toHaveBeenCalled()

    await user.type(within(panel).getByLabelText('Name'), 'New Person')
    await user.type(within(panel).getByLabelText('Email'), 'new@example.com')
    await user.click(within(panel).getByRole('combobox', { name: 'Role' }))
    await user.click(await screen.findByRole('option', { name: 'Locality (Zone) Admin' }))
    await user.click(within(panel).getByRole('button', { name: 'Choose zones' }))
    await user.click(await within(panel).findByRole('checkbox', { name: 'Kennedy' }))
    await user.keyboard('{Escape}')

    await user.click(within(panel).getByRole('button', { name: 'Send invitation' }))

    await waitFor(() =>
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'invite-user',
        expect.objectContaining({ body: expect.objectContaining({ full_name: 'New Person', email: 'new@example.com', role: 'locality_admin' }) }),
      ),
    )
  })

  it('edits a user: changing the role calls updateProfile through Supabase, not direct SQL', async () => {
    const user = userEvent.setup()
    render(<UsersAdmin />)
    await screen.findByText('Ada Admin')

    await user.click(screen.getByText('Sam Specialist'))
    const panel = (await screen.findByRole('heading', { name: 'Sam Specialist' })).closest('aside')!

    await user.click(within(panel).getByRole('combobox', { name: 'Role' }))
    await user.click(await screen.findByRole('option', { name: 'Locality (Zone) Admin' }))

    await waitFor(() => expect(within(panel).getByRole('status')).toHaveTextContent('Role set to Locality (Zone) Admin.'))
    const fromMock = vi.mocked(supabase.from)
    const updateCalls = fromMock.mock.results.filter((r) => {
      const builder = r.value as { update?: ReturnType<typeof vi.fn> }
      return builder.update?.mock.calls.some((c: unknown[]) => (c[0] as { role?: string })?.role === 'locality_admin')
    })
    expect(updateCalls.length).toBeGreaterThan(0)
  })

  it('deactivates a user (the closest thing to "delete" here: no hard delete exists)', async () => {
    const user = userEvent.setup()
    render(<UsersAdmin />)
    await screen.findByText('Ada Admin')

    await user.click(screen.getByText('Sam Specialist'))
    const panel = (await screen.findByRole('heading', { name: 'Sam Specialist' })).closest('aside')!
    const activeToggle = within(panel).getByRole('checkbox', { name: 'Account active' })
    expect(activeToggle).toBeChecked()

    await user.click(activeToggle)

    await waitFor(() => expect(within(panel).getByRole('status')).toHaveTextContent('Account switched off.'))
  })

  it('opens a user panel from the keyboard, not just a mouse click (WCAG 2.1.1 regression)', async () => {
    const user = userEvent.setup()
    render(<UsersAdmin />)
    await screen.findByText('Ada Admin')

    const row = screen.getByText('Sam Specialist').closest('tr')!
    row.focus()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('heading', { name: 'Sam Specialist' })).toBeInTheDocument()
  })

  it('table headers use scope="col" so a screen reader announces them as headers (WCAG 1.3.1 regression)', async () => {
    render(<UsersAdmin />)
    await screen.findByText('Ada Admin')

    for (const name of ['Name', 'Email', 'Role', 'Status', 'Categories']) {
      expect(screen.getByRole('columnheader', { name })).toHaveAttribute('scope', 'col')
    }
  })
})
