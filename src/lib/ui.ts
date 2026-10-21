/** Same look as the Input component (Figma: control-default, bg-card, border-input, radius-sm, body text), for native selects and dropdown buttons. */
export const controlClass =
  'h-(--control-default) w-full rounded-sm border border-input bg-card px-3 text-body outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 [&>option]:bg-card'

/** A native <select> with our own chevron and room for it on the right. */
export const selectClass = `${controlClass} select-chevron pr-10`
