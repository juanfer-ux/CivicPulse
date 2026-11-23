import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar, shownRecurrences } from '@/components/Sidebar'

// Radix ScrollArea (the lists) needs ResizeObserver, which jsdom lacks.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ profile: { full_name: 'Ada Admin' }, session: { user: { email: 'ada@example.com' } }, signOut: vi.fn() }),
}))

const baseProps = {
  initialCollapsed: false, // the sidebar starts collapsed; these tests need its lists and "+" buttons in the DOM
  chats: [{ id: 1, title: 'Existing investigation' }],
  activeId: 1,
  onPick: vi.fn(),
  onNew: vi.fn(),
  cases: [],
  onNewCase: vi.fn(),
  recurrences: [{ id: 'p1', title: 'Parque La Serena, costado norte', status: 'active' as const, reference: 'PR-00088' }],
  incidents: [{ id: 'i1', title: 'Access ramp obstruction', reference: 'CP-00200', group: 'pending' as const }],
  chatItems: [{ title: 'A question', ids: ['p1', 'i1'] }], // only what a conversation touched is listed
}

describe('Sidebar — creating investigations and cases', () => {
  it('creates a new investigation', async () => {
    const user = userEvent.setup()
    const onNew = vi.fn()
    render(<Sidebar {...baseProps} onNew={onNew} />)

    const buttons = screen.getAllByRole('button', { name: 'New investigation' }) // the Explore row and the plus in the Investigations title
    expect(buttons).toHaveLength(2)
    for (const b of buttons) await user.click(b)
    expect(onNew).toHaveBeenCalledTimes(2)
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

    await user.click(screen.getAllByRole('button', { name: 'New investigation' })[0])
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('Explore is selected (aria-current) on the landing page and only there', () => {
    const { rerender } = render(<Sidebar {...baseProps} exploring />)
    expect(screen.getAllByRole('button', { name: 'New investigation' })[0]).toHaveAttribute('aria-current', 'page')
    rerender(<Sidebar {...baseProps} exploring={false} />)
    expect(screen.getAllByRole('button', { name: 'New investigation' })[0]).not.toHaveAttribute('aria-current')
  })

  it('shows Recurrences, Incidents and Investigations in one sidebar', () => {
    render(<Sidebar {...baseProps} />)

    for (const t of ['Recurrences', 'Incidents', 'Investigations']) expect(screen.getByText(t)).toBeInTheDocument()
    expect(screen.getByText('Existing investigation')).toBeInTheDocument()
    expect(screen.getByText(/PR-00088/)).toBeInTheDocument()
    expect(screen.getByText('Access ramp obstruction')).toBeInTheDocument()
    expect(screen.getByText(/CP-00200 · Pending/)).toBeInTheDocument() // the incident's reference and status
  })

  it('clicking a recurrence or an incident asks the map to open it', async () => {
    const user = userEvent.setup()
    const onOpenRecurrence = vi.fn()
    const onOpenIncident = vi.fn()
    render(<Sidebar {...baseProps} onOpenRecurrence={onOpenRecurrence} onOpenIncident={onOpenIncident} />)

    await user.click(screen.getByText('Parque La Serena, costado norte'))
    expect(onOpenRecurrence).toHaveBeenCalledWith('p1')
    await user.click(screen.getByText('Access ramp obstruction'))
    expect(onOpenIncident).toHaveBeenCalledWith('i1')
  })

  it('the row of what is open on the map is highlighted', () => {
    const { rerender } = render(<Sidebar {...baseProps} selected={{ kind: 'incident', id: 'i1' }} />)
    expect(screen.getByRole('button', { name: /Access ramp obstruction/ })).toHaveAttribute('aria-current', 'true')
    rerender(<Sidebar {...baseProps} selected={{ kind: 'recurrence', id: 'p1' }} />)
    expect(screen.getByRole('button', { name: /Parque La Serena/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /Access ramp obstruction/ })).not.toHaveAttribute('aria-current')
  })

  it('Investigations have the same view menu without the View group; Recurrences and Incidents start at View all by last update', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...baseProps} />)

    await user.click(screen.getByRole('button', { name: 'Investigations: view options' }))
    expect(screen.queryByRole('menuitemradio', { name: 'View all' })).toBeNull()
    expect(screen.getByRole('menuitemradio', { name: 'Newest first' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemradio', { name: 'Oldest first' }))
    await user.click(screen.getByRole('button', { name: 'Incidents: view options' }))
    expect(screen.getByRole('menuitemradio', { name: 'View all' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Last updated' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemradio', { name: 'Date created' }))
    await user.click(screen.getByRole('button', { name: 'Incidents: view options' }))
    expect(screen.getByRole('menuitemradio', { name: 'Date created' })).toHaveAttribute('aria-checked', 'true')
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

describe('Sidebar — every incident is listed, a few at a time (owner, 2026-11-23)', () => {
  it('lists the incidents a conversation holds and the ones it never mentioned', () => {
    render(<Sidebar {...baseProps} recurrences={[]} incidents={[{ id: 'a', title: 'In a chat', reference: 'CP-1', group: 'pending' as const }, { id: 'b', title: 'Never mentioned', reference: 'CP-2', group: 'pending' as const }]} chatItems={[{ title: 'My question', ids: ['a'] }]} />)
    expect(screen.getByText('In a chat')).toBeInTheDocument()
    expect(screen.getByText('Never mentioned')).toBeInTheDocument()
  })

  it('the first status group is open and the later ones start collapsed', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...baseProps} recurrences={[]} incidents={[{ id: 'a', title: 'Open one', reference: 'CP-1', group: 'pending' as const }, { id: 'b', title: 'Folded one', reference: 'CP-2', group: 'rejected' as const }]} chatItems={[{ title: 'Q', ids: ['a', 'b'] }]} />)
    await user.click(screen.getByRole('button', { name: 'Incidents: show all' })) // groups appear when the list is expanded
    await user.click(screen.getByRole('button', { name: 'Incidents: view options' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'By status' }))
    expect(screen.getByText('Open one')).toBeInTheDocument()
    expect(screen.queryByText('Folded one')).toBeNull()
    await user.click(screen.getByRole('button', { name: /Rejected · 1/ }))
    expect(screen.getByText('Folded one')).toBeInTheDocument()
  })
})

describe('Sidebar — three incidents collapsed, all of them expanded, and two investigations', () => {
  const twelve = Array.from({ length: 12 }, (_, k) => ({ id: `i${k}`, title: `Incident number ${k}`, reference: `CP-${k}`, group: 'pending' as const, updated: 100 - k }))
  it('shows the latest three incidents collapsed and draws more only when the title chevron is pressed', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...baseProps} recurrences={[]} incidents={twelve} chatItems={[{ title: 'Q', ids: twelve.map((i) => i.id) }]} />)
    expect(screen.getByText('Incident number 2')).toBeInTheDocument()
    expect(screen.queryByText('Incident number 3')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Incidents: show all' }))
    expect(screen.getByText('Incident number 11')).toBeInTheDocument() // twelve is under one batch of 20
    await user.click(screen.getByRole('button', { name: 'Incidents: show less' }))
    expect(screen.queryByText('Incident number 3')).toBeNull()
  })

  it('shows the latest three investigations; the title chevron shows them all, sorted by the view', async () => {
    const user = userEvent.setup()
    const chats = [1, 2, 3, 4].map((n) => ({ id: n, title: `Question ${n}`, created: n, updated: 10 - n }))
    render(<Sidebar {...baseProps} chats={chats} />)
    expect(screen.getByText('Question 1')).toBeInTheDocument() // the default is last updated, and 1 changed last
    expect(screen.queryByText('Question 4')).toBeNull() // collapsed: three rows
    await user.click(screen.getByRole('button', { name: 'Investigations: view options' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Date created' }))
    expect(screen.getByText('Question 4')).toBeInTheDocument() // by creation, 4 is the newest
    expect(screen.queryByText('Question 1')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Investigations: show all' }))
    expect(screen.getByText('Question 1')).toBeInTheDocument()
  })
})

describe('shownRecurrences', () => {
  const r = (id: string, updated: number) => ({ id, updated })
  const items = [r('red-dump', 5), r('red-park', 9), r('yellow', 3), r('old-resolved', 1), r('other', 20)]
  const pinned = new Set(['red-dump', 'red-park', 'yellow', 'old-resolved'])

  it('keeps the three newest pinned recurrences, and never lets another one push them out', () => {
    expect(shownRecurrences(items, pinned, null).map((x) => x.id)).toEqual(['red-park', 'red-dump', 'yellow'])
    expect(shownRecurrences(items, pinned, 'other').map((x) => x.id)).toEqual(['red-park', 'red-dump', 'yellow', 'other']) // the open one is added, the yellow stays
  })

  it('is the three most recently updated when nothing is pinned', () => {
    expect(shownRecurrences(items, undefined, null).map((x) => x.id)).toEqual(['other', 'red-park', 'red-dump'])
  })
})

describe('Sidebar — resizing the window', () => {
  // a controllable matchMedia: `fire(true)` is the window dropping under 1,800 px, `fire(false)` growing back
  function fakeMedia() {
    const ls: ((e: { matches: boolean }) => void)[] = []
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: (_: string, f: (e: { matches: boolean }) => void) => ls.push(f), removeEventListener: () => {} }))
    return (matches: boolean) => act(() => ls.forEach((f) => f({ matches })))
  }
  afterEach(() => vi.unstubAllGlobals())
  const open = () => !document.documentElement.hasAttribute('data-sidebar-collapsed')

  it('collapses when the window gets narrow and opens again when it grows back', () => {
    const fire = fakeMedia()
    render(<Sidebar {...baseProps} />)
    fire(true)
    expect(open()).toBe(false)
    fire(false)
    expect(open()).toBe(true)
  })

  it('leaves a sidebar the person collapsed alone when the window grows', async () => {
    const user = userEvent.setup()
    const fire = fakeMedia()
    render(<Sidebar {...baseProps} />)
    await user.click(screen.getByRole('button', { name: 'Collapse menu' })) // the person collapses it
    fire(false)
    expect(open()).toBe(false)
  })
})
