import { useMemo, useState } from 'react'
import { IncidentMap } from '@/components/IncidentMap'
import { Button } from '@/components/ui/button'
import type { Incident, IncidentStatus } from '@/lib/incidents'
import type { ProblemRow } from '@/lib/problems'
import type { ProblemStatus } from '@/lib/statusColors'

/**
 * Open /#glow-map (no sign-in): the real map component with made-up recurrences and incidents, to see the glow the owner picked in /#glow (2026-11-07):
 * an inner glow on every recurrence ring (lowered on 2026-11-07), and a strong glow only on the selected incident dot. The recurrence marker has no glow of its own.
 * Click a marker or a dot; the button switches the glows off to compare. Nothing here is real data.
 */

const rand = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

const STATUSES: ProblemStatus[] = ['active', 'active', 'active', 'monitoring', 'monitoring', 'resolved', 'resolved', 'archived']
const INCIDENT_STATUSES: IncidentStatus[] = ['received', 'under_review', 'validated', 'rejected', 'intervention_approved']

function makeData() {
  const r = rand(7)
  const at = () => [-74.09 + (r() - 0.5) * 0.12, 4.65 + (r() - 0.5) * 0.09] as const
  const problems: ProblemRow[] = STATUSES.map((status, i) => {
    const [lng, lat] = at()
    return {
      id: `p${i}`, reference: `PR-0${i + 10}`, title: `Recurrence ${i + 1}`, category: i % 2 ? 'illegal_dumping' : 'parking', locality_code: 1, lat, lng, location_description: 'Made-up location', status,
      occurrences_n: 2 + Math.floor(r() * 5), recurrences_n: 1, reports_n: 6, interventions_n: 1, uncertain_n: 0, first_seen: null, last_seen: null, quiet: false,
    }
  })
  const incidents: Incident[] = Array.from({ length: 34 }, (_, i) => {
    const [lng, lat] = at()
    return {
      id: `i${i}`, reference: `CP-0${i + 100}`, title: `Incident ${i + 1}`, description: 'Made up', locality_code: 1, lat, lng, location_description: 'Made-up location', occurred_at: '2026-10-01T10:00:00Z', reported_at: '2026-10-01T11:00:00Z',
      vehicle_type: 'car', category: i % 3 ? 'parking' : 'illegal_dumping', obstruction_subtype: null, subtype: null, ai_classification: null, ai_confidence: null, uncertainty_flags: [], validation_status: 'validated',
      status: INCIDENT_STATUSES[i % INCIDENT_STATUSES.length], outcome: null, is_synthetic: true,
    }
  })
  return { problems, incidents }
}

export function GlowMapPreview() {
  const { problems, incidents } = useMemo(makeData, [])
  const [glow, setGlow] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const selected = selectedId ? `incident ${selectedId}` : selectedProblemId ? `recurrence ${selectedProblemId}` : 'nothing'
  return (
    <div className="fixed inset-0 bg-background">
      <IncidentMap
        incidents={incidents}
        selectedId={selectedId}
        highlightIds={[]}
        areas={[]}
        onSelect={(id) => (setSelectedId(id), id && setSelectedProblemId(null))}
        problems={problems}
        selectedProblemId={selectedProblemId}
        onSelectProblem={(id) => (setSelectedProblemId(id), setSelectedId(null))}
        glow={glow}
      />
      <div className="absolute top-3 left-3 z-10 flex w-[300px] flex-col gap-2 rounded-lg bg-(--neutral-700) p-3">
        <p className="text-label">Glow on the map</p>
        <p className="text-meta text-muted-foreground">The real map with made-up data. Zoom in. Every recurrence ring has the inner glow; click an incident dot to see its strong glow. The recurrence marker does not glow.</p>
        <p className="text-meta">Selected: {selected}</p>
        <Button size="sm" variant="secondary" onClick={() => setGlow((g) => !g)}>
          {glow ? 'Glow on: switch off' : 'Glow off: switch on'}
        </Button>
      </div>
    </div>
  )
}
