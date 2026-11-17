import { ArrowUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The agent's message box (owner, 2026-11-16): its own component, not the generic Input and Button it is made of (Figma `Composer` in Agent Panel). On the landing (`pill`) it is a `neutral-900` pill 8 px around a pill input (`neutral-600` fill, `neutral-400` line) and a round 32 px send button, reaching 8 px into the panel's padding like Figma's outside stroke; in a conversation it is the plain row with 4 px corners. Phones keep the plain row.
 */
export function Composer({ value, onChange, busy }: { value: string; onChange: (v: string) => void; busy: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 desk:-m-2 desk:rounded-full desk:bg-(--neutral-900) desk:p-2 desk:transition-shadow desk:focus-within:shadow-[0_0_17.7px_color-mix(in_oklab,var(--indigo-200)_39%,transparent)]"> {/* Figma `style=active` (owner, 2026-11-16, latest): while the field has focus the pill keeps its `neutral-900` fill and gets a 17.7 px glow, `indigo-200` at 39 % (it was 24 %); no border (Figma's 1 px outside `indigo-500` stroke is switched off) */}
      <div className="relative min-w-0 flex-1"> {/* the send button sits inside the field, at its right end (owner, 2026-11-17): a 24 px round button 12 px from the edge, in a 40 px field (Figma, owner 2026-11-17, latest: it was 4 px in a 32 px field), the text keeps clear of it */}
        <Input name="q" value={value} onChange={(e) => onChange(e.target.value)} placeholder="What would you like to investigate?" aria-label="Investigate and Ask" autoComplete="off" className="pr-11 desk:h-10 desk:rounded-full desk:focus-visible:border-(--neutral-400) desk:focus-visible:ring-0" /> {/* in the active pill the field keeps its `neutral-400` line and has no focus ring of its own */}
        <Button type="submit" size="icon" aria-label="Ask" className="absolute top-1/2 right-3 size-6 -translate-y-1/2 rounded-full bg-(--brand-primary) hover:bg-(--brand-primary)/90" disabled={busy || !value.trim()}>
          <ArrowUp className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
