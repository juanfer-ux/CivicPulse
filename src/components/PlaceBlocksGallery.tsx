import { Bus } from '@phosphor-icons/react'

/**
 * Dev-only gallery at /#place-blocks (owner, 2026-11-20): the block under each OSM place's stem, in four tones and four shadings (16 options, named like a chess square: tone 1-4, shading a-d), drawn as an isometric cube on the map's own background with a stem and a marker above, so one can be picked. The faces are lit by hand exactly as `carLayer.ts` does it (a share of the base, or toward white for the top).
 */
const TONES = [
  { name: 'neutral-300', hex: '#737381', note: 'the first try, too bright' },
  { name: 'between 300 and 400', hex: '#585863', note: 'the map now (owner’s pick, 2d)' },
  { name: 'neutral-400', hex: '#3E3E46', note: 'the map before' },
  { name: 'neutral-500', hex: '#323239', note: '' },
]
// k: below 1 a share of the base color, above 1 that much toward white (as in carLayer.ts). Order: top, the two sides you see (right, left).
const SHADINGS = [
  { name: 'a · flat', top: 1, right: 1, left: 1, note: 'no volume' },
  { name: 'b · soft', top: 1.06, right: 0.86, left: 0.8, note: 'the map before' },
  { name: 'c · medium', top: 1.12, right: 0.9, left: 0.7, note: '' },
  { name: 'd · strong', top: 1.2, right: 0.85, left: 0.6, note: 'the map now' },
]
// The lines where the faces meet (owner, 2026-11-20: "can they have a color too?"): any color works, one pixel wide. Shown on 3b.
const EDGES = [
  { name: 'A · none', color: 'none', opacity: 0, note: '' },
  { name: 'B · dark, faint', color: '#050505', opacity: 0.35, note: 'the map before' },
  { name: 'C · dark, strong', color: '#050505', opacity: 0.7, note: 'the map now (picked)' },
  { name: 'D · light neutral', color: '#737381', opacity: 0.6, note: 'neutral-300' },
  { name: 'E · lighter neutral', color: '#B5B5C0', opacity: 0.5, note: 'a highlight' },
  { name: 'F · the kind color', color: '#FFF398', opacity: 0.6, note: 'yellow here; each place its own' },
  { name: 'G · tint of the block', color: '#8A8A9A', opacity: 0.55, note: 'base + 40 % white' },
]
const MAP = '#1b1b22'

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const shade = (hex: string, k: number) => {
  const c = rgb(hex)
  const out = k > 1 ? c.map((v) => v + (255 - v) * (k - 1)) : c.map((v) => v * k)
  return `rgb(${out.map((v) => Math.round(v)).join(',')})`
}

function Cube({ hex, s, edge = EDGES[1] }: { hex: string; s: (typeof SHADINGS)[number]; edge?: (typeof EDGES)[number] }) {
  // a cube 44 wide and 22 high in the plane, 26 tall: top rhombus, left face, right face
  const cx = 70
  const y0 = 150
  const w = 44
  const d = 22
  const h = 26
  const right = `${cx},${y0 - h} ${cx + w / 2},${y0 - h - d / 2} ${cx + w / 2},${y0 - d / 2} ${cx},${y0}`
  const left = `${cx},${y0 - h} ${cx - w / 2},${y0 - h - d / 2} ${cx - w / 2},${y0 - d / 2} ${cx},${y0}`
  return (
    <svg viewBox="0 0 140 170" width="140" height="170" role="img" aria-label="block">
      <rect width="140" height="170" fill={MAP} />
      <line x1={cx} y1={y0 - h - d / 2} x2={cx} y2={22} stroke="var(--yellow-300)" strokeOpacity="0.6" strokeWidth="2" />
      <g transform={`translate(${cx - 15} 4)`}>
        <rect width="30" height="30" rx="2" fill="var(--yellow-300)" />
        <foreignObject x="7" y="7" width="16" height="16"><Bus weight="fill" size={16} color="#050505" /></foreignObject>
      </g>
      <g stroke={edge.color} strokeOpacity={edge.opacity} strokeWidth="1" strokeLinejoin="round">
        <polygon points={left} fill={shade(hex, s.left)} />
        <polygon points={right} fill={shade(hex, s.right)} />
        <polygon points={`${cx},${y0 - h - d} ${cx + w / 2},${y0 - h - d / 2} ${cx},${y0 - h} ${cx - w / 2},${y0 - h - d / 2}`} fill={shade(hex, s.top)} />
      </g>
    </svg>
  )
}

export function PlaceBlocksGallery() {
  return (
    <main className="min-h-screen bg-(--neutral-900) p-8 text-(--neutral-100)">
      <h1 className="text-heading">Place blocks: 16 options</h1>
      <p className="mt-2 max-w-3xl text-body-sm text-(--neutral-200)">Rows are the tone (1 to 4), columns the shading (a to d); say "2c" to pick one. The drawing is an isometric cube on the map's own background (<code>{MAP}</code>) with a stem and a marker above; on the real map the camera tilts and turns, so the sides you see change, but the numbers are the same ones <code>carLayer.ts</code> uses. "The map now" is 2d with the C edge (the owner’s pick).</p>
      <div className="mt-6 grid gap-x-4 gap-y-6" style={{ gridTemplateColumns: '176px repeat(4, 140px)', justifyContent: 'start' }}>
        <span />
        {SHADINGS.map((s) => (
          <div key={s.name} className="text-meta text-(--neutral-200)">
            <p className="text-body-sm-strong text-(--neutral-100)">{s.name}</p>
            <p>top {s.top}, sides {s.right} and {s.left}</p>
            {s.note && <p className="text-(--neutral-300)">{s.note}</p>}
          </div>
        ))}
        {TONES.map((t, ti) => (
          <div key={t.name} className="contents">
            <div className="w-44 pt-6 text-meta text-(--neutral-200)">
              <p className="text-body-sm-strong text-(--neutral-100)">{ti + 1} · {t.name}</p>
              <p>{t.hex}</p>
              {t.note && <p className="text-(--neutral-300)">{t.note}</p>}
            </div>
            {SHADINGS.map((s, si) => (
              <figure key={s.name} className="relative">
                <Cube hex={t.hex} s={s} />
                <figcaption className="absolute top-1 left-1 rounded-xs bg-(--neutral-800) px-1 text-caption-strong text-(--neutral-100)">{ti + 1}{'abcd'[si]}</figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-heading">Edges: 7 options</h2>
      <p className="mt-2 max-w-3xl text-body-sm text-(--neutral-200)">The same block (3b, <code>neutral-400</code>, soft) with different lines where the faces meet. Say "3b + D" to pick; the line is always 1 px wide in the 3D layer.</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-6">
        {EDGES.map((e) => (
          <figure key={e.name} className="w-[140px]">
            <Cube hex={TONES[2].hex} s={SHADINGS[1]} edge={e} />
            <figcaption className="mt-1 text-meta text-(--neutral-200)">
              <p className="text-body-sm-strong text-(--neutral-100)">{e.name}</p>
              {e.note && <p>{e.note}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}
