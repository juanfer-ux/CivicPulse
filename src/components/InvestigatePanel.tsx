import { gsap } from 'gsap'
import { Suspense, lazy, useEffect, useRef, useState, type FormEvent } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CaretDown, MapPin, PictureInPicture, SidebarSimple, ThumbsDown, ThumbsUp } from '@phosphor-icons/react'
import mark from '@/assets/logo-mark.svg'
import { AgentHome } from '@/components/AgentHome'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Composer } from '@/components/Composer'
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
  const star = useRef<SVGSVGElement>(null)
  const onLanding = turns.length === 0
  // The star glow breathes (owner, 2026-11-17): its opacity eases from 0.4 down to 0.12 and back, 3 s each way, forever (0.32 was almost invisible, owner 2026-11-17); still with reduced motion. It lives only on the landing, so the loop stops when a conversation starts.
  useEffect(() => {
    if (!onLanding || !star.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tween = gsap.fromTo(star.current, { opacity: 0.4 }, { opacity: 0.12, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true })
    return () => { tween.kill() }
  }, [onLanding])

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
    <Card className="isolate min-h-0 flex-1 gap-3 overflow-visible bg-ai desk:gap-0 max-md:gradient-border md:max-desk:rounded-none md:max-desk:border-0 md:max-desk:bg-transparent desk:rounded-none desk:border-0 desk:bg-transparent desk:[--card-spacing:0px]">
      {/* Dotted texture (owner, 2026-11-15; whole panel 2026-11-16): a dot every 8 px (about 2 px wide), colored by a gradient from neutral-900 at the top to neutral-600 at the bottom, made by masking the gradient with the dots; behind everything, from the top of the panel to the bottom (title row, chat and composer), not only the chat area. */}
        {turns.length === 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"> {/* Figma Star (owner's Figma, 2026-11-17, it replaced the ellipse): a four-pointed star, 502 x 502, centered, 305 px below the panel's bottom edge (so only its top points show), a gradient at about 50 degrees from `indigo-400` (10 %) through `red-300` (61 %) to `yellow-300`, 40 % opacity, blurred 120 in Figma (60 px in CSS); the landing only, it goes once a conversation starts; behind the dots and everything else */}
          <svg ref={star} viewBox="0 0 502 502" className="absolute -bottom-[305px] left-1/2 size-[502px] -translate-x-1/2 opacity-40 blur-[60px]">
            <defs>
              <linearGradient id="agent-star" x1="0" y1="0" x2="0.64" y2="0.77">
                <stop offset="0.1" stopColor="var(--indigo-400)" />
                <stop offset="0.61" stopColor="var(--red-300)" />
                <stop offset="1" stopColor="var(--yellow-300)" />
              </linearGradient>
            </defs>
            <path fill="url(#agent-star)" d="M 0 0 L 70.65 41.67 C 181.92 107.31 320.07 107.31 431.34 41.67 L 502 0 L 460.32 70.65 C 394.68 181.92 394.68 320.07 460.32 431.34 L 502 502 L 431.34 460.32 C 320.07 394.68 181.92 394.68 70.65 460.32 L 0 502 L 41.67 431.34 C 107.31 320.07 107.31 181.92 41.67 70.65 L 0 0 Z" />
          </svg>
        </div>
        )}
        <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,var(--neutral-900),var(--neutral-600))] ${turns.length ? 'opacity-40' : ''}`} style={{ maskImage: 'radial-gradient(#000 1px, transparent 1.5px)', maskSize: '8px 8px', WebkitMaskImage: 'radial-gradient(#000 1px, transparent 1.5px)', WebkitMaskSize: '8px 8px' }} />
      {/* The title row (owner's Figma, 2026-11-12): 60 px (8 px above and below the 44 px collapse button), 16 px at the sides, "Explore" in `label` / neutral-200, a 0.5 px `neutral-600` line under it (owner, 2026-11-16: removed, put back, then set to `neutral-600` like the sidebar line; Figma has none right now), the collapse control at its right: Figma's Sidebar Item Investigation instance, 40 × 44 px, 4 px radius, the `picture-in-picture` icon at 20 px (`PictureInPicture`, regular; owner, 2026-11-16, a try: it was `Minus`, a minimize dash, and before that `panel-left`), `neutral-600` on hover (owner, 2026-11-13; it was a 32 px ghost button with a 16 px arrow). */}
      <div className={`flex items-center md:max-desk:hidden desk:shrink-0 desk:border-b-[0.5px] desk:border-(--neutral-600) ${turns.length === 0 ? 'desk:h-17' : 'desk:h-(--agent-header-h)'}`}> {/* Figma title row (owner, 2026-11-17, latest): 68 px high, two cells side by side: a 44 px cell with the expand button (40 x 44, 2 px at the sides; invisible while the sidebar is expanded, so nothing moves) and the rest, 16 px in, with a 0.5 px `neutral-600` line at its left and under both; the rest holds the title, the collapse button and a 40 px empty space at the right. The conversation's Figma row still has the older layout. */}
        <div className="hidden h-full w-16 shrink-0 items-center justify-center border-r-[0.5px] border-(--neutral-700) px-3 py-2 [:root[data-sidebar-collapsed]_&]:desk:flex"> {/* Figma "Logo (collapsed) container" (owner's Figma, 2026-11-17): while the sidebar is collapsed it is gone, and the logo mark sits here, a 40 px button that expands it; while the sidebar is open the container is not drawn */}
          <button type="button" aria-label="Expand menu" title="Expand menu" onClick={() => window.dispatchEvent(new Event('sidebar-expand'))} className="group grid size-10 shrink-0 cursor-pointer place-items-center rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <img src={mark} alt="" width={40} height={40} className="group-hover:hidden group-focus-visible:hidden" /> {/* the rollover is kept (owner, 2026-11-17): on hover or focus the logo swaps for the panel icon, mirrored, as it did in the collapsed sidebar */}
            <SidebarSimple weight="regular" className="hidden size-5 -scale-x-100 group-hover:block group-focus-visible:block" aria-hidden />
          </button>
        </div>
        <div className="flex h-full flex-1 items-center">
          <CardHeader className="flex w-full flex-row items-center gap-2.5 max-desk:mx-auto max-desk:max-w-[664px] desk:px-8"> {/* Figma title row (owner's Figma, 2026-11-17): 32 px at the sides, "Explore" (fills), the place (map-pin, "Bogotá, Colombia", a chevron; no menu yet) and the collapse button */}
            <CardTitle asChild className="flex-1 text-label text-(--neutral-200)">
              <h2>Explore</h2>
            </CardTitle>
            <span className="hidden items-center gap-2 px-4 text-body-sm text-(--neutral-200) desk:flex">
              <span className="flex items-center gap-1"><MapPin weight="regular" className="size-3.5" aria-hidden />Bogotá, Colombia</span>
              <CaretDown weight="regular" className="size-[18px]" aria-hidden />
            </span>
            {onCollapse && (
              <button type="button" aria-label="Collapse agent" title="Collapse agent" onClick={onCollapse} className="hidden h-11 w-10 shrink-0 cursor-pointer place-items-center rounded-sm text-(--neutral-100) outline-none hover:bg-(--neutral-600) focus-visible:ring-3 focus-visible:ring-ring/50 desk:grid">
                <PictureInPicture weight="regular" className="size-5" />
              </button>
            )}
          </CardHeader>
        </div>
      </div>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 desk:gap-0 desk:p-0">
        {/* The scrollbar sits on the panel's own edge (owner, 2026-11-05): the scroll area is full width and the centered column is inside it. */}
        <div className="relative min-h-0 flex-1">
        <ScrollArea className="relative h-full" viewportClassName={turns.length === 0 ? '[&>div]:!flex [&>div]:min-h-full [&>div]:flex-col' : '[&>div]:!block'}> {/* the landing's group is centered vertically between the strip and the composer (owner, 2026-11-17, with a screenshot; Figma's body is centered both ways); taller content scrolls from the top; a conversation starts at the top */}
        <div className={`flex w-full flex-col gap-3 text-body ${turns.length === 0 ? 'flex-1' : ''} max-desk:mx-auto max-desk:max-w-[800px] desk:mx-auto desk:max-w-[816px] desk:gap-8 desk:px-12 desk:py-8`}> {/* the landing's body is top-aligned (owner's Figma, 2026-11-17): the summary card sits at the top and the dashboard fills the rest and centers its own content */}
          {turns.length === 0 && <AgentHome ask={(q) => void ask(q)} />}
          {turns.map((t, i) => (
            <div key={i} className="flex flex-col gap-4 desk:gap-5"> {/* 20 px between a question and its answer on desktop (owner's Figma, 2026-11-17; it was 16) */}
              <Question text={t.question} />
              {!t.result && !t.error && <p className="text-muted-foreground">Querying…</p>}
              {t.error && <p className="text-incident">{t.error}</p>}
              {t.result && <AnswerView result={t.result} shown={t.result.highlightIds === highlightIds} onFocusArea={onFocusArea} onZoomArea={onZoomArea} onPickRecurrence={onOpenRecurrence} onToggle={(on) => onHighlight(on ? t.result!.highlightIds : [], on ? t.result!.areas : [], on ? t.result!.spots : [])} />}
            </div>
          ))}
          <div ref={end} />
        </div>
        </ScrollArea>
        </div>
        <form onSubmit={onSubmit} className={`flex w-full max-w-[800px] items-center gap-2 max-desk:flex-row desk:flex-col desk:items-stretch desk:gap-1.5 max-desk:mx-auto desk:mx-auto desk:shrink-0 desk:px-12 desk:py-2.5 desk:max-w-[816px]`}> {/* the same maximum width in every agent panel (owner, 2026-11-16): 816 with its 48 px sides, a 720 px Composer, on the landing and in a conversation */}
          <Composer value={text} onChange={setText} busy={busy} />
          <p className="hidden text-center text-[11px]/4 tracking-[0.05em] text-(--neutral-300) desk:block">Civic Pulse AI supports decisions and may contain errors. Verify before acting. The final decision rests with the responsible official.</p> {/* Figma chat area (owner's Figma, 2026-11-17): the note is under the composer in the landing and in a conversation, 11 / 16 Manrope Regular with 5 % spacing, `neutral-300` (owner's Figma, 2026-11-17; it was `neutral-200`); the text is the institutional one (owner, 2026-11-17: decision support, verify, the responsible official decides; no "legal advice", no Terms link) */}
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
      {result.bars.length === 0 && <p className="text-muted-foreground">{result.text}</p>}
      {result.bars.length > 0 && (
        <div className="w-full max-w-(--chart-max-w)"> {/* charts and graphs in the conversation are narrower than the text column (owner, 2026-11-15) */}
          {result.chart ? (
            <Suspense fallback={null}>
              <AnswerChart kind={result.chart} bars={result.bars} onPickRecurrence={onPickRecurrence} {...link} />
            </Suspense>
          ) : (
            <Bars bars={result.bars} {...link} />
          )}
        </div>
      )}
      {result.bars.length > 0 && <p className="text-muted-foreground">{result.text}</p>} {/* an answer with a chart or bars: the text goes under the graphic, every time (owner, 2026-11-17) */}
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
      {result.limitations.length > 0 && (
      <ul className="flex flex-col text-meta text-muted-foreground">
        {result.limitations.map((l, i) => (
          <li key={l} className="flex items-start gap-3 border-b border-(--neutral-600) py-2.5 last:border-b-0">
            <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-(--neutral-600) text-caption-strong text-(--neutral-100)">{i + 1}</span>
            <span className="pt-0.5">{l}</span>
          </li>
        ))}
      </ul>
      )}
      {result.offers?.map((o) => (
        <ModuleOffer key={`${o.type}-${o.problemId}`} offer={o} />
      ))}
      {result.highlightIds.length > 0 && (
        <Button size="sm" variant="outline" className="self-start border-[0.5px] border-(--neutral-400) bg-(--neutral-900) px-3" onClick={() => onToggle(!shown)}> {/* answer actions are outline small buttons (owner's Figma, 2026-11-17) */}
          {shown ? 'Clear map highlight' : 'Show on map'}
        </Button>
      )}
      <Feedback />
    </div>
  )
}
