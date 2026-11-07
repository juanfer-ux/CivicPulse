import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Warning } from '@phosphor-icons/react'
import { GROUPS, PROBLEM_STATUS, PROBLEM_STATUSES } from '@/lib/statusColors'

/**
 * Open /#glow (no sign-in): ways to add a glow to the map's outlines, recurrence markers, incident dots and rings (owner, 2026-11-07).
 * Everything here is plain CSS and SVG on a fake map, so nothing touches the real map or its GPU load. The slider scales every glow.
 * A glow on the real map would be stacked blurred copies of the same layer (MapLibre `line-blur` and `circle-blur`); these demos show the look first.
 */

const mix = (token: string, pct: number) => `color-mix(in srgb, var(${token}) ${pct}%, transparent)`
const ROADS = ['M0 40 L460 70', 'M0 150 L460 120', 'M80 0 L110 280', 'M300 0 L270 280', 'M0 230 L460 200']
const POLY = '40,28 190,14 236,86 204,158 92,176 22,114'

function Backdrop({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-sm bg-(--neutral-800) ${className}`}>
      <svg className="absolute inset-0 size-full" aria-hidden>
        {ROADS.map((d) => (
          <path key={d} d={d} stroke="var(--neutral-500)" strokeOpacity="0.45" strokeWidth="6" fill="none" />
        ))}
      </svg>
      {children}
    </div>
  )
}

function Option({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div>
        <p className="text-label">{name}</p>
        <p className="min-h-[42px] text-meta text-muted-foreground">{note}</p>
      </div>
      {children}
    </div>
  )
}

/** One locality outline with a glow recipe: each layer is a blurred copy of the outline under the crisp line. */
type Layer = { w: number; blur: number; opacity: number; token?: string; clip?: boolean; breathe?: boolean }
function Outline({ layers, line = '--map-locality-line', g }: { layers: Layer[]; line?: string; g: number }) {
  const clip = useId()
  return (
    <svg viewBox="0 0 260 200" className="size-full" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <polygon points={POLY} />
        </clipPath>
      </defs>
      <polygon points={POLY} fill={mix('--map-locality-line', 14)} />
      {layers.map((l, i) => (
        <g key={i} clipPath={l.clip ? `url(#${clip})` : undefined}>
          <polygon
            points={POLY}
            fill="none"
            stroke={`var(${l.token ?? '--map-locality-line'})`}
            strokeWidth={l.w * g}
            strokeLinejoin="round"
            opacity={Math.min(1, l.opacity * g)}
            style={{ filter: `blur(${l.blur * g}px)` }}
            className={l.breathe ? 'glow-breathe' : undefined}
          />
        </g>
      ))}
      <polygon points={POLY} fill="none" stroke={`var(${line})`} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

const OUTLINES: { name: string; note: string; layers: Layer[]; line?: string }[] = [
  { name: 'Now (no glow)', note: 'The 1.4 px indigo-300 line the map draws today.', layers: [] },
  { name: 'Soft halo', note: 'One blurred copy under the line. The cheapest glow: one extra line layer.', layers: [{ w: 6, blur: 4, opacity: 0.55 }] },
  { name: 'Strong', note: 'Two copies, a wide faint one and a tight bright one. Reads as light, not a border.', layers: [{ w: 14, blur: 9, opacity: 0.3 }, { w: 6, blur: 3, opacity: 0.6 }] },
  { name: 'Neon core', note: 'Brighter core (indigo-200, the focus line) over an ai-border indigo halo.', line: '--map-locality-line-focus', layers: [{ w: 10, blur: 6, opacity: 0.6, token: '--ai-border' }] },
  { name: 'Inner glow', note: 'The blurred copy is clipped to the inside of the shape: the area itself lights up.', layers: [{ w: 14, blur: 6, opacity: 0.7, clip: true }] },
  { name: 'Breathing', note: 'The soft halo slowly fades in and out (CSS opacity, nothing on the map).', layers: [{ w: 8, blur: 5, opacity: 0.7, breathe: true }] },
]

