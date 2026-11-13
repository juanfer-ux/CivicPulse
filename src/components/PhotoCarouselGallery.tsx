import { useRef, useState, type ReactNode } from 'react'
import { CaretDown, CaretLeft, CaretRight, Image } from '@phosphor-icons/react'

/**
 * Ways to show the photos of a report inside the open report card of the Occurrences History (owner's question, 2026-11-09: is 72 % the right size, or one full-width photo at a time?). Dev-only gallery at /#photo-carousel: every mini card is live (arrows, dots, thumbnails; swipe or scroll works too). Choose 1, 3 or 6 photos at the top to see the edges. The card is 340 px wide inside, like the real one; the tiles are placeholders.
 */

const GAP = 8
const Tile = ({ n, className = '' }: { n: number; className?: string }) => (
  <div className={`relative grid place-items-center rounded-md border border-dashed bg-inset text-muted-foreground ${className}`}>
    <Image className="size-6" aria-hidden />
    <span className="absolute bottom-1.5 left-2 text-caption-medium">Photo {n}</span>
  </div>
)

const Arrow = ({ dir, disabled, onClick }: { dir: 'left' | 'right'; disabled: boolean; onClick: () => void }) => (
  <button type="button" aria-label={dir === 'left' ? 'Previous' : 'Next'} disabled={disabled} onClick={onClick} className={`absolute top-1/2 ${dir === 'left' ? 'left-1' : 'right-1'} grid size-7 -translate-y-1/2 place-items-center rounded-full bg-(--neutral-900) text-(--neutral-100) disabled:opacity-0`}>
    {dir === 'left' ? <CaretLeft className="size-3.5" /> : <CaretRight className="size-3.5" />}
  </button>
)

/** A snapping strip: `tileW` is each tile's share of the width (1 = full width). Reports the index the strip is on. */
function Strip({ count, tileW, ratio, onAt, at, children }: { count: number; tileW: string; ratio: string; onAt: (i: number) => void; at: number; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const step = () => (ref.current?.firstElementChild?.getBoundingClientRect().width ?? 0) + GAP
  const go = (i: number) => ref.current?.scrollTo({ left: i * step(), behavior: 'smooth' })
  return (
    <div className="relative">
      <div ref={ref} onScroll={(e) => onAt(Math.round(e.currentTarget.scrollLeft / (step() || 1)))} className="flex snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: count }, (_, i) => (
          <Tile key={i} n={i + 1} className={`shrink-0 snap-start ${tileW} ${ratio}`} />
        ))}
      </div>
      {count > 1 && (
        <>
          <Arrow dir="left" disabled={at === 0} onClick={() => go(at - 1)} />
          <Arrow dir="right" disabled={at >= count - 1} onClick={() => go(at + 1)} />
        </>
      )}
      {children}
    </div>
  )
}

const Dots = ({ count, at }: { count: number; at: number }) => (
  <div className="flex justify-center gap-1.5" aria-hidden>
    {Array.from({ length: count }, (_, i) => (
      <span key={i} className={`size-1.5 rounded-full ${i === at ? 'bg-(--neutral-100)' : 'bg-(--neutral-500)'}`} />
    ))}
  </div>
)

/** 2: one full-width photo at a time, dots under it. */
function Full({ count }: { count: number }) {
  const [at, setAt] = useState(0)
  return (
    <div className="flex flex-col gap-2">
      <Strip count={count} tileW="w-full" ratio="aspect-[4/3]" at={at} onAt={setAt} />
      {count > 1 && <Dots count={count} at={at} />}
    </div>
  )
}

