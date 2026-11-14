import type { ReactNode } from 'react'
import { ArrowRight, Car, CarSimple, Trash, Wrench, type Icon } from '@phosphor-icons/react'
import { SUGGESTIONS, WORTH_INVESTIGATING } from '@/lib/agent'

/** The agent panel's landing (owner's Figma, 2026-11-12: Agent Panel, Welcome_Module, CatchUp_Module, Worth-Investigating_Module, Quick Questions): a greeting and three sections, each a Welcome_Module with a title row and a caret that folds it. Data overview and the category pictures are still placeholders (Figma's numbers); the questions are real and ask the agent. */
const SHARE: [string, number][] = [['Chapinero', 62], ['Suba', 52], ['Kennedy', 43], ['Engativá', 36], ['Others', 61]] // placeholder: Figma's numbers until the data comes from the incidents
const STEPS = [1, 0.85, 0.7, 0.55, 0.4] // indigo-400, fading from the biggest slice
const GAP = (2.3 / 360) * 2 * Math.PI * 52.28 // 2.3 degrees between slices, centered on the cut (Figma arcs: -88.9 to -3.3, then -1 to 70.4, ...)
const total = SHARE.reduce((a, [, n]) => a + n, 0)

/** A Welcome_Module of the panel (owner's Figma, 2026-11-12): its title, in `display-xs`, over its content. The two ghost buttons (a menu and a fold chevron) that the title row had are gone from the panel's modules, so the sections do not fold any more. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-display-semi text-display-xs text-(--neutral-200)">{title}</h3>
      {children}
    </section>
  )
}

/** The category cards' icons (owner's Figma, 2026-11-14): Phosphor duotone, 25.6 px, `indigo-300`, on a `neutral-900` block. */
const CATEGORY_ICON: Record<string, Icon> = { 'Obstructive Parking': CarSimple, 'Illegal Dumping': Trash, 'Damaged Infrastructure': Wrench }

/** Figma Data_Card_Small / Data_Card_Medium: 6 px radius, `neutral-700` fill, 0.5 px `neutral-500` line, 8 px padding and a name in `body-sm`. */
const dataCard = 'flex flex-col gap-1 rounded-md'
const cardName = 'p-1 text-meta text-(--neutral-100)'

function Donut() {
  const R = 52.28 // the ring's middle radius: outer diameter 130.7, inner radius 60 % of it (the owner's Figma donut, 2026-11-12), in a 131 box (it was 140, owner's Figma 2026-11-14)
  const C = 2 * Math.PI * R
  return (
    <svg viewBox="0 0 131 131" className="size-[131px] shrink-0 -rotate-90" role="img" aria-label="Share of reports by locality">
      {SHARE.map(([name, n], i) => {
        const len = (n / total) * C
        const start = (SHARE.slice(0, i).reduce((a, [, k]) => a + k, 0) / total) * C
        return <circle key={name} cx="65.5" cy="65.5" r={R} fill="none" stroke="var(--indigo-400)" strokeOpacity={STEPS[i]} strokeWidth="26.14" strokeDasharray={`${len - GAP} ${C - len + GAP}`} strokeDashoffset={-(start + GAP / 2)} />
      })}
    </svg>
  )
}

export function AgentHome({ ask }: { ask: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-display text-display-md text-(--brand-primary)">Welcome back,</h2>
      <div className="flex flex-col gap-10">
        <Section title="Let's catch up">
          <div className="flex flex-wrap gap-4"> {/* Figma CatchUp_Module2 (owner, 2026-11-14, latest): a wrapping row, 16 px both ways; a column of the two small cards (at least 180 px) beside the medium card (at least 372 px), and under 568 px of room the medium card drops below, both full width */}
            <div className="flex min-w-[180px] flex-1 basis-0 flex-col gap-4">
              {[0, 1].map((i) => (
                <div key={i} className={`${dataCard} bg-(--neutral-700) p-2`}>
                  <p className={cardName}>Data card name</p>
                  <div className="h-[50px]" aria-hidden /> {/* Figma Data_Chart of the small card: its neutral-800 fill is hidden now (2026-11-14), the 50 px block stays */}
                </div>
              ))}
            </div>
            <div className={`${dataCard} min-h-[218px] min-w-[372px] flex-1 basis-0 bg-(--neutral-800) p-2.5`}>
              <p className={cardName}>Today&apos;s top localities</p>
              <div className="flex flex-1 items-center justify-center gap-6 p-2"> {/* Figma Data_Chart: Fill in height and width, its content centered, 24 px between the donut and the legend (owner, 2026-11-14) */}
                <div className="flex max-w-[164px] min-w-0 flex-1 basis-0 justify-center"> {/* Figma Graph: Fill, 164 px at most, centers the 131 px donut */}
                  <div className="relative shrink-0">
                    <Donut />
                    <Car weight="regular" className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-(--neutral-300)" aria-hidden />
                  </div>
                </div>
                <ul className="flex max-w-[240px] min-w-0 flex-1 basis-0 flex-col justify-center gap-1 px-2 text-body-sm"> {/* Figma Legend: Fill, 240 px at most, 8 px at its sides */}
                  {SHARE.map(([name, n], i) => (
                    <li key={name} className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full bg-(--indigo-400)" style={{ opacity: STEPS[i] }} aria-hidden />
                      <span className="flex-1 truncate text-(--neutral-200)">{name}</span>
                      <span className="text-(--neutral-100)">{n} · {Math.round((n / total) * 100)} %</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>
        <Section title="Recurrences to investigate">
          <div className="flex flex-wrap gap-4"> {/* Figma Worth-Investigating_Module: a wrapping row, 16 px apart */}
            {WORTH_INVESTIGATING.map((c) => {
              const Icon = CATEGORY_ICON[c.title]
              return (
                <button key={c.title} type="button" className="flex min-w-[120px] flex-1 cursor-pointer flex-wrap items-end gap-x-3 gap-y-2.5 rounded-md bg-(--neutral-800) p-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => ask(c.question)}> {/* Figma Category_Card2 (owner, 2026-11-14, latest): a `neutral-800` row with 6 px radius and 10 px padding, 12 px between the icon block (Fill, at least 48 px, 64 px high) and the name (96 px wide, at the bottom), 10 px between rows when it wraps */}
                  <span className="grid h-16 min-w-12 flex-1 basis-0 place-items-center rounded-sm bg-(--neutral-900)">{Icon && <Icon weight="duotone" className="size-[25.6px] text-(--indigo-300)" aria-hidden />}</span>
                  <span className="flex w-24 shrink-0 items-end self-stretch px-1 py-0.5 text-body-sm-medium text-(--neutral-100)">{c.title}</span>
                </button>
              )
            })}
          </div>
        </Section>
        <Section title="Quick sugestions">
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="flex w-full cursor-pointer gap-2 rounded-sm border border-(--neutral-700) p-2 text-left outline-none hover:bg-(--neutral-800) focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => ask(s)}>
                <ArrowRight className="mt-1 size-3 shrink-0 text-(--neutral-300)" aria-hidden />
                <span className="line-clamp-4 px-1 text-body-sm-medium text-(--neutral-200)">{s}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
