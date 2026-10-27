import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { Answer } from '@/lib/agent'

/** The agent's answer charts (shadcn Chart on Recharts), in the app's own colors. Fetched right after the app loads (see InvestigatePanel), so no placeholder is needed. */
const config = { value: { label: 'Incidents', color: 'var(--ai-border)' } } satisfies ChartConfig
const tick = { fill: 'var(--muted-foreground)', fontSize: 12 }
const grid = 'var(--secondary)'
const tooltip = <ChartTooltipContent hideLabel />

/** Screen readers get the numbers as text, since a chart is a picture. */
const summary = (title: string, bars: Answer['bars']) => `${title}: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}`

/** Labels start at the left edge of the box (Recharts right-aligns them against the bars by default). */
type Link = { onFocus?: (code: number | null) => void; onPick?: (code: number) => void }

function LeftTick({ y = 0, payload, bars, onFocus, onPick }: { y?: number; payload?: { value: string }; bars: Answer['bars'] } & Link) {
  const code = bars.find((b) => b.label === payload?.value)?.code
  return (
    <text x={0} y={y} dy={4} textAnchor="start" fill="var(--muted-foreground)" fontSize={12} className={code && onPick ? 'cursor-pointer' : undefined} onMouseEnter={() => code && onFocus?.(code)} onMouseLeave={() => onFocus?.(null)} onClick={() => code && onPick?.(code)}>
      {payload?.value}
    </text>
  )
}

function Ranking({ bars, onFocus, onPick }: { bars: Answer['bars'] } & Link) {
  const labelWidth = Math.min(150, Math.max(...bars.map((b) => b.label.length)) * 8 + 12)
  return (
    <ChartContainer config={config} className="w-full" style={{ height: Math.max(110, bars.length * 28 + 8) }} role="img" aria-label={summary('Bar chart', bars)}>
      <BarChart data={bars} layout="vertical" margin={{ left: 0, right: 28 }}>
        <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={labelWidth} tick={<LeftTick bars={bars} onFocus={onFocus} onPick={onPick} />} interval={0} />
        <XAxis type="number" hide />
        <ChartTooltip cursor={false} content={tooltip} />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={4}
          cursor={onPick ? 'pointer' : undefined}
          onMouseEnter={(d) => onFocus?.((d.payload as Answer['bars'][number]).code ?? null)}
          onMouseLeave={() => onFocus?.(null)}
          onClick={(d) => {
            const code = (d.payload as Answer['bars'][number]).code
            if (code) onPick?.(code)
          }}
        >
          <LabelList dataKey="value" position="right" fill="var(--foreground)" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function Time({ bars }: { bars: Answer['bars'] }) {
  return (
    <ChartContainer config={config} className="h-[180px] w-full" role="img" aria-label={summary('Incidents by time of day', bars)}>
      <AreaChart data={bars} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ ...tick, fontSize: 11 }} interval={0} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area dataKey="value" type="monotone" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.2} />
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
        <Bar dataKey="value" fill="var(--color-value)" radius={4} barSize={48}>
          <LabelList dataKey="value" position="top" fill="var(--foreground)" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export default function AnswerChart({ kind, bars, onFocus, onPick }: { kind: NonNullable<Answer['chart']>; bars: Answer['bars'] } & Link) {
  return (
    <div className="rounded-[6px] bg-(--neutral-700) p-4">
      {kind === 'time' ? <Time bars={bars} /> : kind === 'period' ? <Period bars={bars} /> : <Ranking bars={bars} onFocus={onFocus} onPick={onPick} />}
    </div>
  )
}