/** 3: one full-width photo and a row of small thumbnails; a click on a thumbnail changes the photo. */
function Thumbs({ count }: { count: number }) {
  const [at, setAt] = useState(0)
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Tile n={at + 1} className="aspect-[4/3] w-full" />
        {count > 1 && (
          <>
            <Arrow dir="left" disabled={at === 0} onClick={() => setAt(at - 1)} />
            <Arrow dir="right" disabled={at >= count - 1} onClick={() => setAt(at + 1)} />
          </>
        )}
      </div>
      {count > 1 && (
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" aria-label={`Photo ${i + 1}`} aria-pressed={i === at} onClick={() => setAt(i)} className={`aspect-square rounded-sm bg-(--neutral-600) ${i === at ? 'ring-2 ring-(--neutral-100)' : 'opacity-60'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

const Row = ({ initials, source, reference, day, time, open = false }: { initials: string; source: string; reference: string; day: string; time: string; open?: boolean }) => (
  <div className="flex items-center gap-3 py-4">
    <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-(--neutral-600) text-caption-strong text-(--neutral-100)" aria-hidden>{initials}</span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-body-sm-medium">{source}</span>
      <span className="text-meta text-muted-foreground">{reference}</span>
    </span>
    <span className="flex w-[52px] shrink-0 flex-col items-start">
      <span className="text-body-sm">{day}</span>
      <span className="text-meta tabular-nums text-muted-foreground">{time}</span>
    </span>
    <CaretDown className={`size-3.5 shrink-0 text-(--neutral-300) ${open ? 'rotate-180' : ''}`} aria-hidden />
  </div>
)

/** The Occurrences History card (360 px wide, 16 px padding) with one report open as the agreed raised card: the row as it is, the photos (the option under test), the description and the facts. */
const Card = ({ children }: { children: ReactNode }) => (
  <div className="w-[360px] rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] p-4">
    <h3 className="mb-3 text-caption-medium text-(--neutral-200)">Occurrences history</h3>
    <p className="text-body-sm-medium">Occurrence 2 · 8 Sept · 4 reports</p>
    <div className="border-b border-(--neutral-600)">
      <Row initials="SV" source="Salvajes en la Vía" reference="DMP-0056" day="8 Sept" time="18:48" />
    </div>
    <div className="-mx-3 my-1 rounded-sm bg-(--neutral-800) px-3">
      <Row initials="SI" source="SIMUR (Yo reporto tránsito)" reference="DMP-0058" day="8 Sept" time="21:18" open />
      <div className="flex flex-col gap-3 pb-3">
        {children}
        <p className="text-body-sm text-foreground">New dumping of wood and tires at the same spot, about 30 meters from the first one.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-meta">
          <dt className="text-muted-foreground">Vehicle</dt>
          <dd className="text-foreground">Truck</dd>
          <dt className="text-muted-foreground">Validation</dt>
          <dd className="text-foreground">Confirmed</dd>
          <dt className="text-muted-foreground">AI</dt>
          <dd className="text-foreground">Illegal dumping (94% confidence)</dd>
        </dl>
      </div>
    </div>
    <div className="border-t border-(--neutral-600)">
      <Row initials="CP" source="Civic Pulse direct report" reference="DMP-0057" day="8 Sept" time="17:18" />
    </div>
  </div>
)

const Frame = ({ name, note, children }: { name: string; note: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div>
      <p className="text-label">{name}</p>
      <p className="max-w-[360px] text-meta text-muted-foreground">{note}</p>
    </div>
    <Card>{children}</Card>
  </div>
)

export function PhotoCarouselGallery() {
  const [count, setCount] = useState(6)
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading">Photos in the open report</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">Two ways to show up to six photos of a report (options 2 and 3 of the first round), drawn in context: the Occurrences History card with one report open as the agreed raised card (row, photos, description, facts) and the rows around it (328 px of room for the photos). Use the arrows, the dots or the thumbnails; the strips also swipe and scroll.</p>
        <div className="flex items-center gap-2 text-meta">
          <span className="text-muted-foreground">Photos</span>
          {[1, 3, 6].map((n) => (
            <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)} className={`rounded-sm border px-2 py-0.5 ${count === n ? 'border-(--neutral-100) text-(--neutral-100)' : 'border-(--neutral-500) text-(--neutral-300)'}`}>
              {n}
            </button>
          ))}
        </div>
      </header>
      <div className="flex flex-wrap gap-8">
        <Frame name="2 · Full width, dots" note="One photo at a time at the full width (about 40 % bigger), arrows on the photo, dots under it. Biggest photo, one at a time.">
          <Full key={count} count={count} />
        </Frame>
        <Frame name="3 · Full width and thumbnails" note="One big photo with a row of six small thumbnails: you see how many there are and jump to any. Takes a bit more height.">
          <Thumbs key={count} count={count} />
        </Frame>
        </div>
    </main>
  )
}
