/** Experiment (owner, 2026-11-20, `?places=1`): the places OpenStreetMap lists around an open recurrence, drawn as marks and listed in a card, nearest first. The places are looked up once by scripts/places-seed.ts (Overpass) and stored in Supabase (`recurrence_places`); `placesDb.ts` reads them. */
export type PlaceKind = 'shop' | 'food' | 'education' | 'bus' | 'other'
export type Place = { id: string; lat: number; lng: number; kind: PlaceKind; name: string; label: string; dist: number }
export const RADIUS_M = 100 // how far we keep places (owner, 2026-11-20: 60 m was too thin, 150 m put places outside the ring); the SQL seed uses the same 100
export const NEAR_M = 20 // everything inside this is listed first; the rest sits behind "View more"

export const kindOf = (tags: Record<string, string>): PlaceKind | null => {
  if (tags.highway === 'bus_stop') return 'bus'
  if (['school', 'kindergarten', 'college', 'university'].includes(tags.amenity)) return 'education'
  if (['restaurant', 'cafe', 'fast_food', 'bar', 'pub'].includes(tags.amenity)) return 'food'
  if (tags.shop) return 'shop'
  return tags.amenity || tags.office || tags.tourism || tags.leisure || tags.healthcare ? 'other' : null
}
/** What a place is, in words: its OSM value ("pharmacy", "bus_stop") with the underscores out. */
export const labelOf = (tags: Record<string, string>) => (tags.highway === 'bus_stop' ? 'bus stop' : (tags.amenity || tags.shop || tags.office || tags.tourism || tags.leisure || tags.healthcare || '').replace(/_/g, ' '))

/** How many of the nearest-first list show at once: everything within NEAR_M, whatever it is; when nothing is that close, the nearest FALLBACK_N (owner, 2026-11-20). */
const FALLBACK_N = 5
export const shownCount = (sorted: Place[]) => sorted.filter((p) => p.dist <= NEAR_M).length || Math.min(FALLBACK_N, sorted.length)

/** Metres between two points (flat approximation, fine under a few hundred metres). */
export const metres = (aLat: number, aLng: number, bLat: number, bLng: number) => Math.hypot((bLat - aLat) * 111320, (bLng - aLng) * 111320 * Math.cos((aLat * Math.PI) / 180))
