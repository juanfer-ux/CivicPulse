import type { ReactNode } from 'react'
import { CaretDown, CaretRight, ChatCircle, MagnifyingGlass, Warning, X } from '@phosphor-icons/react'
import { PROBLEM_STATUS, type ProblemStatus } from '@/lib/statusColors'

/**
 * Ways to keep the sidebar's Recurrences and Incidents lists short (owner's request, 2026-11-08). Dev-only gallery at /#sidebar: mock rows in the sidebar's own look, sample data, nothing here changes the app.
 */

type Rec = { t: string; ref: string; s: ProblemStatus }
const RECS: Rec[] = [
  { t: 'Obstructive Parking - Cra 13 #62-40, Entrada del Edificio Aurora', ref: 'PR-00088', s: 'active' },
  { t: 'Illegal Dumping - Parque La Serena, Cl 80', ref: 'PR-00091', s: 'active' },
  { t: 'Obstructive Parking - Av. Boyacá con Cl 72', ref: 'PR-00074', s: 'monitoring' },
  { t: 'Illegal Dumping - Cra 72 con Cl 80, Cruce Peatonal', ref: 'PR-00067', s: 'monitoring' },
  { t: 'Obstructive Parking - Cl 72 #24-30, Entrada del Colegio', ref: 'PR-00052', s: 'resolved' },
  { t: 'Illegal Dumping - Hotspot 8-1, Kennedy', ref: 'PR-00049', s: 'resolved' },
  { t: 'Obstructive Parking - Cra 7 con Cl 63', ref: 'PR-00031', s: 'archived' },
]
type Inc = { t: string; ref: string; g: string; dot: string }
const INCS: Inc[] = [
  { t: 'Access Ramp Blocked by a Parked Vehicle', ref: 'CP-00011', g: 'Pending', dot: 'var(--map-pending)' },
  { t: 'Rubble Left in Public Space', ref: 'CP-00012', g: 'Reviewing', dot: 'var(--map-reviewing)' },
  { t: 'Pedestrian Access Blocked by a Parked Vehicle', ref: 'CP-00013', g: 'Pending', dot: 'var(--map-pending)' },
  { t: 'Furniture Left in Public Space', ref: 'CP-00014', g: 'Approved', dot: 'var(--blue-300)' },
  { t: 'Bike Lane Blocked by a Parked Vehicle', ref: 'CP-00015', g: 'Rejected', dot: 'var(--map-rejected)' },
  { t: 'Tires Left in Public Space', ref: 'CP-00016', g: 'Pending', dot: 'var(--map-pending)' },
]

