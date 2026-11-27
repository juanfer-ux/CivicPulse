import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { BarList } from '@/components/BarList'
import { donutTone } from '@/lib/donutTones'
import type { Answer } from '@/lib/agent'

/** The agent's answer charts (shadcn Chart on Recharts), in the app's own colors. No grow-in animation (owner, 2026-11-05): the bars and the area appear at once, and do not replay when the panel is resized. Fetched right after the app loads (see InvestigatePanel), so no placeholder is needed. */
const config = { value: { label: 'Incidents', color: 'var(--ai-border)' } } satisfies ChartConfig
const tick = { fill: 'var(--muted-foreground)', fontSize: 12 }
const grid = 'var(--secondary)'
const tooltip = <ChartTooltipContent hideLabel />

/** Screen readers get the numbers as text, since a chart is a picture. */
const summary = (title: string, bars: Answer['bars']) => `${title}: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}`

type Link = { onFocus?: (code: number | null) => void; onPick?: (code: number) => void }
type Bar = Answer['bars'][number]
/** The ranked shade of a bar, dot or slice, biggest first (owner's Figma, 2026-11-26). */
const tone = (i: number) => ({ background: donutTone(i).color, opacity: donutTone(i).opacity })
const NUMBER = 'grid size-10 shrink-0 place-items-center rounded-full bg-(--black) text-subtitle-strong'

