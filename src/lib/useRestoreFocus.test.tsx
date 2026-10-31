import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { useFocusTrap, useRestoreFocus } from '@/lib/useRestoreFocus'

// Regression tests for today's accessibility audit: side panels used to leave focus wherever it
// was when they opened, and never gave it back on close (docs/design-system/accessibility.md).
function Panel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useRestoreFocus(ref)
  return (
    <div ref={ref} tabIndex={-1} data-testid="panel">
      <button onClick={onClose}>Close</button>
    </div>
  )
}

function Host() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && <Panel onClose={() => setOpen(false)} />}
    </div>
  )
}

function TrapHost() {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref)
  return (
    <div ref={ref} data-testid="trap">
      <button>First</button>
      <button>Last</button>
    </div>
  )
}

describe('useRestoreFocus', () => {
  it('moves focus into the panel on mount, and back to the trigger on unmount', async () => {
    const user = userEvent.setup()
    const { getByText, queryByTestId } = render(<Host />)

    const opener = getByText('Open')
    await user.click(opener)
    expect(queryByTestId('panel')).toHaveFocus()

    await user.click(getByText('Close'))
    expect(opener).toHaveFocus()
  })
})

describe('useFocusTrap', () => {
  it('wraps Tab from the last focusable element back to the first', async () => {
    const user = userEvent.setup()
    const { getByText } = render(<TrapHost />)

    getByText('Last').focus()
    await user.tab()
    expect(getByText('First')).toHaveFocus()
  })

  it('wraps Shift+Tab from the first focusable element back to the last', async () => {
    const user = userEvent.setup()
    const { getByText } = render(<TrapHost />)

    getByText('First').focus()
    await user.tab({ shift: true })
    expect(getByText('Last')).toHaveFocus()
  })
})
