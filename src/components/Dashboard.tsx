import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CaretDown, CaretUp, ChatCircleDots, X } from '@phosphor-icons/react'
import { IncidentMap } from '@/components/IncidentMap'
import { StatCard } from '@/components/ui/stat-card'
import { trendOf } from '@/lib/trend'
import { MediaGallery } from '@/components/MediaGallery'
import { ProblemDetail } from '@/components/ProblemDetail'
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
import { PROBLEM_STATUSES, fetchLinkedIncidentIds, fetchProblemDetail, fetchProblems, type ProblemDetailData, type ProblemRow, type ProblemStatus } from '@/lib/problems'
import { useRestoreFocus } from '@/lib/useRestoreFocus'

const DAY = 86_400_000

type Data = { incidents: Incident[]; localities: Locality[]; categories: Category[] }

export type Tab = 'explore' | 'ask'

interface Props {
  highlightIds: string[]
  /** Localities to outline for an answer about localities. */
  areas: Area[]
  focusCode: number | null
  zoomTo: { code: number; n: number } | null
  /** Ask the map to fly to a locality (a Stat Card was clicked). */
  onZoomLocality: (code: number) => void
  onClearHighlight: () => void
  /** Active panel on mobile (on desktop everything is visible). */
  tab: Tab
  onTab: (tab: Tab) => void
  onInspect: (open: boolean) => void // an incident is open: App makes room for its panel and collapses the sidebar
  children?: ReactNode
}

