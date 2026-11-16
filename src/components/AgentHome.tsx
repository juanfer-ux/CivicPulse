import { useEffect, type ReactNode } from 'react'
import { Car, CarSimple, Trash, Warning, MapPin, Clock, ArrowsClockwise, Compass, Wrench, type Icon } from '@phosphor-icons/react'
import { SUGGESTIONS, WORTH_INVESTIGATING } from '@/lib/agent'

/** The agent panel's landing (owner's Figma, 2026-11-12: Agent Panel, Welcome_Module, CatchUp_Module, Worth-Investigating_Module, Quick Questions): a greeting and three sections, each a Welcome_Module with a title row and a caret that folds it. Data overview and the category pictures are still placeholders (Figma's numbers); the questions are real and ask the agent. */
const SHARE: [string, number][] = [['Chapinero', 62], ['Suba', 52], ['Kennedy', 43], ['Engativá', 36], ['Others', 61]] // placeholder: Figma's numbers until the data comes from the incidents
const STEPS = [1, 0.85, 0.7, 0.55, 0.4] // indigo-400, fading from the biggest slice
const GAP = (2.3 / 360) * 2 * Math.PI * 52.28 // 2.3 degrees between slices, centered on the cut (Figma arcs: -88.9 to -3.3, then -1 to 70.4, ...)
const total = SHARE.reduce((a, [, n]) => a + n, 0)

/** A Welcome_Module of the panel (owner's Figma, 2026-11-12): its title, in `display-xs`, over its content. The two ghost buttons (a menu and a fold chevron) that the title row had are gone from the panel's modules, so the sections do not fold any more. */
const TOPIC_ICON: Icon[] = [Warning, MapPin, Clock, ArrowsClockwise, Compass]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h3 className="font-display-semi text-display-xs text-(--neutral-200)">{title}</h3>
      {children}
    </section>
  )
}

/** The category cards' icons (owner's Figma, 2026-11-14): Phosphor duotone, 25.6 px, `indigo-300`, on a `neutral-900` block. */
const CATEGORY_ICON: Record<string, Icon> = { 'Obstructive Parking': CarSimple, 'Illegal Dumping': Trash, 'Damaged Infrastructure': Wrench }

