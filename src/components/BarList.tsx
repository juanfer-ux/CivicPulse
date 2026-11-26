import type { Answer } from '@/lib/agent'

/** Tremor's bar list (Figma **Answer Chart · Bar List**): the bar sits behind the label, the number on the right. Used by the agent's answer about localities and by the recurrence numbers card; its own file so the card does not load the chart library. */
export function BarList({ bars, onFocus, onPick }: { bars: Answer['bars']; onFocus?: (code: number | null) => void; onPick?: (code: number) => void }) {
  const max = Math.max(...bars.map((b) => b.value))
  return (
    <ul className="flex flex-col gap-1.5 text-body-sm" aria-label={`Bar list: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}`}>
      {bars.map((b) => (
        <li key={b.label} className="flex items-center gap-3">
          <button type="button" disabled={!b.code || !onPick} onMouseEnter={() => b.code && onFocus?.(b.code)} onMouseLeave={() => onFocus?.(null)} onClick={() => b.code && onPick?.(b.code)} className="relative h-8 flex-1 overflow-hidden rounded-sm bg-(--cobalt-800) text-left enabled:cursor-pointer">
            <span className="absolute inset-y-0 left-0 bg-(--cobalt-300) opacity-30" style={{ width: `${(b.value / max) * 100}%` }} />
            <span className="relative flex h-full items-center px-2 text-body-sm-medium text-(--fg-emphasis)">{b.label}</span>
          </button>
          <span className="w-8 text-right text-subtitle-strong tabular-nums text-foreground">{b.value}</span>
        </li>
      ))}
    </ul>
  )
}
