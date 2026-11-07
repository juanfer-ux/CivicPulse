import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MapZoomControl, type ZoomableMap } from '@/components/MapZoomControl'

const fake = (zoom = 15): ZoomableMap & { calls: string[] } => {
  const calls: string[] = []
  return {
    calls,
    getZoom: () => zoom,
    zoomTo: (z) => calls.push(`zoomTo ${z}`),
    zoomIn: () => calls.push('zoomIn'),
    zoomOut: () => calls.push('zoomOut'),
    flyTo: (o) => calls.push(`flyTo ${o.zoom}`),
    on: vi.fn(),
    off: vi.fn(),
  }
}
const home = { center: [-74.09, 4.65] as [number, number], zoom: 12 }

describe('MapZoomControl', () => {
  it('the home button flies back to the default view', async () => {
    const map = fake()
    render(<MapZoomControl map={map} min={11} max={18} home={home} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Back to the default view' }))
    expect(map.calls).toEqual(['flyTo 12'])
  })
  it('plus and minus zoom by a step and the slider sets the zoom', async () => {
    const map = fake()
    render(<MapZoomControl map={map} min={11} max={18} home={home} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(map.calls).toEqual(['zoomIn', 'zoomOut'])
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveValue('15')
  })
  it('disables plus at the closest zoom and minus at the farthest', () => {
    const { rerender } = render(<MapZoomControl map={fake(18)} min={11} max={18} home={home} />)
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    rerender(<MapZoomControl map={fake(11)} min={11} max={18} home={home} />)
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled()
  })
})
