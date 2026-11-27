import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Alert } from '@/components/ui/alert'

it('shows the close button only with onClose, independent of the action', () => {
  const onClose = vi.fn()
  const { rerender } = render(<Alert action={<button>Got it</button>}>Note</Alert>)
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  rerender(<Alert onClose={onClose}>Note</Alert>)
  expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalledOnce()
})
