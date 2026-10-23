import { useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/ui/role-badge'

const FONTS = [
  { name: 'Inter (today)', family: "'Inter', sans-serif" },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Manrope', family: "'Manrope', sans-serif" },
  { name: 'Geist', family: "'Geist', sans-serif" },
]
// Temporary: loads the candidates from Google Fonts only while comparing. The chosen one will be hosted on our own site like Inter.
const CSS =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Manrope:wght@400;500;600&family=Geist:wght@400;500;600&display=swap'

/** The same Civic Pulse screens in each candidate font (gallery only, to choose the product font). */
export function FontCompare() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
    return () => link.remove()
  }, [])
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
      {FONTS.map((f) => (
        <div key={f.name} style={{ fontFamily: f.family }} className="flex flex-col gap-6 rounded-lg border bg-card p-4 text-body">
          <h3 className="text-label text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
            {f.name}
          </h3>

          <div className="flex items-center justify-between border-b bg-sidebar px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-heading font-semibold">Map</span>
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

          <div className="flex flex-col gap-2 text-body">
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
                <p className="text-stat font-semibold">{n}</p>
                <p className="text-meta text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
