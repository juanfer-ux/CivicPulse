import { useState } from 'react'
import { NEAR_M, RADIUS_M, RING_M, niceLabel, shownCount, type Place } from '@/lib/places'

// every place is the same neutral, like its marker on the map (owner, 2026-11-20)

/** Experiment (`?places=1`, owner, 2026-11-20): what OpenStreetMap lists around the open recurrence, nearest first. Everything within NEAR_M is shown at once, whatever it is; the rest (up to RADIUS_M) is behind "View more". Mount it with `key` = the recurrence so it closes again for the next one. */
export function PlacesCard({ places }: { places: Place[] | 'loading' | 'error' }) {
  const [all, setAll] = useState(false)
  const list = Array.isArray(places) ? places : []
  const n = shownCount(list)
  const near = list.slice(0, n)
  const far = list.slice(n)
  const none = near.length > 0 && near[0].dist > NEAR_M // nothing within NEAR_M: the nearest ones show instead
  const row = (p: Place) => (
    <div key={p.id} className={`flex items-center gap-2 ${p.dist > RING_M ? 'opacity-50' : ''}`}>
      <span className="size-2 shrink-0 rounded-[1px]" style={{ background: 'var(--neutral-100)' }} aria-hidden /> {/* a square, like the mark on the map (owner, 2026-11-20) */}
      <span className="min-w-0 flex-1 truncate text-(--fg-primary)">{p.name || niceLabel(p.label)}{p.name && p.label ? <span className="text-(--neutral-300)"> · {niceLabel(p.label)}</span> : null}</span>
      <span className="shrink-0 text-(--neutral-300)">{p.dist} m</span>
    </div>
  )
  return (
    <div className="pointer-events-auto absolute bottom-(--map-pad) left-(--col-left) z-20 hidden max-h-[360px] w-[320px] flex-col gap-2 overflow-y-auto rounded-sm border border-(--neutral-400) bg-(--neutral-800) p-3 text-body-sm desk:flex">
      <p className="text-meta text-(--neutral-300)">Around this location · nearest first · OpenStreetMap</p>
      {places === 'loading' ? (
        <p className="text-(--fg-secondary)">Looking up places…</p>
      ) : places === 'error' ? (
        <p className="text-(--fg-secondary)">Could not load the stored places. Open the recurrence again to retry.</p>
      ) : (
        <>
          <p className="text-caption-medium text-(--fg-secondary)">{none ? `Nothing mapped within ${NEAR_M} m. The nearest:` : `Within ${NEAR_M} m`}</p>
          {near.length ? near.map(row) : <p className="text-(--neutral-300)">Nothing mapped within {RADIUS_M} m.</p>}
          {far.length > 0 && (all ? (
            <>
              <p className="pt-1 text-caption-medium text-(--fg-secondary)">Farther, up to {RADIUS_M} m · fainter rows are outside the circle, not on the map</p>
              {far.map(row)}
            </>
          ) : (
            <button type="button" className="self-start text-caption-medium text-(--indigo-200) hover:text-(--indigo-100)" onClick={() => setAll(true)}>View more ({far.length} up to {RADIUS_M} m)</button>
          ))}
        </>
      )}
    </div>
  )
}
