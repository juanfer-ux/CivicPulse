import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, Sparks } from 'iconoir-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnswerView, Question } from '@/components/InvestigatePanel'
import type { Answer } from '@/lib/agent'

const VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const
const SIZES = ['sm', 'default', 'lg'] as const

/** Shows the rendered height and text style under a component, so it is checked by measuring, not by eye. */
function Measured({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [spec, setSpec] = useState('')
  useEffect(() => {
    const el = box.current?.firstElementChild as HTMLElement | null
    if (!el) return
    const read = () => {
      const s = getComputedStyle(el)
      setSpec(`${Math.round(el.offsetHeight)} px · ${s.fontSize} / ${s.fontWeight}`)
    }
    // Runs once on mount and again whenever the component changes size (e.g. crossing 1,440 px).
    const watcher = new ResizeObserver(read)
    watcher.observe(el)
    return () => watcher.disconnect()
  }, [])
  return (
    <div ref={box} className="flex flex-col items-start gap-1">
      {children}
      <span className="text-meta text-muted-foreground">{spec}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-title">{title}</h2>
      {children}
    </section>
  )
}

const SAMPLE: Answer = {
  text: 'Kennedy has the most parking obstruction incidents (77), followed by Chapinero (66) and Suba (60).',
  bars: [
    { label: 'Kennedy', value: 77 },
    { label: 'Chapinero', value: 66 },
    { label: 'Suba', value: 60 },
  ],
  evidence: [{ tool: 'ranking_by_locality', scope: 'All localities you can see', period: 'All time', incidentCount: 203, references: [] }],
  limitations: ['Counts are of reported incidents, not confirmed violations.'],
  highlightIds: [],
}

/** Static copy of the docked agent panel with one conversation, so the look can be checked without signing in. */
function ConversationDemo() {
  return (
    <div className="flex h-[640px] w-[456px] max-w-full flex-col gap-3 border border-card bg-ai p-6 text-body">
      <div className="flex min-h-0 flex-1 flex-col gap-8">
        <div className="flex items-center gap-2 text-label">
          <Sparks className="size-4" aria-hidden /> Investigate and Ask
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <Question text="Which localities have the most parking obstruction incidents?" />
          <AnswerView result={SAMPLE} onClear={() => {}} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input placeholder="What would you like to investigate?" aria-label="Investigate and Ask" />
        <Button size="sm" variant="outline">
          Ask
        </Button>
      </div>
    </div>
  )
}

/** Component gallery: open `/#components`. Resize the window under 1,440 px to see the phone sizes. */
export function Gallery() {
  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-8 p-4 desk:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-heading">Component gallery</h1>
        <p className="text-body text-muted-foreground">
          Real components, not copies. Under 1,440 px wide you see the phone sizes.
        </p>
      </header>

      <Section title="Button · variants and sizes">
        {VARIANTS.map((variant) => (
          <div key={variant} className="flex flex-col gap-2">
            <h3 className="text-label text-muted-foreground">{variant}</h3>
            <div className="flex flex-wrap items-start gap-4">
              {SIZES.map((size) => (
                <Measured key={size}>
                  <Button variant={variant} size={size}>
                    {size === 'default' ? 'Button' : `Button ${size}`}
                  </Button>
                </Measured>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Agent panel · one conversation">
        <ConversationDemo />
      </Section>

      <Section title="Button · icon and states">
        <div className="flex flex-wrap items-start gap-4">
          <Measured>
            <Button size="icon" aria-label="Add">
              <Plus />
            </Button>
          </Measured>
          <Measured>
            <Button size="icon-lg" aria-label="Add">
              <Plus />
            </Button>
          </Measured>
          <Measured>
            <Button>
              <Plus /> With icon
            </Button>
          </Measured>
          <Measured>
            <Button disabled>Disabled</Button>
          </Measured>
          <Measured>
            <Button variant="outline" aria-invalid>
              Invalid
            </Button>
          </Measured>
        </div>
      </Section>
    </div>
  )
}
