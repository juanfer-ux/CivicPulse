import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IncidentHoverCard } from '@/components/IncidentHoverCard'
import type { Incident } from '@/lib/incidents'

vi.mock('@/lib/supabase', () => ({ supabase: {} })) // CI has no .env: the real client throws without it
vi.mock('@/lib/incidents', async (load) => ({ ...(await load<typeof import('@/lib/incidents')>()), fetchIncidentPhotos: () => Promise.resolve({ count: 1, placeholder: true }) }))

const incident = { id: 'i', reference: 'CP-00374', title: 'Sidewalk obstruction', status: 'received', occurred_at: '2026-09-02T10:00:00' } as Incident

describe('IncidentHoverCard', () => {
  it('shows the status, title, date, locality, reference and photo count', async () => {
    render(<IncidentHoverCard incident={incident} locality="Kennedy" />)
    expect(await screen.findByText('CP-00374 · 1 photo')).toBeInTheDocument()
    for (const text of ['Pending', 'Sidewalk obstruction', 'Kennedy', 'Latest photo · CP-00374 · 2 Sept']) expect(screen.getByText(text)).toBeInTheDocument()
  })
})
