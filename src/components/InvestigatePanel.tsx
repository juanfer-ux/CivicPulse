import { Suspense, lazy, useEffect, useRef, useState, type FormEvent } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowRight, ArrowUp, Sparkle, ThumbsDown, ThumbsUp, WarningCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SUGGESTIONS, WORTH_INVESTIGATING, answer, type Answer, type Area } from '@/lib/agent'
import { fetchLocalities } from '@/lib/incidents'

// The charts (Recharts) are their own file, fetched right after the app loads so the first answer already has them; nothing is drawn while they load, never the plain bars.
const loadChart = () => import('@/components/AnswerCharts')
const AnswerChart = lazy(loadChart)

export type Turn = { question: string; result?: Answer; error?: string }

/** `turns` are this conversation's questions and answers; the app keeps one list per conversation (the sidebar's Investigations). `onTurns` edits the conversation with this id, even if the person has switched to another one meanwhile. */
export function InvestigatePanel({ chatId, turns, onTurns, onHighlight, highlightIds, onFocusArea, onZoomArea }: { chatId: number; turns: Turn[]; onTurns: (id: number, edit: (t: Turn[]) => Turn[]) => void; onHighlight: (ids: string[], areas?: Area[], spots?: string[][]) => void; highlightIds: string[]; onFocusArea: (code: number | null) => void; onZoomArea: (code: number) => void }) {
  const setTurns = (edit: (t: Turn[]) => Turn[]) => onTurns(chatId, edit)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => void loadChart(), [])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  async function ask(question: string) {
    const q = question.trim()
    if (!q || busy) return
    setBusy(true)
    setTurns((t) => [...t, { question: q }])
    let turn: Turn
    try {
      const result = await answer(q, await fetchLocalities())
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
      {/* On desktop the title row is as tall as the section header, so one line runs across the screen. */}
      <div className={`flex items-center desk:h-(--agent-header-h) desk:shrink-0 desk:border-b desk:px-8 ${turns.length === 0 ? 'desk:hidden' : ''}`}>
        <CardHeader className="flex w-full flex-row items-center justify-between max-desk:mx-auto max-desk:max-w-[664px]">
          <CardTitle asChild className="flex items-center gap-2 text-label">
            <h2>
              <Sparkle weight="fill" className="size-4" aria-hidden /> Investigate and Ask
            </h2>
          </CardTitle>
        </CardHeader>
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 desk:p-8">
        {/* The scrollbar sits on the panel's own edge (owner, 2026-11-05): the scroll area is full width and the centered column is inside it. */}
        <ScrollArea className="min-h-0 flex-1 desk:-mx-8" viewportClassName="[&>div]:!block">
        <div className={`flex w-full flex-col gap-3 text-body-sm max-desk:mx-auto max-desk:max-w-[664px] desk:max-w-[728px] desk:px-8 ${turns.length === 0 ? 'desk:mx-auto' : ''}`}>
          {turns.length === 0 && (
            <div className="flex flex-col gap-10">
              {/* The empty panel (owner's Figma, 2026-11-05), with Figma's auto layout limits: the whole content (cards, Quick questions) and the composer are at most 664 wide and centered (the greeting "Let’s take a look..." is hidden in Figma, so it is not shown), and the cards fill the width and wrap (each at least 250 wide). The title row is hidden on desktop until the first question. */}
              <div className="@container flex flex-col gap-4">
                <p className="font-display text-display-xs text-(--neutral-200)">Worth investigating</p>
                <div className="flex flex-wrap items-start gap-4">
                  {WORTH_INVESTIGATING.map((c) => (
                    <button key={c.title} type="button" className="flex max-w-none min-w-[250px] flex-1 basis-0 @min-[516px]:max-w-[320px] cursor-pointer gap-3 overflow-hidden rounded-lg bg-(--neutral-700) px-2 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => void ask(c.question)}>
                      <span className="h-[160px] max-w-[400px] min-w-[132px] flex-1 rounded-sm bg-(--neutral-500)" aria-hidden />
                      <span className="flex min-w-0 flex-1 flex-col justify-between p-2">
                        <span className="flex flex-col items-start gap-3">
                          <Badge variant="outline" size="lg" className="h-[31px] border-(--neutral-400) bg-(--neutral-900) px-2.5 text-(--neutral-100)">
                            <WarningCircle weight="regular" aria-hidden />
                            {c.category}
                          </Badge>
                          <span className="text-label-regular [overflow-wrap:anywhere] text-(--neutral-200)">{c.title}</span>
                        </span>
                        <ArrowRight weight="regular" className="size-4 shrink-0 self-end text-(--neutral-200)" aria-hidden />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex max-w-[664px] flex-col gap-4">
                <p className="font-display text-display-xs text-(--neutral-200)">Quick questions</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="ghost" className="h-auto justify-start whitespace-normal rounded-none border-0 border-b border-(--neutral-400) p-3 text-left text-body-sm-medium text-(--neutral-200) hover:bg-(--neutral-700) hover:text-(--neutral-200)" onClick={() => void ask(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Question text={t.question} />
              {!t.result && !t.error && <p className="text-muted-foreground">Querying…</p>}
              {t.error && <p className="text-incident">{t.error}</p>}
              {t.result && <AnswerView result={t.result} shown={t.result.highlightIds === highlightIds} onFocusArea={onFocusArea} onZoomArea={onZoomArea} onToggle={(on) => onHighlight(on ? t.result!.highlightIds : [], on ? t.result!.areas : [], on ? t.result!.spots : [])} />}
            </div>
          ))}
          <div ref={end} />
        </div>
        </ScrollArea>
        <form onSubmit={onSubmit} className={`flex w-full max-w-[664px] items-center gap-2 max-desk:mx-auto ${turns.length === 0 ? 'desk:mx-auto' : ''}`}>
          <Input name="q" value={text} onChange={(e) => setText(e.target.value)} placeholder="What would you like to investigate?" aria-label="Investigate and Ask" autoComplete="off" />
          <Button type="submit" size="icon" aria-label="Ask" className="bg-(--white) hover:bg-(--white)/90" disabled={busy || !text.trim()}>
            <ArrowUp aria-hidden />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/** The person's question (Figma Message, role user). */
export function Question({ text }: { text: string }) {
  return <p className="self-end rounded-lg bg-(--neutral-500) px-3 py-2">{text}</p>
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

export function AnswerView({ result, shown, onToggle, onFocusArea, onZoomArea }: { result: Answer; shown: boolean; onToggle: (on: boolean) => void; onFocusArea?: (code: number | null) => void; onZoomArea?: (code: number) => void }) {
  // Only the answer that is on the map can point at it.
  const link = shown && result.areas?.length ? { onFocus: onFocusArea, onPick: onZoomArea } : {}
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground">{result.text}</p>
      {result.bars.length > 0 &&
        (result.chart ? (
          <Suspense fallback={null}>
            <AnswerChart kind={result.chart} bars={result.bars} {...link} />
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
      <ul className="list-disc pl-4 text-meta text-muted-foreground">
        {result.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {result.highlightIds.length > 0 && (
        <Button size="sm" variant="ghost" className="self-start" onClick={() => onToggle(!shown)}>
          {shown ? 'Clear map highlight' : 'Show on map'}
        </Button>
      )}
      <Feedback />
    </div>
  )
}
