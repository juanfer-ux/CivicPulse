import type { ReactNode } from 'react'

/** A visible label above its input. The wrapping <label> also names the input for assistive technology, so the input needs no aria-label (decision 0023). */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-label">
      {label}
      {children}
    </label>
  )
}
