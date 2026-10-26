import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CaretDown, CaretUp, X } from '@phosphor-icons/react'
import { IncidentMap } from '@/components/IncidentMap'
import { SectionHeader } from '@/components/SectionHeader'
import { MediaGallery } from '@/components/MediaGallery'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
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
import { useAuth } from '@/lib/auth'
import { shortName } from '@/lib/utils'

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
  const { profile } = useAuth()
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

  // Everything except the status chips: the status counts show what each chip would add.
  const beforeStatus = useMemo(
    () =>
      (data?.incidents ?? []).filter(
        (i) =>
          (!filters.locality || i.locality_code === Number(filters.locality)) &&
          (!filters.categories.length || filters.categories.includes(i.category)) &&
          (!filters.days || new Date(i.occurred_at).getTime() >= now - filters.days * DAY),
      ),
    [data, filters.locality, filters.categories, filters.days, now],
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

      {/* Section header (desktop only): 70 px, over the map to the right of the agent panel. */}
      <SectionHeader title="Map" count={data ? `${filtered.length} incidents` : undefined} className="absolute top-0 right-0 left-(--agent-w) z-10">
        {profile && (
          <>
            <RoleBadge role={profile.role} />
            <Avatar name={profile.full_name || 'Signed in'} title={shortName(profile.full_name) || 'Signed in'} />
          </>
        )}
      </SectionHeader>

      {/* Filter chips (Figma: Filter Bar): one row over the map, scrolling sideways when it does not fit; hidden while an incident is open. */}
      {!selected && data && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          localities={data.localities}
          categories={data.categories}
          counts={byGroup}
          className="fixed inset-x-3 top-[53px] z-10 flex items-center gap-2 desk:absolute desk:inset-x-auto desk:top-[calc(var(--section-header-h)+0.75rem)] desk:right-4 desk:left-[calc(var(--agent-w)+1rem)]"
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

      <div
        className={`${tab === 'explore' && !selected ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-3 overflow-y-auto desk:absolute desk:right-4 desk:top-[calc(var(--section-header-h)+1rem+2.25rem+0.75rem)] desk:flex desk:w-72 desk:flex-none desk:overflow-visible`}
      >
        <Card className="bg-card/95">
          <CardHeader>
            <CardTitle>
              {error ? 'Could not load incidents' : data ? `${filtered.length} incidents` : 'Loading…'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-body-sm">
            {error && <p className="text-incident">{error}</p>}
            {data && !error && (
              <>
                {topLocalities.length > 0 && (
                  <div>
                    <p className="mb-1 text-meta uppercase tracking-[0.05em] text-muted-foreground">Top localities</p>
                    <ol className="flex flex-col gap-1">
                      {topLocalities.map(([code, n]) => (
                        <li key={code} className="flex justify-between">
                          <button className="text-left hover:underline" onClick={() => setFilters({ ...filters, locality: String(code) })}>
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
