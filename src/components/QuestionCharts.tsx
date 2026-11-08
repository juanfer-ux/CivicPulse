import type { ReactNode } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, Treemap, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

/**
 * Chart options for each predefined question of the agent panel (owner's request, 2026-11-08): the same sample data drawn several ways, so one can be picked for each kind of answer.
 * Shown at the top of /#charts. Sample numbers only; nothing here changes the app.
 */

const COLOR = 'var(--ai-border)' // indigo-400, the answer charts' color
const config = { value: { label: 'Incidents', color: COLOR } } satisfies ChartConfig
const tick = { fill: 'var(--muted-foreground)', fontSize: 12 }
const grid = 'var(--secondary)'
const tip = <ChartTooltipContent hideLabel />

const LOCALITIES = [
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
const SPOTS = [
  { label: 'Cra 13 #62-40, entrada del edificio Aurora', short: 'Cra 13 #62-40', value: 18 },
  { label: 'hotspot 2-1, Chapinero', short: 'Hotspot 2-1', value: 12 },
  { label: 'Av. Boyacá con Cl 72', short: 'Av. Boyacá · Cl 72', value: 11 },
  { label: 'Cl 72 #24-30, entrada del colegio', short: 'Cl 72 #24-30', value: 11 },
  { label: 'hotspot 8-1, Kennedy', short: 'Hotspot 8-1', value: 11 },
  { label: 'Cra 72 con Cl 80', short: 'Cra 72 · Cl 80', value: 9 },
]
const AREAS = [
  { label: 'Chapinero', value: 14 },
  { label: 'Suba', value: 11 },
  { label: 'Kennedy', value: 9 },
  { label: 'Engativá', value: 7 },
  { label: 'Teusaquillo', value: 6 },
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BLOCKS = ['12–4 AM', '4–8 AM', '8 AM–12 PM', '12–4 PM', '4–8 PM', '8 PM–12 AM']
const HEAT = [
  [1, 0, 1, 3, 5, 1],
  [0, 1, 2, 4, 6, 0],
  [1, 0, 1, 3, 7, 1],
  [0, 0, 2, 5, 8, 2],
  [2, 1, 2, 6, 11, 3],
  [3, 1, 1, 4, 9, 4],
  [1, 0, 0, 2, 3, 1],
]
const SERIES = {
  Chapinero: [3, 4, 2, 5, 6, 4, 7, 9, 8, 11, 12, 14],
  Suba: [2, 3, 4, 3, 5, 6, 5, 7, 8, 9, 10, 11],
  Kennedy: [4, 5, 4, 6, 5, 6, 7, 6, 8, 7, 8, 9],
}

function Card({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[6px] border-[0.5px] border-(--neutral-500) bg-(--neutral-700) p-4">
      <div>
        <p className="text-label">{name}</p>
        <p className="min-h-[34px] text-meta text-muted-foreground">{note}</p>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Question({ n, question, kind, children }: { n: string; question: string; kind: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-title">
          {n} · {question}
        </h2>
        <p className="text-meta text-muted-foreground">{kind}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}

const max = (d: { value: number }[]) => Math.max(...d.map((x) => x.value))
const total = (d: { value: number }[]) => d.reduce((s, x) => s + x.value, 0)

/* ───────── ranking of localities ───────── */
function HBars({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height: data.length * 30 + 8 }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 28 }}>
        <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={92} tick={tick} interval={0} />
        <XAxis type="number" hide />
        <ChartTooltip cursor={false} content={tip} />
        <Bar dataKey="value" isAnimationActive={false} fill="var(--color-value)" radius={4}>
          <LabelList dataKey="value" position="right" fill="var(--foreground)" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
function Columns({ data, height = 200, angle = -30 }: { data: { label: string; value: number }[]; height?: number; angle?: number }) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ top: 16, bottom: angle ? 24 : 0 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ ...tick, fontSize: 11 }} interval={0} angle={angle} textAnchor={angle ? 'end' : 'middle'} height={angle ? 56 : 24} />
        <ChartTooltip cursor={false} content={tip} />
        <Bar dataKey="value" isAnimationActive={false} fill="var(--color-value)" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="value" position="top" fill="var(--foreground)" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
function Lollipop({ data }: { data: { label: string; value: number }[] }) {
  const m = max(data)
  return (
    <ul className="flex flex-col gap-2.5 text-body-sm">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-muted-foreground">{d.label}</span>
          <span className="relative h-4 flex-1">
            <span className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-(--neutral-400)" style={{ width: `${(d.value / m) * 100}%` }} />
            <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${(d.value / m) * 100}%`, background: COLOR }} />
          </span>
          <span className="w-7 text-right tabular-nums text-foreground">{d.value}</span>
        </li>
      ))}
    </ul>
  )
}
function ShareBars({ data }: { data: { label: string; value: number }[] }) {
  const t = total(data)
  const m = max(data)
  return (
    <ul className="flex flex-col gap-2 text-body-sm">
      {data.map((d) => (
        <li key={d.label} className="flex flex-col gap-1">
          <span className="flex justify-between">
            <span className="text-foreground">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {d.value} · {Math.round((d.value / t) * 100)} %
            </span>
          </span>
          <span className="h-1.5 rounded-full bg-(--neutral-600)">
            <span className="block h-full rounded-full" style={{ width: `${(d.value / m) * 100}%`, background: COLOR }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
function Tree({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <Treemap
        data={data.map((d) => ({ name: d.label, size: d.value }))}
        dataKey="size"
        isAnimationActive={false}
        stroke="var(--neutral-700)"
        content={(p) => {
          const { x = 0, y = 0, width = 0, height = 0, name, size, index = 0 } = p as { x?: number; y?: number; width?: number; height?: number; name?: string; size?: number; index?: number }
          return (
            <g>
              <rect x={x} y={y} width={width} height={height} rx={3} fill={COLOR} fillOpacity={0.9 - index * 0.11} stroke="var(--neutral-700)" strokeWidth={2} />
              {width > 56 && height > 34 && (
                <>
                  <text x={x + 8} y={y + 18} fill="var(--foreground)" fontSize={12}>
                    {name}
                  </text>
                  <text x={x + 8} y={y + 34} fill="var(--foreground)" fontSize={12} fillOpacity={0.8}>
                    {size}
                  </text>
                </>
              )}
            </g>
          )
        }}
      />
    </ChartContainer>
  )
}
function Donut({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={config} className="size-[150px] shrink-0">
        <PieChart>
          <ChartTooltip content={tip} />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={42} outerRadius={70} paddingAngle={2} isAnimationActive={false} stroke="none">
            {data.map((d, i) => (
              <Cell key={d.label} fill={COLOR} fillOpacity={1 - i * 0.14} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-1 text-meta text-muted-foreground">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: COLOR, opacity: 1 - i * 0.14 }} />
            {d.label} <span className="tabular-nums text-foreground">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ───────── time of day ───────── */
function AreaDay({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ChartContainer config={config} className="h-[180px] w-full">
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ ...tick, fontSize: 11 }} interval={0} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area dataKey="value" isAnimationActive={false} type="monotone" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.2} />
      </AreaChart>
    </ChartContainer>
  )
}
function LineDots({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ChartContainer config={config} className="h-[180px] w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 12 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ ...tick, fontSize: 11 }} interval={0} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line dataKey="value" isAnimationActive={false} type="linear" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 4, fill: COLOR }} />
      </LineChart>
    </ChartContainer>
  )
}
function HeatStrip({ data }: { data: { label: string; value: number }[] }) {
  const m = max(data)
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-6 gap-1">
        {data.map((d) => (
          <div key={d.label} className="grid h-16 place-items-center rounded-sm text-body-sm text-foreground" style={{ background: `color-mix(in srgb, ${COLOR} ${Math.round((d.value / m) * 100)}%, var(--neutral-600))` }} title={`${d.label}: ${d.value}`}>
            {d.value}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1 text-center text-caption text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}
/** A 24 h clock: six wedges of four hours, midnight at the top, the radius is the count. */
function Clock({ data }: { data: { label: string; value: number }[] }) {
  const m = max(data)
  const R = 78
  const wedge = (i: number, v: number) => {
    const a0 = (i * 60 - 90) * (Math.PI / 180)
    const a1 = ((i + 1) * 60 - 90) * (Math.PI / 180)
    const r = 14 + (v / m) * (R - 14)
    const p = (a: number, rr: number) => `${(100 + Math.cos(a) * rr).toFixed(1)} ${(100 + Math.sin(a) * rr).toFixed(1)}`
    return `M${p(a0, 14)} L${p(a0, r)} A${r} ${r} 0 0 1 ${p(a1, r)} L${p(a1, 14)} A14 14 0 0 0 ${p(a0, 14)}Z`
  }
  return (
    <svg viewBox="0 0 200 200" className="mx-auto size-[200px]" role="img" aria-label="24 hour clock of incidents">
      {[0.5, 1].map((k) => (
        <circle key={k} cx={100} cy={100} r={14 + k * (R - 14)} fill="none" stroke={grid} />
      ))}
      {data.map((d, i) => (
        <path key={d.label} d={wedge(i, d.value)} fill={COLOR} fillOpacity={0.85} stroke="var(--neutral-700)" strokeWidth={1.5}>
          <title>{`${d.label}: ${d.value}`}</title>
        </path>
      ))}
      {['12 AM', '6 AM', '12 PM', '6 PM'].map((t, i) => (
        <text key={t} x={100 + Math.cos((i * 90 - 90) * (Math.PI / 180)) * 94} y={100 + Math.sin((i * 90 - 90) * (Math.PI / 180)) * 94 + 4} textAnchor="middle" fill="var(--muted-foreground)" fontSize={10}>
          {t}
        </text>
      ))}
    </svg>
  )
}

/* ───────── repeated locations ───────── */
function SpotRows({ data }: { data: (typeof SPOTS)[number][] }) {
  const m = max(data)
  return (
    <ul className="flex flex-col">
      {data.map((d, i) => (
        <li key={d.label} className={`flex items-center gap-3 py-2.5 ${i ? 'border-t border-(--neutral-600)' : ''}`}>
          <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-(--neutral-600) text-caption-strong text-(--neutral-100)">{i + 1}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-body-sm text-foreground">{d.label}</span>
            <span className="h-1 rounded-full bg-(--neutral-600)">
              <span className="block h-full rounded-full" style={{ width: `${(d.value / m) * 100}%`, background: COLOR }} />
            </span>
          </span>
          <span className="w-8 text-right tabular-nums text-foreground">{d.value}</span>
        </li>
      ))}
    </ul>
  )
}
function DotMatrix({ data }: { data: (typeof SPOTS)[number][] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.label} className="flex flex-col gap-1">
          <span className="truncate text-meta text-muted-foreground">{d.short}</span>
          <span className="flex flex-wrap gap-1">
            {Array.from({ length: d.value }, (_, i) => (
              <span key={i} className="size-2.5 rounded-full" style={{ background: COLOR }} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ───────── where to look tomorrow evening ───────── */
function Heatmap() {
  const m = Math.max(...HEAT.flat())
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[34px_repeat(6,1fr)] gap-1 text-center text-caption text-muted-foreground">
        <span />
        {BLOCKS.map((b) => (
          <span key={b}>{b.replace(' AM', '').replace(' PM', '')}</span>
        ))}
      </div>
      {HEAT.map((row, r) => (
        <div key={DAYS[r]} className="grid grid-cols-[34px_repeat(6,1fr)] gap-1">
          <span className="self-center text-caption text-muted-foreground">{DAYS[r]}</span>
          {row.map((v, c) => (
            <span key={c} className={`grid h-6 place-items-center rounded-[3px] text-caption text-foreground ${r === 4 && c === 4 ? 'outline outline-1 outline-offset-1 outline-(--neutral-100)' : ''}`} style={{ background: `color-mix(in srgb, ${COLOR} ${Math.round((v / m) * 100)}%, var(--neutral-600))` }} title={`${DAYS[r]} ${BLOCKS[c]}: ${v}`}>
              {v || ''}
            </span>
          ))}
        </div>
      ))}
      <p className="text-caption text-muted-foreground">Outlined: tomorrow evening (Friday, 4–8 PM).</p>
    </div>
  )
}
function Bullet({ data }: { data: { label: string; value: number }[] }) {
  const m = 16
  return (
    <ul className="flex flex-col gap-3 text-body-sm">
      {data.map((d) => (
        <li key={d.label} className="flex flex-col gap-1">
          <span className="flex justify-between">
            <span className="text-foreground">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">{d.value} expected</span>
          </span>
          <span className="relative h-3 rounded-sm bg-(--neutral-600)">
            <span className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${(d.value / m) * 100}%`, background: COLOR }} />
            <span className="absolute inset-y-[-2px] w-0.5 bg-(--neutral-100)" style={{ left: `${(10 / m) * 100}%` }} title="Usual: 10" />
          </span>
        </li>
      ))}
      <li className="text-caption text-muted-foreground">The white tick is the usual level (10).</li>
    </ul>
  )
}
function ForecastCards() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((k) => (
        <div key={k} className="flex flex-col gap-1 rounded-sm bg-(--neutral-600) p-2">
          <span className="text-caption text-muted-foreground">{k}</span>
          <span className="text-stat text-foreground">{SERIES[k][SERIES[k].length - 1]}</span>
          <ChartContainer config={config} className="h-10 w-full">
            <LineChart data={SERIES[k].map((v, i) => ({ label: String(i), value: v }))}>
              <Line dataKey="value" isAnimationActive={false} type="monotone" stroke="var(--color-value)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      ))}
    </div>
  )
}

