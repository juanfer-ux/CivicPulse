import { SortAscending, SortDescending } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export type HistorySort = { oldestFirst: boolean; onSort: () => void }

/** The "Occurrence history" title row with the sort button, on the right column and on top of the numbers card (owner's Figma, 2026-11-26). Both buttons sort the same history. Figma: 68 px, 16 px at the sides, a 0.5 px `neutral-600` line under it. */
export function HistoryTitle({ oldestFirst, onSort }: HistorySort) {
  const Icon = oldestFirst ? SortAscending : SortDescending
  const hint = oldestFirst ? 'Show newest first' : 'Show oldest first'
  return (
    <div className="flex h-17 shrink-0 items-center gap-5 border-b-[0.5px] border-(--neutral-600) px-4">
      <h3 className="flex-1 text-label text-(--fg-secondary)">Occurrence history</h3>
      <Button variant="ghost" className="h-11 w-10 justify-center px-2" aria-label={hint} title={hint} onClick={onSort}>
        <Icon className="size-5 text-(--neutral-100)" aria-hidden />
      </Button>
    </div>
  )
}