export function Dashboard({ highlightIds, areas, focusCode, zoomTo, onZoomLocality, onClearHighlight, tab, onTab, onInspect, children }: Props) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false) // mobile bottom sheet only
  // Persistent problems (decision 0030). If the database does not have the layer yet, the list stays empty and the map shows incidents exactly as before.
  const [problems, setProblems] = useState<ProblemRow[]>([])
  const [linked, setLinked] = useState<Map<string, string>>(() => new Map()) // incident -> problem it is confirmed into: the loose layers hide it, the problem's dots show it up close
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ id: string; data: ProblemDetailData } | null>(null)

  useEffect(() => {
    fetchDashboardData().then(setData, (e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    fetchProblems().then(setProblems, () => setProblems([]))
    fetchLinkedIncidentIds().then(setLinked, () => setLinked(new Map()))
  }, [])
  useEffect(() => {
    if (!selectedProblemId) return
    let live = true
    fetchProblemDetail(selectedProblemId).then(
      (data) => live && setDetail({ id: selectedProblemId, data }),
      () => live && setDetail({ id: selectedProblemId, data: { occurrences: [], links: [], incidents: [], sources: {}, interventions: [], events: [] } }),
    )
    return () => {
      live = false
    }
  }, [selectedProblemId])

  // The conversation takes over the map: when an answer rings incidents, filters are cleared so nothing it points at is hidden.
  useEffect(() => {
    if (highlightIds.length) setFilters(NO_FILTERS) // eslint-disable-line react-hooks/set-state-in-effect
  }, [highlightIds])

  const chatMode = highlightIds.length > 0 // an answer is on the map: the banner shows and everything below it moves down by --answer-banner-h
  // One map for both (owner, 2026-10-30): problems are always markers, incidents are dots or pins, and an incident a problem already stands for is not drawn twice.
  // While an agent answer is on the map only its incidents show (they are incidents, linked or not); without the problems layer in the database it is the incident map as before.
  const hasProblems = problems.length > 0
  const showProblems = hasProblems && !chatMode && (!filters.types.length || filters.types.includes('problems'))
  const showIncidents = !hasProblems || chatMode || !filters.types.length || filters.types.includes('incidents')
  useEffect(() => {
    if (!showProblems) setSelectedProblemId(null) // eslint-disable-line react-hooks/set-state-in-effect
  }, [showProblems])

  const localityName = useMemo(() => new Map(data?.localities.map((l) => [l.code, l.name])), [data])

  // While an answer is shown, everything below (map, header count, summary card, status counts) is limited to the answer's incidents.
  const answerIds = useMemo(() => (highlightIds.length ? new Set(highlightIds) : null), [highlightIds])

  // Everything except the status chips: the status counts show what each chip would add.
  const beforeStatus = useMemo(
    () =>
      (data?.incidents ?? []).filter(
        (i) =>
          (!answerIds || answerIds.has(i.id)) &&
          (chatMode || !linked.has(i.id)) &&
          (!filters.locality || i.locality_code === Number(filters.locality)) &&
          (!filters.categories.length || filters.categories.includes(i.category)) &&
          (!filters.days || new Date(i.occurred_at).getTime() >= now - filters.days * DAY),
      ),
    [data, answerIds, chatMode, linked, filters.locality, filters.categories, filters.days, now],
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
    // Informational (owner, 2026-10-29): always every incident in the person's scope, never narrowed by the filters, a clicked card or the agent's answer.
    // The last 30 days and the 30 before, counted back from the newest report (the data is a fixed set, not live).
    const all = data?.incidents ?? []
    const DAY = 86_400_000
    const end = Math.max(0, ...all.map((i) => Date.parse(i.occurred_at)))
    const counts = new Map<number, { n: number; recent: number; before: number }>()
    for (const i of all) {
      const c = counts.get(i.locality_code) ?? { n: 0, recent: 0, before: 0 }
      const age = (end - Date.parse(i.occurred_at)) / DAY
      c.n++
      if (age < 30) c.recent++
      else if (age < 60) c.before++
      counts.set(i.locality_code, c)
    }
    return [...counts].sort((a, b) => b[1].n - a[1].n).slice(0, 4)
  }, [data])

  // Problems view: the same filters, applied to problems. Days means "reported in that window"; a problem has no incident status, it has its own.
  const problemsBeforeStatus = useMemo(
    () =>
      problems.filter(
        (p) =>
          (!filters.locality || p.locality_code === Number(filters.locality)) &&
          (!filters.categories.length || filters.categories.includes(p.category)) &&
          (!filters.days || (!!p.last_seen && Date.parse(p.last_seen) >= now - filters.days * DAY)),
      ),
    [problems, filters.locality, filters.categories, filters.days, now],
  )
  const problemsFiltered = useMemo(
    () => (filters.problemStatuses.length ? problemsBeforeStatus.filter((p) => filters.problemStatuses.includes(p.status)) : problemsBeforeStatus),
    [problemsBeforeStatus, filters.problemStatuses],
  )
  const byProblemStatus = useMemo(() => {
    const counts = Object.fromEntries(PROBLEM_STATUSES.map((st) => [st, 0])) as Record<ProblemStatus, number>
    for (const p of problemsBeforeStatus) counts[p.status]++
    return counts
  }, [problemsBeforeStatus])

  const selectedProblem = showProblems ? (problemsFiltered.find((p) => p.id === selectedProblemId) ?? null) : null
  const problemDetail = detail && detail.id === selectedProblemId ? detail.data : null
  // The map holds the loose incidents plus, while a problem is open, that problem's own incidents (drawn as tiny dots around its marker).
  const problemIncidents = useMemo(() => (selectedProblem ? (problemDetail?.incidents ?? []) : []), [selectedProblem, problemDetail])
  const problemIncidentIds = useMemo(() => problemIncidents.map((i) => i.id), [problemIncidents])
  // Up close (map zoom 14+) every visible problem's incidents show as dots in its status color, open or not (owner, 2026-10-30).
  const { dotStatusById, linkedDots } = useMemo(() => {
    const status = new Map<string, ProblemStatus>()
    const dots: Incident[] = []
    if (showProblems) {
      const byId = new Map(problemsFiltered.map((p) => [p.id, p.status]))
      for (const i of data?.incidents ?? []) {
        const st = byId.get(linked.get(i.id) ?? '')
        if (st) {
          status.set(i.id, st)
          dots.push(i)
        }
      }
    }
    for (const i of problemIncidents) status.set(i.id, selectedProblem!.status)
    return { dotStatusById: status, linkedDots: dots }
  }, [showProblems, problemsFiltered, data, linked, problemIncidents, selectedProblem])
  const mapIncidents = useMemo(() => {
    const seen = new Set<string>()
    return [...(showIncidents ? filtered : []), ...linkedDots, ...problemIncidents].filter((i) => !seen.has(i.id) && seen.add(i.id))
  }, [showIncidents, filtered, linkedDots, problemIncidents])
  const selected = mapIncidents.find((i) => i.id === selectedId) ?? null
  useEffect(() => onInspect(!!selected || !!selectedProblem), [selected, selectedProblem, onInspect])
  const select = (id: string | null) => {
    if (!id && !selectedId && selectedProblemId) setSelectedProblemId(null) // a click on empty map (or Escape) closes the incident first, then the problem
    setSelectedId(id)
    if (id) setCollapsed(false)
  }
  const selectProblem = (id: string | null) => {
    setSelectedProblemId(id)
    setSelectedId(null)
    if (id) setCollapsed(false)
  }
  const pick = (t: Tab) => {
    onTab(t)
    setCollapsed(false)
  }

  return (
    <>
      <h1 className="sr-only">Civic Pulse incident map and investigations</h1>
      <IncidentMap
        incidents={mapIncidents}
        problems={showProblems ? problemsFiltered : undefined}
        problemIncidentIds={problemIncidentIds}
        selectedProblemId={selectedProblem?.id ?? null}
        dotStatusById={dotStatusById}
        onSelectProblem={selectProblem}
        selectedId={selected?.id ?? null}
        highlightIds={highlightIds}
        areas={areas}
        focusCode={focusCode}
        zoomTo={zoomTo}
        onSelect={select}
      />

      {/* Conversation mode banner (Figma Answer Banner): while an answer is on the map, filters narrow it; the button ends the mode. */}
      {chatMode && (
        <div className="fixed inset-x-0 top-[53px] z-10 flex h-(--answer-banner-h) items-center gap-4 bg-(--indigo-800) px-5 text-meta text-(--indigo-200) desk:absolute desk:top-(--section-header-h) desk:right-0 desk:left-[var(--map-left)] desk:inset-x-auto">
          <ChatCircleDots weight="fill" className="size-5 shrink-0 text-(--indigo-300)" aria-hidden />
          <span className="flex-1">While showing the agent's answer on the map, filters will narrow it down.</span>
          <Button size="sm" variant="outline" className="h-6" onClick={onClearHighlight}>
            Clear agent results
          </Button>
        </div>
      )}

      {/* Legend (owner, 2026-10-28, kept from the map header): how many incidents the map shows now, bottom left. */}
      {data && (
        <div className="pointer-events-none absolute bottom-[4.5rem] left-3 z-10 flex items-center gap-2 desk:bottom-6 desk:left-[calc(var(--map-left)+1.5rem)]">
          {showProblems && (
            <p className="rounded-sm border bg-card/95 px-3 py-1 text-meta text-(--neutral-200)">
              Showing {problemsFiltered.length} {problemsFiltered.length === 1 ? 'problem' : 'problems'}
            </p>
          )}
          {showIncidents && (
            <p className="rounded-sm border bg-card/95 px-3 py-1 text-meta text-(--neutral-200)">
              Showing {filtered.length} {filtered.length === 1 ? 'incident' : 'incidents'}
            </p>
          )}
        </div>
      )}

      {/* Filter chips (Figma: Filter Bar): one row over the map, scrolling sideways when it does not fit; hidden while an incident is open. */}
      {!selected && !selectedProblem && data && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          localities={data.localities}
          categories={data.categories}
          counts={byGroup}
          problemCounts={hasProblems ? byProblemStatus : undefined}
          className={`fixed inset-x-3 ${chatMode ? 'top-[calc(53px+var(--answer-banner-h))]' : 'top-[53px]'} z-10 flex items-center gap-2 desk:absolute desk:inset-x-auto ${chatMode ? 'desk:top-[calc(var(--section-header-h)+var(--answer-banner-h)+var(--stat-row-h)+3rem)]' : 'desk:top-[calc(var(--section-header-h)+var(--stat-row-h)+3rem)]'} desk:right-6 desk:left-[calc(var(--map-left)+1.5rem)] desk:mx-auto desk:max-w-[1280px]`}
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

      {/* The four localities with most incidents (Figma Stat Card), in a row above the filters; hidden while an incident is open, like the filters (owner, 2026-10-30); a click filters the map to that locality. On phones they sit in the Explore tab, two by two. */}
      <div
        role="region"
        aria-label="Busiest localities"
        className={`${selected || selectedProblem ? 'hidden' : tab === 'explore' ? 'grid desk:grid' : 'hidden desk:grid'} grid-cols-2 gap-4 overflow-y-auto desk:absolute desk:right-6 desk:left-[calc(var(--map-left)+1.5rem)] desk:z-10 desk:mx-auto desk:max-w-[1280px] desk:grid-cols-4 ${chatMode ? 'desk:top-[calc(var(--section-header-h)+var(--answer-banner-h)+1.5rem)]' : 'desk:top-[calc(var(--section-header-h)+1.5rem)]'}`}
      >
        {error ? (
          <p className="col-span-full text-incident">{error}</p>
        ) : !data ? (
          <p className="col-span-full text-muted-foreground">Loading…</p>
        ) : topLocalities.length ? (
          topLocalities.map(([code, c]) => <StatCard key={code} label={localityName.get(code)} value={c.n} trend={trendOf(c.recent, c.before)} selected={filters.locality === String(code)} onClick={() => {
                const on = filters.locality !== String(code)
                setFilters({ ...filters, locality: on ? String(code) : '' })
                if (on) onZoomLocality(code) // fly to the locality, wherever the map is now
              }} />)
        ) : (
          <p className="col-span-full text-muted-foreground">No incidents in your scope.</p>
        )}
      </div>

      <div
        className={`${tab !== 'explore' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-3 desk:absolute desk:top-0 desk:bottom-0 desk:left-0 desk:flex desk:w-(--agent-w) desk:flex-none desk:border-r desk:border-secondary desk:bg-ai desk:p-0`}
      >
        {children}
      </div>
      {/* The incident detail (owner, 2026-10-30, test): its own panel on the map, to the right of the agent panel, like one more sidebar. On phones it stays in the bottom sheet. */}
      {selected ? (
        <IncidentDetail
          key={selected.id}
          incident={selected}
          localityName={localityName.get(selected.locality_code)}
          categoryName={data?.categories.find((c) => c.code === selected.category)?.name}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        selectedProblem && (
          <ProblemDetail
            key={selectedProblem.id}
            problem={selectedProblem}
            detail={problemDetail}
            localityName={localityName.get(selectedProblem.locality_code)}
            categoryName={data?.categories.find((c) => c.code === selectedProblem.category)?.name}
            onSelectIncident={select}
            onClose={() => selectProblem(null)}
          />
        )
      )}
      </div>
    </>
  )
}

function IncidentDetail({ incident, localityName, categoryName, onClose }: { incident: Incident; localityName: string | undefined; categoryName: string | undefined; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  useRestoreFocus(panel)
  return (
    <Card
      ref={panel}
      tabIndex={-1}
      role="region"
      aria-label="Incident details"
      className="max-h-[45%] shrink-0 overflow-auto bg-card/95 outline-none desk:absolute desk:top-0 desk:bottom-0 desk:left-[calc(var(--agent-w)+var(--panel-gap))] desk:z-20 desk:max-h-none desk:w-[360px] desk:rounded-none desk:border-y-0 desk:border-l-0 desk:border-r desk:border-secondary desk:bg-(--neutral-700)"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle asChild>
            <h2>{incident.title}</h2>
          </CardTitle>
          <p className="text-meta text-muted-foreground">
            {incident.reference} · {localityName}
          </p>
        </div>
        <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-body-sm">
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{label(incident.status)}</Badge>
          {incident.uncertainty_flags.map((f) => (
            <Badge key={f} variant="outline">
              {label(f)}
            </Badge>
          ))}
        </div>
        <MediaGallery incidentId={incident.id} />
        <p>{incident.description}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
          <dt>Location</dt>
          <dd className="text-foreground">{incident.location_description}</dd>
          <dt>Occurred</dt>
          <dd className="text-foreground">{new Date(incident.occurred_at).toLocaleString('en-GB')}</dd>
          <dt>Reported</dt>
          <dd className="text-foreground">{new Date(incident.reported_at).toLocaleString('en-GB')}</dd>
          <dt>Category</dt>
          <dd className="text-foreground">{categoryName ?? label(incident.category)}</dd>
          <dt>Vehicle</dt>
          <dd className="text-foreground">{label(incident.vehicle_type)}</dd>
          <dt>AI</dt>
          <dd className="text-foreground">
            {incident.ai_classification} ({Math.round((incident.ai_confidence ?? 0) * 100)}% confidence)
          </dd>
          <dt>Validation</dt>
          <dd className="text-foreground">{label(incident.validation_status)}</dd>
          {incident.outcome && (
            <>
              <dt>Outcome</dt>
              <dd className="text-foreground">{incident.outcome}</dd>
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
