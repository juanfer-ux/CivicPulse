import type { ReactNode } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { Bars } from '@/components/InvestigatePanel'
import { StatCard } from '@/components/ui/stat-card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

/** Open /#charts (no sign-in): the agent's answer bars next to alternatives, on the same sample data. */

const RANKING = [
  { label: 'Chapinero', value: 62 },
  { label: 'Suba', value: 52 },
  { label: 'Kennedy', value: 43 },
  { label: 'Engativá', value: 36 },
  { label: 'Barrios Unidos', value: 32 },
  { label: 'Fontibón', value: 29 },
]
const TIME = [
  { label: '12–4 AM', value: 3 },
  { label: '4–8 AM', value: 2 },
  { label: '8 AM–12 PM', value: 2 },
  { label: '12–4 PM', value: 9 },
  { label: '4–8 PM', value: 11 },
  { label: '8 PM–12 AM', value: 1 },
]
const PERIOD = [
  { label: 'Previous 30 days', value: 20 },
  { label: 'Last 30 days', value: 19 },
]

const config = { value: { label: 'Incidents', color: 'var(--indigo-400)' } } satisfies ChartConfig
const tick = { fill: 'var(--neutral-200)', fontSize: 12 }

function Option({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-sm border border-input bg-ai p-4">
      <div>
        <p className="text-label">{name}</p>
        <p className="text-meta text-muted-foreground">{note}</p>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-title">{title}</h2>
      <div className="grid gap-4 md:grid-cols-3">{children}</div>
    </section>
  )
}

/** Tremor's BarList look, without the library: the bar sits behind the label, the number on the right. */
function BarList({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <ul className="flex flex-col gap-1.5 text-body-sm">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-3">
          <div className="relative h-8 flex-1 overflow-hidden rounded-sm bg-muted/40">
            <div className="absolute inset-y-0 left-0 rounded-sm bg-ai-border/60" style={{ width: `${(d.value / max) * 100}%` }} />
            <span className="relative flex h-full items-center px-2">{d.label}</span>
          </div>
          <span className="w-8 text-right tabular-nums">{d.value}</span>
        </li>
      ))}
    </ul>
  )
}

/** A big number with the change against the period before, like a dashboard metric tile. */
function MetricTile({ now, before, label }: { now: number; before: number; label: string }) {
  const change = Math.round(((now - before) / before) * 100)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-meta text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-3">
        <span className="text-stat">{now}</span>
        <span className="text-body-sm text-muted-foreground">
          {change > 0 ? '+' : ''}
          {change} % vs {before} before
        </span>
      </div>
    </div>
  )
}

export function ChartGallery() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 p-8">
      <header>
        <h1 className="text-heading">Chart options for the agent's answers</h1>
        <p className="text-body-sm text-muted-foreground">
          Same data in each row. "Current" is what the app shows today; the others are alternatives. Colors are the app's own (indigo-400, neutrals).
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-title">Stat Card · the four states</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Kennedy" value={77} trend="above" />
          <StatCard label="Chapinero" value={66} trend="about" />
          <StatCard label="Suba" value={60} trend="below" />
          <StatCard label="Ciudad Bolívar" value={4} trend="low" />
        </div>
      </section>

      <Row title="1 · Ranked list: which localities have the most incidents">
        <Option name="Current" note="Hand-made HTML bars. No dependency.">
          <Bars bars={RANKING} />
        </Option>
        <Option name="Tremor-style BarList" note="Same idea, bigger rows with the name inside the bar. Still plain HTML.">
          <BarList data={RANKING} />
        </Option>
        <Option name="shadcn Chart · horizontal bar" note="Recharts under the hood. Tooltip on hover, values at the end of each bar.">
          <ChartContainer config={config} className="h-[220px] w-full">
            <BarChart data={RANKING} layout="vertical" margin={{ left: 0, right: 28 }}>
              <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={96} tick={tick} />
              <XAxis type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4}>
                <LabelList dataKey="value" position="right" fill="var(--neutral-100)" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Option>
      </Row>

      <Row title="2 · Time of day: when do incidents happen (Usaquén, 28 incidents)">
        <Option name="Current" note="The same bars, one per 4-hour block. Reads as a ranking, not as a day.">
          <Bars bars={TIME} />
        </Option>
        <Option name="shadcn Chart · columns" note="Time runs left to right, so the evening peak is a shape you see at once.">
          <ChartContainer config={config} className="h-[200px] w-full">
            <BarChart data={TIME} margin={{ top: 16 }}>
              <CartesianGrid vertical={false} stroke="var(--neutral-500)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4}>
                <LabelList dataKey="value" position="top" fill="var(--neutral-100)" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Option>
        <Option name="shadcn Chart · area" note="Smooth curve over the day. Looks good, but hides that the blocks are 4 hours wide.">
          <ChartContainer config={config} className="h-[200px] w-full">
            <AreaChart data={TIME} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--neutral-500)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Area dataKey="value" type="monotone" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.2} />
            </AreaChart>
          </ChartContainer>
        </Option>
      </Row>

      <Row title="3 · Period comparison: the last 30 days against the 30 before (Chapinero)">
        <Option name="Current" note="Two bars with the numbers.">
          <Bars bars={PERIOD} />
        </Option>
        <Option name="Metric tile" note="A dashboard-style number with the change. No chart at all; the clearest for two numbers.">
          <MetricTile now={19} before={20} label="Chapinero · incidents, last 30 days" />
        </Option>
        <Option name="shadcn Chart · two columns" note="Two columns to compare by eye, with a tooltip.">
          <ChartContainer config={config} className="h-[160px] w-full">
            <BarChart data={PERIOD} margin={{ top: 16 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} barSize={48}>
                <LabelList dataKey="value" position="top" fill="var(--neutral-100)" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </Option>
      </Row>
    </main>
  )
}
