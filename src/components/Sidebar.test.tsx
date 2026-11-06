import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from '@/components/Sidebar'

// Radix ScrollArea (the lists) needs ResizeObserver, which jsdom lacks.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ profile: { full_name: 'Ada Admin' }, session: { user: { email: 'ada@example.com' } }, signOut: vi.fn() }),
}))

const baseProps = {
  chats: [{ id: 1, title: 'Existing investigation' }],
  activeId: 1,
  onPick: vi.fn(),
  onNew: vi.fn(),
  cases: [],
  onNewCase: vi.fn(),
}

describe('Sidebar — creating investigations and cases', () => {
  // The sidebar starts collapsed (icons only) unless localStorage says otherwise; expand it so the
  // Investigations/Cases lists and their "+" buttons are actually in the DOM for these tests.
  beforeEach(() => localStorage.setItem('sidebar-collapsed', '0'))

  it('creates a new investigation', async () => {
    const user = userEvent.setup()
    const onNew = vi.fn()
    render(<Sidebar {...baseProps} onNew={onNew} />)

    await user.click(screen.getByRole('button', { name: 'New investigation' }))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('creates a new case', async () => {
    const user = userEvent.setup()
    const onNewCase = vi.fn()
    render(<Sidebar {...baseProps} onNewCase={onNewCase} />)

    await user.click(screen.getByRole('button', { name: 'New recurrence' }))
    expect(onNewCase).toHaveBeenCalledTimes(1)
  })

  it('picks an existing investigation from the list', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Sidebar {...baseProps} chats={[{ id: 1, title: 'Existing investigation' }, { id: 2, title: 'Another one' }]} onPick={onPick} />)

    await user.click(screen.getByText('Another one'))
    expect(onPick).toHaveBeenCalledWith(2)
  })

  it('Explore takes you to the agent landing: it starts a new investigation', async () => {
    const user = userEvent.setup()
    const onNew = vi.fn()
    render(<Sidebar {...baseProps} onNew={onNew} />)

    await user.click(screen.getByRole('button', { name: 'Explore' }))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('shows Recurrences, Incidents and Investigations in one sidebar', () => {
    render(<Sidebar {...baseProps} />)

    for (const t of ['Recurrences', 'Incidents', 'Investigations']) expect(screen.getByText(t)).toBeInTheDocument()
    expect(screen.getByText('Existing investigation')).toBeInTheDocument()
    expect(screen.getByText(/PR-00088/)).toBeInTheDocument()
    expect(screen.getByText('Access ramp obstruction')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument() // the incident's status, in its own run
  })

  it('each section has its own sort button', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...baseProps} />)

    await user.click(screen.getByRole('button', { name: /^Incidents: newest first/ }))
    expect(screen.getByRole('button', { name: /^Incidents: oldest first/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Recurrences: newest first/ })).toBeInTheDocument()
  })

  it('the search filters the three lists', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...baseProps} />)

    await user.type(screen.getByRole('searchbox', { name: 'Search the menu' }), 'Existing')
    expect(screen.getByText('Existing investigation')).toBeInTheDocument()
    expect(screen.queryByText(/PR-00088/)).not.toBeInTheDocument()
  })
})

// Regression tests for today's accessibility audit.
describe('Sidebar — accessibility regressions', () => {
  beforeEach(() => localStorage.setItem('sidebar-collapsed', '0'))

  it('the account menu is a proper ARIA menu button (not just an expanded div)', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...baseProps} />)

    const trigger = screen.getByRole('button', { name: 'Account menu' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await user.click(trigger)

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('the mobile menu is a true modal dialog: focus moves in, and back to the hamburger button on close', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...baseProps} />)

    const opener = screen.getByRole('button', { name: 'Open menu' })
    await user.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
