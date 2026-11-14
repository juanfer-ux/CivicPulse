import { useState } from 'react'

/**
 * One duotone icon family per page for the category cards (owner's request, 2026-11-14), next to the Phosphor gallery at /#category-icons and the mixed one at /#category-families. Dev-only: /#category-coolicons (Coolicons, MIT: duotone, round, sharp and duocolor styles) and /#category-lucide (Lucide Extended, ISC: the Lucide set drawn in duotone, with a banana, a brick wall and a construction icon). The pictures are SVGs loaded from the public Iconify API by icon name (nothing of ours is sent), so these pages need the network. Nothing is installed and nothing here is in the app.
 */

type Family = { prefix: string; title: string; license: string; styles: string[]; styleOf: (name: string, style: string) => string; categories: { title: string; names: string[] }[] }

const COOL: Family = {
  prefix: 'coolicons', title: 'Coolicons', license: 'MIT', styles: ['duotone', 'duotone-round', 'duotone-sharp', 'duocolor'],
  styleOf: (n, s) => `${n}-${s}`,
  categories: [
    { title: 'Obstructive Parking', names: ['car'] },
    { title: 'Illegal Dumping', names: ['trash', 'box', 'money-bag'] },
    { title: 'Damaged Infrastructure', names: ['traffic-cone', 'wrench', 'hammer', 'warning', 'road', 'plug', 'link'] },
  ],
}
const LUCIDE: Family = {
  prefix: 'lucide-extended', title: 'Lucide Extended', license: 'ISC', styles: ['duotone'],
  styleOf: (n) => `${n}-duotone`,
  categories: [
    { title: 'Obstructive Parking', names: ['car', 'car-front', 'car-taxi-front'] },
    { title: 'Illegal Dumping', names: ['trash', 'paper-bag', 'shopping-bag', 'bottle-wine', 'banana', 'box', 'newspaper'] },
    { title: 'Damaged Infrastructure', names: ['brick-wall', 'brick-wall-fire', 'construction', 'traffic-cone', 'road', 'wrench', 'hammer', 'plug-zap', 'unplug'] },
  ],
}
const COLORS = [['neutral-300', '#C1C1C8'], ['neutral-100', '#ECECEE'], ['indigo-400', '#7C86C4'], ['indigo-300', '#9AA3D6']] as const
const SIZES = [32, 40, 48, 56] as const

function Pick<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-meta text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {options.map((o) => (
          <button key={String(o)} type="button" onClick={() => onChange(o)} aria-pressed={o === value} className={`rounded-sm border px-2 py-1 text-meta ${o === value ? 'border-(--neutral-300) bg-(--neutral-600)' : 'border-(--neutral-500) hover:bg-(--neutral-700)'}`}>
            {String(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

function FamilyGallery({ f }: { f: Family }) {
  const [color, setColor] = useState<(typeof COLORS)[number][0]>('indigo-300')
  const [size, setSize] = useState<(typeof SIZES)[number]>(48)
  const [style, setStyle] = useState(f.styles[0])
  const hex = COLORS.find(([n]) => n === color)![1].replace('#', '%23')
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-8 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading">Category card icons: {f.title}</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">{f.title} ({f.license}). Loaded by name from the public Iconify API, so it needs the network. A blank card means this family has no icon with that name.</p>
        <div className="flex flex-col gap-2">
          {f.styles.length > 1 && <Pick label="Style" value={style} options={f.styles} onChange={setStyle} />}
          <Pick label="Color" value={color} options={COLORS.map(([n]) => n)} onChange={setColor} />
          <Pick label="Size" value={size} options={SIZES} onChange={setSize} />
        </div>
      </header>
      {f.categories.map((c) => (
        <section key={c.title} className="flex flex-col gap-3">
          <h2 className="font-display-semi text-display-xs text-(--neutral-200)">{c.title}</h2>
          <div className="flex flex-wrap gap-4">
            {c.names.map((n) => {
              const id = f.styleOf(n, style)
              return (
                <div key={id} className="flex w-[202px] flex-col gap-1.5 rounded-lg bg-(--neutral-700) p-2">
                  <div className="grid h-20 place-items-center rounded-sm bg-(--neutral-800)">
                    <img src={`https://api.iconify.design/${f.prefix}/${id}.svg?color=${hex}&height=${size}`} alt="" height={size} />
                  </div>
                  <p className="truncate p-1 text-meta text-(--neutral-100)">{c.title}</p>
                  <p className="px-1 pb-0.5 text-caption text-(--neutral-300)">{f.prefix}:{id}</p>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}

export const CoolIconsGallery = () => <FamilyGallery f={COOL} />
export const LucideExtendedGallery = () => <FamilyGallery f={LUCIDE} />
