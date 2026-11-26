import type { CSSProperties, ReactNode } from 'react'
import { Image } from '@phosphor-icons/react'

/** The shell of the map's hover cards (Figma **Recurrence Card** and **Incident Hover Card**, one style, owner 2026-11-25): 353 px, 24 px padding, 8 px radius; a 180 px photo tile with the status top right and the photo's label bottom left, then the title, two columns and one quieter line. */
export function HoverCard({ status, photo, placeholder, title, columns, note, className = '', style }: { status: ReactNode; photo?: string | null; placeholder?: boolean; title: string; columns: [string, string]; note: string; className?: string; style?: CSSProperties }) {
  return (
    <div role="tooltip" style={style} className={`pointer-events-none flex w-[353px] flex-col gap-4 rounded-md border border-(--neutral-400) bg-(--neutral-800) p-6 shadow-lg ${className}`}>
      <div className="relative grid h-[180px] place-items-center rounded-md border border-dashed border-(--neutral-500) bg-(--neutral-900) text-(--fg-secondary)" title={placeholder ? 'Placeholder: no file attached yet' : undefined}> {/* no photo files exist yet, so a placeholder */}
        <Image className="size-6" aria-hidden />
        <div className="absolute top-3 right-3">{status}</div>
        {photo && <span className="absolute bottom-3 left-3 text-caption-medium text-(--neutral-300)">{photo}</span>}
      </div>
      <div className="flex flex-col gap-3">
        <p className="line-clamp-3 whitespace-pre-line font-display-semi text-display-xs font-[calc(700+var(--display-weight-offset))] text-(--fg-primary)">{title}</p>
        <div className="flex flex-col gap-0.5 text-body-sm">
          <div className="flex gap-0.5 text-(--fg-primary)">
            <p className="flex-1">{columns[0]}</p>
            <p className="flex-1">{columns[1]}</p>
          </div>
          <p className="text-(--fg-secondary)">{note}</p>
        </div>
      </div>
    </div>
  )
}
