import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Sparks } from 'iconoir-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SUGGESTIONS, answer, type Answer } from '@/lib/agent'
import { fetchLocalities } from '@/lib/incidents'

type Turn = { question: string; result?: Answer; error?: string }

export function InvestigatePanel({ onHighlight }: { onHighlight: (ids: string[]) => void }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
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
    const input = e.currentTarget.elements.namedItem('q') as HTMLInputElement
    void ask(input.value)
    input.value = ''
  }

  return (
    <Card className="min-h-0 flex-1 gap-3 gradient-border overflow-visible bg-ai">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparks className="size-4" aria-hidden /> Investigate and Ask
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 text-body">
          {turns.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Try one of these, or ask your own:</p>
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => void ask(s)}>
                  {s}
                </Button>
              ))}
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className="flex flex-col gap-2">
              <p className="self-end rounded-lg bg-secondary px-3 py-2">{t.question}</p>
              {!t.result && !t.error && <p className="text-muted-foreground">Querying…</p>}
              {t.error && <p className="text-incident">{t.error}</p>}
              {t.result && <AnswerView result={t.result} onClear={() => onHighlight([])} />}
            </div>
          ))}
          <div ref={end} />
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <Input name="q" placeholder="What would you like to investigate?" aria-label="Investigate and Ask" autoComplete="off" />
          <Button type="submit" size="sm" variant="outline" disabled={busy}>
            Ask
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function AnswerView({ result, onClear }: { result: Answer; onClear: () => void }) {
  const max = Math.max(1, ...result.bars.map((b) => b.value))
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card/60 p-3">
      <p>{result.text}</p>
      {result.bars.length > 0 && (
        <ul className="flex flex-col gap-1">
          {result.bars.map((b) => (
            <li key={b.label} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2 text-meta">
              <span className="truncate text-muted-foreground">{b.label}</span>
              <span className="h-2 rounded-full bg-muted">
                <span className="block h-2 rounded-full bg-ai-border" style={{ width: `${(b.value / max) * 100}%` }} />
              </span>
              <span className="text-right">{b.value}</span>
            </li>
          ))}
        </ul>
      )}
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
        <Button size="sm" variant="ghost" className="self-start" onClick={onClear}>
          Clear map highlight
        </Button>
      )}
    </div>
  )
}
