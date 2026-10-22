import { useEffect, useState } from 'react'
import { MediaImage, VideoCamera } from 'iconoir-react'
import { supabase } from '@/lib/supabase'

interface Media {
  id: string
  kind: 'photo' | 'video'
  duration_seconds: number | null
  is_placeholder: boolean
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * Evidence for one incident: photos and videos. Files will arrive from the future Citizen Agent; until
 * then every row is a placeholder tile. Nothing here has been visually inspected by anyone or anything.
 */
export function MediaGallery({ incidentId }: { incidentId: string }) {
  const [loaded, setLoaded] = useState<{ id: string; rows: Media[] } | null>(null)

  useEffect(() => {
    let stale = false
    supabase
      .from('incident_media')
      .select('id, kind, duration_seconds, is_placeholder')
      .eq('incident_id', incidentId)
      .order('kind')
      .order('created_at')
      .then(({ data }) => {
        if (!stale) setLoaded({ id: incidentId, rows: (data ?? []) as Media[] })
      })
    return () => {
      stale = true
    }
  }, [incidentId])

  if (loaded?.id !== incidentId) return <div className="aspect-video rounded-md bg-muted/40" aria-hidden />

  const photos = loaded.rows.filter((m) => m.kind === 'photo')
  const tiles = loaded.rows.length ? loaded.rows : [null]

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((m) => (
          <div
            key={m?.id ?? 'none'}
            className="relative grid aspect-video place-items-center rounded-md border border-dashed bg-inset text-muted-foreground"
            title={m?.is_placeholder === false ? 'File stored' : 'Placeholder: no file yet'}
          >
            {m?.kind === 'video' ? <VideoCamera className="size-5" aria-hidden /> : <MediaImage className="size-5" aria-hidden />}
            <span className="absolute bottom-1 left-1.5 text-caption">
              {m?.kind === 'video'
                ? `Video${m.duration_seconds ? ` ${clock(m.duration_seconds)}` : ''}`
                : m
                  ? `Photo ${photos.indexOf(m) + 1}`
                  : 'No file'}
            </span>
          </div>
        ))}
      </div>
      <p className="text-meta text-muted-foreground">
        {loaded.rows.length
          ? 'Placeholder media: no files attached yet, so nothing has been visually inspected.'
          : 'No evidence attached yet.'}
      </p>
    </div>
  )
}