export function QuestionCharts() {
  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-heading">Charts for the predefined questions</h1>
        <p className="max-w-[760px] text-meta text-muted-foreground">One group per question of the agent panel, the same sample numbers drawn several ways. The first card of each group is what the agent draws today. Pick one per kind of answer; nothing here changes the app yet.</p>
      </header>

      <Question n="1" question="Which localities have the most parking obstruction incidents?" kind="A ranking of localities. The same chart serves question 5 (illegal dumping localities).">
        <Card name="Horizontal bars (today)" note="Names on the left, a bar and the count. Reads as a ranking at once.">
          <HBars data={LOCALITIES} />
        </Card>
        <Card name="Vertical bars (columns)" note="Columns side by side; the names sit under them, tilted.">
          <Columns data={LOCALITIES} />
        </Card>
        <Card name="Lollipop" note="A thin line and a dot instead of a heavy bar: lighter, good with many rows.">
          <Lollipop data={LOCALITIES} />
        </Card>
        <Card name="Share bars" note="Thin bars with the count and the share of the total: says how concentrated it is.">
          <ShareBars data={LOCALITIES} />
        </Card>
        <Card name="Treemap" note="Rectangles sized by count: the biggest locality is the biggest shape.">
          <Tree data={LOCALITIES} />
        </Card>
        <Card name="Donut" note="Parts of the total with a legend; fine for few items, weak for ranking.">
          <Donut data={LOCALITIES} />
        </Card>
      </Question>

      <Question n="2" question="When do parking obstruction incidents occur most frequently in Usaquén?" kind="Time of day, six blocks of four hours.">
        <Card name="Area (today)" note="A smooth curve over the day. Looks good, hides that each block is four hours.">
          <AreaDay data={TIME} />
        </Card>
        <Card name="Columns by block" note="One column per four-hour block, left to right through the day.">
          <Columns data={TIME} height={200} angle={0} />
        </Card>
        <Card name="Line with dots" note="The same shape as the area, with a dot per block so the blocks show.">
          <LineDots data={TIME} />
        </Card>
        <Card name="Heat strip" note="Six cells in a row; the strongest color is the busiest block. Very compact.">
          <HeatStrip data={TIME} />
        </Card>
        <Card name="24 h clock" note="Wedges around a clock, midnight at the top: the evening peak shows as a long wedge.">
          <Clock data={TIME} />
        </Card>
      </Question>

      <Question n="3" question="Which locations have repeated parking obstruction reports?" kind="A ranking of places with long names (and for the dumping card, the same).">
        <Card name="Horizontal bars (today)" note="Long names get cut (here the full names are shortened by hand).">
          <HBars data={SPOTS.map((s) => ({ label: s.short, value: s.value }))} />
        </Card>
        <Card name="Rows with a thin bar" note="A numbered list: the full name on top, a thin bar under it, the count. Room for long names.">
          <SpotRows data={SPOTS} />
        </Card>
        <Card name="Dot matrix" note="One dot per report: the count is something you can count, no axis needed.">
          <DotMatrix data={SPOTS} />
        </Card>
        <Card name="Columns" note="Short names under the columns; the long address goes in the tooltip.">
          <Columns data={SPOTS.map((s) => ({ label: s.short, value: s.value }))} angle={-35} />
        </Card>
      </Question>

      <Question n="4" question="Which area might deserve further investigation tomorrow evening?" kind="A short list of areas with an expected count for tomorrow evening (the forecast is a simple rule on past weeks).">
        <Card name="Ranked bars" note="The areas ranked by expected reports, the same bars as a ranking.">
          <HBars data={AREAS} />
        </Card>
        <Card name="Heatmap, week by time" note="Day against four-hour block; tomorrow evening is outlined, so you see why it is busy.">
          <Heatmap />
        </Card>
        <Card name="Bullet rows" note="Each area's expected count against its usual level: shows who is above normal.">
          <Bullet data={AREAS} />
        </Card>
        <Card name="Forecast cards" note="A big number and a small trend per area: the most compact, for three or four areas.">
          <ForecastCards />
        </Card>
      </Question>

      <Question n="5" question="Which localities have the most illegal dumping incidents?" kind="The same kind of answer as question 1: whichever ranking chart is chosen there applies here.">
        <Card name="Same as question 1" note="Horizontal bars (today), now with the dumping numbers.">
          <HBars data={[{ label: 'Ciudad Bolívar', value: 48 }, { label: 'Kennedy', value: 41 }, { label: 'Bosa', value: 33 }, { label: 'Usme', value: 27 }, { label: 'Suba', value: 19 }, { label: 'Engativá', value: 12 }]} />
        </Card>
      </Question>
    </div>
  )
}
