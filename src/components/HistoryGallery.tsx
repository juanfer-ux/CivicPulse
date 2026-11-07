import { useState } from 'react'
import { ChatCircleText, Car, CarProfile, Headset, Buildings, Sparkle, type Icon } from '@phosphor-icons/react'

/**
 * Open /#history (no sign-in): the rows of the Occurrences History card as three columns (owner's idea, 2026-11-07):
 * a small square logo, the source name with its reference below, and the date with the time below (24 h). Four things to choose (the owner picked roomy, full width, initials tile and left aligned on 2026-11-07, now in the real card): the gap, the divider, the logo placeholder and the alignment of the date.
 * The logos are temporary placeholders (an icon tile); the real marks are an open question (see the handoff). Made-up rows, nothing here changes the app.
 */

type Row = { source: string; ref: string; day: string; time: string; Icon: Icon; initials: string }
const OCCURRENCES: { title: string; rows: Row[] }[] = [
  {
    title: 'Occurrence 1 · 21 Aug · 5 reports',
    rows: [
      { source: 'Community reporting channel', ref: 'DMP-0027', day: '21 Aug', time: '19:18', Icon: ChatCircleText, initials: 'CR' },
      { source: 'UAESP operational records', ref: 'DMP-0029', day: '21 Aug', time: '23:18', Icon: Buildings, initials: 'UA' },
      { source: 'Bogotá te Escucha', ref: 'DMP-0028', day: '21 Aug', time: '21:18', Icon: Headset, initials: 'BE' },
      { source: 'Community reporting channel', ref: 'DMP-0030', day: '22 Aug', time: '01:18', Icon: ChatCircleText, initials: 'CR' },
      { source: 'UAESP operational records', ref: 'DMP-0026', day: '21 Aug', time: '17:18', Icon: Buildings, initials: 'UA' },
    ],
  },
  {
    title: 'Occurrence 2 · 8 Sept · 4 reports',
    rows: [
      { source: 'SIMUR (Yo reporto tránsito)', ref: 'PRK-0058', day: '8 Sept', time: '21:18', Icon: CarProfile, initials: 'SI' },
      { source: 'Salvajes en la Vía', ref: 'PRK-0056', day: '8 Sept', time: '18:48', Icon: Car, initials: 'SV' },
      { source: 'Civic Pulse direct report', ref: 'PRK-0057', day: '8 Sept', time: '17:18', Icon: Sparkle, initials: 'CP' },
    ],
  },
]

const GAPS = { compact: 'py-2', regular: 'py-3', roomy: 'py-4' } as const
type Gap = keyof typeof GAPS
type Divider = 'full' | 'inset' | 'none'
type Logo = 'icon' | 'initials' | 'slot'
type Align = 'right' | 'left'

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2 text-meta">
      <span className="text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)} className={`rounded-sm border-[0.5px] px-2 py-1 ${value === o.v ? 'border-foreground text-foreground' : 'border-(--neutral-400) text-muted-foreground'}`}>
          {o.t}
        </button>
      ))}
    </div>
  )
}

function LogoTile({ row, look }: { row: Row; look: Logo }) {
  const base = 'grid size-8 shrink-0 place-items-center rounded-sm'
  if (look === 'initials') return <span className={`${base} bg-(--neutral-600) text-caption-strong text-(--neutral-100)`}>{row.initials}</span>
  if (look === 'slot') return <span className={`${base} border border-dashed border-(--neutral-400) text-caption text-(--neutral-300)`}>logo</span>
  return (
    <span className={`${base} bg-(--neutral-600)`}>
      <row.Icon className="size-4 text-(--neutral-100)" aria-hidden />
    </span>
  )
}

function HistoryRow({ row, gap, divider, logo, align, last }: { row: Row; gap: Gap; divider: Divider; logo: Logo; align: Align; last: boolean }) {
  return (
    <li className={`flex items-center gap-3 ${GAPS[gap]} ${divider === 'full' && !last ? 'border-b border-(--neutral-600)' : ''}`}>
      <LogoTile row={row} look={logo} />
      <div className={`flex min-w-0 flex-1 flex-col ${divider === 'inset' && !last ? '-my-px border-b border-(--neutral-600) py-3' : ''}`}>
        <span className="truncate text-body-sm-medium text-foreground">{row.source}</span>
        <span className="text-meta text-muted-foreground">{row.ref}</span>
      </div>
      <div className={`flex shrink-0 flex-col ${align === 'right' ? 'items-end text-right' : 'w-[52px] items-start text-left'}`}>
        <span className="text-body-sm text-foreground">{row.day}</span>
        <span className="text-meta tabular-nums text-muted-foreground">{row.time}</span>
      </div>
    </li>
  )
}

function Card({ gap, divider, logo, align }: { gap: Gap; divider: Divider; logo: Logo; align: Align }) {
  return (
    <div className="w-[420px] max-w-full rounded-lg bg-(--neutral-900) p-4">
      <h3 className="mb-3 text-section-label uppercase text-(--neutral-200)">Occurrences history</h3>
      {OCCURRENCES.map((o) => (
        <div key={o.title} className="mb-3 last:mb-0">
          <p className="mb-1 text-body-sm-medium text-foreground">{o.title}</p>
          <ul>
            {o.rows.map((r, i) => (
              <HistoryRow key={r.ref} row={r} gap={gap} divider={divider} logo={logo} align={align} last={i === o.rows.length - 1} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function HistoryGallery() {
  const [gap, setGap] = useState<Gap>('roomy')
  const [divider, setDivider] = useState<Divider>('full')
  const [logo, setLogo] = useState<Logo>('initials')
  const [align, setAlign] = useState<Align>('left')
  return (
    <div className="min-h-svh bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div>
            <h1 className="text-heading">Occurrences history rows</h1>
            <p className="max-w-[720px] text-meta text-muted-foreground">Three columns: a small square logo, the source name with its reference below, and the date with the time below (24 h, no AM or PM). The logos are placeholders until the real marks are decided.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Toggle label="Gap" value={gap} options={[{ v: 'compact', t: 'Compact' }, { v: 'regular', t: 'Regular' }, { v: 'roomy', t: 'Roomy' }]} onChange={setGap} />
            <Toggle label="Divider" value={divider} options={[{ v: 'full', t: 'Full width' }, { v: 'inset', t: 'Inset (under the text)' }, { v: 'none', t: 'None' }]} onChange={setDivider} />
            <Toggle label="Logo" value={logo} options={[{ v: 'icon', t: 'Icon tile' }, { v: 'initials', t: 'Initials tile' }, { v: 'slot', t: 'Empty slot' }]} onChange={setLogo} />
            <Toggle label="Date" value={align} options={[{ v: 'right', t: 'Right aligned' }, { v: 'left', t: 'Left aligned' }]} onChange={setAlign} />
          </div>
        </header>
        <div className="flex flex-wrap items-start gap-8">
          <Card gap={gap} divider={divider} logo={logo} align={align} />
          <div className="max-w-[360px] text-meta text-muted-foreground">
            <p className="mb-2 text-label text-foreground">Now (for comparison)</p>
            <ul className="flex flex-col gap-1.5 rounded-lg bg-(--neutral-900) p-4">
              {OCCURRENCES[0].rows.map((r) => (
                <li key={r.ref}>{r.ref} {r.source} · {r.day}, {r.time}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
