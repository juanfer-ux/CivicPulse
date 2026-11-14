import { useEffect, useState } from 'react'
import { SlidersHorizontal } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { NO_FILTERS, isFiltered, type Filters } from '@/components/FilterBar'
import { FiltersPanel, filterCount } from '@/components/FiltersPanel'
import type { Category, Locality } from '@/lib/incidents'

/**
 * The Filters side panel on its own (owner, 2026-11-14), the real `FiltersPanel` of the app drawn over a fake map with made-up data. Dev-only gallery at /#filters-panel: the Filters button opens the panel with its slide-in, Escape or Close shuts it, and a switch picks no filters or some chosen. The app itself opens the same panel from the Filters button over the map.
 */

const LOCALITIES: Locality[] = ['Antonio Nariño', 'Barrios Unidos', 'Bosa', 'Chapinero', 'Ciudad Bolívar', 'Engativá', 'Fontibón', 'Kennedy', 'Puente Aranda', 'Suba', 'Usaquén'].map((name, i) => ({ code: i + 1, name }))
const CATEGORIES: Category[] = [{ code: 'parking', name: 'Parking Obstruction' }, { code: 'illegal_dumping', name: 'Illegal Dumping' }]
const SOME: Filters = { ...NO_FILTERS, locality: '8', categories: ['parking'], statuses: ['pending', 'reviewing'], problemStatuses: ['active'], days: 30 }

export function FiltersPanelGallery() {
  const [open, setOpen] = useState(true)
  const [filters, setFilters] = useState<Filters>(SOME)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [])
  const n = filterCount(filters)
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-6 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading">Filters side panel</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">The app's real Filters panel over a fake map with made-up numbers. Open it with the button, close it with Close or Escape.</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setFilters(NO_FILTERS)}>No filters</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setFilters(SOME)}>Some chosen</Button>
        </div>
      </header>
      <div className="relative h-[820px] overflow-hidden rounded-lg border border-(--neutral-500) bg-(--neutral-800)">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_40%,var(--neutral-500),transparent_55%),radial-gradient(circle_at_70%_70%,var(--neutral-600),transparent_50%)]" aria-hidden />
        <div className="absolute top-5 right-5">
          <Button type="button" variant="outline" onClick={() => setOpen(true)} aria-expanded={open}>
            <SlidersHorizontal aria-hidden /> Filters{n ? ` · ${n}` : ''}
          </Button>
        </div>
        <div className={`absolute inset-y-0 right-0 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!open} inert={!open}>
          <FiltersPanel filters={filters} onChange={setFilters} onClose={() => setOpen(false)} results={isFiltered(filters) ? 48 : 666} localities={LOCALITIES} categories={CATEGORIES} counts={{ pending: 120, reviewing: 80, approved: 300, rejected: 166 }} problemCounts={{ active: 6, monitoring: 4, resolved: 3, archived: 3 }} />
        </div>
      </div>
    </main>
  )
}
