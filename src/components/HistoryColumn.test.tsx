import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { HistoryColumn } from '@/components/HistoryColumn'
import type { ProblemDetailData } from '@/lib/problems'

vi.mock('@/components/MediaGallery', () => ({ MediaGallery: () => null }))
vi.mock('@/lib/supabase', () => ({ supabase: {} })) // CI has no .env: the real client throws without it

const detail = {
  occurrences: [
    { occurrence_id: 'a', first_report_at: '2026-08-02T10:00:00', reports_n: 1 },
    { occurrence_id: 'b', subject_key: 'FIC-602', first_report_at: '2026-08-12T10:00:00', reports_n: 1 },
  ],
  links: [{ incident_id: 'i1', occurrence_id: 'a', state: 'confirmed' }, { incident_id: 'i2', occurrence_id: 'b', state: 'confirmed' }],
  incidents: [{ id: 'i1', reference: 'PRK-0001', occurred_at: '2026-08-02T10:00:00', status: 'received', vehicle_type: 'car', validation_status: 'pending' }, { id: 'i2', reference: 'PRK-0002', occurred_at: '2026-08-12T10:00:00', status: 'validated' }],
  sources: { i1: 'SIMUR', i2: 'Bogotá te Escucha' },
  interventions: [{ id: 'v', action_type: 'tow', agency: 'Movilidad', performed_at: '2026-08-16T10:00:00', description: 'Vehicle removed', outcome: 'cleared' }],
  events: [],
} as unknown as ProblemDetailData

const headers = () => screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
function History() {
  const [oldestFirst, setOldestFirst] = useState(false)
  return <HistoryColumn category="parking" status="resolved" detail={detail} openReportId={null} onSelectIncident={() => {}} focus={null} viewport={{ current: null }} oldestFirst={oldestFirst} onSort={() => setOldestFirst((o) => !o)} />
}
const show = () => render(<History />)

describe('HistoryColumn', () => {
  it('shows every occurrence open, newest first, with its plate, reports and intervention', () => {
    show()
    expect(headers()).toEqual(['Occurrence12 AugFIC 602', 'Occurrence2 Aug'])
    expect(screen.getByText('PRK-0002')).toBeInTheDocument()
    expect(screen.getByText('PRK-0001')).toBeInTheDocument()
    expect(screen.getByText('Road Cleared')).toBeInTheDocument()
  })
  it('keeps a report\'s details only while it is open', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true })) // reduced motion: the animation is instant
    const column = (openReportId: string | null) => <HistoryColumn category="parking" status="resolved" detail={detail} openReportId={openReportId} onSelectIncident={() => {}} focus={null} viewport={{ current: null }} oldestFirst={false} onSort={() => {}} />
    const { rerender } = render(column('i1'))
    expect(screen.getByText('Vehicle')).toBeInTheDocument()
    rerender(column(null))
    await waitFor(() => expect(screen.queryByText('Vehicle')).toBeNull())
    vi.unstubAllGlobals()
  })
  it('sorts oldest first and searches by reference or source', () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Show oldest first' }))
    expect(headers()).toEqual(['Occurrence2 Aug', 'Occurrence12 AugFIC 602'])
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'simur' } })
    expect(headers()).toEqual(['Occurrence2 Aug'])
    expect(screen.queryByText('PRK-0002')).toBeNull()
  })
})
