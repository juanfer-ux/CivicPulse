import type { ComponentType, ReactNode } from 'react'
import { ArrowsClockwise, Calendar, FileText, Stack, Wrench, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ProblemStatusPill } from '@/components/ProblemStatusPill'

/**
 * Ways to lay out the Recurrence Panel as a wide header, left to right (owner, 2026-11-08): the address and category on the left, the numbers (with icons) across. Dev-only gallery at /#header: sample data (PR-00088), nothing here changes the app.
 */

const TITLE = 'Obstructive Parking'
const ADDRESS = 'Cl 39 #20-15, Garaje del Conjunto Alcázar'
const REF = 'PR-00088 · Teusaquillo'
type Icon = ComponentType<{ weight?: 'regular' | 'bold'; className?: string; 'aria-hidden'?: boolean }>
const STATS: { Icon: Icon; label: string; value: string }[] = [
  { Icon: Stack, label: 'Occurrences', value: '3' },
  { Icon: ArrowsClockwise, label: 'Returns', value: '2' },
  { Icon: FileText, label: 'Reports', value: '12' },
  { Icon: Wrench, label: 'Interventions', value: '2' },
  { Icon: Calendar, label: 'Last reported', value: '12 Oct' },
]

const Frame = ({ name, note, children }: { name: string; note: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div>
      <p className="text-label">{name}</p>
      <p className="text-meta text-muted-foreground">{note}</p>
    </div>
    <div className="rounded-[6px] border-[0.5px] border-(--neutral-500) bg-(--neutral-900) p-4">{children}</div>
  </div>
)

/** The close button sits in the same corner in every option (top 20 px, right 20 px, the position it has in the two-row one); the content keeps 60 px free on the right for it. The floating card look: neutral-700 at 95 %, 1 px neutral-900 outline, no blur. */
const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-(--neutral-900) relative bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] ${className}`}>{children}</div>
)

const Close = () => (
  <Button size="icon" variant="ghost" aria-label="Close" className="absolute top-5 right-5">
    <X />
  </Button>
)

const Title = ({ today }: { today?: boolean }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <h2 className="text-subtitle">
      {today ? TITLE : ADDRESS}
    </h2>
    <p className="text-body-sm-medium">{today ? ADDRESS : TITLE}</p>
    <p className="text-meta text-muted-foreground">{REF}</p>
  </div>
)

const Option1 = () => (
  <Card className="overflow-hidden bg-(--neutral-900)!">
            <Close />
            <div className="flex items-center gap-6 py-4 pr-[60px] pl-5">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-heading text-[24px]! leading-[30px]">{ADDRESS}</h2>
              <div className="flex items-center gap-3">
                <p className="text-body-medium leading-5">{TITLE}</p>
                <span className="h-3.5 w-px bg-(--neutral-500)" aria-hidden />
                <p className="text-meta leading-5 text-muted-foreground">{REF}</p>
                <ProblemStatusPill status="active" />
              </div>
            </div>
            <dl className="ml-auto flex items-stretch">
              {STATS.map((s) => (
                <div key={s.label} className="flex shrink-0 flex-col gap-0 whitespace-nowrap border-l border-(--neutral-500) px-5 first:border-l-0">
                  <dt className="text-meta text-muted-foreground">{s.label}</dt>
                  <dd className="text-heading text-[24px]!">{s.value}</dd>
                </div>
              ))}
            </dl>
            </div>
          </Card>
)

const Option3 = () => (
  <Card className="bg-(--neutral-900)!">
            <Close />
            <div className="flex items-start gap-4 pt-5 pr-[60px] pb-5 pl-5">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-heading text-[24px]! leading-[30px]">{ADDRESS}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-body-medium leading-5">{TITLE}</p>
                  <span className="h-3.5 w-px bg-(--neutral-500)" aria-hidden />
                  <p className="text-meta leading-5 text-muted-foreground">{REF}</p>
                </div>
              </div>
              <div className="ml-auto flex items-start">
                <ProblemStatusPill status="active" />
              </div>
            </div>
            <dl className="grid grid-cols-5 border-t border-(--neutral-500)">
              {STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-3 border-l border-(--neutral-500) px-5 py-3 first:border-l-0">
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-(--neutral-600)">
                <s.Icon weight="regular" className="size-4 text-(--neutral-100)" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <dt className="text-meta leading-none text-muted-foreground">{s.label}</dt>
                <dd className="text-heading leading-none">{s.value}</dd>
              </div>
            </div>
              ))}
            </dl>
          </Card>
)

/** The same card over the map screen (the gradient the map shows through), with the two history cards at the bottom, 360 px tall, 60 / 40, 12 px apart, to see the header in place. Placeholders, not real data. */
const InContext = ({ children }: { children: ReactNode }) => (
  <div className="relative h-[640px] overflow-hidden rounded-lg p-4" style={{ background: 'var(--screen-gradient)' }}>
    {children}
    <div className="absolute right-4 bottom-4 left-4 flex h-[360px] gap-3">
      <div className="relative flex-[4] rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] p-4 text-caption-medium text-(--neutral-200)">Occurrences</div>
      <div className="relative flex-[6] rounded-lg border border-(--neutral-900) bg-[color-mix(in_srgb,var(--neutral-700)_95%,transparent)] p-4 text-caption-medium text-(--neutral-200)">Timeline</div>
    </div>
  </div>
)

export function HeaderGallery() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-8 p-8">
      <header>
        <h1 className="text-heading">The Recurrence Panel as a wide header</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">The same recurrence drawn left to right: address and category on the left, the numbers with icons across. The first one is today's 400 px card. The others are about 1,000 px wide, the width of the map's top strip.</p>
      </header>
      <div className="grid gap-8">
        <Frame name="0 · Today (400 px card)" note="Title, address, status, then the facts as a list.">
          <Card className="w-[400px] px-4 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <Title today />
                <Button size="icon" variant="ghost" aria-label="Close"><X /></Button>
              </div>
              <ProblemStatusPill status="active" />
              <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 [&>dd]:text-body-sm-strong [&>dt]:text-body-sm-medium">
                {STATS.map((s) => (
                  <div key={s.label} className="contents">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>
        </Frame>

        <Frame name="1 · Strip: title left, numbers with dividers" note="One row. The title block on the left, then each number as a label over a value, a thin line between them. No icons.">
          <Option1 />
        </Frame>

        <Frame name="3 · Two rows: big title, then the numbers" note="The address in the big title style on one line, below it the category, a small vertical line and the reference on the same line; the status and the close button on the right, a line, then the five numbers spread across the full width with icons.">
          <Option3 />
        </Frame>

        <Frame name="1 · In context" note="Option 1 over the map screen with the two history cards below.">
          <InContext><Option1 /></InContext>
        </Frame>

        <Frame name="3 · In context" note="Option 3 over the map screen with the two history cards below.">
          <InContext><Option3 /></InContext>
        </Frame>
      </div>
    </main>
  )
}
