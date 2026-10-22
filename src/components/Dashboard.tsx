import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { NavArrowDown, NavArrowUp, Xmark } from 'iconoir-react'
import { IncidentMap } from '@/components/IncidentMap'
import { MediaGallery } from '@/components/MediaGallery'
import { Badge } from '@/components/ui/badge'
import { selectClass } from '@/lib/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  GROUPS,
  STATUSES,
  fetchDashboardData,
  groupOf,
  label,
  type Category,
  type Incident,
  type Locality,
} from '@/lib/incidents'

const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 0, label: 'All time' },
]
const DAY = 86_400_000

type Data = { incidents: Incident[]; localities: Locality[]; categories: Category[] }

export type Tab = 'explore' | 'ask'

interface Props {
  highlightIds: string[]
  /** Active panel on mobile (on desktop everything is visible). */
  tab: Tab
  onTab: (tab: Tab) => void
  children?: ReactNode
}

export function Dashboard({ highlightIds, tab, onTab, children }: Props) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const [locality, setLocality] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [days, setDays] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false) // mobile bottom sheet only

  useEffect(() => {
    fetchDashboardData().then(setData, (e: Error) => setError(e.message))
  }, [])

  const localityName = useMemo(() => new Map(data?.localities.map((l) => [l.code, l.name])), [data])

  const filtered = useMemo(
    () =>
      (data?.incidents ?? []).filter(
        (i) =>
          (!locality || i.locality_code === Number(locality)) &&
          (!category || i.category === category) &&
          (!status || i.status === status) &&
          (!days || new Date(i.occurred_at).getTime() >= now - days * DAY),
      ),
    [data, locality, category, status, days, now],
  )

  const byGroup = useMemo(() => {
    const counts = { pending: 0, active: 0, closed: 0 }
    for (const i of filtered) counts[groupOf(i.status)]++
    return counts
  }, [filtered])

  const topLocalities = useMemo(() => {
    const counts = new Map<number, number>()
    for (const i of filtered) counts.set(i.locality_code, (counts.get(i.locality_code) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [filtered])

  const selected = filtered.find((i) => i.id === selectedId) ?? null
  const select = (id: string | null) => {
    setSelectedId(id)
    if (id) setCollapsed(false)
  }
  const pick = (t: Tab) => {
    onTab(t)
    setCollapsed(false)
  }

  return (
    <>
      <IncidentMap
        incidents={filtered}
        selectedId={selected?.id ?? null}
        highlightIds={highlightIds}
        onSelect={select}
      />

      {/* Mobile: bottom sheet over the map. Desktop (1440 px and wider): `contents`, so the two columns float over the map. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-10 flex flex-col gap-2 rounded-t-2xl border-t bg-sidebar/95 p-2 backdrop-blur desk:contents ${collapsed ? 'max-desk:[&>:not(:first-child)]:hidden' : 'h-[62svh]'}`}
      >
        <div className="flex shrink-0 gap-1 desk:hidden">
          {(
            [
              ['explore', 'Explore'],
              ['ask', 'Investigate'],
            ] as const
          ).map(([t, text]) => (
            <Button key={t} size="sm" className="flex-1" variant={tab === t && !collapsed ? 'secondary' : 'ghost'} onClick={() => pick(t)}>
              {text}
            </Button>
          ))}
          <Button size="icon" variant="ghost" aria-label={collapsed ? 'Expand panel' : 'Collapse panel'} onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <NavArrowUp /> : <NavArrowDown />}
          </Button>
        </div>

      <div
        className={`${tab === 'explore' && !selected ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-3 overflow-y-auto desk:absolute desk:right-4 desk:top-4 desk:flex desk:w-72 desk:flex-none desk:overflow-visible`}
      >
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <select aria-label="Locality" className={selectClass} value={locality} onChange={(e) => setLocality(e.target.value)}>
              <option value="">All localities</option>
              {data?.localities.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Category"
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {data?.categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <select aria-label="Status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
            <select aria-label="Period" className={selectClass} value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {PERIODS.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle>
              {error ? 'Could not load incidents' : data ? `${filtered.length} incidents` : 'Loading…'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-body">
            {error && <p className="text-incident">{error}</p>}
            {data && !error && (
              <>
                <ul className="flex flex-col gap-1">
                  {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
                    <li key={g} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: `var(${GROUPS[g].token})` }} aria-hidden />
                      <span className="flex-1 text-muted-foreground">{GROUPS[g].label}</span>
                      <span>{byGroup[g]}</span>
                    </li>
                  ))}
                </ul>
                {topLocalities.length > 0 && (
                  <div>
                    <p className="mb-1 text-meta font-medium uppercase tracking-wide text-muted-foreground">Top localities</p>
                    <ol className="flex flex-col gap-1">
                      {topLocalities.map(([code, n]) => (
                        <li key={code} className="flex justify-between">
                          <button className="text-left hover:underline" onClick={() => setLocality(String(code))}>
                            {localityName.get(code)}
                          </button>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {data.incidents.length === 0 && (
                  <p className="text-muted-foreground">No incidents in your scope.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div
        className={`${tab !== 'explore' || selected ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-3 desk:absolute desk:inset-y-0 desk:left-0 desk:flex desk:w-[543.5px] desk:flex-none desk:border-r desk:bg-ai desk:p-3`}
      >
        {children}
        {selected && (
        <Card className="max-h-[45%] shrink-0 overflow-auto bg-card/95">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>{selected.title}</CardTitle>
              <p className="text-meta text-muted-foreground">
                {selected.reference} · {localityName.get(selected.locality_code)}
              </p>
            </div>
            <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setSelectedId(null)}>
              <Xmark />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-body">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{label(selected.status)}</Badge>
              {selected.uncertainty_flags.map((f) => (
                <Badge key={f} variant="outline">
                  {label(f)}
                </Badge>
              ))}
            </div>
            <MediaGallery incidentId={selected.id} />
            <p>{selected.description}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
              <dt>Location</dt>
              <dd className="text-foreground">{selected.location_description}</dd>
              <dt>Occurred</dt>
              <dd className="text-foreground">{new Date(selected.occurred_at).toLocaleString('en-GB')}</dd>
              <dt>Reported</dt>
              <dd className="text-foreground">{new Date(selected.reported_at).toLocaleString('en-GB')}</dd>
              <dt>Category</dt>
              <dd className="text-foreground">
                {data?.categories.find((c) => c.code === selected.category)?.name ?? label(selected.category)}
              </dd>
              <dt>Vehicle</dt>
              <dd className="text-foreground">{label(selected.vehicle_type)}</dd>
              <dt>AI</dt>
              <dd className="text-foreground">
                {selected.ai_classification} ({Math.round((selected.ai_confidence ?? 0) * 100)}% confidence)
              </dd>
              <dt>Validation</dt>
              <dd className="text-foreground">{label(selected.validation_status)}</dd>
              {selected.outcome && (
                <>
                  <dt>Outcome</dt>
                  <dd className="text-foreground">{selected.outcome}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
        )}
      </div>
      </div>
    </>
  )
}
