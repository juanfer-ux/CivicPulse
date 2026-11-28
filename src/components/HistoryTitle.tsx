import { List, SortAscending, SortDescending } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useModules } from '@/components/modules/ModulesProvider'
import { PanelIcon } from '@/components/modules/PanelIcon'
import type { PanelId } from '@/lib/modules'

export type HistorySort = { oldestFirst: boolean; onSort: () => void }

/** The title row with the sort button, on the **History** column and on top of the **Overview** card (owner's Figma; names from 2026-11-27). Both buttons sort the same history. Figma: 68 px, 16 px at the sides, a 0.5 px `neutral-600` line under it. */
export function HistoryTitle({ title, oldestFirst, onSort, panel, icon }: Partial<HistorySort> & { title: string; icon?: PanelId /* a sidebar window's icon, before its title */; panel?: PanelId /* a window of the right sidebar: drag this row, or use the arrow keys on its grip, to swap the two */ }) {
  const { on, startPanelDrag, movePanel } = useModules()
  const movable = on ? panel : undefined
  const Icon = oldestFirst ? SortAscending : SortDescending
  const hint = oldestFirst ? 'Show newest first' : 'Show oldest first'
  return (
    <div className={`flex h-17 shrink-0 items-center gap-5 border-b-[0.5px] border-(--neutral-600) px-4 ${movable ? 'cursor-grab touch-none select-none active:cursor-grabbing' : ''}`} onPointerDown={movable ? startPanelDrag(movable) : undefined} data-drag-header>
      {icon && <span className="-mr-3 flex"><PanelIcon id={icon} /></span>}
      <h3 className="flex-1 text-label text-(--fg-secondary)">{title}</h3>
      {onSort && (
        <Button variant="ghost" className="h-11 w-10 justify-center px-2" aria-label={hint} title={hint} onClick={onSort}>
          <Icon className="size-5 text-(--neutral-200)" aria-hidden />
        </Button>
      )} {/* an incident's Overview has nothing to sort */}
      {movable && ( /* the drag grip, at the right (owner, 2026-11-29) */
        <button type="button" data-grip aria-label={`Move ${title}: up or down arrow`} title="Drag to reorder" className="-ml-3 grid size-6 cursor-grab place-items-center rounded-sm text-(--neutral-200) outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); movePanel(movable, e.key === 'ArrowUp' ? 'top' : 'bottom') } }}>
          <List weight="regular" className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
