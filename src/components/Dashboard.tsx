import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CaretDown, CaretUp, ChatCircleDots, X } from '@phosphor-icons/react'
import { IncidentMap } from '@/components/IncidentMap'
import { StatCard } from '@/components/ui/stat-card'
import { trendOf } from '@/lib/trend'
import { MediaGallery } from '@/components/MediaGallery'
import { Badge } from '@/components/ui/badge'
import { FilterBar, NO_FILTERS, type Filters } from '@/components/FilterBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  fetchDashboardData,
  groupOf,
  label,
  type Category,
  type Incident,
  type Locality,
} from '@/lib/incidents'
import type { Area } from '@/lib/agent'

const DAY = 86_400_000

type Data = { incidents: Incident[]; localities: Locality[]; categories: Category[] }

export type Tab = 'explore' | 'ask'

interface Props {
  highlightIds: string[]
  /** Localities to outline for an answer about localities. */
  areas: Area[]
  focusCode: number | null
  zoomTo: { code: number; n: number } | null
  onClearHighlight: () => void
  /** Active panel on mobile (on desktop everything is visible). */
  tab: Tab
  onTab: (tab: Tab) => void
  children?: ReactNode
}

export function Dashboard({ highlightIds, areas, focusCode, zoomTo, onClearHighlight, tab, onTab, children }: Props) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false) // mobile bottom sheet only

  useEffect(() => {
    fetchDashboardData().then(setData, (e: Error) => setError(e.message))
  }, [])

  // The conversation takes over the map: when an answer rings incidents, filters are cleared so nothing it points at is hidden.
  useEffect(() => {
    if (highlightIds.length) setFilters(NO_FILTERS) // eslint-disable-line react-hooks/set-state-in-effect
  }, [highlightIds])

  const localityName = useMemo(() => new Map(data?.localities.map((l) => [l.code, l.name])), [data])

  // While an answer is shown, everything below (map, header count, summary card, status counts) is limited to the answer's incidents.
  const answerIds = useMemo(() => (highlightIds.length ? new Set(highlightIds) : null), [highlightIds])

  // Everything except the status chips: the status counts show what each chip would add.
  const beforeStatus = useMemo(
    () =>
      (data?.incidents ?? []).filter(
        (i) =>
          (!answerIds || answerIds.has(i.id)) &&
          (!filters.locality || i.locality_code === Number(filters.locality)) &&
          (!filters.categories.length || filters.categories.includes(i.category)) &&
          (!filters.days || new Date(i.occurred_at).getTime() >= now - filters.days * DAY),
      ),
    [data, answerIds, filters.locality, filters.categories, filters.days, now],
  )
  const filtered = useMemo(
    () => (filters.statuses.length ? beforeStatus.filter((i) => filters.statuses.includes(groupOf(i.status))) : beforeStatus),
    [beforeStatus, filters.statuses],
  )

  const byGroup = useMemo(() => {
    const counts = { pending: 0, reviewing: 0, approved: 0, rejected: 0 }
    for (const i of beforeStatus) counts[groupOf(i.status)]++
    return counts
  }, [beforeStatus])

  const topLocalities = useMemo(() => {
    // The last 30 days and the 30 before, counted back from the newest report (the data is a fixed set, not live).
    const DAY = 86_400_000
    const end = Math.max(0, ...filtered.map((i) => Date.parse(i.occurred_at)))
    const counts = new Map<number, { n: number; recent: number; before: number }>()
    for (const i of filtered) {
      const c = counts.get(i.locality_code) ?? { n: 0, recent: 0, before: 0 }
      const age = (end - Date.parse(i.occurred_at)) / DAY
      c.n++
      if (age < 30) c.recent++
      else if (age < 60) c.before++
      counts.set(i.locality_code, c)
    }
    return [...counts].sort((a, b) => b[1].n - a[1].n).slice(0, 4)
  }, [filtered])

  const chatMode = highlightIds.length > 0 // an answer is on the map: the banner shows and everything below it moves down by --answer-banner-h
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
        areas={areas}
        focusCode={focusCode}
        zoomTo={zoomTo}
        onSelect={select}
      />

      {/* Conversation mode banner (Figma Answer Banner): while an answer is on the map, filters narrow it; the button ends the mode. */}
      {chatMode && (
        <div className="fixed inset-x-0 top-[53px] z-10 flex h-(--answer-banner-h) items-center gap-4 bg-(--indigo-800) px-5 text-meta text-(--indigo-200) desk:absolute desk:top-(--section-header-h) desk:right-0 desk:left-(--agent-w) desk:inset-x-auto">
          <ChatCircleDots weight="fill" className="size-5 shrink-0 text-(--indigo-300)" aria-hidden />
          <span className="flex-1">While showing the agent's answer on the map, filters will narrow it down.</span>
          <Button size="sm" variant="outline" className="h-6" onClick={onClearHighlight}>
            Clear agent results
          </Button>
        </div>
      )}

      {/* Legend (owner, 2026-10-28, kept from the map header): how many incidents the map shows now, bottom left. */}
      {data && (
        <p className="pointer-events-none absolute bottom-[4.5rem] left-3 z-10 rounded-sm border bg-card/95 px-3 py-1 text-meta text-(--neutral-200) desk:bottom-6 desk:left-[calc(var(--agent-w)+1.5rem)]">
          Showing {filtered.length} {filtered.length === 1 ? 'incident' : 'incidents'}
        </p>
      )}

      {/* Filter chips (Figma: Filter Bar): one row over the map, scrolling sideways when it does not fit; hidden while an incident is open. */}
      {!selected && data && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          localities={data.localities}
          categories={data.categories}
          counts={byGroup}
          className={`fixed inset-x-3 ${chatMode ? 'top-[calc(53px+var(--answer-banner-h))]' : 'top-[53px]'} z-10 flex items-center gap-2 desk:absolute desk:inset-x-auto ${chatMode ? 'desk:top-[calc(var(--section-header-h)+var(--answer-banner-h)+var(--stat-row-h)+2.25rem)]' : 'desk:top-[calc(var(--section-header-h)+var(--stat-row-h)+2.25rem)]'} desk:right-6 desk:left-[calc(var(--agent-w)+1.5rem)] desk:max-w-[1200px]`}
        />
      )}

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
            {collapsed ? <CaretUp /> : <CaretDown />}
          </Button>
        </div>

      {/* The four localities with most incidents (Figma Stat Card), in a row above the filters; a click filters the map to that locality. On phones they sit in the Explore tab, two by two. */}
      <div
        className={`${tab === 'explore' && !selected ? 'grid' : 'hidden'} grid-cols-2 gap-3 overflow-y-auto desk:absolute desk:right-6 desk:left-[calc(var(--agent-w)+1.5rem)] desk:z-10 desk:grid desk:max-w-[1200px] desk:grid-cols-4 ${chatMode ? 'desk:top-[calc(var(--section-header-h)+var(--answer-banner-h)+1.5rem)]' : 'desk:top-[calc(var(--section-header-h)+1.5rem)]'}`}
      >
        {error ? (
          <p className="col-span-full text-incident">{error}</p>
        ) : !data ? (
          <p className="col-span-full text-muted-foreground">Loading…</p>
        ) : topLocalities.length ? (
          topLocalities.map(([code, c]) => <StatCard key={code} label={localityName.get(code)} value={c.n} trend={trendOf(c.recent, c.before)} onClick={() => setFilters({ ...filters, locality: String(code) })} />)
        ) : (
          <p className="col-span-full text-muted-foreground">No incidents in your scope.</p>
        )}
      </div>

      <div
        className={`${tab !== 'explore' || selected ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-3 desk:absolute desk:top-0 desk:bottom-0 desk:left-0 desk:flex desk:w-(--agent-w) desk:flex-none desk:border-r desk:border-secondary desk:bg-ai desk:p-0`}
      >
        {children}
        {selected && (
        <Card className="max-h-[45%] shrink-0 overflow-auto bg-card/95 desk:mx-6 desk:mb-6">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>{selected.title}</CardTitle>
              <p className="text-meta text-muted-foreground">
                {selected.reference} · {localityName.get(selected.locality_code)}
              </p>
            </div>
            <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setSelectedId(null)}>
              <X />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-body-sm">
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