/** Figma Data_Card_Small / Data_Card_Medium: 6 px radius, `neutral-700` fill, 0.5 px `neutral-500` line, 8 px padding and a name in `body-sm`. */
const dataCard = 'flex flex-col gap-1 rounded-md border-[0.5px] border-(--neutral-500)' // Figma data cards (owner, 2026-11-15): no fill, a 0.5 px `neutral-500` line inside
const cardName = 'p-1 text-meta text-(--neutral-200)'

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
  useEffect(() => {
    // Shift + 1 to 5 (owner, 2026-11-15; plain digits did nothing while the composer had focus, which is nearly always; Option was tried first, but not everyone reads its symbol). e.code, because Shift changes e.key (Shift+1 types !).
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
      const q = SUGGESTIONS[Number(/^Digit([1-9])$/.exec(e.code)?.[1]) - 1]
      if (q) {
        e.preventDefault()
        ask(q)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ask])
  return (
    <div className="flex flex-col gap-10"> {/* Figma Dashboard (owner, checked 2026-11-15): 40 px between "Welcome back," and the modules (it was 32) */}
      <h2 className="font-display text-display-md text-(--brand-primary)">Welcome back,</h2>
      <div className="flex flex-col gap-10">
        <Section title="Let's catch up">
          <div className="flex flex-wrap items-center gap-3"> {/* Figma CatchUp_Module2 (owner, 2026-11-15, checked again later that day): a wrapping row, 12 px across and 12 px between wrapped rows, items centered; a column of the two small cards (at least 180 px) beside the medium card (at least 372 px), and under 568 px of room the medium card drops below, both full width */}
            <div className="@container min-w-[180px] flex-1 basis-0">
              {/* The two small cards stack in a column beside the medium card, and sit side by side once the group has the whole width, i.e. when the medium card has dropped below (owner, 2026-11-15; the panel at its minimum width) */}
              <div className="flex flex-col gap-3 @min-[420px]:flex-row">
                {[0, 1].map((i) => (
                  <div key={i} className={`${dataCard} p-2 @min-[420px]:flex-1`}>
                    <p className={cardName}>Data card name</p>
                    <div className="h-[50px]" aria-hidden /> {/* Figma Data_Chart of the small card: its neutral-800 fill is hidden now (2026-11-14), the 50 px block stays */}
                  </div>
                ))}
              </div>
            </div>
            <div className={`${dataCard} min-h-[218px] min-w-[372px] flex-1 basis-0 gap-2 p-2.5`}>
              <p className={cardName}>Today&apos;s top localities</p>
              <div className="flex flex-1 items-center justify-center gap-6 p-2"> {/* Figma Data_Chart: Fill in height and width, its content centered, 24 px between the donut and the legend (owner, 2026-11-14) */}
                <div className="flex max-w-[164px] min-w-0 flex-1 basis-0 justify-center"> {/* Figma Graph: Fill, 164 px at most, centers the 131 px donut */}
                  <div className="relative shrink-0">
                    <Donut />
                    <Car weight="regular" className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-(--neutral-300)" aria-hidden />
                  </div>
                </div>
                <ul className="flex max-w-[240px] min-w-0 flex-1 basis-0 flex-col justify-between gap-1 self-stretch px-2 text-meta"> {/* Figma Legend (owner, 2026-11-15): Fill in width and height, 240 px at most, 8 px at its sides, its five rows spread from top to bottom (space between), each row `meta` 23 px high */}
                  {SHARE.map(([name, n], i) => (
                    <li key={name} className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full bg-(--indigo-400)" style={{ opacity: STEPS[i] }} aria-hidden />
                      <span className="flex-1 truncate text-(--neutral-200)">{name}</span>
                      <span className="text-meta-medium text-(--neutral-100)">{n} · {Math.round((n / total) * 100)} %</span> {/* meta-medium (13 Medium) since 2026-11-15; it was regular */}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>
        <Section title="Recurrences to investigate">
          <div className="flex gap-2.5"> {/* Figma Worth-Investigating_Module (2026-11-15): one row that no longer wraps, 10 px apart, cards Fill with a 120 px minimum */}
            {WORTH_INVESTIGATING.map((c) => {
              const Icon = CATEGORY_ICON[c.title]
              return (
                <button key={c.title} type="button" className="group flex min-w-[120px] flex-1 cursor-pointer flex-col items-start gap-4 rounded-md bg-(--neutral-700) p-3 text-left outline-none hover:bg-(--neutral-600) focus-visible:bg-(--neutral-600) focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => ask(c.question)}> {/* Figma Category_Card2 (owner, 2026-11-15): vertical, neutral-700, 6 px radius, 12 px padding, 16 px between the icon (24 px, top left) and the name (Fill width, Hug height, neutral-200, wraps) and the name; no inner block. Rollover (owner's try): neutral-600 and the icon turns filled */}
                  {Icon && (
                    <span className="grid size-6 place-items-center">
                      <Icon weight="duotone" className="size-6 text-(--indigo-300) group-hover:hidden group-focus-visible:hidden" aria-hidden />
                      <Icon weight="fill" className="hidden size-6 text-(--indigo-300) group-hover:block group-focus-visible:block" aria-hidden />
                    </span>
                  )}
                  <span className="w-full max-w-[88px] text-body-sm-medium text-(--neutral-200)">{c.title}</span>
                </button>
              )
            })}
          </div>
        </Section>
        <Section title="Quick sugestions">
          <div className="flex flex-col gap-2"> {/* Command list (owner, 2026-11-15, picked from fourteen layouts): all five questions as rows with a topic icon and a key hint; pressing 1 to 5 asks that question. Icons are made up. */}
            {SUGGESTIONS.map((s, k) => {
              const TopicIcon = TOPIC_ICON[k]
              return (
                <button key={s} type="button" className="group flex cursor-pointer items-center gap-3 rounded-sm bg-(--neutral-700) p-2 text-left outline-none hover:bg-(--neutral-600) focus-visible:bg-(--neutral-600) focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => ask(s)}>
                  <TopicIcon className="size-5 shrink-0 text-(--neutral-300)" aria-hidden />
                  <span className="flex-1 text-body-sm-medium text-(--neutral-200)">{s}</span>
                  <kbd className="grid h-6 min-w-6 shrink-0 place-items-center rounded-xs bg-(--neutral-800) px-1.5 text-meta font-sans whitespace-nowrap text-(--neutral-300)">Shift+{k + 1}</kbd>
                </button>
              )
            })}
          </div>
        </Section>
      </div>
    </div>
  )
}
