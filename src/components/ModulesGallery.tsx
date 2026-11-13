import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BookmarkSimple, ChartBar, ChartScatter, Check, Compass, DotsSixVertical, GearSix, Hash, Plus, Sparkle, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/**
 * Agent-offered modules, the right-side dock, shapes and the Modules library (owner, 2026-11-09, decision 0049, proposed). Dev-only gallery at /#modules: one live mock screen with made-up data; nothing touches the app or the database.
 * Try it: pick a case in the sidebar, answer in the agent panel, say Yes to the offer (it proposes a shape by the data), drag the tile or press "Add to side panel", change a card's shape with its size button, Save it, drag it again from the Modules section, then switch the "Apply and pin across every case" option and open another case.
 */

export type ModuleType = 'timeline' | 'numbers' | 'chart'
export type Shape = '4:4' | '4:3' | '4:2'
export const RATIO: Record<Shape, number> = { '4:4': 1, '4:3': 0.75, '4:2': 0.5 }
/** Each module says which shapes it can be drawn in (widest first choice listed first) and which kind of thing it shows. */
export const MODULES: Record<ModuleType, { title: string; Icon: typeof Hash; shapes: Shape[]; about: 'case' | 'answer' }> = {
  timeline: { title: 'Recurrence timeline', Icon: ChartScatter, shapes: ['4:2', '4:3', '4:4'], about: 'case' },
  numbers: { title: 'Numbers', Icon: Hash, shapes: ['4:3', '4:4'], about: 'case' },
  chart: { title: 'Answer chart', Icon: ChartBar, shapes: ['4:3', '4:2'], about: 'answer' },
}

type Case = { id: string; kind: 'recurrence' | 'incident'; ref: string; title: string; numbers: [string, string][]; lanes: [string, number[]][]; bars: [string, number][]; occ: string[] }
export const CASES: Case[] = [
  { id: 'pr94', kind: 'recurrence', ref: 'PR-00094', title: 'Illegal Dumping · Engativá', numbers: [['Occurrences', '3'], ['Returns', '2'], ['Reports', '11'], ['Interventions', '2'], ['Last reported', '18 Oct']], lanes: [['Occurrences', [10, 52, 90]], ['Reports', [8, 12, 50, 54, 58, 88, 92]], ['Interventions', [30, 70]]], bars: [['Engativá', 9], ['Suba', 6], ['Kennedy', 4]], occ: ['Occurrence 1 · 3 Aug · 4 reports', 'Occurrence 2 · 8 Sept · 4 reports', 'Occurrence 3 · 12 Oct · 3 reports'] },
  { id: 'pr82', kind: 'recurrence', ref: 'PR-00082', title: 'Obstructive Parking · Chapinero', numbers: [['Occurrences', '4'], ['Returns', '3'], ['Reports', '22'], ['Interventions', '3'], ['Last reported', '20 Sept']], lanes: [['Occurrences', [6, 30, 62, 94]], ['Reports', [4, 8, 28, 32, 36, 60, 64, 68, 72, 92, 96]], ['Interventions', [20, 48, 80]]], bars: [['Chapinero', 12], ['Teusaquillo', 7], ['Suba', 3]], occ: ['Occurrence 1 · 4 Aug · 3 reports', 'Occurrence 2 · 29 Aug · 5 reports', 'Occurrence 3 · 19 Sept · 6 reports', 'Occurrence 4 · 12 Oct · 8 reports'] },
  { id: 'cp270', kind: 'incident', ref: 'CP-00270', title: 'Intersection Obstruction', numbers: [], lanes: [], bars: [], occ: [] },
]
const answerBars: [string, number][] = [['Teusaquillo', 9], ['Chapinero', 6], ['Kennedy', 4]]

