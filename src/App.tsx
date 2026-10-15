import { useState } from 'react'
import { Dashboard, type Tab } from '@/components/Dashboard'
import { InvestigatePanel } from '@/components/InvestigatePanel'
import { RecommendationsPanel } from '@/components/RecommendationsPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export default function App() {
  const { profile, signOut } = useAuth()
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [tab, setTab] = useState<Tab>('explore')
  const [reloadKey, setReloadKey] = useState(0)
  const [pending, setPending] = useState(0)

  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <Dashboard highlightIds={highlightIds} tab={tab} onTab={setTab} pending={pending}>
        <div className="flex shrink-0 gap-1 rounded-lg border bg-card/95 p-1 max-md:hidden">
          <Button size="sm" className="flex-1" variant={tab !== 'recommendations' ? 'secondary' : 'ghost'} onClick={() => setTab('ask')}>
            Investigate
          </Button>
          <Button
            size="sm"
            className="flex-1"
            variant={tab === 'recommendations' ? 'secondary' : 'ghost'}
            onClick={() => setTab('recommendations')}
          >
            Recommendations{pending > 0 ? ` (${pending})` : ''}
          </Button>
        </div>
        {/* Both stay mounted so the conversation survives switching tabs. */}
        <div className={tab === 'ask' ? 'contents' : tab === 'explore' ? 'hidden md:contents' : 'hidden'}>
          <InvestigatePanel onHighlight={setHighlightIds} onProposed={() => setReloadKey((k) => k + 1)} />
        </div>
        <div className={tab === 'recommendations' ? 'contents' : 'hidden'}>
          <RecommendationsPanel reloadKey={reloadKey} onPending={setPending} />
        </div>
      </Dashboard>

      <header className="absolute inset-x-0 top-0 flex items-center justify-between border-b bg-sidebar/90 px-4 py-3 backdrop-blur">
        <span className="text-sm font-semibold tracking-[0.2em] text-foreground">CIVIC PULSE</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Synthetic data</Badge>
          <Badge variant="outline" className="max-sm:hidden">
            {profile?.role?.replace('_', ' ')}
          </Badge>
          <Button size="sm" variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
    </div>
  )
}
