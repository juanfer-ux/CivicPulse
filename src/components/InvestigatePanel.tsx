import { Suspense, lazy, useEffect, useRef, useState, type FormEvent } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLineLeft, ArrowUp, ThumbsDown, ThumbsUp } from '@phosphor-icons/react'
import { AgentHome } from '@/components/AgentHome'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ModuleOffer } from '@/components/modules/ModuleOffer'
import { answer, type Answer, type Area } from '@/lib/agent'
import { fetchLocalities } from '@/lib/incidents'

// The charts (Recharts) are their own file, fetched right after the app loads so the first answer already has them; nothing is drawn while they load, never the plain bars.
const loadChart = () => import('@/components/AnswerCharts')
const AnswerChart = lazy(loadChart)

export type Turn = { question: string; result?: Answer; error?: string }

/** `turns` are this conversation's questions and answers; the app keeps one list per conversation (the sidebar's Investigations). `onTurns` edits the conversation with this id, even if the person has switched to another one meanwhile. */
export function InvestigatePanel({ chatId, turns, onTurns, onHighlight, highlightIds, onFocusArea, onZoomArea, recurrenceId = null, onOpenRecurrence, onCollapse }: { onCollapse?: () => void; recurrenceId?: string | null; onOpenRecurrence?: (id: string) => void; chatId: number; turns: Turn[]; onTurns: (id: number, edit: (t: Turn[]) => Turn[]) => void; onHighlight: (ids: string[], areas?: Area[], spots?: string[][]) => void; highlightIds: string[]; onFocusArea: (code: number | null) => void; onZoomArea: (code: number) => void }) {
  const setTurns = (edit: (t: Turn[]) => Turn[]) => onTurns(chatId, edit)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => void loadChart(), [])

  useEffect(() => {
    if (turns.length) end.current?.scrollIntoView({ block: 'end' }) // not on the landing, which opens at its top
  }, [turns])

  async function ask(question: string) {
    const q = question.trim()
    if (!q || busy) return
    setBusy(true)
    setTurns((t) => [...t, { question: q }])
    let turn: Turn
    try {
      const result = await answer(q, await fetchLocalities(), { recurrenceId })
      onHighlight(result.highlightIds, result.areas, result.spots)
      turn = { question: q, result }
    } catch (e) {
      turn = { question: q, error: e instanceof Error ? e.message : 'Something went wrong' }
    }
    setTurns((t) => [...t.slice(0, -1), turn])
    setBusy(false)
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void ask(text)
    setText('')
  }

  return (
    <Card className="min-h-0 flex-1 gap-3 overflow-visible bg-ai desk:gap-0 max-desk:gradient-border desk:rounded-none desk:border-0 desk:bg-transparent desk:[--card-spacing:0px]">
      {/* The title row (owner's Figma, 2026-11-12): 60 px (8 px above and below the 44 px collapse button), 16 px at the sides, "Explore" in `label` / neutral-200, a `neutral-500` line under it, the collapse button (a 32 px ghost icon button) at its right. */}
      <div className="flex items-center desk:h-(--agent-header-h) desk:shrink-0 desk:border-b desk:border-(--neutral-500) desk:px-4">
        <CardHeader className="flex w-full flex-row items-center justify-between max-desk:mx-auto max-desk:max-w-[664px]">
          <CardTitle asChild className="text-label text-(--neutral-200)">
            <h2>Explore</h2>
          </CardTitle>
          {onCollapse && (
            <Button size="icon" variant="ghost" aria-label="Collapse agent" title="Collapse agent" onClick={onCollapse} className="hidden size-8 desk:inline-flex">
              <ArrowLineLeft weight="bold" className="size-4 text-(--neutral-100)" />
            </Button>
          )}
        </CardHeader>
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 desk:gap-0 desk:p-0">
        {/* The scrollbar sits on the panel's own edge (owner, 2026-11-05): the scroll area is full width and the centered column is inside it. */}
        <ScrollArea className="min-h-0 flex-1" viewportClassName="[&>div]:!block">
        <div className="flex w-full flex-col gap-3 text-body-sm max-desk:mx-auto max-desk:max-w-[664px] desk:mx-auto desk:max-w-[816px] desk:gap-8 desk:px-12 desk:py-8">
          {turns.length === 0 && <AgentHome ask={(q) => void ask(q)} />}
          {turns.map((t, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Question text={t.question} />
              {!t.result && !t.error && <p className="text-muted-foreground">Querying…</p>}
              {t.error && <p className="text-incident">{t.error}</p>}
              {t.result && <AnswerView result={t.result} shown={t.result.highlightIds === highlightIds} onFocusArea={onFocusArea} onZoomArea={onZoomArea} onPickRecurrence={onOpenRecurrence} onToggle={(on) => onHighlight(on ? t.result!.highlightIds : [], on ? t.result!.areas : [], on ? t.result!.spots : [])} />}
            </div>
          ))}
          <div ref={end} />
        </div>
        </ScrollArea>
        <form onSubmit={onSubmit} className={`flex w-full max-w-[664px] items-center gap-2 max-desk:mx-auto desk:mx-auto desk:shrink-0 desk:px-12 desk:py-6 ${turns.length === 0 ? 'desk:max-w-[816px]' : 'desk:max-w-[760px]'}`}>
          <Input name="q" value={text} onChange={(e) => setText(e.target.value)} placeholder="What would you like to investigate?" aria-label="Investigate and Ask" autoComplete="off" />
          <Button type="submit" size="icon" aria-label="Ask" className="bg-(--brand-primary) hover:bg-(--brand-primary)/90" disabled={busy || !text.trim()}>
            <ArrowUp aria-hidden />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/** The person's question (Figma Message, role user). */
export function Question({ text }: { text: string }) {
  return <p className="self-end rounded-lg bg-(--neutral-600) px-3 py-2">{text}</p>
}

/** Thumbs under an answer (Figma Message, role assistant). For now they only mark the choice on screen. */
function Feedback() {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const pick = (v: 'up' | 'down') => setVote((cur) => (cur === v ? null : v))
  return (
    <div className="flex">
      <Button size="icon" variant="ghost" className="size-5 max-desk:size-8" aria-label="Helpful" aria-pressed={vote === 'up'} onClick={() => pick('up')}>
        <ThumbsUp className={`size-3 ${vote === 'up' ? 'text-foreground' : 'text-muted-foreground'}`} />
      </Button>
      <Button size="icon" variant="ghost" className="size-5 max-desk:size-8" aria-label="Not helpful" aria-pressed={vote === 'down'} onClick={() => pick('down')}>
        <ThumbsDown className={`size-3 ${vote === 'down' ? 'text-foreground' : 'text-muted-foreground'}`} />
      </Button>
    </div>
  )
}

/** `shown`: this answer is the one ringed on the map. The button clears it, or brings it back after clearing (or from an older answer). */

/** The answer's small bar list: a label, a bar sized by value, and the number. */
export function Bars({ bars, onFocus, onPick }: { bars: Answer['bars']; onFocus?: (code: number | null) => void; onPick?: (code: number) => void }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <ul className="flex flex-col gap-1">
      {bars.map((b) => (
        <li
          key={b.label}
          className={`grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2 text-meta ${b.code && onPick ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => b.code && onFocus?.(b.code)}
          onMouseLeave={() => onFocus?.(null)}
          onClick={() => b.code && onPick?.(b.code)}
        >
          <span className="truncate text-muted-foreground">{b.label}</span>
          <span className="h-2 rounded-full bg-muted">
            <span className="block h-2 rounded-full bg-ai-border" style={{ width: `${(b.value / max) * 100}%` }} />
          </span>
          <span className="text-right">{b.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function AnswerView({ result, shown, onToggle, onFocusArea, onZoomArea, onPickRecurrence }: { result: Answer; shown: boolean; onToggle: (on: boolean) => void; onFocusArea?: (code: number | null) => void; onZoomArea?: (code: number) => void; onPickRecurrence?: (id: string) => void }) {
  // Only the answer that is on the map can point at it.
  const link = shown && result.areas?.length ? { onFocus: onFocusArea, onPick: onZoomArea } : {}
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground">{result.text}</p>
      {result.bars.length > 0 &&
        (result.chart ? (
          <Suspense fallback={null}>
            <AnswerChart kind={result.chart} bars={result.bars} onPickRecurrence={onPickRecurrence} {...link} />
          </Suspense>
        ) : (
          <Bars bars={result.bars} {...link} />
        ))}
      {result.evidence.map((e) => (
        <details key={e.tool + e.scope} className="text-meta text-muted-foreground">
          <summary className="cursor-pointer">Evidence: {e.incidentCount} Incidents</summary>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2">
            <dt>Tool</dt>
            <dd className="text-foreground">{e.tool}</dd>
            <dt>Scope</dt>
            <dd className="text-foreground">{e.scope}</dd>
            <dt>Period</dt>
            <dd className="text-foreground">{e.period}</dd>
            {e.references.length > 0 && (
              <>
                <dt>Examples</dt>
                <dd className="text-foreground">{e.references.join(', ')}</dd>
              </>
            )}
          </dl>
        </details>
      ))}
      <ul className="flex flex-col text-meta text-muted-foreground">
        {result.limitations.map((l, i) => (
          <li key={l} className="flex items-start gap-3 border-b border-(--neutral-600) py-2.5 last:border-b-0">
            <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-(--neutral-600) text-caption-strong text-(--neutral-100)">{i + 1}</span>
            <span className="pt-0.5">{l}</span>
          </li>
        ))}
      </ul>
      {result.offers?.map((o) => (
        <ModuleOffer key={`${o.type}-${o.problemId}`} offer={o} />
      ))}
      {result.highlightIds.length > 0 && (
        <Button size="sm" variant="ghost" className="self-start" onClick={() => onToggle(!shown)}>
          {shown ? 'Clear map highlight' : 'Show on map'}
        </Button>
      )}
      <Feedback />
    </div>
  )
}
