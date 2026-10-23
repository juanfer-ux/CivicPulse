import type { CSSProperties } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/ui/role-badge'

type Style = CSSProperties & Record<string, string | number>

// Weights a little lighter than ours (380 / 450 / 550), to read as "a little more smoothing".
const LIGHTER: Style = {
  '--text-display--font-weight': 530,
  '--text-stat--font-weight': 530,
  '--text-heading--font-weight': 530,
  '--text-title--font-weight': 530,
  '--text-subtitle--font-weight': 430,
  '--text-label--font-weight': 430,
  '--text-body--font-weight': 360,
  '--text-meta--font-weight': 360,
  '--text-caption--font-weight': 430,
  '--font-weight-normal': 360,
  '--font-weight-medium': 430,
  '--font-weight-semibold': 530,
}

const CASES: { name: string; note: string; style: Style }[] = [
  { name: 'Smoothing off', note: 'font-smoothing: auto (the browser thickens light text on Mac)', style: { WebkitFontSmoothing: 'auto', MozOsxFontSmoothing: 'auto' } },
  { name: 'Smoothing on (today)', note: 'antialiased, weights 380 / 450 / 550', style: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' } },
  { name: 'On + a little more', note: 'antialiased, geometricPrecision, weights 360 / 430 / 530', style: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textRendering: 'geometricPrecision', ...LIGHTER } },
]

/** The same Civic Pulse text with font smoothing off, on, and on with slightly lighter weights (gallery only, to choose). */
export function SmoothingCompare() {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
      {CASES.map((c) => (
        <div key={c.name} style={c.style} className="flex flex-col gap-6 rounded-lg border bg-card p-4 text-body">
          <div>
            <h3 className="text-label">{c.name}</h3>
            <p className="text-meta text-muted-foreground">{c.note}</p>
          </div>

          <div className="flex items-center justify-between border-b bg-sidebar px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-heading">Map</span>
              <span className="text-body text-muted-foreground">650 incidents</span>
            </div>
            <div className="flex items-center gap-3">
              <RoleBadge role="super_admin" />
              <Avatar name="Juan Fernando Murcia" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="self-end rounded-lg bg-foreground/10 px-3 py-2">Which localities have the most parking obstruction incidents?</p>
            <p className="text-muted-foreground">Kennedy has the most parking obstruction incidents (77), followed by Chapinero (66) and Suba (60).</p>
            <Button variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left">
              When do parking obstruction incidents occur most frequently in Usaquén?
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {[
              ['Ana María Gómez', 'locality_admin', 'Active'],
              ['Carlos Pérez', 'specialist_operator', 'Pending'],
              ['Laura Rojas', null, 'Off'],
            ].map(([n, r, s]) => (
              <div key={n} className="flex items-center justify-between gap-2 border-t pt-2">
                <span className="truncate">{n}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <RoleBadge role={r as 'locality_admin' | null} />
                  <Badge variant={s === 'Active' ? 'secondary' : s === 'Off' ? 'outline' : 'default'}>{s}</Badge>
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ['189', 'Needs review'],
              ['280', 'In progress'],
              ['181', 'Closed'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-stat">{n}</p>
                <p className="text-meta text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
