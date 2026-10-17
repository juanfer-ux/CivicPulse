import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { label } from '@/lib/incidents'
import {
  decide,
  listAudit,
  listRecommendations,
  type AuditEvent,
  type Decision,
  type Recommendation,
} from '@/lib/recommendations'

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })

interface Props {
  /** Changes when a recommendation is proposed elsewhere, to reload the list. */
  reloadKey: number
  onPending: (n: number) => void
}

export function RecommendationsPanel({ reloadKey, onPending }: Props) {
  const { profile, session, can } = useAuth()
  const [data, setData] = useState<{
    recommendations: Recommendation[]
    decisions: Decision[]
    names: Map<string, string>
  } | null>(null)
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const next = await listRecommendations()
      setData(next)
      onPending(next.recommendations.filter((r) => r.status === 'proposed' || r.status === 'needs_second_approval').length)
      setAudit(await listAudit())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load recommendations')
    }
  }, [onPending])

  useEffect(() => {
    void load()
  }, [load, reloadKey])

  const who = (id: string | null) =>
    !id ? 'system' : id === session?.user.id ? 'You' : (data?.names.get(id) ?? 'another operator')

  return (
    <Card className="min-h-0 flex-1 gap-3 bg-card/95">
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
        <p className="text-xs text-muted-foreground">
          Prompts for human review. Approving or rejecting records your decision and who made it; nothing is dispatched.
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto text-sm">
        {error && <p className="text-incident">{error}</p>}
        {data && data.recommendations.length === 0 && (
          <p className="text-muted-foreground">
            None yet. Ask “Which area might deserve further investigation tomorrow evening?” and send the suggestion for review.
          </p>
        )}
        {data?.recommendations.map((r) => (
          <RecommendationCard
            key={r.id}
            rec={r}
            decisions={data.decisions.filter((d) => d.recommendation_id === r.id)}
            who={who}
            canDecide={
              (r.status === 'proposed' && can('decide_recommendation')) ||
              (r.status === 'needs_second_approval' && can('review_escalations'))
            }
            onDecided={load}
          />
        ))}
        {audit.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">
              Audit trail ({profile?.role === 'super_admin' ? 'all users' : 'your actions'})
            </summary>
            <ul className="mt-1 flex flex-col gap-1">
              {audit.map((a) => (
                <li key={a.id}>
                  {when(a.created_at)} · {who(a.actor)} · {label(a.action)}
                  {typeof a.details.title === 'string' ? `: ${a.details.title}` : ''}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

function RecommendationCard({
  rec,
  decisions,
  who,
  canDecide,
  onDecided,
}: {
  rec: Recommendation
  decisions: Decision[]
  who: (id: string | null) => string
  canDecide: boolean
  onDecided: () => Promise<void>
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ev = rec.evidence as { candidate?: Record<string, unknown>; incident_ids?: string[]; tool?: string }

  async function submit(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !note.trim()) {
      setError('Please explain the rejection.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await decide(rec.id, decision, note)
      await onDecided()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the decision')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{rec.title}</p>
        <Badge variant={rec.status === 'proposed' || rec.status === 'needs_second_approval' ? 'secondary' : 'outline'}>
          {label(rec.status)}
        </Badge>
      </div>
      <p>{rec.problem}</p>
      <p>
        <span className="text-muted-foreground">Proposed: </span>
        {rec.proposed_intervention}
      </p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Evidence and limitations</summary>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2">
          <dt>Category</dt>
          <dd className="text-foreground">{label(rec.category)}</dd>
          <dt>Tool</dt>
          <dd className="text-foreground">{ev.tool}</dd>
          <dt>Incidents</dt>
          <dd className="text-foreground">{ev.incident_ids?.length ?? 0} linked</dd>
          <dt>Period</dt>
          <dd className="text-foreground">
            {when(rec.period_start)} to {when(rec.period_end)}
          </dd>
        </dl>
        <ul className="mt-1 list-disc pl-4">
          {rec.limitations.split('\n').map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>
      <p className="text-xs text-muted-foreground">
        Proposed by {who(rec.created_by)} · {when(rec.created_at)}
      </p>
      {decisions.map((d) => (
        <p key={d.id} className="text-xs">
          {label(d.decision)} by {who(d.decided_by)} · {when(d.decided_at)}
          {d.explanation ? ` · “${d.explanation}”` : ''}
        </p>
      ))}
      {(rec.status === 'proposed' || rec.status === 'needs_second_approval') && canDecide && (
        <div className="flex flex-col gap-2">
          <textarea
            aria-label="Explanation"
            placeholder="Explanation (required to reject)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-card px-2 py-1 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => void submit('approved')}>
              Approve
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void submit('rejected')}>
              Reject
            </Button>
          </div>
          {error && <p className="text-xs text-incident">{error}</p>}
        </div>
      )}
      {(rec.status === 'proposed' || rec.status === 'needs_second_approval') && !canDecide && (
        <p className="text-xs text-muted-foreground">Your role cannot approve or reject this recommendation.</p>
      )}
    </div>
  )
}
