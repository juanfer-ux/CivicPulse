import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Sparkle, ThumbsDown, ThumbsUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SUGGESTIONS, answer, type Answer } from '@/lib/agent'
import { fetchLocalities } from '@/lib/incidents'

type Turn = { question: string; result?: Answer; error?: string }

export function InvestigatePanel({ onHighlight, highlightIds }: { onHighlight: (ids: string[]) => void; highlightIds: string[] }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)

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
      onHighlight(result.highlightIds)
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
      <div className="flex items-center desk:h-(--section-header-h) desk:shrink-0 desk:border-b desk:px-6">
        <CardHeader className="flex w-full flex-row items-center justify-between max-desk:mx-auto max-desk:max-w-[664px]">
          <CardTitle className="flex items-center gap-2 text-label">
            <Sparkle className="size-4" aria-hidden /> Investigate and Ask
          </CardTitle>
        </CardHeader>
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 desk:p-6">
        <div className="mx-auto flex min-h-0 w-full max-w-[664px] flex-1 flex-col gap-3 overflow-y-auto pr-1 text-body-sm">
          {turns.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-meta text-muted-foreground">Try one of these, or ask your own:</p>
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="outline" className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-button-sm text-foreground" onClick={() => void ask(s)}>
                  {s}
                </Button>
              ))}
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Question text={t.question} />
              {!t.result && !t.error && <p className="text-muted-foreground">Querying…</p>}
              {t.error && <p className="text-incident">{t.error}</p>}
              {t.result && <AnswerView result={t.result} shown={t.result.highlightIds === highlightIds} onToggle={(on) => onHighlight(on ? t.result!.highlightIds : [])} />}
            </div>
          ))}
          <div ref={end} />
        </div>
        <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[664px] items-center gap-2">
          <Input name="q" value={text} onChange={(e) => setText(e.target.value)} placeholder="What would you like to investigate?" aria-label="Investigate and Ask" autoComplete="off" />
          <Button type="submit" size="icon" aria-label="Ask" disabled={busy || !text.trim()}>
            <ArrowUp aria-hidden />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/** The person's question (Figma Message, role user). */
export function Question({ text }: { text: string }) {
  return <p className="self-end rounded-lg bg-foreground/10 px-3 py-2">{text}</p>
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
export function Bars({ bars }: { bars: Answer['bars'] }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <ul className="flex flex-col gap-1">
      {bars.map((b) => (
        <li key={b.label} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2 text-meta">
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

export function AnswerView({ result, shown, onToggle }: { result: Answer; shown: boolean; onToggle: (on: boolean) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground">{result.text}</p>
      {result.bars.length > 0 && <Bars bars={result.bars} />}
      {result.evidence.map((e) => (
        <details key={e.tool + e.scope} className="text-meta text-muted-foreground">
          <summary className="cursor-pointer">Evidence: {e.incidentCount} incidents</summary>
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
