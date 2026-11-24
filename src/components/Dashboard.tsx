import { titleCase } from '@/lib/titleCase'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CaretDown, CaretUp, ChatCircleDots, SlidersHorizontal, Sparkle, X } from '@phosphor-icons/react'
import { ModuleDock } from '@/components/modules/ModuleDock'
import { useModules } from '@/components/modules/ModulesProvider'
import { pushOf } from '@/lib/modules'
import { IncidentMap } from '@/components/IncidentMap'
import { StatCard } from '@/components/ui/stat-card'
import { buckets } from '@/lib/sparkline'
import { trendOf, type Trend } from '@/lib/trend'

/** DEMO (owner, 2026-11-05, released): the four cards show the four trend statuses, one each (Above, About, Below usual, Low reporting), whatever the data says, so the design can be reviewed. The incident data is synthetic anyway. Delete this line and `DEMO_TRENDS[i] ??` below to show the real trends again. */
const DEMO_TRENDS: Trend[] = ['above', 'about', 'below', 'low']
import { MediaGallery } from '@/components/MediaGallery'
import { CaseHeader, HEADER, ProblemDetail } from '@/components/ProblemDetail'
import { ProblemTimelineCard } from '@/components/ProblemTimelineCard'
import { Badge } from '@/components/ui/badge'
import { MapTypeChips, NO_FILTERS, type Filters } from '@/components/FilterBar'
import { FiltersPanel, filterCount } from '@/components/FiltersPanel'
import { facetCounts, statusHides, type FacetRow } from '@/lib/facets'
import { PERIODS } from '@/components/FilterBar'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchDashboardData,
  groupOf,
  label,
  type Category,
  type Incident,
  type Locality,
} from '@/lib/incidents'
import type { Area } from '@/lib/agent'
import { PlacesCard } from '@/components/PlacesCard'
import { fetchRecurrencePlaces } from '@/lib/placesDb'
import type { Place } from '@/lib/places'
import { fetchLinkedIncidentIds, fetchProblemDetail, fetchProblems, type ProblemDetailData, type ProblemRow } from '@/lib/problems'
import { PROBLEM_STATUSES, type ProblemStatus } from '@/lib/statusColors'
import type { SidebarIncident, SidebarRecurrence, SidebarSelection } from '@/components/Sidebar'
import { useRestoreFocus } from '@/lib/useRestoreFocus'
import { useHeld } from '@/lib/useSlide'

const SIDEBAR_DELAY_MS = 1000 // how long the sidebar waits before collapsing or expanding when an incident or problem opens or closes

const DAY = 86_400_000

type Data = { incidents: Incident[]; localities: Locality[]; categories: Category[] }

export type Tab = 'explore' | 'ask'

interface Props {
  highlightIds: string[]
  placesFor?: string | null // the agent's "show places on map": the recurrence whose places are drawn
  /** Localities to outline for an answer about localities. */
  areas: Area[]
  spots: string[][]
  focusCode: number | null
  zoomTo: { code: number; n: number } | null
  /** Ask the map to fly to a locality (a Stat Card was clicked). */
  onZoomLocality: (code: number) => void
  onClearHighlight: () => void
  /** Active panel on mobile (on desktop everything is visible). */
  tab: Tab
  onTab: (tab: Tab) => void
  focus?: { kind: 'recurrence' | 'incident'; id: string; n: number } | null // the sidebar asked for a row: the map flies to it and its panel opens, as after a click on the map (owner, 2026-11-06)
  onSelection?: (s: SidebarSelection | null) => void // what is open on the map, so the sidebar highlights its row
  onRows?: (rows: { recurrences: SidebarRecurrence[]; incidents: SidebarIncident[] }) => void // the real rows for the sidebar lists
  agentOff: boolean // the agent panel is collapsed to a 44 px rail
  onAgentOff: (off: boolean) => void
  onInspect: (open: boolean) => void // an incident is open: App makes room for its panel and collapses the sidebar
  children?: ReactNode
}

