import { useEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight, Image, VideoCamera } from '@phosphor-icons/react'
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
// Report photos test (owner, 2026-11-09): /?photos=2 is one full-width photo at a time with dots (the default), /?photos=3 one full-width photo with thumbnails; both from /#photo-carousel.
const PHOTOS = new URLSearchParams(location.search).get('photos') === '3' ? '3' : '2'
const PHOTOS_TEST = new URLSearchParams(location.search).has('photos')
const CAROUSEL_MAX = 6 // a report card shows at most six items (owner, 2026-11-09)

/** `carousel` (owner, 2026-11-09, the report card in the Occurrences History): 4:3 tiles at the full width, at most six, one at a time (see PHOTOS). The strip's own scrollbar is hidden because the arrows and the dots do its job. */
export function MediaGallery({ incidentId, carousel = false }: { incidentId: string; carousel?: boolean }) {
  const [loaded, setLoaded] = useState<{ id: string; rows: Media[] } | null>(null)
  const strip = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)

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
  const tiles = (loaded.rows.length ? loaded.rows : [null]).slice(0, carousel ? CAROUSEL_MAX : undefined)

  if (carousel) {
    // The seed has at most one placeholder photo per report, so with a ?photos switch in the URL the strip is padded to five placeholders to see the carousel (owner, 2026-11-09, test only).
    const shown: (Media | null)[] = PHOTOS_TEST ? Array.from({ length: 5 }, (_, k) => tiles[k] ?? { id: `demo-${k}`, kind: 'photo' as const, duration_seconds: null, is_placeholder: true }) : tiles
    const tile = (m: Media | null, className: string, k: number) => (
      <div key={m?.id ?? 'none'} className={`relative grid aspect-[4/3] place-items-center rounded-md border border-dashed bg-inset text-muted-foreground ${className}`} title={m?.is_placeholder === false ? 'File stored' : 'Placeholder: no file yet'}>
        {m?.kind === 'video' ? <VideoCamera className="size-6" aria-hidden /> : <Image className="size-6" aria-hidden />}
        <span className="absolute bottom-1.5 left-2 text-caption-medium">
          {m?.kind === 'video' ? `Video${m.duration_seconds ? ` ${clock(m.duration_seconds)}` : ''}` : m ? `Photo ${k + 1}` : 'No file'}
        </span>
      </div>
    )
    const arrow = (dir: 1 | -1, onClick: () => void, disabled: boolean) => (
      <button type="button" aria-label={dir === 1 ? 'Next' : 'Previous'} disabled={disabled} onClick={onClick} className={`absolute top-1/2 ${dir === 1 ? 'right-1' : 'left-1'} grid size-7 -translate-y-1/2 place-items-center rounded-full bg-(--neutral-900) text-(--neutral-100) disabled:opacity-0`}>
        {dir === 1 ? <CaretRight className="size-3.5" /> : <CaretLeft className="size-3.5" />}
      </button>
    )
    const note = <p className="text-meta text-muted-foreground">{loaded.rows.length ? 'Placeholder media: no files attached yet.' : 'No evidence attached yet.'}</p>
    const i = Math.min(at, shown.length - 1)
    if (PHOTOS === '3')
      // option 3: one full-width photo and a row of thumbnails
      return (
        <div className="flex flex-col gap-2">
          <div className="relative">
            {tile(shown[i], 'w-full', i)}
            {shown.length > 1 && (
              <>
                {arrow(-1, () => setAt(i - 1), i === 0)}
                {arrow(1, () => setAt(i + 1), i >= shown.length - 1)}
              </>
            )}
          </div>
          {shown.length > 1 && (
            <div className="grid grid-cols-6 gap-1.5">
              {shown.map((m, k) => (
                <button key={m?.id ?? k} type="button" aria-label={`Photo ${k + 1}`} aria-pressed={k === i} onClick={() => setAt(k)} className={`aspect-square rounded-sm bg-(--neutral-600) ${k === i ? 'ring-2 ring-(--neutral-100)' : 'opacity-60'}`} />
              ))}
            </div>
          )}
          {note}
        </div>
      )
    // option 2: one full-width photo at a time in a snapping strip, dots under it
    const go = (k: number) => strip.current?.scrollTo({ left: k * (strip.current.clientWidth + 8), behavior: 'smooth' })
    return (
      <div className="flex flex-col gap-2">
        <div className="relative">
          <div ref={strip} onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth + 8 || 1)))} className="flex snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shown.map((m, k) => tile(m, 'w-full shrink-0 snap-start', k))}
          </div>
          {shown.length > 1 && (
            <>
              {arrow(-1, () => go(i - 1), i === 0)}
              {arrow(1, () => go(i + 1), i >= shown.length - 1)}
            </>
          )}
        </div>
        {shown.length > 1 && (
          <div className="flex justify-center gap-1.5" aria-hidden>
            {shown.map((m, k) => (
              <span key={m?.id ?? k} className={`size-1.5 rounded-full ${k === i ? 'bg-(--neutral-100)' : 'bg-(--neutral-500)'}`} />
            ))}
          </div>
        )}
        {note}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((m) => (
          <div
            key={m?.id ?? 'none'}
            className="relative grid aspect-video place-items-center rounded-md border border-dashed bg-inset text-muted-foreground"
            title={m?.is_placeholder === false ? 'File stored' : 'Placeholder: no file yet'}
          >
            {m?.kind === 'video' ? <VideoCamera className="size-5" aria-hidden /> : <Image className="size-5" aria-hidden />}
            <span className="absolute bottom-1 left-1.5 text-caption-medium">
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
