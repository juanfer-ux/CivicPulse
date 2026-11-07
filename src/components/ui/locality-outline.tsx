import type { Shape } from '@/lib/localityShape'

export type OutlineStyle = 'line' | 'fill' | 'soft' | 'map'

const STYLES: Record<OutlineStyle, { stroke: string; fill: string }> = {
  line: { stroke: 'var(--neutral-300)', fill: 'none' }, // a 1 px line
  fill: { stroke: 'var(--neutral-300)', fill: 'color-mix(in srgb, var(--neutral-100) 10%, transparent)' }, // the line and a faint fill
  soft: { stroke: 'none', fill: 'color-mix(in srgb, var(--neutral-100) 22%, transparent)' }, // a faint shape, no line
  map: { stroke: 'var(--map-locality-line)', fill: 'color-mix(in srgb, var(--map-locality-line) 14%, transparent)' }, // the look of the localities an agent answer outlines on the map
}

/** Only the outline of a locality, centered in a box at least `box` px square (wider or taller when the shape is, with 1 px for the line): no name, no streets (owner's idea, 2026-11-07). Decorative: the card already says the name. */
export function LocalityOutline({ shape, box, look = 'line' }: { shape: Shape; box: number; look?: OutlineStyle }) {
  const s = STYLES[look]
  const w = Math.max(box, Math.ceil(shape.w) + 2)
  const h = Math.max(box, Math.ceil(shape.h) + 2)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <path d={shape.d} transform={`translate(${(w - shape.w) / 2} ${(h - shape.h) / 2})`} fill={s.fill} stroke={s.stroke} strokeWidth={1} strokeLinejoin="round" />
    </svg>
  )
}
