import { useRef, useState, type ReactNode } from 'react'
import { CaretDown, ArrowSquareOut } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Clicking one of a recurrence's incident dots while its panel is open (owner's idea, 2026-11-09): no jump to the Incident Panel; the report's row in the Occurrences History expands in place with the incident's details, and its dot lights up on the map while the others tone down. Dev-only gallery at /#report-expand: every mini screen is live (click a dot or a row). Made-up data: 12 reports, 3 occurrences; nothing here changes the app.
 */

type Report = { id: string; source: string; initials: string; ref: string; day: string; time: string; x: number; y: number; text: string; category: string; vehicle: string; validation: string; ai: string }
const REPORTS: Report[] = [
  { id: 'r1', source: 'Community reporting channel', initials: 'CR', ref: 'DMP-0027', day: '21 Aug', time: '19:18', x: 30, y: 34, text: 'Bags of construction debris and old furniture left on the sidewalk next to the park entrance.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Confirmed', ai: 'Illegal dumping (92 %)' },
  { id: 'r2', source: 'Bogotá te Escucha', initials: 'BE', ref: 'DMP-0028', day: '21 Aug', time: '21:18', x: 34, y: 40, text: 'Pile of rubble blocking half of the pedestrian path, residents say it was left overnight.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Confirmed', ai: 'Illegal dumping (88 %)' },
  { id: 'r3', source: 'UAESP operational records', initials: 'UA', ref: 'DMP-0029', day: '21 Aug', time: '23:18', x: 27, y: 42, text: 'Crew note: debris and mattresses at the corner, collection pending.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Pending review', ai: 'Illegal dumping (81 %)' },
  { id: 'r4', source: 'Community reporting channel', initials: 'CR', ref: 'DMP-0030', day: '22 Aug', time: '01:18', x: 32, y: 30, text: 'More bags added during the night, smell is getting stronger.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Confirmed', ai: 'Illegal dumping (90 %)' },
  { id: 'r5', source: 'SIMUR (Yo reporto tránsito)', initials: 'SI', ref: 'DMP-0058', day: '8 Sept', time: '21:18', x: 56, y: 52, text: 'New dumping of wood and tires at the same spot, about 30 meters from the first one.', category: 'Illegal Dumping', vehicle: 'Truck', validation: 'Confirmed', ai: 'Illegal dumping (94 %)' },
  { id: 'r6', source: 'Salvajes en la Vía', initials: 'SV', ref: 'DMP-0056', day: '8 Sept', time: '18:48', x: 60, y: 47, text: 'A truck unloading debris, photographed from the opposite sidewalk.', category: 'Illegal Dumping', vehicle: 'Truck', validation: 'Confirmed', ai: 'Illegal dumping (96 %)' },
  { id: 'r7', source: 'Civic Pulse direct report', initials: 'CP', ref: 'DMP-0057', day: '8 Sept', time: '17:18', x: 54, y: 58, text: 'Resident reports the dumping restarted after the cleanup.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Pending review', ai: 'Illegal dumping (79 %)' },
  { id: 'r8', source: 'Community reporting channel', initials: 'CR', ref: 'DMP-0061', day: '8 Sept', time: '22:40', x: 63, y: 55, text: 'Stack of rubble now covers the whole bike lane.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Confirmed', ai: 'Illegal dumping (89 %)' },
  { id: 'r9', source: 'Bogotá te Escucha', initials: 'BE', ref: 'DMP-0095', day: '12 Oct', time: '17:18', x: 72, y: 28, text: 'Third round of dumping, bigger this time: sofas, a refrigerator and bags.', category: 'Illegal Dumping', vehicle: 'Truck', validation: 'Confirmed', ai: 'Illegal dumping (95 %)' },
  { id: 'r10', source: 'UAESP operational records', initials: 'UA', ref: 'DMP-0096', day: '12 Oct', time: '19:02', x: 76, y: 33, text: 'Crew confirms bulky waste on site, scheduling a special collection.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Confirmed', ai: 'Illegal dumping (91 %)' },
  { id: 'r11', source: 'Salvajes en la Vía', initials: 'SV', ref: 'DMP-0097', day: '12 Oct', time: '20:15', x: 70, y: 36, text: 'Video of two people leaving the items from a pickup.', category: 'Illegal Dumping', vehicle: 'Pickup', validation: 'Confirmed', ai: 'Illegal dumping (97 %)' },
  { id: 'r12', source: 'Community reporting channel', initials: 'CR', ref: 'DMP-0098', day: '12 Oct', time: '23:50', x: 74, y: 24, text: 'Still there the next morning, now with a mattress on the road.', category: 'Illegal Dumping', vehicle: 'None', validation: 'Pending review', ai: 'Illegal dumping (84 %)' },
]
const OCCURRENCES = [
  { title: 'Occurrence 1 · 21 Aug · 4 reports', ids: ['r1', 'r2', 'r3', 'r4'] },
  { title: 'Occurrence 2 · 8 Sept · 4 reports', ids: ['r5', 'r6', 'r7', 'r8'] },
  { title: 'Occurrence 3 · 12 Oct · 4 reports', ids: ['r9', 'r10', 'r11', 'r12'] },
]
const byId = new Map(REPORTS.map((r) => [r.id, r]))
const KEEP = 0.4 // the dimming of everything but the open report, the same as the map's

type Variant = 'accordion' | 'card' | 'compact'

const Facts = ({ r }: { r: Report }) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-meta">
    <dt className="text-muted-foreground">Vehicle</dt>
    <dd className="text-foreground">{r.vehicle}</dd>
    <dt className="text-muted-foreground">Validation</dt>
    <dd className="text-foreground">{r.validation}</dd>
    <dt className="text-muted-foreground">AI</dt>
    <dd className="text-foreground">{r.ai}</dd>
  </dl>
)

