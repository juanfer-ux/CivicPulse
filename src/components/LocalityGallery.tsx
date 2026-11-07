import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { LocalityOutline, type OutlineStyle } from '@/components/ui/locality-outline'
import { localityShapes, localityShapesByHeight, type LocalityFeature } from '@/lib/localityShape'
import type { Trend } from '@/lib/trend'

/**
 * Open /#locality (no sign-in): the outline of each locality, very small, on the right of its Stat Card, to show how big or small it is (owner's idea, 2026-11-07).
 * Only the outline: no names, no streets. Real boundaries from /bogota-localities.geojson (OpenStreetMap). Nothing here changes the app yet.
 */

type Feature = LocalityFeature & { properties: { code: number; name: string } }
const CARDS: { code: number; value: string; trend: Trend }[] = [
  { code: 8, value: '103', trend: 'above' }, // Kennedy
  { code: 2, value: '88', trend: 'about' }, // Chapinero
  { code: 11, value: '72', trend: 'below' }, // Suba
  { code: 10, value: '65', trend: 'low' }, // Engativá
]
const LOOKS: { look: OutlineStyle; name: string; note: string }[] = [
  { look: 'line', name: 'Line', note: 'A 1 px neutral-300 line, nothing inside.' },
  { look: 'fill', name: 'Line + fill', note: 'The line and a faint fill: the shape reads as an area.' },
  { look: 'soft', name: 'Soft', note: 'Only a faint shape, no line. The quietest.' },
  { look: 'map', name: 'Map look', note: 'The indigo line and fill the map uses for the localities of an answer.' },
]

function Toggle<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2 text-meta">
      <span className="text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button key={String(o.v)} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)} className={`rounded-sm border-[0.5px] px-2 py-1 ${value === o.v ? 'border-foreground text-foreground' : 'border-(--neutral-400) text-muted-foreground'}`}>
          {o.t}
        </button>
      ))}
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-section-label uppercase text-(--neutral-200)">{title}</h2>
        {note && <p className="max-w-[720px] text-meta text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

export function LocalityGallery() {
  const [features, setFeatures] = useState<Feature[] | null>(null)
  const [mode, setMode] = useState<'cards' | 'city' | 'fit' | 'height'>('height')
  const [size, setSize] = useState(40)
  const [place, setPlace] = useState<'top' | 'center'>('top')
  useEffect(() => {
    fetch('/bogota-localities.geojson').then((r) => r.json()).then((d: { features: Feature[] }) => setFeatures(d.features))
  }, [])
  const urban = useMemo(() => (features ?? []).filter((f) => f.properties.code !== 20).map((f) => f.properties.code), [features]) // Sumapaz is rural and huge: it would make every other locality a dot
  const shapes = useMemo(() => (features ? (mode === 'height' ? localityShapesByHeight(features, size) : localityShapes(features, size, mode !== 'fit', mode === 'cards' ? CARDS.map((c) => c.code) : urban)) : null), [features, size, mode, urban])
  const big = useMemo(() => (features ? { fit: localityShapes(features, 96, false), same: localityShapes(features, 96, true, urban) } : null), [features, urban])
  const small = useMemo(() => (features ? { fit: localityShapes(features, 44, false), same: localityShapes(features, 44, true, urban) } : null), [features, urban])
  const name = (code: number) => features?.find((f) => f.properties.code === code)?.properties.name ?? ''
  if (!features || !shapes || !big || !small) return <div className="min-h-svh bg-background p-6 text-meta text-muted-foreground">Loading the boundaries…</div>

  return (
    <div className="min-h-svh bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
        <header className="flex flex-col gap-3">
          <div>
            <h1 className="text-heading">Locality outlines for the Stat Card</h1>
            <p className="max-w-[720px] text-meta text-muted-foreground">The outline of each locality, very small, on the right of its card. Only the shape: no names, no streets. Same scale draws every locality with one scale, so a small one looks small (among these four, or against the whole city: the largest urban locality fills the box); Fit fills the same box for each, so only the shape shows; Same height makes every outline the same height and gives each its own width.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Toggle label="Scale" value={mode} options={[{ v: 'height', t: 'Same height' }, { v: 'cards', t: 'Same scale, these four' }, { v: 'city', t: 'Same scale, whole city' }, { v: 'fit', t: 'Fit' }]} onChange={setMode} />
            <Toggle label={mode === 'height' ? 'Height' : 'Size'} value={size} options={[32, 40, 48, 56, 64, 72].map((v) => ({ v, t: `${v} px` }))} onChange={setSize} />
            <Toggle label="Place" value={place} options={[{ v: 'top', t: 'Top right' }, { v: 'center', t: 'Centered right' }]} onChange={setPlace} />
          </div>
        </header>

        <Section title="In the Stat Card" note="One row per look; the toggles above change the scale, the size and the place for all of them. Kennedy, Chapinero, Suba and Engativá, as on the map screens.">
          <div className="flex flex-col gap-6">
            {LOOKS.map((l) => (
              <div key={l.look} className="flex flex-col gap-2">
                <p className="text-label">{l.name} <span className="text-meta text-muted-foreground">{l.note}</span></p>
                <div className="grid max-w-[1100px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {CARDS.map((c) => (
                    <div key={c.code} className="relative">
                      <StatCard label={name(c.code)} value={c.value} trend={c.trend} />
                      <div className={`pointer-events-none absolute right-3 ${place === 'top' ? 'top-4' : 'top-[50px] -translate-y-1/2'}`}>
                        <LocalityOutline shape={shapes.get(c.code)!} box={size} look={l.look} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="The shapes, large" note="The four localities at 96 px: on the left each fills its box, on the right they share one scale.">
          <div className="grid max-w-[900px] grid-cols-2 gap-6 sm:grid-cols-4">
            {CARDS.map((c) => (
              <div key={c.code} className="flex flex-col items-center gap-2 rounded-sm bg-(--neutral-800) p-4">
                <div className="flex gap-3">
                  <LocalityOutline shape={big.fit.get(c.code)!} box={96} look="fill" />
                  <LocalityOutline shape={big.same.get(c.code)!} box={96} look="fill" />
                </div>
                <p className="text-meta">{name(c.code)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="All 20 localities" note="Fit on the first row of each block, same scale on the second. Sumapaz is rural and very large: it is shrunk to fit the box and does not set the scale.">
          {(['fit', 'same'] as const).map((k) => (
            <div key={k} className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-10">
              {features.map((f) => (
                <div key={f.properties.code} className="flex flex-col items-center gap-1 rounded-sm bg-(--neutral-800) p-2">
                  <LocalityOutline shape={small[k].get(f.properties.code)!} box={44} look="fill" />
                  <p className="text-center text-caption text-muted-foreground">{f.properties.name}</p>
                </div>
              ))}
            </div>
          ))}
        </Section>
      </div>
    </div>
  )
}
