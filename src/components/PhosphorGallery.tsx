import { useMemo, useState, type ComponentType } from 'react'
import * as Phosphor from '@phosphor-icons/react'
import type { IconProps } from '@phosphor-icons/react'

/**
 * Every Phosphor icon (owner's request, 2026-11-14), the family the app uses. Dev-only gallery at /#phosphor: search by name, weight (thin, light, regular, bold, fill, duotone), size and color; click an icon to copy its name. Shows the first 240 matches, with a button for more. Nothing here touches the app.
 */

const ICONS = Object.entries(Phosphor as unknown as Record<string, ComponentType<IconProps>>)
  .filter(([name, c]) => /^[A-Z]/.test(name) && !name.endsWith('Icon') && !['IconBase', 'IconContext', 'SSR'].includes(name) && (typeof c === 'function' || typeof c === 'object'))
  .sort(([a], [b]) => a.localeCompare(b))
const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] as const
const SIZES = [24, 32, 40, 48] as const
const COLORS = [['neutral-100', 'var(--neutral-100)'], ['neutral-300', 'var(--neutral-300)'], ['indigo-400', 'var(--indigo-400)'], ['indigo-300', 'var(--indigo-300)']] as const
const PAGE = 240

function Pick<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-meta text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button key={String(o)} type="button" onClick={() => onChange(o)} aria-pressed={o === value} className={`rounded-sm border px-2 py-1 text-meta ${o === value ? 'border-(--neutral-300) bg-(--neutral-600)' : 'border-(--neutral-500) hover:bg-(--neutral-700)'}`}>
            {String(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PhosphorGallery() {
  const [q, setQ] = useState('')
  const [weight, setWeight] = useState<(typeof WEIGHTS)[number]>('duotone')
  const [size, setSize] = useState<(typeof SIZES)[number]>(32)
  const [color, setColor] = useState<(typeof COLORS)[number][0]>('neutral-100')
  const [shown, setShown] = useState(PAGE)
  const [copied, setCopied] = useState('')
  const hex = COLORS.find(([n]) => n === color)![1]
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? ICONS.filter(([n]) => n.toLowerCase().includes(s)) : ICONS
  }, [q])
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-6 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading">Phosphor icons</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">{ICONS.length} icons in six weights, the family the app uses (MIT). Search by name; click an icon to copy its name.</p>
        <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder="Search, for example car, trash, road, warning" aria-label="Search icons" className="h-9 max-w-[420px] rounded-sm border border-(--neutral-400) bg-(--neutral-600) px-3 text-body-sm outline-none focus-visible:border-(--neutral-100)" />
        <div className="flex flex-col gap-2">
          <Pick label="Weight" value={weight} options={WEIGHTS} onChange={setWeight} />
          <Pick label="Size" value={size} options={SIZES} onChange={setSize} />
          <Pick label="Color" value={color} options={COLORS.map(([n]) => n)} onChange={setColor} />
        </div>
        <p className="text-meta text-muted-foreground" aria-live="polite">{matches.length} match{matches.length === 1 ? '' : 'es'}{copied && ` · copied ${copied}`}</p>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
        {matches.slice(0, shown).map(([name, Icon]) => (
          <button key={name} type="button" title={name} onClick={() => { void navigator.clipboard?.writeText(name); setCopied(name) }} className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm bg-(--neutral-700) px-1 hover:bg-(--neutral-600)">
            <span style={{ color: hex }}><Icon weight={weight} size={size} aria-hidden /></span>
            <span className="w-full truncate text-center text-caption text-(--neutral-200)">{name}</span>
          </button>
        ))}
      </div>
      {shown < matches.length && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="self-start rounded-sm border border-(--neutral-500) px-3 py-2 text-meta hover:bg-(--neutral-700)">
          Show {Math.min(PAGE, matches.length - shown)} more
        </button>
      )}
    </main>
  )
}