function Marker({ token, level, size = 28 }: { token: string; level: 'none' | 'soft' | 'strong' | 'pulse'; size?: number }) {
  const shadow =
    level === 'soft'
      ? `0 0 calc(10px*var(--g)) calc(1px*var(--g)) ${mix(token, 45)}`
      : level === 'strong'
        ? `0 0 calc(14px*var(--g)) calc(3px*var(--g)) ${mix(token, 60)}, 0 0 calc(30px*var(--g)) calc(7px*var(--g)) ${mix(token, 28)}`
        : undefined
  return (
    <span
      className={`grid place-items-center rounded-full bg-(--neutral-700) text-(--neutral-100) ${level === 'pulse' ? 'glow-pulse' : ''}`}
      style={{ width: size, height: size, border: `1px solid var(${token})`, boxShadow: shadow, ['--c' as string]: `var(${token})` } as CSSProperties}
    >
      <Warning weight="fill" className="size-3.5" aria-hidden style={{ color: `var(${token})` }} />
    </span>
  )
}

function Dot({ token, level }: { token: string; level: 'none' | 'soft' | 'strong' | 'pulse' }) {
  const shadow =
    level === 'soft'
      ? `0 0 calc(8px*var(--g)) calc(1px*var(--g)) ${mix(token, 70)}`
      : level === 'strong'
        ? `0 0 calc(10px*var(--g)) calc(2px*var(--g)) ${mix(token, 80)}, 0 0 calc(22px*var(--g)) calc(5px*var(--g)) ${mix(token, 35)}`
        : undefined
  return <span className={`block size-3 rounded-full ${level === 'pulse' ? 'glow-pulse' : ''}`} style={{ background: `var(${token})`, boxShadow: shadow, ['--c' as string]: `var(${token})` } as CSSProperties} />
}

const LEVELS = [
  ['none', 'None'],
  ['soft', 'Soft'],
  ['strong', 'Strong'],
  ['pulse', 'Pulse'],
] as const

