import { useEffect, useState, type CSSProperties } from 'react'
import { HoverCard } from '@/components/HoverCard'
import { IncidentStatusPill } from '@/components/IncidentStatusPill'
import { fetchIncidentPhotos, groupOf, type Incident, type IncidentPhotos } from '@/lib/incidents'

const date = (iso: string, year: boolean) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) })

/** A very small view of an incident (owner, 2026-11-25; Figma Incident Hover Card), shown while the pointer is over it on the map: its latest photo and status, what, when and where, its reference and how many photos. The full story is in the Incident Panel (click). */
export function IncidentHoverCard({ incident, locality, className, style }: { incident: Incident; locality: string; className?: string; style?: CSSProperties }) {
  const [loaded, setLoaded] = useState<{ id: string; photos: IncidentPhotos | null } | null>(null)
  useEffect(() => {
    let stale = false
    fetchIncidentPhotos(incident.id).then((photos) => !stale && setLoaded({ id: incident.id, photos }))
    return () => {
      stale = true
    }
  }, [incident.id])
  const photos = loaded?.id === incident.id ? loaded.photos : null
  const count = photos ? ` · ${photos.count} ${photos.count === 1 ? 'photo' : 'photos'}` : ''
  return (
    <HoverCard
      className={className}
      style={style}
      status={<IncidentStatusPill group={groupOf(incident.status)} />}
      photo={photos?.count ? `Latest photo · ${incident.reference} · ${date(incident.occurred_at, false)}` : null}
      placeholder={photos?.placeholder}
      title={incident.title}
      columns={[date(incident.occurred_at, true), locality]}
      note={`${incident.reference}${count}`}
    />
  )
}
