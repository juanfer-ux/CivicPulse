import { useEffect, useState } from 'react'
import { ProblemTimeline } from '@/components/ProblemTimeline'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchProblemDetail, type ProblemDetailData, type ProblemRow } from '@/lib/problems'

/** One fetch per recurrence however many modules show it (the detail is five queries). */
const cache = new Map<string, ProblemDetailData>()

/** The Recurrence timeline module: the same chart as the history card, for any recurrence (the open one reuses the detail the panel already loaded, passed in `openDetail`). The zone gives it a box; the chart scrolls inside when the box is short. */
export default function TimelineModule({ problem, openDetail }: { problem: ProblemRow; openDetail: ProblemDetailData | null }) {
  const [loaded, setLoaded] = useState<{ id: string; detail: ProblemDetailData } | null>(null)
  const have = openDetail ?? cache.get(problem.id) // `openDetail` is passed only when this recurrence is the open one
  useEffect(() => {
    if (have) return
    let stale = false
    fetchProblemDetail(problem.id).then((d) => {
      if (stale) return
      cache.set(problem.id, d)
      setLoaded({ id: problem.id, detail: d })
    })
    return () => {
      stale = true
    }
  }, [problem.id, have])
  const detail = have ?? (loaded?.id === problem.id ? loaded.detail : null)
  if (!detail) return <p className="text-meta text-muted-foreground">Loading…</p>
  return (
    <ScrollArea className="h-full">
      <ProblemTimeline detail={detail} status={problem.status} onSelectIncident={() => {}} />
    </ScrollArea>
  )
}
