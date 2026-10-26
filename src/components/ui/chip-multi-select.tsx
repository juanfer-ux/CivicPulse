import type { ReactNode } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { CaretDown, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { chipClass } from '@/components/ui/chip'

export type ChipOption = { value: string; label: string; icon?: ReactNode; disabled?: boolean; hint?: string }

/** Several values from a list, as a Filter Chip: the chip says what is chosen, the menu has a checkbox, an icon and a name per row. Base UI Select (multiple), so the menu is positioned, keyboard-driven and never clipped by the scrolling chip row. */
export function ChipMultiSelect({
  value,
  onValueChange,
  options,
  icon,
  all,
  noun,
  'aria-label': ariaLabel,
}: {
  value: string[]
  onValueChange: (value: string[]) => void
  options: ChipOption[]
  icon?: ReactNode
  /** What the chip says when nothing is chosen, e.g. "All categories". */
  all: string
  /** Plural noun for several, e.g. "categories". */
  noun: string
  'aria-label'?: string
}) {
  const summary = (v: string[]) => (v.length === 0 ? all : v.length === 1 ? (options.find((o) => o.value === v[0])?.label ?? all) : `${v.length} ${noun}`)
  return (
    <BaseSelect.Root multiple value={value} onValueChange={(v) => onValueChange(v as string[])} items={options}>
      <BaseSelect.Trigger aria-label={ariaLabel} data-active={value.length ? '' : undefined} className={cn(chipClass)}>
        {icon}
        <BaseSelect.Value className="truncate">{(v: string[]) => summary(v)}</BaseSelect.Value>
        <BaseSelect.Icon className="shrink-0 text-muted-foreground">
          <CaretDown className="size-4" aria-hidden />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-50 outline-none">
          <BaseSelect.Popup className="max-h-(--available-height) min-w-72 overflow-y-auto rounded-sm border border-secondary bg-popover p-1 text-body-sm outline-none">
            {options.map((o) => (
              <BaseSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="flex h-9 cursor-default items-center gap-2 rounded-sm px-2 text-foreground outline-none select-none data-disabled:opacity-50 data-highlighted:bg-secondary"
              >
                <span className="grid size-4 shrink-0 place-items-center rounded-xs border border-input bg-card">
                  <BaseSelect.ItemIndicator>
                    <Check className="size-3" aria-hidden />
                  </BaseSelect.ItemIndicator>
                </span>
                {o.icon && <span className="shrink-0 text-muted-foreground [&_svg]:size-4">{o.icon}</span>}
                <BaseSelect.ItemText className="flex-1 truncate">{o.label}</BaseSelect.ItemText>
                {o.hint && <span className="shrink-0 text-meta text-muted-foreground">{o.hint}</span>}
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