/** Localities of one category: parts of the whole, the smaller localities together as "Others". The legend shows the count and the share. */
function Donut({ bars, onFocus, onPick }: { bars: Answer['bars'] } & Link) {
  const total = bars.reduce((s, b) => s + b.value, 0)
  return (
    <div className="flex items-center gap-3 px-2" role="img" aria-label={summary('Donut chart', bars)}>
      <div className="grid w-[180px] shrink-0 place-items-center">
        <ChartContainer config={config} className="size-[150px]">
          <PieChart>
            <ChartTooltip content={tooltip} />
            <Pie data={bars} dataKey="value" nameKey="label" innerRadius={42} outerRadius={70} paddingAngle={2} isAnimationActive={false} stroke="none" cursor={onPick ? 'pointer' : undefined} onMouseEnter={(_, i) => onFocus?.(bars[i].code ?? null)} onMouseLeave={() => onFocus?.(null)} onClick={(_, i) => bars[i].code && onPick?.(bars[i].code!)}>
              {bars.map((b, i) => (
                <Cell key={b.label} fill={donutTone(i).color} fillOpacity={donutTone(i).opacity} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-3 px-2 text-meta text-muted-foreground">
        {bars.map((b, i) => (
          <li key={b.label} className="flex items-center gap-2" onMouseEnter={() => b.code && onFocus?.(b.code)} onMouseLeave={() => onFocus?.(null)}>
            <span className="size-2 shrink-0 rounded-full" style={tone(i)} />
            <span className="truncate">{b.label}</span>
            <span className="ml-auto text-meta-medium tabular-nums text-foreground">
              {b.value} · {Math.round((b.value / total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Repeated locations: one dot per report, so the count is something you can count. */
function Dots({ bars }: { bars: Answer['bars'] }) {
  return (
    <ul className="flex flex-col gap-2.5" aria-label={summary('Reports per location', bars)}>
      {bars.map((b, row) => (
        <li key={b.label} className="flex flex-col gap-1">
          <span className="flex items-baseline gap-1.5 text-meta"> {/* Figma Dot Matrix: the count sits right after the name, 6 px (owner, 2026-11-17), it was pushed to the right */}
            <span className="truncate text-muted-foreground">{b.label}</span>
            <span className="shrink-0 tabular-nums text-foreground">{b.value}</span>
          </span>
          <span className="flex flex-wrap gap-1">
            {Array.from({ length: b.value }, (_, i) => (
              <span key={i} className="size-2.5 rounded-full" style={tone(row)} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Tomorrow's candidates: numbered rows, the name on top, a thin bar under it and the count on the right (Figma **Answer Chart · Rows**). */
function Rows({ bars }: { bars: Answer['bars'] }) {
  const max = Math.max(...bars.map((b) => b.value))
  return (
    <ul className="flex flex-col gap-1" aria-label={summary('Evening incidents per candidate', bars)}>
      {bars.map((b, i) => (
        <li key={b.label} className="flex items-center gap-4 py-2">
          <span className={`${NUMBER} border-2 border-(--neutral-800) text-(--fg-primary)`}>{i + 1}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-meta text-foreground" title={b.label}>
              {b.label}
            </span>
            <span className="h-2 overflow-hidden rounded-xs bg-(--neutral-600)">
              <span className="block h-full" style={{ width: `${(b.value / max) * 100}%`, ...tone(i) }} />
            </span>
          </span>
          <span className="w-8 text-right text-body-strong tabular-nums text-foreground">{b.value}</span>
        </li>
      ))}
    </ul>
  )
}

/** Recurrences the agent ranked (owner, 2026-11-09): numbered rows like the candidates', each a button that opens that recurrence on the map; the bar and the count are its returns (occurrences minus one). */
function Recurrences({ bars, onPick }: { bars: Answer['bars']; onPick?: (id: string) => void }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <ul className="flex flex-col gap-1" aria-label={summary('Returns per recurrence', bars)}>
      {bars.map((b, i) => (
        <li key={b.problemId ?? b.label}>
          <button type="button" onClick={() => b.problemId && onPick?.(b.problemId)} className="flex w-full items-center gap-4 rounded-sm px-1 py-2 text-left hover:bg-(--neutral-800) focus-visible:bg-(--neutral-800)">
            <span className={`${NUMBER} border-2 border-(--cobalt-700) text-(--fg-secondary)`}>{i + 1}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="truncate text-meta text-foreground" title={b.label}>
                {b.label}
              </span>
              <span className="h-1 rounded-xs bg-(--neutral-600)">
                <span className="block h-full rounded-xs" style={{ width: `${(b.value / max) * 100}%`, ...tone(i) }} />
              </span>
              {b.sub && <span className="truncate text-caption-medium text-(--fg-tertiary)">{b.sub}</span>}
            </span>
            <span className="flex w-14 flex-col items-center justify-between self-stretch px-1">
              <span className="text-body-strong tabular-nums text-foreground">{b.value}</span>
              <span className="text-body-sm text-muted-foreground">returns</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Time({ bars }: { bars: Answer['bars'] }) {
  return (
    <ChartContainer config={config} className="h-[180px] w-full" role="img" aria-label={summary('Incidents by time of day', bars)}>
      <AreaChart data={bars} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ ...tick, fontSize: 11 }} interval={0} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area dataKey="value" isAnimationActive={false} type="monotone" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.2} />
      </AreaChart>
    </ChartContainer>
  )
}

function Period({ bars }: { bars: Answer['bars'] }) {
  return (
    <ChartContainer config={config} className="h-[150px] w-full" role="img" aria-label={summary('Two periods compared', bars)}>
      <BarChart data={bars} margin={{ top: 16 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
        <ChartTooltip cursor={false} content={tooltip} />
        <Bar dataKey="value" isAnimationActive={false} fill="var(--color-value)" radius={4} barSize={48}>
          <LabelList dataKey="value" position="top" fill="var(--foreground)" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** The places around a recurrence (owner, 2026-11-23): one row each, nearest first, its name and its distance in metres. */
function Places({ bars }: { bars: Answer['bars'] }) {
  return (
    <ul className="flex flex-col" aria-label={summary('Distance in metres to each place', bars)}>
      {bars.map((b, i) => (
        <li key={b.label + i} className={`flex items-center gap-3 py-2 ${i ? 'border-t border-(--neutral-600)' : ''}`}>
          <span className="size-2 shrink-0 rounded-[1px] bg-(--neutral-100)" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-body-sm text-foreground" title={b.label}>{b.label}</span>
          <span className="shrink-0 text-body-sm tabular-nums text-(--neutral-300)">{b.value} m</span>
        </li>
      ))}
    </ul>
  )
}

export default function AnswerChart({ kind, bars, onFocus, onPick, onPickRecurrence }: { kind: NonNullable<Answer['chart']>; bars: Answer['bars']; onPickRecurrence?: (id: string) => void } & Link) {
  const dark = kind === 'donut' || kind === 'barlist' || kind === 'rows' || kind === 'recurrences' // owner's Figma, 2026-11-26: these sit on the darker card
  return (
    <div className={dark ? `rounded-lg border border-(--neutral-700) bg-(--neutral-900) ${kind === 'barlist' ? 'p-[15px]' : 'p-4'}` : 'rounded-lg border-[0.5px] border-(--neutral-700) bg-(--neutral-700) p-4'}>
      {kind === 'time' ? <Time bars={bars} /> : kind === 'period' ? <Period bars={bars} /> : kind === 'dots' ? <Dots bars={bars} /> : kind === 'rows' ? <Rows bars={bars} /> : kind === 'places' ? <Places bars={bars} /> : kind === 'recurrences' ? <Recurrences bars={bars} onPick={onPickRecurrence} /> : kind === 'donut' ? <Donut bars={bars} onFocus={onFocus} onPick={onPick} /> : <BarList bars={bars} onFocus={onFocus} onPick={onPick} />}
    </div>
  )
}
