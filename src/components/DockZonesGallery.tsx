import { useRef, useState } from 'react'
import { DotsSixVertical, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { CASES, Content, Dragger, MODULES, RATIO, card, type ModuleType, type Shape } from '@/components/ModulesGallery'

/**
 * Docking zones (owner's clarification, 2026-11-09): you do not pick a module's ratio after docking it. While you drag a module the screen shows docking zones of different ratios (4:4, 4:3, 4:2) in different places; only the zones the module supports light up, the one that suits its data best is marked as suggested, and the module takes the shape of the zone you drop it in. Dev-only gallery at /#dock-zones: three layouts to try, all live (drag a module from the left chips into a lit zone). Made-up data (recurrence PR-00082); nothing here touches the app.
 */

type Zone = { id: string; shape: Shape; x: number; y: number; w: number }
const H = (z: Zone) => Math.round(z.w * RATIO[z.shape])
const W = 760 // mock screen size
const SCREEN_H = 540

const LAYOUTS: { name: string; note: string; zones: Zone[] }[] = [
  {
    name: '1 · Right column only',
    note: 'Three zones stacked on the right: a wide 4:2, a 4:3 and a square 4:4. Always in the same place; the map keeps its width.',
    zones: [
      { id: 'a1', shape: '4:2', x: 524, y: 16, w: 220 },
      { id: 'a2', shape: '4:3', x: 524, y: 138, w: 220 },
      { id: 'a3', shape: '4:4', x: 524, y: 315, w: 220 },
    ],
  },
  {
    name: '2 · Right column plus a bottom strip',
    note: 'The right column keeps the taller zones (4:3, 4:4) and a wide 4:2 strip runs along the bottom of the map, so a busy timeline gets a really wide place.',
    zones: [
      { id: 'b1', shape: '4:3', x: 544, y: 16, w: 200 },
      { id: 'b2', shape: '4:4', x: 544, y: 178, w: 200 },
      { id: 'b3', shape: '4:2', x: 16, y: 348, w: 360 },
    ],
  },
  {
    name: '3 · Zones where there is free space',
    note: 'While you drag, the app offers free areas of the map: here under the stat cards, beside the map and in the corners. Most flexible; the places change with what is open.',
    zones: [
      { id: 'c1', shape: '4:2', x: 16, y: 92, w: 300 },
      { id: 'c2', shape: '4:3', x: 520, y: 92, w: 224 },
      { id: 'c3', shape: '4:4', x: 16, y: 330, w: 190 },
      { id: 'c4', shape: '4:2', x: 440, y: 380, w: 300 },
    ],
  },
]

const CASE = CASES[1]
const MODULE_TYPES = Object.keys(MODULES) as ModuleType[]

function Layout({ zones }: { zones: Zone[] }) {
  const [placed, setPlaced] = useState<Record<string, ModuleType>>({})
  const [drag, setDrag] = useState<{ type: ModuleType; x: number; y: number } | null>(null)
  const screen = useRef<HTMLDivElement>(null)
  const fits = (z: Zone, t: ModuleType) => MODULES[t].shapes.includes(z.shape)
  /** The suggested zone for a module: the first zone with its first-choice shape, else the first one it fits. */
  const suggested = (t: ModuleType) => (zones.find((z) => z.shape === MODULES[t].shapes[0]) ?? zones.find((z) => fits(z, t)))?.id
  const start = (type: ModuleType) => (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ type, x: e.clientX, y: e.clientY })
    const move = (m: PointerEvent) => setDrag({ type, x: m.clientX, y: m.clientY })
    const up = (u: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      const id = u.type === 'pointerup' ? document.elementsFromPoint(u.clientX, u.clientY).find((el) => (el as HTMLElement).dataset?.zone)?.getAttribute('data-zone') : null
      const z = zones.find((x) => x.id === id)
      if (z && fits(z, type)) setPlaced((p) => ({ ...Object.fromEntries(Object.entries(p).filter(([, t]) => t !== type)), [z.id]: type }))
      setDrag(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
  return (
    <div className="flex gap-3">
      <div className="flex w-[170px] shrink-0 flex-col gap-2 rounded-lg bg-(--neutral-700) p-3">
        <p className="text-caption-medium text-(--neutral-200)">Modules</p>
        {MODULE_TYPES.map((t) => {
          const { title, Icon, shapes } = MODULES[t]
          return (
            <Dragger key={t} onStart={start(t)} className="flex flex-col gap-0.5 rounded-sm px-1 py-1.5 hover:bg-(--neutral-800)">
              <span className="flex items-center gap-2 text-body-sm"><DotsSixVertical className="size-3.5 text-(--neutral-300)" aria-hidden /><Icon weight="regular" className="size-4 text-(--neutral-200)" aria-hidden />{title}</span>
              <span className="pl-9 text-meta text-muted-foreground">{[...shapes].sort((a, b) => RATIO[a] - RATIO[b]).join(' · ')}</span>
            </Dragger>
          )
        })}
        <p className="text-meta text-muted-foreground">Drag one onto the screen: only the zones it fits light up.</p>
      </div>
      <div ref={screen} className="relative shrink-0 overflow-hidden rounded-lg border-[0.5px] border-(--neutral-500)" style={{ width: W, height: SCREEN_H, background: 'var(--screen-gradient)' }}>
        <div className="absolute top-4 left-4 flex gap-3" style={{ right: 16 }} aria-hidden>
          {['Kennedy 103', 'Chapinero 88', 'Suba 72'].map((s) => <span key={s} className="rounded-sm bg-(--neutral-800) p-3 text-body-sm" style={{ width: 150 }}>{s}</span>)}
        </div>
        <span className="absolute inset-0 grid place-items-center text-meta text-muted-foreground">the map · {CASE.ref}</span>
        {zones.map((z) => {
          const t = placed[z.id]
          const lit = drag && fits(z, drag.type)
          const best = drag && suggested(drag.type) === z.id
          const box = { left: z.x, top: z.y, width: z.w, height: H(z) }
          if (t) {
            const { title, Icon } = MODULES[t]
            return (
              <div key={z.id} data-zone={z.id} className={`${card} absolute flex flex-col gap-2 overflow-hidden p-3 ${lit ? 'outline-2 outline-dashed outline-(--indigo-300)' : ''}`} style={box}>
                <div className="flex items-center gap-1">
                  <Icon weight="regular" className="size-4 shrink-0 text-(--neutral-200)" aria-hidden />
                  <h3 className="flex-1 truncate text-caption-medium text-(--neutral-200)">{title}</h3>
                  <span className="text-meta text-muted-foreground">{z.shape}</span>
                  <Button size="icon" variant="ghost" aria-label="Close" className="size-6" onClick={() => setPlaced((p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== z.id)))}><X className="size-4" /></Button>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden"><Content type={t} shape={z.shape} c={CASE} /></div>
              </div>
            )
          }
          if (!drag) return null
          return (
            <div key={z.id} data-zone={z.id} className={`absolute grid place-items-center rounded-lg border-2 border-dashed text-meta transition-opacity ${lit ? 'border-(--indigo-300) bg-(--indigo-300)/10 text-(--indigo-100)' : 'border-(--neutral-500) opacity-30'}`} style={box}>
              <span className="flex flex-col items-center gap-0.5">
                <span className="tabular-nums">{z.shape}</span>
                {best && <span className="rounded-sm bg-(--indigo-600) px-1.5 py-0.5 text-caption-strong text-(--indigo-100)">Suggested</span>}
              </span>
            </div>
          )
        })}
      </div>
      {drag && <div className={`${card} pointer-events-none fixed z-50 px-3 py-2 text-body-sm-medium shadow-lg`} style={{ left: drag.x + 12, top: drag.y + 12 }}>{MODULES[drag.type].title}</div>}
    </div>
  )
}

export function DockZonesGallery() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 p-8">
      <header>
        <h1 className="text-heading">Docking zones: three layouts to try</h1>
        <p className="max-w-[820px] text-body-sm text-muted-foreground">Drag a module from the left chips and watch the screen: the zones that match its supported shapes light up (indigo), the others dim, and one is marked Suggested (the module's first-choice shape: the wide strip for the timeline, a 4:3 for the numbers and the chart). Drop it in any lit zone and it takes that zone's shape. The agent's offer would use the same hint. The same module placed in another zone re-lays out (try the timeline in 4:2, 4:3 and 4:4).</p>
      </header>
      {LAYOUTS.map((l) => (
        <section key={l.name} className="flex flex-col gap-2">
          <div>
            <p className="text-label">{l.name}</p>
            <p className="max-w-[760px] text-meta text-muted-foreground">{l.note}</p>
          </div>
          <Layout zones={l.zones} />
        </section>
      ))}
    </main>
  )
}
