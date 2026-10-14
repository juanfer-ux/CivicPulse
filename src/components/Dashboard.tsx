import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { IncidentMap } from '@/components/IncidentMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  GROUPS,
  STATUSES,
  SUBTYPES,
  fetchDashboardData,
  groupOf,
  label,
  type Incident,
  type Locality,
} from '@/lib/incidents'

const selectClass = 'h-8 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground'
const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 0, label: 'All time' },
]
const DAY = 86_400_000

type Data = { incidents: Incident[]; localities: Locality[] }

export function Dashboard() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const [locality, setLocality] = useState('')
  const [status, setStatus] = useState('')
  const [subtype, setSubtype] = useState('')
  const [days, setDays] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData().then(setData, (e: Error) => setError(e.message))
  }, [])

  const localityName = useMemo(() => new Map(data?.localities.map((l) => [l.code, l.name])), [data])

  const filtered = useMemo(
    () =>
      (data?.incidents ?? []).filter(
        (i) =>
          (!locality || i.locality_code === Number(locality)) &&
          (!status || i.status === status) &&
          (!subtype || i.obstruction_subtype === subtype) &&
          (!days || new Date(i.occurred_at).getTime() >= now - days * DAY),
      ),
    [data, locality, status, subtype, days, now],
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

  return (
    <>
      <IncidentMap incidents={filtered} selectedId={selected?.id ?? null} onSelect={setSelectedId} />

      <div className="absolute left-4 top-16 flex w-72 flex-col gap-3">
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
            <select aria-label="Status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
            <select aria-label="Obstruction type" className={selectClass} value={subtype} onChange={(e) => setSubtype(e.target.value)}>
              <option value="">All obstruction types</option>
              {SUBTYPES.map((s) => (
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
          <CardContent className="flex flex-col gap-3 text-sm">
            {error && <p className="text-incident">{error}</p>}
            {data && !error && (
              <>
                <ul className="flex flex-col gap-1">
                  {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
                    <li key={g} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: GROUPS[g].color }} aria-hidden />
                      <span className="flex-1 text-muted-foreground">{GROUPS[g].label}</span>
                      <span>{byGroup[g]}</span>
                    </li>
                  ))}
                </ul>
                {topLocalities.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Top localities</p>
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

      {selected && (
        <Card className="absolute right-4 top-32 w-96 bg-card/95">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>{selected.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {selected.reference} · {localityName.get(selected.locality_code)}
              </p>
            </div>
            <Button size="icon" variant="ghost" aria-label="Close" onClick={() => setSelectedId(null)}>
              <X />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{label(selected.status)}</Badge>
              {selected.is_synthetic && <Badge variant="outline">Synthetic</Badge>}
              {selected.uncertainty_flags.map((f) => (
                <Badge key={f} variant="outline">
                  {label(f)}
                </Badge>
              ))}
            </div>
            <p>{selected.description}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
              <dt>Location</dt>
              <dd className="text-foreground">{selected.location_description}</dd>
              <dt>Occurred</dt>
              <dd className="text-foreground">{new Date(selected.occurred_at).toLocaleString('en-GB')}</dd>
              <dt>Reported</dt>
              <dd className="text-foreground">{new Date(selected.reported_at).toLocaleString('en-GB')}</dd>
              <dt>Type</dt>
              <dd className="text-foreground">{label(selected.obstruction_subtype)}</dd>
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
    </>
  )
}
