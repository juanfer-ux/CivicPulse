/** Experiment (owner, 2026-11-20, `?places=1`): the places OpenStreetMap lists around an open recurrence, drawn as marks and listed in a card, nearest first. The places are looked up once by scripts/places-seed.ts (Overpass) and stored in Supabase (`recurrence_places`); `placesDb.ts` reads them. */
export type PlaceKind = 'shop' | 'food' | 'education' | 'bus' | 'other'
export type Place = { id: string; lat: number; lng: number; kind: PlaceKind; name: string; label: string; dist: number }
export const RADIUS_M = 100 // how far we keep places (owner, 2026-11-20: 60 m was too thin, 150 m put places outside the ring); the SQL seed uses the same 100
export const RING_M = 60 // the recurrence ring's real radius: only the places inside it are drawn on the map (owner, 2026-11-20: boxes outside the circle looked wrong); the card still lists up to RADIUS_M
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

/** OSM's own words for the things we show, in plain words (owner, 2026-11-20: "track" meant a running track and nobody could tell). Anything not listed shows its OSM value with a capital. */
const NICE: Record<string, string> = {
  track: 'Running or racing track', pitch: 'Sports pitch', parking: 'Car park', 'parking space': 'Parking space', doctors: 'Doctor’s office', clinic: 'Clinic', hospital: 'Hospital',
  pharmacy: 'Pharmacy', bank: 'Bank', atm: 'ATM', fuel: 'Fuel station', 'place of worship': 'Place of worship', school: 'School', kindergarten: 'Kindergarten', college: 'College',
  university: 'University', restaurant: 'Restaurant', cafe: 'Café', 'fast food': 'Fast food', bar: 'Bar', pub: 'Pub', 'bus stop': 'Bus stop', 'waste basket': 'Waste bin',
  'waste disposal': 'Waste disposal', 'recycling': 'Recycling point', police: 'Police', 'fire station': 'Fire station', 'travel agency': 'Travel agency', 'fitness station': 'Outdoor gym',
}
export const niceLabel = (label: string) => NICE[label] ?? (label ? label[0].toUpperCase() + label.slice(1) : 'Place')

/** Places that rarely matter to an operator (sports grounds, parks, benches): they go after everything else (owner, 2026-11-20), still nearest first among themselves. */
const LOW = new Set(['track', 'pitch', 'park', 'playground', 'garden', 'fitness station', 'picnic table', 'bench', 'dog park', 'swimming pool', 'common'])
export const orderPlaces = (list: Place[]) => [...list].sort((a, b) => Number(LOW.has(a.label)) - Number(LOW.has(b.label)) || a.dist - b.dist)

/** How many of the ordered list show at once: everything within NEAR_M that is not low-value, whatever it is; when nothing is that close, the nearest FALLBACK_N (owner, 2026-11-20). */
const FALLBACK_N = 5
export const shownCount = (ordered: Place[]) => ordered.filter((p) => p.dist <= NEAR_M && !LOW.has(p.label)).length || Math.min(FALLBACK_N, ordered.length)

/** Metres between two points (flat approximation, fine under a few hundred metres). */
export const metres = (aLat: number, aLng: number, bLat: number, bLng: number) => Math.hypot((bLat - aLat) * 111320, (bLng - aLng) * 111320 * Math.cos((aLat * Math.PI) / 180))
