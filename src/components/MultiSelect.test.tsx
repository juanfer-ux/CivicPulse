import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MultiSelect } from '@/components/MultiSelect'

const OPTIONS = [
  { value: 'a', label: 'Usaquén' },
  { value: 'b', label: 'Kennedy' },
]

// Regression tests for today's accessibility audit (docs/design-system/accessibility.md):
// the dropdown used to be role="listbox" wrapping checkboxes, an invalid ARIA pattern, and Escape
// never returned focus to the trigger.
describe('MultiSelect — accessibility regressions', () => {
  it('exposes the open dropdown as a labelled group of checkboxes, not an invalid listbox', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={OPTIONS} selected={[]} onChange={vi.fn()} noun="zones" />)

    await user.click(screen.getByRole('button', { name: 'Choose zones' }))

    expect(screen.getByRole('group', { name: 'Choose zones' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Kennedy' })).toBeInTheDocument()
  })

  it('returns focus to the trigger button when closed with Escape', async () => {
    const user = userEvent.setup()
    render(<MultiSelect options={OPTIONS} selected={[]} onChange={vi.fn()} noun="zones" />)

    const trigger = screen.getByRole('button', { name: 'Choose zones' })
    await user.click(trigger)
    expect(screen.getByRole('group')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('does not let its own Escape bubble out to close an enclosing panel (regression: this broke the invite form)', async () => {
    const user = userEvent.setup()
    const outerEscapeHandler = vi.fn()
    document.addEventListener('keydown', outerEscapeHandler) // stands in for a panel's own Escape-to-close
    render(<MultiSelect options={OPTIONS} selected={[]} onChange={vi.fn()} noun="zones" />)

    await user.click(screen.getByRole('button', { name: 'Choose zones' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('group')).not.toBeInTheDocument() // the dropdown did close
    expect(outerEscapeHandler).not.toHaveBeenCalled() // but the panel never saw the key
    document.removeEventListener('keydown', outerEscapeHandler)
  })

  it('selecting a checkbox calls onChange with the updated list (editing scope)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MultiSelect options={OPTIONS} selected={['a']} onChange={onChange} noun="zones" />)

    await user.click(screen.getByRole('button', { name: 'Usaquén' }))
    await user.click(screen.getByRole('checkbox', { name: 'Kennedy' }))

    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })
})
