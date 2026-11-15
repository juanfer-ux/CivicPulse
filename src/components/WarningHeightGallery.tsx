/**
 * Dev-only gallery at /#warning-gallery (owner, 2026-11-15): side views of a car with its warning floating at different heights, each joined to the car's center by a 1 px line, so the height can be picked before it is set in the map. Heights are multiples of the old one (2.2 car heights); the map's own value is `LIFT_MULT` in `carLayer.ts` (try `/?lift=3` on the dev server).
 */
const OPTIONS = [
  { mult: 1, note: 'before' },
  { mult: 2, note: '' },
  { mult: 2.4, note: 'the map now' },
  { mult: 3, note: '' },
  { mult: 4, note: '' },
]
const CAR = 30 // a car's height in the drawing, px

/** The report dots with their stems (owner's proposal, 2026-11-15): each dot lies flat on the ground and has a 2 px line standing on it, solid at the dot and fading upward, each a random height up to half of the warning's. */
function DotsStems() {
  const H = 330
  const top = 300 // the warning's line top, px above the ground
  const dots = Array.from({ length: 11 }, (_, i) => ({ x: 24 + i * 24, h: (top / 2) * (0.25 + 0.75 * (((i * 7919) % 97) / 97)) }))
  return (
    <figure className="flex flex-col items-center gap-3">
      <svg width="320" height={H} viewBox={`0 0 320 ${H}`} role="img" aria-label="Report dots with stems">
        <defs>
          <linearGradient id="up" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="var(--incident)" /><stop offset="1" stopColor="var(--incident)" stopOpacity="0" /></linearGradient>
          <linearGradient id="down" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="var(--incident)" stopOpacity="0" /><stop offset="1" stopColor="var(--incident)" /></linearGradient>
        </defs>
        <ellipse cx="160" cy={H - 20} rx="150" ry="22" fill="none" stroke="var(--neutral-500)" />
        <rect x="132" y={H - 28 - 22} width="56" height="22" rx="6" fill="var(--neutral-100)" />
        <rect x="159" y={H - 24 - top} width="2" height={top - 22} fill="url(#down)" />
        <polygon points={`160,${H - 24 - top - 26} 178,${H - 24 - top + 4} 142,${H - 24 - top + 4}`} fill="var(--incident)" stroke="var(--neutral-900)" strokeWidth="3" strokeLinejoin="round" />
        {dots.map((d, i) => {
          const y = H - 20 + Math.sin((i / 10) * Math.PI) * -6 + 4
          return (
            <g key={i}>
              <rect x={d.x - 1 + 4} y={y - d.h} width="2" height={d.h} fill="url(#up)" />
              <ellipse cx={d.x + 5} cy={y} rx="5" ry="2.6" fill="var(--incident)" stroke="var(--neutral-900)" />
            </g>
          )
        })}
      </svg>
      <figcaption className="text-body-sm-medium">Dots flat on the ground, a stem from each: solid at the dot, fading up, random height up to half the warning's <span className="text-(--neutral-300)">· proposal</span></figcaption>
    </figure>
  )
}

export function WarningHeightGallery() {
  return (
    <div className="flex min-h-screen flex-wrap items-end gap-10 bg-(--neutral-800) p-10 text-(--neutral-100)">
      <DotsStems />
      {OPTIONS.map((o) => {
        const lift = 2.2 * CAR * o.mult
        const h = lift + 80
        return (
          <figure key={o.mult} className="flex flex-col items-center gap-3">
            <svg width="140" height={h} viewBox={`0 0 140 ${h}`} role="img" aria-label={`Warning at ${o.mult} times the old height`}>
              <ellipse cx="55" cy={h - 14} rx="46" ry="9" fill="black" opacity="0.18" />
              <line x1="0" x2="140" y1={h - 14} y2={h - 14} stroke="var(--neutral-600)" strokeWidth="1" />
              <rect x="36" y={h - 14 - CAR} width="38" height={CAR} rx="8" fill="var(--neutral-100)" />
              <line x1="55" y1={h - 14 - CAR / 2} x2="100" y2={h - 14 - lift} stroke="var(--neutral-200)" strokeWidth="1" />
              <polygon points={`100,${h - 14 - lift - 20} 114,${h - 14 - lift + 4} 86,${h - 14 - lift + 4}`} fill="var(--incident)" stroke="var(--neutral-900)" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <figcaption className="text-body-sm-medium">{o.mult}× {o.note && <span className="text-(--neutral-300)">· {o.note}</span>}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}
