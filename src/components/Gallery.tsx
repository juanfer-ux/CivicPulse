import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, Sparks } from 'iconoir-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/role-badge'
import { Select } from '@/components/ui/select'
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
function ConversationDemo({ width = 456 }: { width?: number }) {
  return (
    <div style={{ width }} className="flex h-[640px] max-w-full flex-col gap-3 border border-card bg-ai p-6 text-body-sm">
      <div className="mx-auto flex min-h-0 w-full max-w-[664px] flex-1 flex-col gap-8">
        <div className="flex items-center gap-2 text-label">
          <Sparks className="size-4" aria-hidden /> Investigate and Ask
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <Question text="Which localities have the most parking obstruction incidents?" />
          <AnswerView result={SAMPLE} onClear={() => {}} />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[664px] items-center gap-2">
        <Input placeholder="What would you like to investigate?" aria-label="Investigate and Ask" />
        <Button size="sm" variant="outline">
          Ask
        </Button>
      </div>
    </div>
  )
}

const ROLE_DEMO = [
  { value: '', label: 'All roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'zone_admin', label: 'Locality (Zone) Admin' },
  { value: 'operator', label: 'Specialist Operator' },
]

function SelectDemo({ disabled }: { disabled?: boolean }) {
  const [v, setV] = useState('')
  return <Select aria-label="Role" value={v} onValueChange={setV} options={ROLE_DEMO} disabled={disabled} className="w-70" />
}

/** The Map filters card and the Users search row with labels above (decision 0023), built from the real components; the real screens need a sign-in. */
function FiltersDemo() {
  const [v, setV] = useState('')
  const options = [{ value: '', label: 'All' }, ...ROLE_DEMO]
  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex w-72 flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="text-subtitle">Filters</div>
        {['Locality', 'Category', 'Status', 'Period'].map((name) => (
          <Field key={name} label={name}>
            <Select aria-label={name} value={v} onValueChange={setV} options={options} />
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Search">
          <Input className="max-w-xs" placeholder="Name or email" />
        </Field>
        <Field label="Role">
          <Select className="w-auto!" aria-label="Filter by role" value={v} onValueChange={setV} options={options} />
        </Field>
        <label className="flex h-(--control-default) items-center gap-2 text-body-sm">
          <input type="checkbox" />
          Pending only
        </label>
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
        <p className="text-body-sm text-muted-foreground">
          Real components, not copies. Under 1,440 px wide you see the phone sizes.
        </p>
      </header>

      <Section title="Description text · weight decision (the Sign in line under the title)">
        <div className="flex w-[460px] max-w-full flex-col gap-3 rounded-xl border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-meta text-muted-foreground">Now: Regular (300), what the app uses</span>
            <div className="text-body-sm text-muted-foreground">Welcome to the Civic Ops. Agent Platform</div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-meta text-muted-foreground">Proposed: Medium (360), sturdier strokes at 13.5 px</span>
            <div className="text-body-sm-medium text-muted-foreground">Welcome to the Civic Ops. Agent Platform</div>
          </div>
        </div>
      </Section>

      <Section title="Filters and search · labels above (Map filters card, Users search row)">
        <FiltersDemo />
      </Section>

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

      <Section title="Agent panel · one conversation (456 px and dragged to 800 px)">
        <div className="flex flex-wrap items-start gap-4">
          <ConversationDemo />
          <ConversationDemo width={800} />
        </div>
      </Section>

      <Section title="Avatar · sizes (initials until there is a photo)">
        <div className="flex items-center gap-4">
          <Measured><Avatar name="Juan Fernando Pérez Gómez" size="sm" /></Measured>
          <Measured><Avatar name="Juan Fernando Pérez Gómez" /></Measured>
          <Measured><Avatar name="Juan Fernando Pérez Gómez" size="lg" /></Measured>
        </div>
      </Section>

      <Section title="Role Badge">
        <div className="flex flex-wrap items-center gap-4">
          <RoleBadge role="super_admin" />
          <RoleBadge role="locality_admin" />
          <RoleBadge role="specialist_operator" />
          <RoleBadge role={null} />
        </div>
      </Section>

      <Section title="Select · Base UI list (click to open)">
        <div className="flex flex-wrap items-start gap-4">
          <SelectDemo />
          <SelectDemo disabled />
        </div>
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
