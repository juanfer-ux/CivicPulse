import { Sparkles } from 'lucide-react'
import { Dashboard } from '@/components/Dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

export default function App() {
  const { profile, signOut } = useAuth()
  return (
    <div className="relative h-svh overflow-hidden bg-background">
      <Dashboard />

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

      {/* Placeholder: the conversational agent arrives in the Investigate and Ask phase. */}
      <div className="absolute right-4 top-16 flex w-96 items-center gap-2 rounded-lg border border-ai-border bg-ai p-2">
        <Sparkles className="size-4 text-ai-foreground" aria-hidden />
        <Input placeholder="What would you like to investigate?" aria-label="Investigate and Ask" disabled />
        <Button size="sm" variant="outline" disabled>
          Ask
        </Button>
      </div>
    </div>
  )
}
