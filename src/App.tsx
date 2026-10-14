import { useState } from 'react'
import { Dashboard } from '@/components/Dashboard'
import { InvestigatePanel } from '@/components/InvestigatePanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export default function App() {
  const { profile, signOut } = useAuth()
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <Dashboard highlightIds={highlightIds}>
        <InvestigatePanel onHighlight={setHighlightIds} />
      </Dashboard>

      <header className="absolute inset-x-0 top-0 flex items-center justify-between border-b bg-sidebar/90 px-4 py-3 backdrop-blur">
        <span className="text-sm font-semibold tracking-[0.2em] text-foreground">CIVIC PULSE</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Synthetic data</Badge>
          <Badge variant="outline">{profile?.role?.replace('_', ' ')}</Badge>
          <Button size="sm" variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
    </div>
  )
}