const Frame = ({ name, note, children }: { name: string; note: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div>
      <p className="text-label">{name}</p>
      <p className="min-h-[54px] text-meta text-muted-foreground">{note}</p>
    </div>
    <div className="flex h-[560px] w-[300px] max-w-full flex-col overflow-hidden rounded-[6px] border-[0.5px] border-(--neutral-500) bg-(--neutral-900)">{children}</div>
  </div>
)

const Row = ({ icon, title, sub, active }: { icon: ReactNode; title: string; sub: ReactNode; active?: boolean }) => (
  <div className={`flex h-[50px] shrink-0 items-start gap-2.5 pt-[3px] pr-[19px] pb-[5px] pl-[11px] ${active ? 'bg-(--neutral-800)' : ''}`}>
    <span className="flex h-10 w-4 shrink-0 items-start justify-center pt-1">{icon}</span>
    <span className="flex h-10 min-w-0 flex-col justify-center gap-0.5">
      <span className="truncate text-body-sm text-(--neutral-100)">{title}</span>
      <span className="truncate text-caption text-(--neutral-200)">{sub}</span>
    </span>
  </div>
)
const RecRow = ({ r, active }: { r: Rec; active?: boolean }) => (
  <Row active={active} icon={<Warning weight="fill" className="size-4" style={{ color: `var(${PROBLEM_STATUS[r.s].token})` }} />} title={r.t} sub={`${r.ref} · ${PROBLEM_STATUS[r.s].label}`} />
)
const IncRow = ({ i, active }: { i: Inc; active?: boolean }) => <Row active={active} icon={<span className="mt-0.5 size-3 rounded-full" style={{ background: i.dot }} />} title={i.t} sub={`${i.ref} · ${i.g}`} />

const Head = ({ title, count, open = true, hint }: { title: string; count: string; open?: boolean; hint?: string }) => (
  <div className="flex h-8 shrink-0 items-center gap-1 px-2.5 text-caption-medium text-(--neutral-200)">
    {open ? <CaretDown className="size-3" /> : <CaretRight className="size-3" />}
    <span className="flex-1">
      {title} <span className="text-(--neutral-300)">· {count}</span>
    </span>
    {hint && <span className="text-caption text-(--neutral-300)">{hint}</span>}
  </div>
)
const More = ({ children }: { children: ReactNode }) => <div className="mx-2.5 mt-1 shrink-0 rounded-sm px-2 py-1.5 text-caption-medium text-(--neutral-200) hover:bg-(--neutral-800)">{children}</div>
const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-(--neutral-600) px-2 text-caption text-(--neutral-100)">
    {children}
    <X className="size-3 text-(--neutral-200)" />
  </span>
)
const Search = ({ value }: { value?: string }) => (
  <div className="m-3 flex h-9 shrink-0 items-center gap-2 rounded-sm border border-(--neutral-400) bg-(--neutral-600) px-2.5 text-body-sm">
    <MagnifyingGlass className="size-4 text-(--neutral-200)" />
    <span className={value ? 'text-(--neutral-100)' : 'text-(--neutral-200)'}>{value ?? 'Search...'}</span>
  </div>
)
/** The conversation an item belongs to, on its second line. */
const Conv = ({ s, c }: { s: string; c: string }) => (
  <span className="flex items-center gap-1">
    <span className="shrink-0">{s}</span>
    <ChatCircle weight="regular" className="size-3 shrink-0 text-(--indigo-300)" />
    <span className="truncate text-(--indigo-200)">{c}</span>
  </span>
)
const RecC = ({ r, c }: { r: Rec; c: string }) => (
  <Row icon={<Warning weight="fill" className="size-4" style={{ color: `var(${PROBLEM_STATUS[r.s].token})` }} />} title={r.t} sub={<Conv s={`${r.ref} · ${PROBLEM_STATUS[r.s].label}`} c={c} />} />
)
const IncC = ({ i, c }: { i: Inc; c: string }) => <Row icon={<span className="mt-0.5 size-3 rounded-full" style={{ background: i.dot }} />} title={i.t} sub={<Conv s={`${i.ref} · ${i.g}`} c={c} />} />
/** A collapsed status group: its title with a caret and the count. */
const Grp = ({ title }: { title: string }) => (
  <p className="flex shrink-0 items-center gap-1 px-3 py-1.5 text-caption-medium text-(--neutral-200)">
    <CaretRight weight="bold" className="size-3" />
    {title}
  </p>
)
const Pin = () => <p className="mx-2.5 mt-1 mb-0.5 shrink-0 text-caption text-(--neutral-300)">Open on the map</p>

