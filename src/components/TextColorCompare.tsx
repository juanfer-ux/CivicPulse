import type { CSSProperties } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/ui/role-badge'

type Style = CSSProperties & Record<string, string | number>

const set = (fg: string, muted: string, incident: string, warning: string): Style => ({
  '--foreground': fg,
  '--primary': fg,
  '--secondary-foreground': fg,
  '--accent-foreground': fg,
  '--destructive-foreground': fg,
  '--muted-foreground': muted,
  '--incident': incident,
  '--warning': warning,
  WebkitFontSmoothing: 'auto',
  MozOsxFontSmoothing: 'auto',
})

// Contrast on the page background in the notes. All shown with font smoothing off.
const CASES: { name: string; note: string; style: Style }[] = [
  { name: 'Today', note: 'main #DCDCDC 12.9 · secondary #A5A5A5 7.2 · incident #FFA08F 9.0 · warning #EDC57F 10.9', style: set('#DCDCDC', '#A5A5A5', '#FFA08F', '#EDC57F') },
  { name: 'Softer', note: 'main #CFCFD2 11.4 · secondary #9C9CA2 6.5 · incident #EE9686 7.9 · warning #DDB873 9.4', style: set('#CFCFD2', '#9C9CA2', '#EE9686', '#DDB873') },
  { name: 'Softest', note: 'main #C2C2C7 10.0 · secondary #94949A 5.9 · incident #E58C7D 7.1 · warning #D0AC6B 8.3', style: set('#C2C2C7', '#94949A', '#E58C7D', '#D0AC6B') },
]

/** The same Civic Pulse text in today's colors and two softer sets, smoothing off (gallery only, to choose the text colors). */
export function TextColorCompare() {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
      {CASES.map((c) => (
        <div key={c.name} style={c.style} className="flex flex-col gap-6 rounded-lg border bg-card p-4 text-body text-foreground">
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
            <p className="text-incident">Could not load the incidents. Try again.</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: 'var(--warning)' }} /> Needs review <span className="ml-auto">189</span></p>
            <p className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: 'var(--incident)' }} /> Validated / in progress <span className="ml-auto">280</span></p>
            <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-closed" /> Closed <span className="ml-auto">181</span></p>
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
