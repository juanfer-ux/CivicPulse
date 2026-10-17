import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export interface Option<T> {
  value: T
  label: string
}

/** A dropdown with a checkbox for each option. Closes on outside click or Escape. */
export function MultiSelect<T extends string | number>({
  options,
  selected,
  onChange,
  noun,
  disabled,
}: {
  options: Option<T>[]
  selected: T[]
  onChange: (next: T[]) => void
  /** Plural noun for the summary, e.g. "zones". */
  noun: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const names = options.filter((o) => selected.includes(o.value)).map((o) => o.label)
  const summary =
    selected.length === 0 ? `Choose ${noun}` : selected.length === options.length ? `All ${options.length} ${noun}` : names.length <= 2 ? names.join(', ') : `${names.length} ${noun} selected`

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <span className="truncate">{summary}</span>
        <span aria-hidden className="text-xs text-muted-foreground">
          ▾
        </span>
      </button>
      {open && (
        <div role="listbox" aria-multiselectable className="absolute inset-x-0 top-9 z-30 flex max-h-72 flex-col overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-2 py-1">
            <span className="text-xs text-muted-foreground">
              {selected.length}/{options.length} selected
            </span>
            <span className="flex gap-1">
              <Button size="xs" variant="ghost" type="button" onClick={() => onChange(options.map((o) => o.value))}>
                Select all
              </Button>
              <Button size="xs" variant="ghost" type="button" onClick={() => onChange([])}>
                Clear
              </Button>
            </span>
          </div>
          <div className="overflow-y-auto p-1">
            {options.map((o) => (
              <label key={String(o.value)} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={(e) => onChange(e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value))}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
