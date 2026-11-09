import { stats } from '@/components/ProblemDetail'
import type { Shape } from '@/lib/modules'
import type { ProblemRow } from '@/lib/problems'

/** The Numbers module: a recurrence's five numbers (the same ones as the header's left column), laid out for the zone's shape: 4:3 in three columns, 4:4 in two with bigger numbers. */
export default function NumbersModule({ problem, shape }: { problem: ProblemRow; shape: Shape }) {
  const big = shape === '4:4'
  return (
    <dl className={`grid gap-x-3 gap-y-3 ${big ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {stats(problem).map((x) => (
        <div key={x.label} className="flex min-w-0 flex-col gap-1">
          <dt className="flex items-center gap-1 truncate text-meta text-muted-foreground">
            <x.Icon weight="regular" className="size-3.5 shrink-0 text-(--neutral-200)" aria-hidden />
            <span className="truncate">{x.label}</span>
          </dt>
          <dd className={`truncate ${big ? 'text-heading' : 'text-subtitle'}`}>{x.value}</dd>
        </div>
      ))}
    </dl>
  )
}
