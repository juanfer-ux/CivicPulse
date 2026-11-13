import type { ReactNode } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { SUGGESTIONS, WORTH_INVESTIGATING } from '@/lib/agent'

/** The agent panel's landing (owner's Figma, 2026-11-12: Agent Panel, Welcome_Module, CatchUp_Module, Worth-Investigating_Module, Quick Questions): a greeting and three sections, each a Welcome_Module with a title row and a caret that folds it. Data overview and the category pictures are still placeholders (Figma's numbers); the questions are real and ask the agent. */
const SHARE: [string, number][] = [['Chapinero', 62], ['Suba', 52], ['Kennedy', 43], ['Engativá', 36], ['Others', 61]] // placeholder: Figma's numbers until the data comes from the incidents
const STEPS = [1, 0.85, 0.7, 0.55, 0.4] // indigo-400, fading from the biggest slice
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

/** Figma Data_Card_Small / Data_Card_Medium: 6 px radius, `neutral-700` fill, 0.5 px `neutral-500` line, 8 px padding and a name in `body-sm`. */
const dataCard = 'flex flex-col gap-1 rounded-md bg-(--neutral-700) p-2'
const cardName = 'p-1 text-meta text-(--neutral-100)'

function Donut() {
  const R = 52.28 // the ring's middle radius: outer diameter 130.7, inner radius 60 % of it (the owner's Figma donut, 2026-11-12), in a 140 box
  const C = 2 * Math.PI * R
  return (
    <svg viewBox="0 0 140 140" className="size-[140px] shrink-0 -rotate-90" role="img" aria-label="Share of reports by locality">
      {SHARE.map(([name, n], i) => {
        const len = (n / total) * C
        const start = (SHARE.slice(0, i).reduce((a, [, k]) => a + k, 0) / total) * C
        return <circle key={name} cx="70" cy="70" r={R} fill="none" stroke="var(--indigo-400)" strokeOpacity={STEPS[i]} strokeWidth="26.14" strokeDasharray={`${len - 1.9} ${C - len + 1.9}`} strokeDashoffset={-start} />
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
          <div className="grid grid-cols-[minmax(180px,1fr)_minmax(372px,1fr)] gap-4">
            <div className="flex flex-col gap-4">
              {[0, 1].map((i) => (
                <div key={i} className={dataCard}>
                  <p className={cardName}>Data card name</p>
                  <div className="h-[50px] rounded-sm bg-(--neutral-800)" aria-hidden />
                </div>
              ))}
            </div>
            <div className={dataCard}>
              <p className={cardName}>Data card name</p>
              <div className="flex items-center gap-4 p-2">
                <Donut />
                <ul className="flex max-w-[200px] min-w-0 flex-1 flex-col gap-1 px-1 text-body-sm">
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
          <div className="grid grid-cols-3 gap-4">
            {WORTH_INVESTIGATING.map((c) => (
              <button key={c.title} type="button" className="flex cursor-pointer flex-col gap-1.5 rounded-lg bg-(--neutral-700) p-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => ask(c.question)}>
                <span className="h-20 rounded-sm bg-[#1c2b3f]" aria-hidden /> {/* Figma's flat Photo_category placeholder (a color without a variable) until the owner adds icons */}
                <span className="truncate p-1 text-meta text-(--neutral-100)">{c.title}</span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Quick sugestions">
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="flex w-full cursor-pointer gap-3 rounded-sm border border-(--neutral-700) p-3 text-left outline-none hover:bg-(--neutral-800) focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => ask(s)}>
                <ArrowRight className="mt-1.5 size-3 shrink-0 text-(--neutral-300)" aria-hidden />
                <span className="line-clamp-4 text-body-sm-medium text-(--neutral-200)">{s}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
