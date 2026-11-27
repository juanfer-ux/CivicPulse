import { gsap } from 'gsap'
import { Suspense, lazy, useEffect, useRef, useState, type FormEvent, type CSSProperties } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CaretDown, MapPin, PictureInPicture, Sparkle, ThumbsDown, ThumbsUp } from '@phosphor-icons/react'
import { Alert } from '@/components/ui/alert'
import { setRailSlot } from '@/lib/railSlot'
import { AgentHome } from '@/components/AgentHome'
import { RecurrenceDetailHeader } from '@/components/RecurrenceDetailHeader'
import type { SidebarIncident, SidebarRecurrence } from '@/components/Sidebar'
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
export function InvestigatePanel({ chatId, turns, onTurns, onHighlight, highlightIds, onFocusArea, onZoomArea, recurrenceId = null, emptyFor = null, recurrence = null, incident = null, onOpenRecurrence, onCollapse, placesFor = null, onPlaces }: { incident?: SidebarIncident | null; recurrence?: SidebarRecurrence | null; emptyFor?: 'recurrence' | 'incident' | null; placesFor?: string | null; onPlaces?: (problemId: string | null) => void; onCollapse?: () => void; recurrenceId?: string | null; onOpenRecurrence?: (id: string) => void; chatId: number; turns: Turn[]; onTurns: (id: number, edit: (t: Turn[]) => Turn[]) => void; onHighlight: (ids: string[], areas?: Area[], spots?: string[][]) => void; highlightIds: string[]; onFocusArea: (code: number | null) => void; onZoomArea: (code: number) => void }) {
  const setTurns = (edit: (t: Turn[]) => Turn[]) => onTurns(chatId, edit)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [noteOpen, setNoteOpen] = useState(true) // the AI note under the greeting; its X closes it for this session
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
    <Card className="isolate min-h-0 flex-1 gap-3 overflow-visible bg-ai desk:flex-row desk:gap-0 max-md:gradient-border md:max-desk:rounded-none md:max-desk:border-0 md:max-desk:bg-transparent desk:rounded-none desk:border-0 desk:bg-transparent desk:[--card-spacing:0px]">
      {/* Dotted texture (owner, 2026-11-15; whole panel 2026-11-16): a dot every 8 px (about 2 px wide), colored by a gradient from neutral-900 at the top to neutral-600 at the bottom, made by masking the gradient with the dots; behind everything, from the top of the panel to the bottom (title row, chat and composer), not only the chat area. */}
        {turns.length === 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"> {/* Figma Star (owner's Figma, 2026-11-17, it replaced the ellipse): a four-pointed star, 502 x 502, centered, 305 px below the panel's bottom edge (so only its top points show), a gradient at about 50 degrees from `cobalt-400` (10 %) through `red-300` (61 %) to `yellow-300`, 40 % opacity, blurred 120 in Figma (60 px in CSS); the landing only, it goes once a conversation starts; behind the dots and everything else */}
          <svg ref={star} viewBox="0 0 502 502" className="absolute -bottom-[305px] left-1/2 size-[502px] -translate-x-1/2 opacity-40 blur-[60px]">
            <defs>
              <linearGradient id="agent-star" x1="0" y1="0" x2="0.64" y2="0.77">
                <stop offset="0" stopColor="var(--cobalt-500)" /> {/* owner's Figma Star, 2026-11-27: cobalt-500, indigo-400, red-300 (cobalt-400, red-300, yellow-300 before) */}
                <stop offset="0.27" stopColor="var(--indigo-400)" />
                <stop offset="0.71" stopColor="var(--red-300)" />
              </linearGradient>
            </defs>
            <path fill="url(#agent-star)" d="M 0 0 L 70.65 41.67 C 181.92 107.31 320.07 107.31 431.34 41.67 L 502 0 L 460.32 70.65 C 394.68 181.92 394.68 320.07 460.32 431.34 L 502 502 L 431.34 460.32 C 320.07 394.68 181.92 394.68 70.65 460.32 L 0 502 L 41.67 431.34 C 107.31 320.07 107.31 181.92 41.67 70.65 L 0 0 Z" />
          </svg>
        </div>
        )}
        <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,var(--neutral-900),var(--neutral-600))] ${turns.length ? 'opacity-40' : ''}`} style={{ maskImage: 'radial-gradient(#000 1px, transparent 1.5px)', maskSize: '8px 8px', WebkitMaskImage: 'radial-gradient(#000 1px, transparent 1.5px)', WebkitMaskSize: '8px 8px' }} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* The title row (owner's Figma, 2026-11-12): 60 px (8 px above and below the 44 px collapse button), 16 px at the sides, "Explore" in `label` / neutral-200, a 0.5 px `neutral-600` line under it (owner, 2026-11-16: removed, put back, then set to `neutral-600` like the sidebar line; Figma has none right now), the collapse control at its right: Figma's Sidebar Item Investigation instance, 40 × 44 px, 4 px radius, the `picture-in-picture` icon at 20 px (`PictureInPicture`, regular; owner, 2026-11-16, a try: it was `Minus`, a minimize dash, and before that `panel-left`), `neutral-600` on hover (owner, 2026-11-13; it was a 32 px ghost button with a 16 px arrow). */}
      <div style={recurrence ? ({ '--agent-line': 'var(--neutral-700)' } as CSSProperties) : undefined} className={`flex items-center md:max-desk:hidden desk:shrink-0 desk:border-b-[0.5px] desk:border-(--agent-line,var(--neutral-600)) ${turns.length === 0 ? 'desk:h-17' : 'desk:h-(--agent-header-h)'}`}> {/* the line is `neutral-600` (owner's Figma Header, 2026-11-26), `neutral-700` with a recurrence open */}
        <div ref={setRailSlot} className="hidden h-full shrink-0 [:root[data-sidebar-collapsed]_&]:desk:block" /> {/* the collapsed sidebar's logo box (64 x 68, `black`, a line under it) is the first cell of the header row, not a column down the panel (owner's Figma, 2026-11-20: the sidebar left the Agent Panel and the logo box became part of its Header); empty while the sidebar is open */} {/* Figma title row (owner, 2026-11-17, latest): 68 px high, two cells side by side: a 44 px cell with the expand button (40 x 44, 2 px at the sides; invisible while the sidebar is expanded, so nothing moves) and the rest, 16 px in, with a 0.5 px `neutral-600` line at its left and under both; the rest holds the title, the collapse button and a 40 px empty space at the right. The conversation's Figma row still has the older layout. */}
        <div className="flex h-full flex-1 items-center">
          <CardHeader className="flex w-full flex-row items-center gap-2.5 max-desk:mx-auto max-desk:max-w-[664px] desk:px-8"> {/* Figma title row (owner's Figma, 2026-11-17): 32 px at the sides, "Explore" (fills), the place (map-pin, "Bogotá, Colombia", a chevron; no menu yet) and the collapse button */}
            {/* with a recurrence open the title is its street (owner's Figma, 2026-11-24, Agent Panel · Empty · Recurrence) */}
            <CardTitle asChild className={`flex-1 text-label ${recurrence || incident ? 'text-(--fg-emphasis)' : 'text-(--fg-secondary)'}`}>
              <h2 className="truncate" title={recurrence?.address}>{recurrence?.address ?? 'Explore'}</h2>
            </CardTitle>
            <span className="hidden items-center gap-2 px-4 text-body-sm text-(--fg-secondary) desk:flex">
              <span className="flex items-center gap-1"><MapPin weight="regular" className="size-3.5 text-(--neutral-300)" aria-hidden />Bogotá, Colombia</span>
              <CaretDown weight="regular" className="size-[18px] text-(--neutral-200)" aria-hidden />
            </span>
            {onCollapse && (
              <button type="button" aria-label="Collapse agent" title="Collapse agent" onClick={onCollapse} className="hidden h-11 w-10 shrink-0 cursor-pointer place-items-center rounded-sm text-(--neutral-100) outline-none hover:bg-(--neutral-600) focus-visible:ring-3 focus-visible:ring-ring/50 desk:grid">
                <PictureInPicture weight="regular" className="size-5" />
              </button>
            )}
          </CardHeader>
        </div>
      </div>
      {recurrence && <RecurrenceDetailHeader category={recurrence.category ?? recurrence.title} reference={recurrence.reference} locality={recurrence.locality} status={recurrence.status} />} {/* every recurrence, with or without a conversation (owner, 2026-11-24): Figma Recurrence Detail Header */}
      {!recurrence && incident && <RecurrenceDetailHeader category={incident.category ?? incident.title} reference={incident.reference} locality={incident.locality} group={incident.group} />} {/* an open incident has the same strip (owner's Figma, 2026-11-26) */}
      <CardContent className={`flex min-h-0 flex-1 flex-col gap-3 desk:gap-0 desk:p-0`}> {/* the body and the chat area are centered in the whole panel (the sidebar's rail is a header cell now, owner's Figma 2026-11-20, so nothing is reserved at a side). The padding is on the content INSIDE the scroll area, never on the scroll area: the scrollbar stays on the panel's own edge. */}
        {/* The scrollbar sits on the panel's own edge (owner, 2026-11-05): the scroll area is full width and the centered column is inside it. */}
        <div className="relative min-h-0 flex-1">
        <ScrollArea className="relative h-full" viewportClassName={turns.length === 0 ? '[&>div]:!flex [&>div]:min-h-full [&>div]:flex-col' : '[&>div]:!block'}> {/* the landing's group is centered vertically between the strip and the composer (owner, 2026-11-17, with a screenshot; Figma's body is centered both ways); taller content scrolls from the top; a conversation starts at the top */}
        <div className={`flex w-full flex-1 flex-col`}>
        <div className={`flex w-full flex-col gap-3 text-body ${turns.length === 0 ? 'flex-1' : ''} max-desk:mx-auto max-desk:max-w-[800px] desk:mx-auto desk:max-w-[calc(var(--agent-content-w)+32px)] desk:gap-8 desk:px-4 desk:py-12`}> {/* the landing's body is top-aligned (owner's Figma, 2026-11-17): the summary card sits at the top and the dashboard fills the rest and centers its own content */}
          {turns.length === 0 && !emptyFor && <AgentHome ask={(q) => void ask(q)} note={noteOpen && (
            <Alert className="hidden desk:flex" icon={<Sparkle weight="fill" className="size-5" aria-hidden />} onClose={() => setNoteOpen(false)}>
              CivicPulse AI groups related reports into patterns. Nothing goes to the authorities until you’ve reviewed it. Final decision rests with the responsible official.
            </Alert>
          )} />}
          {turns.length === 0 && emptyFor && (
            <div className="flex flex-1 items-center justify-center px-8 text-center"> {/* Empty state (owner, 2026-11-23): a recurrence with no conversation and no history shows an empty agent panel with one hint line (Figma Agent Panel · Empty) */}
              <p className="max-w-[320px] text-body-sm text-(--fg-secondary)">No conversation about this {emptyFor} yet. Ask the agent anything about it.</p>
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className="flex flex-col gap-4 desk:gap-6"> {/* 24 px between a question and its answer on desktop (owner's Figma, 2026-11-24; it was 20, 16 before) */}
              <Question text={t.question} />
              {!t.result && !t.error && <p className="text-muted-foreground">Querying…</p>}
              {t.error && <p className="text-incident">{t.error}</p>}
              {t.result && <AnswerView result={t.result} placesOn={placesFor} onPlaces={onPlaces} shown={t.result.highlightIds === highlightIds} onFocusArea={onFocusArea} onZoomArea={onZoomArea} onPickRecurrence={onOpenRecurrence} onToggle={(on) => onHighlight(on ? t.result!.highlightIds : [], on ? t.result!.areas : [], on ? t.result!.spots : [])} />}
            </div>
          ))}
          <div ref={end} />
        </div>
        </div>
        </ScrollArea>
        </div>
        <div className="w-full">
        <form onSubmit={onSubmit} className={`flex w-full max-w-[800px] items-center gap-2 max-desk:flex-row desk:flex-col desk:items-stretch desk:gap-3 max-desk:mx-auto desk:mx-auto desk:shrink-0 desk:px-4 desk:py-5 desk:max-w-[calc(var(--agent-content-w)+32px)]`}> {/* the same maximum width in every agent panel (owner, 2026-11-16): 816 with its 48 px sides, a 720 px Composer, on the landing and in a conversation */}
          <div className="relative z-10"><Composer value={text} onChange={setText} busy={busy} /></div>
        </form>
        </div>
      </CardContent>
      </div>
    </Card>
  )
}

/** The person's question (Figma Message, role user). */
export function Question({ text }: { text: string }) {
  return <p className="self-end rounded-lg bg-(--neutral-800) p-3 text-(--fg-secondary)">{text}</p>
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

export function AnswerView({ result, shown, onToggle, onFocusArea, onZoomArea, onPickRecurrence, placesOn = null, onPlaces }: { result: Answer; shown: boolean; placesOn?: string | null; onPlaces?: (problemId: string | null) => void; onToggle: (on: boolean) => void; onFocusArea?: (code: number | null) => void; onZoomArea?: (code: number) => void; onPickRecurrence?: (id: string) => void }) {
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
      {/* The evidence details are not shown either (owner, 2026-11-23, with the limitations): `Answer.evidence` is still filled. */}
      {/* The numbered limitations are not shown under any answer (owner, 2026-11-23: "remove all these disclaimers, on each question"). The Answer still carries them (`limitations`), and the tests read them. */}
      {result.offers?.map((o) => (
        <ModuleOffer key={`${o.type}-${o.problemId}`} offer={o} />
      ))}
      {result.highlightIds.length > 0 && (
        <Button size="sm" variant="outline" className="self-start border-[0.5px] border-(--neutral-400) bg-(--neutral-900) px-3" onClick={() => onToggle(!shown)}> {/* answer actions are outline small buttons (owner's Figma, 2026-11-17) */}
          {shown ? 'Clear map highlight' : 'Show on map'}
        </Button>
      )}
      {result.places && onPlaces && (
        <Button size="sm" variant="outline" className="self-start border-[0.5px] border-(--neutral-400) bg-(--neutral-900) px-3" onClick={() => onPlaces(placesOn === result.places!.problemId ? null : result.places!.problemId)}>
          {placesOn === result.places.problemId ? 'Hide places on map' : 'Show places on map'}
        </Button>
      )}
      <Feedback />
    </div>
  )
}
