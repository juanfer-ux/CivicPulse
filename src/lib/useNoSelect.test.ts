import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useReleaseGuard } from '@/lib/useNoSelect'

describe('useReleaseGuard (a drag always ends)', () => {
  it('ends the drag on a window pointerup, blur or a hidden tab, only while dragging', () => {
    const stop = vi.fn()
    const { rerender } = renderHook(({ on }) => useReleaseGuard(on, stop), { initialProps: { on: false } })
    window.dispatchEvent(new Event('blur'))
    expect(stop).not.toHaveBeenCalled()
    rerender({ on: true })
    window.dispatchEvent(new Event('pointerup'))
    window.dispatchEvent(new Event('blur'))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(stop).toHaveBeenCalledTimes(3)
    rerender({ on: false })
    window.dispatchEvent(new Event('blur'))
    expect(stop).toHaveBeenCalledTimes(3)
  })
})
