import { ArrowUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The agent's message box (owner, 2026-11-16): its own component, not the generic Input and Button it is made of (Figma `Composer` in Agent Panel). On the landing (`pill`) it is a `neutral-900` pill 8 px around a pill input (`neutral-600` fill, `neutral-400` line) and a round 32 px send button, reaching 8 px into the panel's padding like Figma's outside stroke; in a conversation it is the plain row with 4 px corners. Phones keep the plain row.
 */
export function Composer({ value, onChange, busy, pill }: { value: string; onChange: (v: string) => void; busy: boolean; pill: boolean }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${pill ? 'desk:-m-2 desk:rounded-full desk:bg-(--neutral-900) desk:p-2 desk:transition-shadow desk:focus-within:bg-(--indigo-900) desk:focus-within:outline desk:focus-within:outline-1 desk:focus-within:outline-(--indigo-400) desk:focus-within:shadow-[0_0_17.7px_var(--indigo-200)]' : ''}`}> {/* Figma `style=active` (owner, 2026-11-16): while the field has focus the pill is `indigo-900` with a 1 px outside `indigo-400` stroke and a 17.7 px `indigo-200` glow */}
      <Input name="q" value={value} onChange={(e) => onChange(e.target.value)} placeholder="What would you like to investigate?" aria-label="Investigate and Ask" autoComplete="off" className={pill ? 'desk:rounded-full desk:focus-visible:border-(--neutral-400) desk:focus-visible:ring-0' : ''} /> {/* in the active pill the field keeps its `neutral-400` line and has no focus ring of its own */}
      <Button type="submit" size="icon" aria-label="Ask" className={`bg-(--brand-primary) hover:bg-(--brand-primary)/90 ${pill ? 'desk:rounded-full' : ''}`} disabled={busy || !value.trim()}>
        <ArrowUp aria-hidden />
      </Button>
    </div>
  )
}