/** The Filters panel's way of opening (owner's test, 2026-11-14): true pushes the map and everything on it to the left like the menu sidebar does, false lays the panel over the map with a scrim. */
const FILTERS_PUSH = true
const FILTERS_W = 420

export function Dashboard({ placesFor: askedPlaces = null, highlightIds, areas, spots, focusCode, zoomTo, onZoomLocality, onClearHighlight, tab, onTab, onInspect, agentOff, onAgentOff, focus, onRows, onSelection, children }: Props) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('filters-open', { detail: filtersOpen })) // the sidebar steps aside while the filters are open on a narrow viewport (owner, 2026-11-17)
  }, [filtersOpen])
  useEffect(() => {
    if (!filtersOpen) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setFiltersOpen(false)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [filtersOpen])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false) // mobile bottom sheet only
  // Recurrences (decision 0030). If the database does not have the layer yet, the list stays empty and the map shows incidents exactly as before.
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
  const typeProblems = hasProblems && !chatMode && (!filters.types.length || filters.types.includes('problems'))
  const typeIncidents = !hasProblems || chatMode || !filters.types.length || filters.types.includes('incidents')
  const showProblems = typeProblems && !statusHides(filters, true) // a status chosen for the other kind only (owner, 2026-11-16) hides this kind
  const showIncidents = typeIncidents && !statusHides(filters, false)
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
    const counts = new Map<number, { n: number; recent: number; before: number; times: number[] }>()
    for (const i of all) {
      const c = counts.get(i.locality_code) ?? { n: 0, recent: 0, before: 0, times: [] }
      const age = (end - Date.parse(i.occurred_at)) / DAY
      c.n++
      c.times.push(Date.parse(i.occurred_at))
      if (age < 30) c.recent++
      else if (age < 60) c.before++
      counts.set(i.locality_code, c)
    }
    return [...counts].sort((a, b) => b[1].n - a[1].n).slice(0, 6).map(([code, c]) => [code, { ...c, series: buckets(c.times, end) }] as const)
  }, [data])

  // Recurrences view: the same filters, applied to problems. Days means "reported in that window"; a problem has no incident status, it has its own.
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

  // What each option of the Filters panel would leave on the map with every other filter kept (owner, 2026-11-15): an option that would leave nothing is switched off.
  const facets = useMemo(() => {
    const rows: FacetRow[] = []
    if (typeIncidents) for (const i of data?.incidents ?? []) if ((!answerIds || answerIds.has(i.id)) && (chatMode || !linked.has(i.id))) rows.push({ problem: false, locality: i.locality_code, category: i.category, at: Date.parse(i.occurred_at), group: groupOf(i.status) })
    if (typeProblems) for (const p of problems) rows.push({ problem: true, locality: p.locality_code, category: p.category, at: p.last_seen ? Date.parse(p.last_seen) : null, status: p.status })
    return facetCounts(rows, filters, now, (data?.localities ?? []).map((l) => l.code), (data?.categories ?? []).map((c) => c.code), PERIODS.map((p) => p.days))
  }, [data, answerIds, chatMode, linked, problems, typeIncidents, typeProblems, filters, now])

  const selectedProblem = showProblems ? (problemsFiltered.find((p) => p.id === selectedProblemId) ?? null) : null
  const problemDetail = detail && detail.id === selectedProblemId ? detail.data : null
  // Experiment (`?places=1`, owner, 2026-11-20): the stored OpenStreetMap places around the open recurrence, as marks on the map and a small card.
  const [places, setPlaces] = useState<{ id: string; list: Place[] | 'error' } | null>(null)
  const placesOn = new URLSearchParams(location.search).get('places') === '1'
  const placesFor = selectedProblem && (placesOn || askedPlaces === selectedProblem.id) ? selectedProblem : null // the flag shows them on every recurrence; the agent's button, only on the one it answered about
  useEffect(() => {
    if (!placesFor) return
    let live = true
    fetchRecurrencePlaces(placesFor.id).then(
      (list) => live && setPlaces({ id: placesFor.id, list }),
      () => live && setPlaces({ id: placesFor.id, list: 'error' }),
    )
    return () => { live = false }
  }, [placesFor])
  const placeList = placesFor && places?.id === placesFor.id && places.list !== 'error' ? places.list : undefined
  // The modules' right column (decision 0049, behind /?modules=1) pushes the map content: --dock-w feeds .map-col.
  const modules = useModules()
  const recurrenceOpen = !!selectedProblem && !selectedId // an open incident hides the recurrence panel
  const caseOpen = !!selectedProblem || !!selectedId // modules exist only while a case is open: with none open they push nothing (owner, 2026-11-20: the stat cards stayed squeezed to the right, leaving an empty strip)
  const dockW = modules.on && caseOpen ? pushOf(modules.placed, 'right', modules.follow, selectedProblem?.id ?? null, recurrenceOpen) : 0
  const dockL = modules.on && caseOpen ? pushOf(modules.placed, 'left', modules.follow, selectedProblem?.id ?? null, recurrenceOpen) : 0
  const filtersPush = FILTERS_PUSH && filtersOpen ? FILTERS_W : 0 // the panel, flush with the window's right edge (no page padding around it since 2026-11-15)
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
  // The problem panel waits until the camera has finished flying to the problem, then slides in from under the agent panel (owner, 2026-11-01). The sidebar collapses at the same moment; for an incident, or when closing, it still changes SIDEBAR_DELAY_MS after the camera starts, so the map does not change width in the first frames of the flight.
  const [shownProblemId, setShownProblemId] = useState<string | null>(null)
  const selectedProblemIdNow = useRef<string | null>(null)
  useEffect(() => {
    selectedProblemIdNow.current = selectedProblemId
  }, [selectedProblemId])
  const onFlightEnd = useCallback(() => setShownProblemId(selectedProblemIdNow.current), [])
  const panelProblem = selectedProblem && selectedProblem.id === shownProblemId ? selectedProblem : null
  const open = !!selected || !!panelProblem
  // The open side panel (incident or problem) stays on screen while it slides back under the agent panel after it closes (owner, 2026-11-01).
  const current = useMemo(() => (selected ? { kind: 'incident' as const, incident: selected } : panelProblem ? { kind: 'problem' as const, problem: panelProblem, detail: problemDetail } : null), [selected, panelProblem, problemDetail])
  const shown = useHeld(current, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350)
  useEffect(() => {
    const t = setTimeout(() => onInspect(open), open && !selected ? 0 : SIDEBAR_DELAY_MS)
    return () => clearTimeout(t)
  }, [open, selected, onInspect])
  // A recurrence is open (owner, 2026-11-09): a click on one of its incidents (a dot, a row of the history, a point of the timeline) opens that report inside the history, it does not leave for the Incident Panel; a second click or Escape closes it before the recurrence.
  const [openReportId, setOpenReportId] = useState<string | null>(null)
  const select = (id: string | null) => {
    if (selectedProblemId && !selectedId && (!id ? openReportId : problemIncidentIds.includes(id))) {
      setOpenReportId((cur) => (!id || cur === id ? null : id))
      return
    }
    if (!id && !selectedId && selectedProblemId) {
      setSelectedProblemId(null) // a click on empty map (or Escape) closes the incident first, then the problem
      setShownProblemId(null)
    }
    if (id && id === selectedId) return // a second click on the open incident does nothing (owner, 2026-11-01)
    setSelectedId(id)
    if (id) setCollapsed(false)
  }
  const selectProblem = (id: string | null) => {
    if (id && id === selectedProblemId) {
      setSelectedId(null) // a second click on the open problem does nothing, except to come back to it from one of its incidents (its panel is still there)
      return
    }
    setOpenReportId(null)
    setSelectedProblemId(id)
    setShownProblemId(null) // the panel waits for the camera again
    setSelectedId(null)
    if (id) setCollapsed(false)
  }
  useEffect(() => {
    onRows?.({
      recurrences: [...problems].sort((a, b) => (b.last_seen ?? '').localeCompare(a.last_seen ?? '')).map((p) => ({ id: p.id, title: titleCase(p.title), category: data?.categories.find((c) => c.code === p.category)?.name ?? label(p.category), status: p.status, reference: p.reference, locality: localityName.get(p.locality_code), created: Date.parse(p.first_seen ?? '') || 0, updated: Date.parse(p.last_seen ?? '') || 0 })),
      incidents: (data?.incidents ?? []).map((i) => ({ id: i.id, title: i.title, reference: i.reference, locality: localityName.get(i.locality_code), group: groupOf(i.status), created: Date.parse(i.reported_at) || 0, updated: Date.parse(i.reported_at) || 0 })) // the data has no update time for incidents yet: reported_at stands for both,
    })
  }, [problems, data, onRows, localityName])
  useEffect(() => {
    onSelection?.(selectedId ? { kind: 'incident', id: selectedId } : selectedProblemId ? { kind: 'recurrence', id: selectedProblemId } : null)
  }, [selectedId, selectedProblemId, onSelection])
  // A row of the sidebar was clicked: clear what hides it (filters, an agent answer) and open it like a click on the map. Only a new request (n) does this.
  useEffect(() => {
    if (!focus) return
    setFilters(NO_FILTERS)
    onClearHighlight()
    if (focus.kind === 'recurrence') selectProblem(focus.id)
    else select(focus.id)
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps -- reacts to a new request only
  const pick = (t: Tab) => {
    onTab(t)
    setCollapsed(false)
  }

  const item = shown.value
  const mapBase = 'calc(var(--agent-w) + var(--panel-gap))'
  // Both detail panels float over the map (owner, 2026-11-05), so the map and the controls over it never move for them.
  const statCards = (
    <>
      {error ? (
        <p className="col-span-full text-incident">{error}</p>
      ) : !data ? (
        <p className="col-span-full text-muted-foreground">Loading…</p>
      ) : topLocalities.length ? (
        topLocalities.map(([code, c], i) => <StatCard key={code} series={c.series} label={localityName.get(code)} value={c.n} trend={DEMO_TRENDS[i] ?? trendOf(c.recent, c.before)} selected={filters.locality === String(code)} onClick={() => {
              const on = filters.locality !== String(code)
              setFilters({ ...filters, locality: on ? String(code) : '' })
              if (on) onZoomLocality(code) // fly to the locality, wherever the map is now
            }} />)
      ) : (
        <p className="col-span-full text-muted-foreground">No incidents in your scope.</p>
      )}
    </>
  )

  return (
    <div className="contents map-col" data-history={item?.kind === 'problem' && !shown.leaving && HEADER !== '3' ? '' : undefined} data-rp={item?.kind === 'problem' && !shown.leaving && HEADER === '3' ? '' : undefined} style={{ '--map-base': mapBase, '--map-left': mapBase, '--dock-w': `${dockW + filtersPush}px`, '--filters-push': `${filtersPush}px`, '--dock-l': `${dockL}px`, '--banner-offset': chatMode ? 'calc(var(--answer-banner-h) + var(--page-pad))' : '0px' } as CSSProperties}>
      <h1 className="sr-only">Civic Pulse incident map and investigations</h1>
      <IncidentMap
        incidents={mapIncidents}
        problems={showProblems ? problemsFiltered : undefined}
        problemIncidentIds={problemIncidentIds}
        places={placeList}
        problemOfIncident={linked}
        selectedProblemId={selectedProblem?.id ?? null}
        openReportId={openReportId}
        dotStatusById={dotStatusById}
        onSelectProblem={selectProblem}
        onFlightEnd={onFlightEnd}
        selectedId={selected?.id ?? null}
        highlightIds={highlightIds}
        areas={areas}
        spots={spots}
        focusCode={focusCode}
        zoomTo={zoomTo}
        onSelect={select}
      />

      {placesFor && placesOn && <PlacesCard key={placesFor.id} places={places?.id === placesFor.id ? places.list : 'loading'} />}

      {/* Conversation mode banner (Figma Answer Banner): while an answer is on the map, filters narrow it; the button ends the mode. The banner sits under the filters row (owner, 2026-11-15; it was above the stat cards, then between them and the filters row); while an incident or recurrence is open the stat cards and filters are hidden, so it goes back to the top and the panel sits below it (`--banner-offset`, owner, 2026-11-07). */}
      {chatMode && (
        <div data-float className={`fixed inset-x-0 top-[53px] ${!selected && !selectedProblem ? 'md:max-desk:top-[221px]' : ''} z-10 flex h-(--answer-banner-h) items-center gap-1 bg-(--indigo-800) px-2 text-meta text-(--indigo-100) justify-center desk:absolute ${selected || selectedProblem ? 'desk:top-(--map-pad)' : 'desk:top-[calc(var(--section-header-h)+var(--stat-row-h)+var(--map-pad)+16px+var(--control-default)+16px)]'} desk:right-(--col-right) desk:left-(--col-left) desk:inset-x-auto desk:rounded-sm`}>
          <span className="grid size-9 shrink-0 place-items-center"><ChatCircleDots weight="fill" className="size-5 text-(--indigo-200)" aria-hidden /></span>
          <span>While showing the agent's answer on the map, filters will narrow it down.</span>
          <Button size="sm" variant="outline" className="ml-7 border-[0.5px] border-(--neutral-400) bg-(--neutral-900) px-3" onClick={onClearHighlight}> {/* Figma (owner, 2026-11-17): outline, small (32 px), `neutral-900` fill, a 0.5 px `neutral-400` line, 12 px at the sides */}
            Clear agent results
          </Button>
        </div>
      )}

      {/* Bottom left (owner, 2026-10-30): the Problems and Incidents toggles with their counts, merged with the old "Showing N" legend. Without the problems layer there is one plain count, as before. */}
      {data && (
        <div data-float className="absolute bottom-[4.5rem] left-3 z-10 flex items-center gap-2 desk:bottom-(--map-pad) desk:left-(--col-left) desk:transition-[left] desk:duration-300 desk:right-(--col-right) desk:pointer-events-none desk:[&>*]:pointer-events-auto">
          {!hasProblems && (
            <p className="pointer-events-none rounded-sm border bg-card/95 px-3 py-1 text-meta text-(--neutral-200)">
              Showing {filtered.length} {filtered.length === 1 ? 'incident' : 'incidents'}
            </p>
          )}
        </div>
      )}

      {/* Recurrences and Incidents chips (owner, 2026-11-14): at the top left of the same row as the Filters button, where they were at the bottom left. */}
      {hasProblems && !selected && !selectedProblem && (
        <div data-float className={`fixed left-3 ${chatMode ? 'top-[calc(53px+var(--answer-banner-h))]' : 'top-[53px]'} ${!selected && !selectedProblem ? (chatMode ? 'md:max-desk:top-[calc(221px+var(--answer-banner-h))]' : 'md:max-desk:top-[221px]') : ''} z-10 flex items-center gap-2 desk:absolute desk:inset-x-auto ${chatMode ? 'desk:top-[calc(var(--section-header-h)+var(--stat-row-h)+var(--map-pad)+16px)]' : 'desk:top-[calc(var(--section-header-h)+var(--stat-row-h)+var(--map-pad)+16px)]'} desk:left-(--col-left) desk:transition-[left] desk:duration-300`}>
          <MapTypeChips filters={filters} onChange={setFilters} problemCount={problemsFiltered.length} incidentCount={filtered.length} />
        </div>
      )}

      {/* The Filters button (owner, 2026-11-14): it replaces the chip bar and sits at the right of the same row; it opens the Filters side panel. Hidden while an incident is open, like the bar was. */}
      {!selected && !selectedProblem && data && (
        <div data-float className={`fixed right-3 ${chatMode ? 'top-[calc(53px+var(--answer-banner-h))]' : 'top-[53px]'} ${!selected && !selectedProblem ? (chatMode ? 'md:max-desk:top-[calc(221px+var(--answer-banner-h))]' : 'md:max-desk:top-[221px]') : ''} z-10 flex items-center gap-2 desk:absolute desk:inset-x-auto ${chatMode ? 'desk:top-[calc(var(--section-header-h)+var(--stat-row-h)+var(--map-pad)+16px)]' : 'desk:top-[calc(var(--section-header-h)+var(--stat-row-h)+var(--map-pad)+16px)]'} desk:right-(--col-right)`}>
          {filterCount(filters) > 0 && ( // the Recurrences / Incidents toggles are not filters: switching them never shows Clear filters (owner, 2026-11-15)
            <Chip icon={<X aria-hidden />} onClick={() => setFilters({ ...NO_FILTERS, types: filters.types })}>
              Clear filters
            </Chip>
          )}
          <Chip className="border-(--neutral-500)" icon={<SlidersHorizontal aria-hidden />} count={filterCount(filters) || undefined} pressed={filterCount(filters) > 0} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
            Filters
          </Chip>
        </div>
      )}

      {/* The Filters side panel (owner, 2026-11-14): from the right like Create user. FILTERS_PUSH (the owner's test) makes it a column that pushes the map and what floats on it to the left, like the menu sidebar; otherwise it lies over the map with a scrim. Escape or Close shut it. */}
      {data && (
        <>
          {!FILTERS_PUSH && <div className={`absolute inset-0 z-40 bg-black/30 transition-opacity duration-300 ${filtersOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setFiltersOpen(false)} aria-hidden />}
          <div className={`absolute inset-y-0 right-0 ${FILTERS_PUSH ? 'z-30' : 'z-40 shadow-lg'} overflow-hidden transition-transform duration-300 ease-out ${filtersOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!filtersOpen} inert={!filtersOpen}>
            <FiltersPanel filters={filters} onChange={setFilters} onClose={() => setFiltersOpen(false)} results={(showProblems ? problemsFiltered.length : 0) + (showIncidents ? filtered.length : 0)} localities={data.localities} categories={data.categories} facets={facets} counts={byGroup} problemCounts={hasProblems ? byProblemStatus : undefined} />
          </div>
        </>
      )}

      {/* Tablet (768 to 1,439 px, owner 2026-11-15): the stat cards float over the map in one row, above the filters row and the chips, like desktop. They cannot live in the bottom sheet below (its backdrop blur makes `fixed` relative to the sheet), so this is a second copy of the cards, shown on tablet only; the sheet's own copy is hidden there. */}
      <div role="region" data-float aria-label="Busiest localities" className={`${selected || selectedProblem ? 'hidden' : 'hidden md:max-desk:grid'} fixed inset-x-3 top-[53px] z-10 grid-cols-4 gap-2 [&>:nth-child(n+5)]:hidden`}>
        {statCards}
      </div>

      {/* Mobile: bottom sheet over the map. Desktop (1440 px and wider): `contents`, so the two columns float over the map. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-10 flex flex-col gap-2 rounded-t-2xl border-t bg-sidebar/95 p-2 backdrop-blur desk:contents ${collapsed ? 'max-desk:[&>:not(:first-child)]:hidden' : 'h-[62svh] md:max-desk:h-[50svh]'}`}
      >
        <div className="flex shrink-0 items-center gap-1 md:max-desk:justify-between desk:hidden">
          <span className="hidden px-2 text-label text-(--neutral-200) md:max-desk:block">Explore</span> {/* tablet: the panel's own title row is hidden, so its title sits here, on the row of the collapse button (owner, 2026-11-15) */} {/* tablet (owner, 2026-11-15): no tabs, only the collapse button; the sheet always shows the agent (Explore) panel, 50 % of the screen high */}
          {(
            [
              ['explore', 'Explore'],
              ['ask', 'Investigate'],
            ] as const
          ).map(([t, text]) => (
            <Button key={t} size="sm" className="flex-1 md:max-desk:hidden" variant={tab === t && !collapsed ? 'secondary' : 'ghost'} onClick={() => pick(t)}>
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
        data-float
        aria-label="Busiest localities"
        className={`${selected || selectedProblem ? 'hidden' : tab === 'explore' ? 'grid md:max-desk:hidden desk:grid' : 'hidden desk:grid'} grid-cols-2 gap-2 overflow-y-auto desk:overflow-visible desk:gap-4 desk:absolute desk:right-(--col-right) desk:left-(--col-left) desk:z-10 min-[1601px]:grid-cols-4 min-[2601px]:grid-cols-6 max-[2600px]:[&>:nth-child(n+5)]:hidden desk:top-[calc(var(--section-header-h)+var(--map-pad))]`}
      >
        {statCards}
      </div>

      <div
        className={`${tab !== 'explore' ? 'flex' : 'hidden md:max-desk:flex'} desk:transition-[width] desk:duration-300 min-h-0 flex-1 flex-col desk:pointer-events-none desk:absolute desk:top-0 desk:bottom-0 desk:left-0 desk:z-30 desk:flex desk:w-(--agent-w) desk:flex-none desk:pl-(--sidebar-gap)`}
      >
        {/* Outer container: no padding outside the panel any more (owner, 2026-11-15; it had the 12 px float padding since 2026-11-06): the sidebar and the agent panel touch the window's top, bottom and left edges. */}
        <div data-float data-agent-panel className="relative flex min-h-0 flex-1 flex-col gap-3 desk:pointer-events-auto desk:backdrop-blur-[32px] desk:border-r-[0.5px] desk:border-r-(--neutral-500) desk:bg-(--neutral-900) desk:p-0">
          {agentOff ? (
            <button type="button" aria-label="Open agent" title="Open agent" onClick={() => onAgentOff(false)} className="hidden h-full w-full flex-col items-center gap-3 py-4 text-(--neutral-200) hover:text-(--neutral-100) desk:flex">
              <Sparkle className="size-4" />
              <span className="text-caption [writing-mode:vertical-rl]">Ask the agent</span>
            </button>
          ) : null /* the collapse button is in the agent panel's title row (InvestigatePanel) */}
          <div className={agentOff ? 'contents desk:hidden' : 'contents'}>{children}</div>
        </div>
      </div>
      {/* The incident detail (owner, 2026-10-30, test): its own panel on the map, to the right of the agent panel, like one more sidebar. On phones it stays in the bottom sheet. */}
      {item?.kind === 'incident' ? (
        <IncidentDetail
          key={item.incident.id}
          incident={item.incident}
          localityName={localityName.get(item.incident.locality_code)}
          categoryName={data?.categories.find((c) => c.code === item.incident.category)?.name}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        item && (
          <>
            <ProblemDetail
              key={item.problem.id}
              problem={item.problem}
              localityName={localityName.get(item.problem.locality_code)}
              categoryName={data?.categories.find((c) => c.code === item.problem.category)?.name}
              onClose={() => selectProblem(null)}
            />
            {!shown.leaving && <ProblemTimelineCard key={`h-${item.problem.id}`} problem={item.problem} detail={item.detail} onSelectIncident={select} openReportId={openReportId} />}
          </>
        )
      )}
      </div>
      <ModuleDock problems={problems} openProblemId={item?.kind === 'incident' ? item.incident.id : selectedProblem?.id ?? null} openIncident={item?.kind === 'incident' ? item.incident : null} openDetail={problemDetail} openKind={item?.kind === 'incident' ? 'incident' : selectedProblem ? 'recurrence' : null} />
    </div>
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
      data-float
      aria-label="Incident details"
      className="max-h-[45%] shrink-0 gap-0 overflow-auto bg-card/95 py-0 outline-none desk:absolute desk:top-[calc(var(--map-pad)+var(--banner-offset,0px))] desk:left-(--col-left) desk:z-20 desk:max-h-[calc(100%-var(--map-pad)-var(--map-pad)-var(--banner-offset,0px))] desk:w-[360px] desk:border desk:border-(--neutral-900) desk:bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)]"
    >
      <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose} className="absolute top-5 right-5 z-10">
        <X />
      </Button>
      <CaseHeader title={incident.title} category={categoryName ?? label(incident.category)} reference={incident.reference} locality={localityName} pill={<Badge variant="secondary">{label(incident.status)}</Badge>} kind="incident" />
      <CardContent className="flex flex-col gap-3 pt-4 text-body-sm">
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
