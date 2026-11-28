import { SortAscending, SortDescending } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export type HistorySort = { oldestFirst: boolean; onSort: () => void }

/** The title row with the sort button, on the **History** column and on top of the **Overview** card (owner's Figma; names from 2026-11-27). Both buttons sort the same history. Figma: 68 px, 16 px at the sides, a 0.5 px `neutral-600` line under it. */
export function HistoryTitle({ title, oldestFirst, onSort }: Partial<HistorySort> & { title: string }) {
  const Icon = oldestFirst ? SortAscending : SortDescending
  const hint = oldestFirst ? 'Show newest first' : 'Show oldest first'
  return (
    <div className="flex h-17 shrink-0 items-center gap-5 border-b-[0.5px] border-(--neutral-600) px-4">
      <h3 className="flex-1 text-label text-(--fg-secondary)">{title}</h3>
      {onSort && (
        <Button variant="ghost" className="h-11 w-10 justify-center px-2" aria-label={hint} title={hint} onClick={onSort}>
          <Icon className="size-5 text-(--neutral-200)" aria-hidden />
        </Button>
      )} {/* an incident's Overview has nothing to sort */}
    </div>
  )
}