/** The docking zones (layout 2 of /#dock-zones, chosen by the owner 2026-11-09): two taller zones in a right column and a wide strip along the bottom of the map. A zone's height is its shape's ratio of its width. */
type Zone = { id: string; shape: Shape; w: number; place: 'right' | 'bottom'; top?: number }
const ZONES: Zone[] = [
  { id: 'r1', shape: '4:3', w: 200, place: 'right', top: 0 },
  { id: 'r2', shape: '4:4', w: 200, place: 'right', top: 162 },
  { id: 'b1', shape: '4:2', w: 360, place: 'bottom' },
]
const zoneH = (z: Zone) => Math.round(z.w * RATIO[z.shape])
type Placed = { zone: string; type: ModuleType; target: string | null }
/** The agent's hint, deterministic: a busy recurrence gets the wide timeline. */
const proposeShape = (c: Case): Shape => (c.lanes[1]?.[1].length > 8 ? '4:2' : '4:3')

export const card = 'rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)]'

/** Made-up content; the content adapts to the shape it is given (the real modules use container queries on the same components). */
export function Content({ type, shape, c }: { type: ModuleType; shape: Shape; c: Case | null }) {
  if (type === 'chart') {
    const bars = shape === '4:2' ? answerBars.slice(0, 2) : answerBars
    return (
      <ul className="flex flex-col gap-2">
        {bars.map(([n, v]) => (
          <li key={n} className="flex flex-col gap-1">
            <span className="flex justify-between text-meta"><span>{n}</span><span className="tabular-nums text-muted-foreground">{v}</span></span>
            <span className="h-1.5 rounded-full bg-(--neutral-800)"><span className="block h-full rounded-full bg-(--indigo-300)" style={{ width: `${v * 10}%` }} /></span>
          </li>
        ))}
      </ul>
    )
  }
  if (!c || c.kind !== 'recurrence') return <p className="grid h-full place-items-center text-center text-meta text-muted-foreground">Open a recurrence to fill this module.</p>
  if (type === 'numbers')
    return (
      <dl className={`grid gap-x-3 gap-y-2 ${shape === '4:4' ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {c.numbers.map(([l, v]) => (
          <div key={l} className="flex flex-col">
            <dt className="truncate text-meta text-muted-foreground">{l}</dt>
            <dd className={shape === '4:4' ? 'text-heading' : 'text-subtitle'}>{v}</dd>
          </div>
        ))}
      </dl>
    )
  // 4:2 wide and short: thin lanes without labels. 4:3: labelled, taller lanes and a legend. 4:4: the same plus the list of occurrences.
  const laneH = shape === '4:2' ? 'h-3' : shape === '4:3' ? 'h-5' : 'h-6'
  return (
    <div className="flex h-full flex-col justify-between gap-2">
      <div className={`flex flex-col ${shape === '4:2' ? 'gap-1' : 'gap-2'}`}>
        {c.lanes.map(([name, at]) => (
          <div key={name} className="flex flex-col gap-0.5">
            {shape !== '4:2' && <span className="flex justify-between text-meta text-muted-foreground"><span>{name}</span><span className="tabular-nums">{at.length}</span></span>}
            <div className={`relative ${laneH} rounded-sm bg-(--neutral-800)`}>
              {at.map((x) => <span key={x} className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--yellow-300)" style={{ left: `${x}%` }} />)}
            </div>
          </div>
        ))}
        <div className="flex justify-between text-meta text-muted-foreground"><span>1 Aug</span><span>26 Sept</span></div>
      </div>
      {shape === '4:4' && (
        <ul className="flex flex-col gap-0.5 border-t border-(--neutral-600) pt-2 text-meta">
          {c.occ.map((o) => <li key={o}>{o}</li>)}
        </ul>
      )}
    </div>
  )
}

const Item = ({ label, on, pick }: { label: string; on: boolean; pick: () => void }) => (
  <Button role="menuitemradio" aria-checked={on} variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-body-sm hover:bg-(--neutral-800)" onClick={pick}>
    <span className="flex size-4 items-center justify-center">{on && <Check weight="bold" className="size-3.5" aria-hidden />}</span>
    {label}
  </Button>
)

/** The gear in the Modules title row (option 1 of /#module-options): a small menu with the two choices, like the sidebar's view menu. */
function SettingsMenu({ follow, onChange }: { follow: boolean; onChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => (document.removeEventListener('pointerdown', down), document.removeEventListener('keydown', key))
  }, [open])
  return (
    <>
      <Button size="icon" variant="ghost" aria-label="Module settings" aria-pressed={open} title="Module settings" onClick={() => setOpen(!open)} className={`size-6 ${open ? 'bg-(--neutral-600)' : ''}`}>
        <GearSix weight="regular" className="size-4 text-(--neutral-100)" />
      </Button>
      {open && (
        <div ref={box} role="menu" aria-label="Module settings" className="absolute top-full right-0 z-20 mt-1 w-60 rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-1 shadow-lg">
          <p className="px-2 pt-1 pb-0.5 text-caption-medium text-(--neutral-300)">Apply modules across every case</p>
          <Item label="Follow the open case" on={follow} pick={() => onChange(true)} />
          <Item label="Stay with each case" on={!follow} pick={() => onChange(false)} />
        </div>
      )}
    </>
  )
}

/** The drag handle wrapper; it lives outside the page component so it is not remounted while a drag re-renders the page. */
export const Dragger = ({ onStart, children, className = '' }: { onStart: (e: React.PointerEvent) => void; children: ReactNode; className?: string }) => (
  <div onPointerDown={onStart} className={`touch-none cursor-grab select-none active:cursor-grabbing ${className}`}>{children}</div>
)

export function ModulesGallery() {
  const [current, setCurrent] = useState('pr94')
  const [asked, setAsked] = useState(false)
  const [offer, setOffer] = useState<'offer' | 'preview' | 'dismissed'>('offer')
  const [placed, setPlaced] = useState<Placed[]>([])
  const [saved, setSaved] = useState<ModuleType[]>([])
  const [follow, setFollow] = useState(true) // gear menu: Follow the open case (default) or Stay with each case
  const [note, setNote] = useState('')
  const [drag, setDrag] = useState<{ type: ModuleType; x: number; y: number } | null>(null)
  const open = CASES.find((c) => c.id === current)!
  const offered = proposeShape(CASES[1]) // the question is about Chapinero (PR-00082)

  const fits = (z: Zone, t: ModuleType) => MODULES[t].shapes.includes(z.shape)
  /** The suggested zone: the module's first-choice shape (the agent's hint moves it to the shape the data asks for). */
  const suggested = (t: ModuleType, want?: Shape) => (ZONES.find((z) => z.shape === (want ?? MODULES[t].shapes[0])) ?? ZONES.find((z) => fits(z, t)))?.id
  const place = (zone: Zone, type: ModuleType) => {
    if (!fits(zone, type)) return
    if (MODULES[type].about === 'case' && open.kind !== 'recurrence') return setNote('Recurrence modules dock on a recurrence: open one first.')
    setNote('')
    setPlaced((p) => [...p.filter((x) => x.zone !== zone.id && x.type !== type), { zone: zone.id, type, target: MODULES[type].about === 'case' ? current : null }])
  }
  /** Pointer-events drag (mouse and touch, no library); the same pattern as the sidebar's resize handle. */
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
      const z = ZONES.find((x) => x.id === id)
      if (z) place(z, type)
      setDrag(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
  const visible = (m: Placed) => follow || m.target === null || m.target === current
  const rightUsed = placed.some((m) => visible(m) && ZONES.find((z) => z.id === m.zone)?.place === 'right')
  const dropHint = drag ? suggested(drag.type) : undefined

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-4 p-8">
      <header>
        <h1 className="text-heading">Modules: the agent offers, you dock in a zone, you save</h1>
        <p className="max-w-[860px] text-body-sm text-muted-foreground">Docking zones, layout 2: two taller zones in a right column (4:3 and 4:4) and a wide 4:2 strip along the bottom of the map. While you drag a module, only the zones it fits light up and its first-choice zone is marked Suggested; it takes the shape of the zone you drop it in. Each module shows the data of the case it is on: the gear in the sidebar's Modules title row decides whether the zones follow the open case or each module stays with the case it was placed on. Made-up data.</p>
      </header>
      <div className="relative grid h-[560px] grid-cols-[210px_320px_1fr] gap-3 overflow-hidden rounded-lg border-[0.5px] border-(--neutral-500) p-3" style={{ background: 'var(--screen-gradient)' }}>
        <aside className="flex min-h-0 flex-col gap-2 overflow-auto rounded-lg bg-(--neutral-700) p-3">
          <div className="flex items-center gap-2 rounded-sm bg-(--neutral-800) px-2 py-1.5 text-body-sm"><Compass className="size-4" aria-hidden />Explore</div>
          <div className="relative mt-2 flex items-center justify-between">
            <p className="text-caption-medium text-(--neutral-200)">Modules</p>
            <SettingsMenu follow={follow} onChange={setFollow} />
          </div>
          {(Object.keys(MODULES) as ModuleType[]).map((t) => {
            const { title, Icon } = MODULES[t]
            return (
              <Dragger key={t} onStart={start(t)} className="flex items-center gap-2 rounded-sm px-1 py-1.5 hover:bg-(--neutral-800)">
                <DotsSixVertical className="size-3.5 text-(--neutral-300)" aria-hidden />
                <Icon weight="regular" className="size-4 text-(--neutral-200)" aria-hidden />
                <span className="flex-1 truncate text-body-sm">{title}</span>
                {saved.includes(t) && <BookmarkSimple weight="fill" className="size-3.5 text-(--neutral-200)" aria-label="Saved" />}
              </Dragger>
            )
          })}
          <p className="mt-2 text-caption-medium text-(--neutral-200)">Cases</p>
          {CASES.map((c) => (
            <button key={c.id} type="button" aria-current={c.id === current} onClick={() => { setCurrent(c.id); setNote('') }} className={`rounded-sm px-2 py-1.5 text-left hover:bg-(--neutral-800) ${c.id === current ? 'bg-(--neutral-800)' : ''}`}>
              <span className="block truncate text-body-sm">{c.title}</span>
              <span className="text-meta text-muted-foreground">{c.ref} · {c.kind === 'recurrence' ? 'Recurrence' : 'Incident'}</span>
            </button>
          ))}
        </aside>
        <section className="flex min-h-0 flex-col gap-3 overflow-auto rounded-lg bg-[color-mix(in_srgb,var(--neutral-900)_90%,transparent)] p-4 backdrop-blur-[32px]" aria-label="Agent">
          {!asked ? (
            <>
              <p className="text-caption-medium text-(--neutral-200)">Quick questions</p>
              <Button variant="ghost" className="justify-start" onClick={() => setAsked(true)}>Investigate recurring parking obstruction</Button>
            </>
          ) : (
            <>
              <p className="ml-auto max-w-[85%] rounded-lg bg-(--neutral-600) px-3 py-2 text-body-sm">Investigate recurring parking obstruction</p>
              <p className="text-body-sm">Chapinero has the most repeated parking obstruction: 22 reports in 4 occurrences over three months. Reports are grouped into an occurrence when they come within 24 hours of each other.</p>
              <p className="text-meta text-muted-foreground">Numbers come from the database. The data is synthetic.</p>
              {offer === 'offer' && (
                <div className="flex flex-col gap-2 rounded-sm border border-(--neutral-500) p-3">
                  <p className="flex items-start gap-2 text-body-sm-medium"><Sparkle weight="fill" className="mt-0.5 size-4 shrink-0 text-(--indigo-200)" aria-hidden />Draw a {offered === '4:2' ? 'wide ' : ''}timeline of these occurrences?</p>
                  <p className="text-meta text-muted-foreground">{offered === '4:2' ? 'Many reports, so it reads best in the wide strip along the bottom (4:2).' : 'A short history fits the 4:3 zone.'}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setOffer('preview')}>Yes</Button>
                    <Button size="sm" variant="ghost" onClick={() => setOffer('dismissed')}>Not now</Button>
                  </div>
                </div>
              )}
              {offer === 'preview' && (
                <div className={`${card} flex flex-col gap-2 p-3`}>
                  <Dragger onStart={start('timeline')} className="flex items-center gap-2">
                    <DotsSixVertical className="size-4 text-(--neutral-300)" aria-hidden />
                    <ChartScatter weight="regular" className="size-4 text-(--neutral-200)" aria-hidden />
                    <span className="flex-1 text-body-sm-medium">Recurrence timeline</span>
                    <span className="text-meta text-muted-foreground">suggested {offered}</span>
                  </Dragger>
                  <Content type="timeline" shape={offered} c={CASES[1]} />
                  <Button size="sm" variant="secondary" className="gap-1" onClick={() => place(ZONES.find((z) => z.id === suggested('timeline', offered))!, 'timeline')}><Plus className="size-3.5" />Add to side panel</Button>
                  <p className="text-meta text-muted-foreground">Drag it to a lit zone, or press the button (it goes to the suggested one).</p>
                </div>
              )}
              {offer === 'dismissed' && <Button size="sm" variant="ghost" className="w-fit" onClick={() => setOffer('offer')}>Offer a timeline again</Button>}
            </>
          )}
        </section>
        <div className="relative min-h-0">
          <div className="absolute inset-y-0 left-0 flex flex-col gap-3 transition-[right] duration-300" style={{ right: rightUsed ? 212 : 0 }}>
            <div className="flex gap-3" aria-hidden>
              {['Kennedy 103', 'Chapinero 88', 'Suba 72'].map((s) => <span key={s} className="flex-1 rounded-sm bg-(--neutral-800) p-3 text-body-sm">{s}</span>)}
            </div>
            <div className="relative flex-1 rounded-lg border border-dashed border-(--neutral-500) text-meta text-muted-foreground">
              <span className="absolute inset-0 grid place-items-center">the map · {open.ref}</span>
            </div>
            {note && <p className="absolute top-14 left-2 z-10 rounded-sm bg-(--neutral-800) p-2 text-meta">{note}</p>}
          </div>
          {ZONES.map((z) => {
            const m = placed.find((x) => x.zone === z.id && visible(x))
            const lit = !!drag && fits(z, drag.type)
            const box = z.place === 'right' ? { right: 0, top: z.top, width: z.w, height: zoneH(z) } : { left: 0, bottom: 0, width: z.w, height: zoneH(z) }
            if (m) {
              const { title, Icon, about } = MODULES[m.type]
              const c = about === 'case' ? (follow ? open : CASES.find((x) => x.id === m.target) ?? null) : null
              return (
                <div key={z.id} data-zone={z.id} className={`${card} absolute flex flex-col gap-2 overflow-hidden p-3 ${lit ? 'outline-2 outline-dashed outline-(--indigo-300)' : ''}`} style={box}>
                  <div className="flex items-center gap-1">
                    <Icon weight="regular" className="size-4 shrink-0 text-(--neutral-200)" aria-hidden />
                    <h3 className="flex-1 truncate text-caption-medium text-(--neutral-200)">{title}{c ? ` · ${c.ref}` : ''}</h3>
                    <span className="text-meta text-muted-foreground">{z.shape}</span>
                    <Button size="icon" variant="ghost" aria-label={saved.includes(m.type) ? 'Saved' : 'Save module'} className="size-6" onClick={() => setSaved((x) => (x.includes(m.type) ? x : [...x, m.type]))}>
                      <BookmarkSimple weight={saved.includes(m.type) ? 'fill' : 'regular'} className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Close" className="size-6" onClick={() => setPlaced((p) => p.filter((x) => x !== m))}><X className="size-4" /></Button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden"><Content type={m.type} shape={z.shape} c={c} /></div>
                </div>
              )
            }
            if (!drag) return null
            return (
              <div key={z.id} data-zone={z.id} className={`absolute grid place-items-center rounded-lg border-2 border-dashed text-meta transition-opacity ${lit ? 'border-(--indigo-300) bg-(--indigo-300)/10 text-(--indigo-100)' : 'border-(--neutral-500) opacity-30'}`} style={box}>
                <span className="flex flex-col items-center gap-0.5">
                  <span className="tabular-nums">{z.shape}</span>
                  {lit && dropHint === z.id && <span className="rounded-sm bg-(--indigo-600) px-1.5 py-0.5 text-caption-strong text-(--indigo-100)">Suggested</span>}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      {drag && <div className={`${card} pointer-events-none fixed z-50 flex items-center gap-2 px-3 py-2 text-body-sm-medium shadow-lg`} style={{ left: drag.x + 12, top: drag.y + 12 }}>{MODULES[drag.type].title}</div>}
    </main>
  )
}