export function SidebarListGallery() {
  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-8 p-8">
      <header>
        <h1 className="text-heading">Sidebar lists, ways to keep them short</h1>
        <p className="max-w-[820px] text-body-sm text-muted-foreground">Today the sidebar lists every recurrence and every incident, about 38 and 120 here. Each option below is a mock of the sidebar with the same sample rows. They can be combined; the combination I would build is 3, 5 and 2. The marker you click on the map always keeps its row visible (the "Open on the map" row). Options 8 and 9 are the owner's direction: priority groups, only items a conversation touched.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Frame name="0 · Today" note="Every row, always. 38 recurrences and 120 incidents: the list never ends and most of it is not what you are looking at.">
          <Head title="Recurrences" count="38" />
          {RECS.slice(0, 5).map((r) => (
            <RecRow key={r.ref} r={r} />
          ))}
          <p className="px-6 py-1 text-caption text-(--neutral-300)">... 33 more rows</p>
          <Head title="Incidents" count="120" />
          {INCS.slice(0, 3).map((i) => (
            <IncRow key={i.ref} i={i} />
          ))}
        </Frame>

        <Frame name="1 · Collapsed by default" note="Each section shows only its title and count, and opens on click. The least work, and the cleanest at first sight.">
          <Search />
          <Head title="Recurrences" count="38" open={false} />
          <Head title="Incidents" count="120" open={false} />
          <Head title="Investigations" count="3" open={false} />
        </Frame>

        <Frame name="2 · Short list and View all" note="The 5 most recent of each, then a row that expands the rest. Good for the landing, when there is no conversation.">
          <Head title="Recurrences" count="38" />
          {RECS.slice(0, 5).map((r) => (
            <RecRow key={r.ref} r={r} />
          ))}
          <More>View all 38</More>
          <Head title="Incidents" count="120" />
          {INCS.slice(0, 5).map((i) => (
            <IncRow key={i.ref} i={i} />
          ))}
          <More>View all 120</More>
        </Frame>

        <Frame name="3 · Scoped to the conversation" note="With an answer on the map, only the items behind that answer are listed, and a row at the top says so. 'Show all' brings the full list back.">
          <div className="m-3 mb-1 flex shrink-0 flex-col gap-1 rounded-sm bg-(--indigo-600) px-3 py-2 text-meta text-(--indigo-100)">
            <span className="truncate">Which locations have repeated parking obstruction reports?</span>
            <span className="text-caption text-(--indigo-200)">6 of 120 incidents · 4 of 38 recurrences · Show all</span>
          </div>
          <Head title="Recurrences" count="4 of 38" />
          {RECS.slice(0, 4).map((r) => (
            <RecRow key={r.ref} r={r} active={r.ref === 'PR-00074'} />
          ))}
          <Head title="Incidents" count="6 of 120" />
          {INCS.slice(0, 4).map((i) => (
            <IncRow key={i.ref} i={i} />
          ))}
        </Frame>

        <Frame name="4 · Search first" note="The lists stay hidden until you type or pick a filter. The empty state tells you how many there are and what to do.">
          <Search />
          <p className="px-4 pt-2 text-body-sm text-(--neutral-200)">38 recurrences and 120 incidents.</p>
          <p className="px-4 text-caption text-(--neutral-300)">Type to search, or ask the agent a question.</p>
          <div className="my-4 h-px bg-(--neutral-600)" />
          <p className="px-4 text-caption-medium text-(--neutral-200)">After typing "aurora"</p>
          <Search value="aurora" />
          <Head title="Recurrences" count="1" />
          <RecRow r={RECS[0]} />
          <Head title="Incidents" count="2" />
          {INCS.slice(0, 2).map((i) => (
            <IncRow key={i.ref} i={i} />
          ))}
        </Frame>

        <Frame name="5 · Follows the map filters" note="The sidebar lists exactly what the map shows: the same locality, category and period. No row exists that the map hides.">
          <div className="m-3 mb-1 flex shrink-0 flex-wrap gap-1.5">
            <Chip>Suba</Chip>
            <Chip>Obstructive Parking</Chip>
            <Chip>Last 30 Days</Chip>
          </div>
          <Head title="Recurrences" count="5 of 38" />
          {RECS.filter((r) => r.t.startsWith('Obstructive')).slice(0, 3).map((r) => (
            <RecRow key={r.ref} r={r} />
          ))}
          <Head title="Incidents" count="14 of 120" />
          {INCS.slice(0, 3).map((i) => (
            <IncRow key={i.ref} i={i} />
          ))}
          <More>View all 14</More>
        </Frame>

        <Frame name="6 · Priority groups" note="Grouped by what needs attention: Active recurrences and Pending incidents open, the rest collapsed under their count.">
          <Head title="Recurrences" count="38" />
          <p className="px-4 pt-1 pb-0.5 text-caption-medium text-(--neutral-200)">Active · 6</p>
          {RECS.slice(0, 2).map((r) => (
            <RecRow key={r.ref} r={r} />
          ))}
          <More>Monitoring 11 · Resolved 17 · Archived 4</More>
          <Head title="Incidents" count="120" />
          <p className="px-4 pt-1 pb-0.5 text-caption-medium text-(--neutral-200)">Pending · 31</p>
          {INCS.filter((i) => i.g === 'Pending').slice(0, 2).map((i) => (
            <IncRow key={i.ref} i={i} />
          ))}
          <More>Reviewing 12 · Approved 44 · Rejected 33</More>
        </Frame>

        <Frame name="7 · The open row stays (with 3)" note="A marker you click on the map keeps its row at the top even when it is outside the short list, so the highlight and the scroll still work.">
          <Head title="Recurrences" count="38" />
          <Pin />
          <RecRow r={RECS[6]} active />
          <p className="px-4 pt-1 pb-0.5 text-caption text-(--neutral-300)">Most recent</p>
          {RECS.slice(0, 3).map((r) => (
            <RecRow key={r.ref} r={r} />
          ))}
          <More>View all 38</More>
        </Frame>
        <Frame name="8 · Working set: priority groups, only what a conversation touched" note="Option 6's groups, but only items an answer highlighted or you opened from the map. Each row says which conversation it came from. The map still shows everything.">
          <Head title="Recurrences" count="4 · in 3 conversations" />
          <p className="px-4 pt-1 pb-0.5 text-caption-medium text-(--neutral-200)">Active · 2</p>
          <RecC r={RECS[0]} c="Repeated Parking Locations" />
          <RecC r={RECS[1]} c="Illegal Dumping Localities" />
          <Grp title="Monitoring · 1" />
          <Grp title="Resolved · 1" />
          <Head title="Incidents" count="8 · in 3 conversations" />
          <p className="px-4 pt-1 pb-0.5 text-caption-medium text-(--neutral-200)">Pending · 3</p>
          <IncC i={INCS[0]} c="Repeated Parking Locations" />
          <IncC i={INCS[2]} c="Tomorrow Evening" />
          <Grp title="Reviewing · 2" />
          <Grp title="Approved · 2" />
          <Grp title="Rejected · 1" />
          <More>View all 30 in "Illegal Dumping Localities"</More>
        </Frame>

        <Frame name="9 · Working set, empty state" note="The landing, before any conversation. The sections explain how items get here, so an empty sidebar reads as intended.">
          <Search />
          <Head title="Recurrences" count="0" />
          <p className="px-4 pb-2 text-caption text-(--neutral-300)">Nothing here yet. Ask the agent, or open a marker on the map.</p>
          <Head title="Incidents" count="0" />
          <p className="px-4 pb-2 text-caption text-(--neutral-300)">Nothing here yet. Incidents an answer points to, or that you open, appear here.</p>
          <Head title="Investigations" count="3" />
          <Row icon={<ChatCircle weight="regular" className="size-4 text-(--neutral-200)" />} title="Repeated Parking Locations" sub="6 incidents · 4 recurrences" />
          <Row icon={<ChatCircle weight="regular" className="size-4 text-(--neutral-200)" />} title="Illegal Dumping Localities" sub="30 incidents · 2 recurrences" />
          <Row icon={<ChatCircle weight="regular" className="size-4 text-(--neutral-200)" />} title="Tomorrow Evening" sub="3 incidents · 1 recurrence" />
        </Frame>
      </div>
    </main>
  )
}
