import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
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
const COLOR = 'var(--ai-border)'
const shade = (i: number, n: number) => 1 - (i / Math.max(n, 1)) * 0.75 // the biggest slice is the strongest; "Others" is the lightest

/** Localities of one category: parts of the whole, the smaller localities together as "Others". The legend shows the count and the share. */
function Donut({ bars, onFocus, onPick }: { bars: Answer['bars'] } & Link) {
  const total = bars.reduce((s, b) => s + b.value, 0)
  return (
    <div className="flex items-center gap-4" role="img" aria-label={summary('Donut chart', bars)}>
      <ChartContainer config={config} className="size-[150px] shrink-0">
        <PieChart>
          <ChartTooltip content={tooltip} />
          <Pie data={bars} dataKey="value" nameKey="label" innerRadius={42} outerRadius={70} paddingAngle={2} isAnimationActive={false} stroke="none" cursor={onPick ? 'pointer' : undefined} onMouseEnter={(_, i) => onFocus?.(bars[i].code ?? null)} onMouseLeave={() => onFocus?.(null)} onClick={(_, i) => bars[i].code && onPick?.(bars[i].code!)}>
            {bars.map((b, i) => (
              <Cell key={b.label} fill={COLOR} fillOpacity={shade(i, bars.length)} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex min-w-0 flex-1 flex-col gap-1 text-meta text-muted-foreground">
        {bars.map((b, i) => (
          <li key={b.label} className="flex items-center gap-2" onMouseEnter={() => b.code && onFocus?.(b.code)} onMouseLeave={() => onFocus?.(null)}>
            <span className="size-2 shrink-0 rounded-full" style={{ background: COLOR, opacity: shade(i, bars.length) }} />
            <span className="truncate">{b.label}</span>
            <span className="ml-auto tabular-nums text-foreground">
              {b.value} · {Math.round((b.value / total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Localities of all categories: Tremor's bar list (the bar sits behind the label, the number on the right). */
function BarList({ bars, onFocus, onPick }: { bars: Answer['bars'] } & Link) {
  const max = Math.max(...bars.map((b) => b.value))
  return (
    <ul className="flex flex-col gap-1.5 text-body-sm" aria-label={summary('Bar list', bars)}>
      {bars.map((b) => (
        <li key={b.label} className="flex items-center gap-3">
          <button type="button" disabled={!b.code || !onPick} onMouseEnter={() => b.code && onFocus?.(b.code)} onMouseLeave={() => onFocus?.(null)} onClick={() => b.code && onPick?.(b.code)} className="relative h-8 flex-1 overflow-hidden rounded-sm bg-(--neutral-600) text-left enabled:cursor-pointer">
            <span className="absolute inset-y-0 left-0 rounded-sm opacity-60" style={{ width: `${(b.value / max) * 100}%`, background: COLOR }} />
            <span className="relative flex h-full items-center px-2 text-foreground">{b.label}</span>
          </button>
          <span className="w-8 text-right tabular-nums text-foreground">{b.value}</span>
        </li>
      ))}
    </ul>
  )
}

/** Repeated locations: one dot per report, so the count is something you can count. */
function Dots({ bars }: { bars: Answer['bars'] }) {
  return (
    <ul className="flex flex-col gap-2.5" aria-label={summary('Reports per location', bars)}>
      {bars.map((b) => (
        <li key={b.label} className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between gap-3 text-meta">
            <span className="truncate text-muted-foreground">{b.label}</span>
            <span className="shrink-0 tabular-nums text-foreground">{b.value}</span>
          </span>
          <span className="flex flex-wrap gap-1">
            {Array.from({ length: b.value }, (_, i) => (
              <span key={i} className="size-2.5 rounded-full" style={{ background: COLOR }} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Tomorrow's candidates: a big number per location (the three strongest). */
function Cards({ bars }: { bars: Answer['bars'] }) {
  return (
    <ul className="grid grid-cols-3 gap-2" aria-label={summary('Evening incidents per candidate', bars)}>
      {bars.slice(0, 3).map((b: Bar) => (
        <li key={b.label} className="flex min-w-0 flex-col gap-1 rounded-sm bg-(--neutral-600) p-2">
          <span className="truncate text-caption text-muted-foreground">{b.label}</span>
          <span className="text-stat text-foreground">{b.value}</span>
          <span className="text-caption text-muted-foreground">evening incidents</span>
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

export default function AnswerChart({ kind, bars, onFocus, onPick }: { kind: NonNullable<Answer['chart']>; bars: Answer['bars'] } & Link) {
  return (
    <div className="rounded-[6px] border-[0.5px] border-(--neutral-500) bg-(--neutral-700) p-4">
      {kind === 'time' ? <Time bars={bars} /> : kind === 'period' ? <Period bars={bars} /> : kind === 'dots' ? <Dots bars={bars} /> : kind === 'cards' ? <Cards bars={bars} /> : kind === 'donut' ? <Donut bars={bars} onFocus={onFocus} onPick={onPick} /> : <BarList bars={bars} onFocus={onFocus} onPick={onPick} />}
    </div>
  )
}