export function GlowGallery() {
  const [g, setG] = useState(1)
  return (
    <div className="min-h-svh bg-background p-6 text-foreground" style={{ ['--g' as string]: g } as CSSProperties}>
      <style>{`
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 calc(8px*var(--g)) calc(1px*var(--g)) color-mix(in srgb, var(--c) 40%, transparent) } 50% { box-shadow: 0 0 calc(22px*var(--g)) calc(5px*var(--g)) color-mix(in srgb, var(--c) 75%, transparent) } }
        @keyframes glow-breathe { 0%,100% { opacity: .25 } 50% { opacity: .85 } }
        .glow-pulse { animation: glow-pulse 2.2s ease-in-out infinite }
        .glow-breathe { animation: glow-breathe 3s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .glow-pulse, .glow-breathe { animation: none } .glow-pulse { box-shadow: 0 0 calc(14px*var(--g)) calc(3px*var(--g)) color-mix(in srgb, var(--c) 55%, transparent) } }
      `}</style>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-heading">Glow options for the map</h1>
            <p className="max-w-[640px] text-meta text-muted-foreground">Outlines, recurrence markers, incident dots and rings with a glow, on a fake map. Plain CSS and SVG, nothing runs on the real map. The slider scales every glow at once; the status colors are the map's own tokens.</p>
          </div>
          <label className="flex items-center gap-3 text-label">
            Strength
            <input type="range" min={0} max={2} step={0.1} value={g} onChange={(e) => setG(Number(e.target.value))} className="w-48" />
            <span className="w-8 text-meta tabular-nums text-muted-foreground">{g.toFixed(1)}</span>
          </label>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-section-label uppercase text-(--neutral-200)">Locality outlines (the answer areas)</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OUTLINES.map((o) => (
              <Option key={o.name} name={o.name} note={o.note}>
                <Backdrop className="h-[200px]">
                  <Outline layers={o.layers} line={o.line} g={g} />
                </Backdrop>
              </Option>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-section-label uppercase text-(--neutral-200)">Recurrence markers (one row per status)</h2>
          <Backdrop className="p-5">
            <div className="relative grid grid-cols-[110px_repeat(4,1fr)] items-center gap-y-6">
              <span />
              {LEVELS.map(([, label]) => (
                <span key={label} className="text-meta text-muted-foreground">
                  {label}
                </span>
              ))}
              {PROBLEM_STATUSES.map((s) => (
                <div key={s} className="contents">
                  <span className="text-meta text-(--neutral-100)">{PROBLEM_STATUS[s].label}</span>
                  {LEVELS.map(([lv]) => (
                    <div key={lv}>
                      <Marker token={PROBLEM_STATUS[s].token} level={lv} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Backdrop>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-section-label uppercase text-(--neutral-200)">Incident dots (one row per status group)</h2>
          <Backdrop className="p-5">
            <div className="relative grid grid-cols-[110px_repeat(4,1fr)] items-center gap-y-6">
              <span />
              {LEVELS.map(([, label]) => (
                <span key={label} className="text-meta text-muted-foreground">
                  {label}
                </span>
              ))}
              {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((k) => (
                <div key={k} className="contents">
                  <span className="text-meta text-(--neutral-100)">{GROUPS[k].label}</span>
                  {LEVELS.map(([lv]) => (
                    <div key={lv}>
                      <Dot token={GROUPS[k].token} level={lv} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Backdrop>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-section-label uppercase text-(--neutral-200)">Rings, and the selected one</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Ring now', note: 'The 1.5 px ring and 15 % fill of the radius circle.', shadow: undefined },
              { name: 'Outer halo', note: 'The ring gives off light outward.', shadow: `0 0 calc(18px*var(--g)) calc(2px*var(--g)) ${mix('--ai-border', 55)}` },
              { name: 'Inner glow', note: 'The light stays inside the circle.', shadow: `inset 0 0 calc(22px*var(--g)) calc(2px*var(--g)) ${mix('--ai-border', 60)}` },
              { name: 'Both', note: 'Inner and outer together: the strongest ring.', shadow: `0 0 calc(20px*var(--g)) calc(3px*var(--g)) ${mix('--ai-border', 50)}, inset 0 0 calc(22px*var(--g)) calc(2px*var(--g)) ${mix('--ai-border', 55)}` },
            ].map((r) => (
              <Option key={r.name} name={r.name} note={r.note}>
                <Backdrop className="grid h-[180px] place-items-center">
                  <span className="relative block size-[110px] rounded-full" style={{ border: '1.5px solid var(--ai-border)', background: mix('--ai-border', 15), boxShadow: r.shadow }} />
                </Backdrop>
              </Option>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-section-label uppercase text-(--neutral-200)">Put together (a map with the glow on)</h2>
          <Backdrop className="h-[300px]">
            <svg viewBox="0 0 460 280" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
              <g transform="translate(110 50) scale(1.05)">
                <polygon points={POLY} fill={mix('--map-locality-line', 14)} />
                {[{ w: 14, b: 9, o: 0.3 }, { w: 6, b: 3, o: 0.6 }].map((l, i) => (
                  <polygon key={i} points={POLY} fill="none" stroke="var(--map-locality-line)" strokeWidth={l.w * g} opacity={Math.min(1, l.o * g)} style={{ filter: `blur(${l.b * g}px)` }} strokeLinejoin="round" />
                ))}
                <polygon points={POLY} fill="none" stroke="var(--map-locality-line)" strokeWidth="1.2" strokeLinejoin="round" />
              </g>
            </svg>
            {([
              { l: '22%', t: '30%', c: '--map-pending', d: true },
              { l: '31%', t: '58%', c: '--map-reviewing', d: true },
              { l: '46%', t: '24%', c: '--map-approved', d: true },
              { l: '52%', t: '64%', c: '--map-rejected', d: true },
              { l: '64%', t: '40%', c: '--map-approved', d: true },
              { l: '40%', t: '42%', c: PROBLEM_STATUS.active.token, level: 'pulse' as const },
              { l: '58%', t: '52%', c: PROBLEM_STATUS.monitoring.token, level: 'strong' as const },
              { l: '28%', t: '44%', c: PROBLEM_STATUS.resolved.token, level: 'soft' as const },
            ] as { l: string; t: string; c: string; d?: boolean; level?: 'none' | 'soft' | 'strong' | 'pulse' }[]).map((p, i) => (
              <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.l, top: p.t }}>
                {p.d ? <Dot token={p.c} level="strong" /> : <Marker token={p.c} level={p.level ?? 'soft'} />}
              </span>
            ))}
          </Backdrop>
        </section>
      </div>
    </div>
  )
}
