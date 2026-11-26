import { ArrowUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * The agent's message box (owner, 2026-11-16): its own component, not the generic Input and Button it is made of (Figma `Composer` in Agent Panel). On the landing (`pill`) it is a `neutral-900` pill 8 px around a pill input (`neutral-600` fill, `neutral-400` line) and a round 32 px send button, reaching 8 px into the panel's padding like Figma's outside stroke; in a conversation it is the plain row with 4 px corners. Phones keep the plain row.
 */
export function Composer({ value, onChange, busy }: { value: string; onChange: (v: string) => void; busy: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 desk:rounded-full desk:bg-(--neutral-900) desk:p-1 desk:transition-colors desk:focus-within:bg-(--black)"> {/* Composer, again (owner's Figma, 2026-11-17, latest): the field is 48 px again (pill 60), the send button 32 px, and the active pill is `black` (#050505), not `neutral-800`. Before that:  the pill has 6 px around the field (it was 8) and the field is 42 px high (it was 48), so the composer is 54 px (it was 64); while the field has focus (`style=active`) the pill turns `neutral-800` and nothing else changes. */} {/* The glow and the 0.5 px `cobalt-500` line of the active state are both removed (owner, 2026-11-17, in Figma and here): focus changes nothing on the pill. Figma `style=active` (owner, 2026-11-17, latest): while the field has focus the pill keeps its `neutral-900` fill and gets a 0.5 px `cobalt-500` line (Figma draws it centered on the edge; here it is 0.5 px outside, a box-shadow) and a 17.7 px glow, `cobalt-200` at 16 % (owner's Figma 2026-11-17, latest: it was 39 %). The line was switched off for a while. The field is `neutral-700`, also while active (owner's Figma, 2026-11-17: it was `neutral-600` for a moment) */}
      <div className="relative min-w-0 flex-1"> {/* the send button sits inside the field, at its right end (owner, 2026-11-17): a 28 px round button (arrow 15.75 px) 12 px from the edge, in a 48 px field with 20 px on the left (Figma, owner 2026-11-17, latest: the button was 32 px, before that 24), the text keeps clear of it */}
        <Input name="q" value={value} onChange={(e) => onChange(e.target.value)} placeholder="What would you like to investigate?" aria-label="Investigate and Ask" autoComplete="off" className="pr-14 desk:h-12 desk:rounded-full desk:bg-(--neutral-700) desk:pl-5 desk:focus-visible:border-(--neutral-400) desk:focus-visible:ring-0" /> {/* in the active pill the field keeps its `neutral-400` line and has no focus ring of its own */}
        <Button type="submit" size="icon" aria-label="Ask" className="absolute top-1/2 right-3 size-8 -translate-y-1/2 rounded-full bg-(--brand-primary) hover:bg-(--brand-primary)/90" disabled={busy || !value.trim()}>
          <ArrowUp className="size-[15.75px]" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