const Photos = () => (
  <div className="flex gap-1" aria-hidden>
    {[0, 1, 2].map((i) => (
      <span key={i} className="h-12 flex-1 rounded-sm bg-(--neutral-600)" />
    ))}
  </div>
)

/** What shows under the row when it is open, by option. */
function Detail({ r, variant }: { r: Report; variant: Variant }) {
  if (variant === 'compact')
    return (
      <div className="flex flex-col gap-2 pb-3 pl-11">
        <p className="line-clamp-2 text-body-sm text-foreground">{r.text}</p>
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="secondary">{r.validation}</Badge>
          <Badge variant="outline">{r.vehicle === 'None' ? 'No vehicle' : r.vehicle}</Badge>
          <Button size="sm" variant="ghost" className="ml-auto gap-1">
            Open <ArrowSquareOut className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  if (variant === 'card')
    return (
      <div className="flex flex-col gap-3 pb-3">
        <Photos />
        <p className="text-body-sm text-foreground">{r.text}</p>
        <Facts r={r} />
      </div>
    )
  return (
    <div className="flex flex-col gap-2 pb-3 pl-11">
      <p className="text-body-sm text-foreground">{r.text}</p>
      <Facts r={r} />
      <Button size="sm" variant="ghost" className="w-fit gap-1 px-0">
        Open full incident <ArrowSquareOut className="size-3.5" />
      </Button>
    </div>
  )
}

function Demo({ variant }: { variant: Variant }) {
  const [open, setOpen] = useState<string | null>(null)
  const rows = useRef(new Map<string, HTMLLIElement>())
  const choose = (id: string) => {
    const next = open === id ? null : id
    setOpen(next)
    if (next) requestAnimationFrame(() => rows.current.get(next)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }
  return (
    <div className="grid h-[420px] grid-cols-[1fr_360px] gap-3">
      <div className="relative overflow-hidden rounded-lg border-[0.5px] border-(--neutral-500)" style={{ background: 'var(--screen-gradient)' }}>
        <span className="absolute top-1/2 left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--red-300) opacity-40" aria-hidden />
        {REPORTS.map((r) => {
          const on = open === r.id
          return (
            <button key={r.id} type="button" aria-label={`${r.ref}, ${r.day}`} aria-pressed={on} onClick={() => choose(r.id)} className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full" style={{ left: `${r.x}%`, top: `${r.y}%`, opacity: open && !on ? KEEP : 1 }}>
              <span className={`rounded-full border border-(--neutral-900) bg-(--red-300) ${on ? 'size-3.5 ring-2 ring-(--neutral-100)' : 'size-2.5'}`} />
            </button>
          )
        })}
      </div>
      <div className="min-h-0 overflow-auto rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] p-4">
        <h3 className="mb-3 text-caption-medium text-(--neutral-200)">Occurrences history</h3>
        {OCCURRENCES.map((o) => (
          <section key={o.title} className="mb-3">
            <p className="text-body-sm-medium">{o.title}</p>
            <ul>
              {o.ids.map((id) => {
                const r = byId.get(id)!
                const on = open === id
                const card = on && variant === 'card'
                return (
                  <li key={id} ref={(el) => void (el ? rows.current.set(id, el) : rows.current.delete(id))} className={`border-b border-(--neutral-600) last:border-b-0 ${card ? '-mx-3 my-1 rounded-sm border-b-0 bg-(--neutral-800) px-3' : ''}`}>
                    <button type="button" aria-expanded={on} onClick={() => choose(id)} className={`flex items-center gap-3 rounded-sm py-3 text-left hover:bg-(--neutral-800) ${variant === 'card' && !on ? '-mx-3 w-[calc(100%+1.5rem)] px-3' : 'w-full'}`}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-(--neutral-600) text-caption-strong text-(--neutral-100)" aria-hidden>{r.initials}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-body-sm-medium">{r.source}</span>
                        <span className="text-meta text-muted-foreground">{r.ref}</span>
                      </span>
                      <span className="flex w-[52px] shrink-0 flex-col items-start">
                        <span className="text-body-sm">{r.day}</span>
                        <span className="text-meta tabular-nums text-muted-foreground">{r.time}</span>
                      </span>
                      <CaretDown className={`size-3.5 shrink-0 text-(--neutral-300) transition-transform ${on ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    {on && <Detail r={r} variant={variant} />}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

const Frame = ({ name, note, children }: { name: string; note: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div>
      <p className="text-label">{name}</p>
      <p className="max-w-[760px] text-meta text-muted-foreground">{note}</p>
    </div>
    {children}
  </div>
)

export function ReportExpandGallery() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 p-8">
      <header>
        <h1 className="text-heading">Opening a report from the map, inside the recurrence</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">One recurrence with 12 reports in 3 occurrences. Click a dot on the map or a row in the history: you stay in the recurrence view (no Incident Panel), the report's row opens in place with its details and its dot lights up while the others tone down to 40 %. Click it again to close. Three ways to draw the open row; the map side and the behavior are the same in all of them.</p>
      </header>
      <div className="grid gap-8">
        <Frame name="1 · Accordion" note="The row stays as it is, the details open under it, indented to line up with the text: description, a small facts grid and a link to the full incident panel. One open at a time.">
          <Demo variant="accordion" />
        </Frame>
        <Frame name="2 · Card" note="The open row becomes a raised card (neutral-800): photos strip first, the description, then the facts. Easier to see which one is open, takes more height.">
          <Demo variant="card" />
        </Frame>
        <Frame name="3 · Compact" note="Only the description (two lines), the validation and vehicle badges, and an Open button. Keeps the list short; the rest is one click away.">
          <Demo variant="compact" />
        </Frame>
      </div>
    </main>
  )
}
