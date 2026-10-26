import { Select as BaseSelect } from '@base-ui/react/select'
import { CaretDown, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { controlClass } from '@/lib/ui'

export type SelectOption = { value: string; label: string; disabled?: boolean }

/** One value from a list. Base UI Select (shadcn) styled like Input; the list is ours, never the browser's (Figma: Select Menu). */
export function Select({
  value,
  onValueChange,
  options,
  className,
  disabled,
  id,
  'aria-label': ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  className?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
}) {
  return (
    <BaseSelect.Root value={value} onValueChange={(v) => onValueChange(v ?? '')} items={options} disabled={disabled}>
      <BaseSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        data-slot="select-trigger"
        className={cn(controlClass, 'flex items-center justify-between gap-2 text-left data-popup-open:border-foreground', className)}
      >
        <BaseSelect.Value className="truncate" />
        <BaseSelect.Icon className="shrink-0 text-muted-foreground">
          <CaretDown className="size-4" aria-hidden />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-50 outline-none">
          <BaseSelect.Popup
            data-slot="select-content"
            className="max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto rounded-sm border border-secondary bg-popover p-1 text-body-sm outline-none"
          >
            {options.map((o) => (
              <BaseSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="flex h-8 cursor-default items-center gap-2 rounded-sm px-2 text-foreground outline-none select-none data-disabled:opacity-50 data-highlighted:bg-secondary"
              >
                <BaseSelect.ItemText className="flex-1 truncate">{o.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="shrink-0">
                  <Check className="size-4" aria-hidden />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
