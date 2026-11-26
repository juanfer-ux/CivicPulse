import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecurrenceDetailHeader } from '@/components/RecurrenceDetailHeader'

describe('RecurrenceDetailHeader', () => {
  it('shows the category, the reference with the locality and the status', () => {
    render(<RecurrenceDetailHeader category="Obstructive Parking" reference="PR-00088" locality="Teusaquillo" status="active" />)
    expect(screen.getByText('Obstructive Parking')).toBeTruthy()
    expect(screen.getByText('PR-00088 · Teusaquillo')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
  })
  it('shows an incident with its own status pill', () => {
    render(<RecurrenceDetailHeader category="Illegal Dumping" reference="CP-00200" group="rejected" />)
    expect(screen.getByText('CP-00200')).toBeTruthy()
    expect(screen.getByText('Rejected')).toBeTruthy()
  })
})
