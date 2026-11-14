import { useState } from 'react'

/**
 * Other duotone icon families for the category cards (owner's request, 2026-11-14), next to the Phosphor gallery at /#category-icons. Dev-only gallery at /#category-families: Solar (bold or line duotone, CC BY 4.0, so it needs credit), IconPark TwoTone (Apache 2.0, has a banana) and Duoicons (MIT, a small set), drawn in the real card block. The pictures are SVGs loaded from the public Iconify API by icon name (nothing of ours is sent), so this page needs the network. Nothing here is in the app, and nothing is installed.
 */

type Entry = { prefix: 'solar' | 'icon-park-twotone' | 'duo-icons'; name: string }
const S = (name: string): Entry => ({ prefix: 'solar', name })
const P = (name: string): Entry => ({ prefix: 'icon-park-twotone', name })
const D = (name: string): Entry => ({ prefix: 'duo-icons', name })
const CATEGORIES: { title: string; icons: Entry[] }[] = [
  { title: 'Obstructive Parking', icons: [S('car'), P('car'), D('car'), P('parking')] },
  { title: 'Illegal Dumping', icons: [S('trash-bin-2'), S('trash-bin-minimalistic'), S('trash-bin-trash'), S('bag'), S('bottle'), S('cup-paper'), S('paper-bin'), P('banana'), P('fish'), P('bottle-one'), P('high-heeled-shoes'), D('box')] },
  { title: 'Damaged Infrastructure', icons: [S('link-broken'), S('unlink'), S('plug-circle'), S('lightbulb-bolt'), S('sledgehammer'), S('signpost'), P('road-cone'), P('road-sign'), P('bridge-one'), P('hammer-and-anvil'), P('plug'), D('bridge')] },
]
const COLORS = [['neutral-300', '#C1C1C8'], ['neutral-100', '#ECECEE'], ['indigo-400', '#7C86C4'], ['indigo-300', '#9AA3D6']] as const
const SIZES = [32, 40, 48, 56] as const

const idOf = (e: Entry, solar: 'bold' | 'line') => (e.prefix === 'solar' ? `${e.name}-${solar}-duotone` : e.name)

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

export function CategoryIconFamiliesGallery() {
  const [color, setColor] = useState<(typeof COLORS)[number][0]>('indigo-300')
  const [size, setSize] = useState<(typeof SIZES)[number]>(48)
  const [solar, setSolar] = useState<'bold' | 'line'>('bold')
  const hex = COLORS.find(([n]) => n === color)![1].replace('#', '%23')
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-8 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading">Category card icons: other duotone families</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">Solar (CC BY 4.0, needs credit), IconPark TwoTone (Apache 2.0) and Duoicons (MIT). Loaded by name from the public Iconify API, so it needs the network. A blank card means that family has no icon with that name.</p>
        <div className="flex flex-col gap-2">
          <Pick label="Solar" value={solar} options={['bold', 'line'] as const} onChange={setSolar} />
          <Pick label="Color" value={color} options={COLORS.map(([n]) => n)} onChange={setColor} />
          <Pick label="Size" value={size} options={SIZES} onChange={setSize} />
        </div>
      </header>
      {CATEGORIES.map((c) => (
        <section key={c.title} className="flex flex-col gap-3">
          <h2 className="font-display-semi text-display-xs text-(--neutral-200)">{c.title}</h2>
          <div className="flex flex-wrap gap-4">
            {c.icons.map((e) => {
              const id = idOf(e, solar)
              return (
                <div key={`${e.prefix}:${id}`} className="flex w-[202px] flex-col gap-1.5 rounded-lg bg-(--neutral-700) p-2">
                  <div className="grid h-20 place-items-center rounded-sm bg-(--neutral-800)">
                    <img src={`https://api.iconify.design/${e.prefix}/${id}.svg?color=${hex}&height=${size}`} alt="" height={size} />
                  </div>
                  <p className="truncate p-1 text-meta text-(--neutral-100)">{c.title}</p>
                  <p className="px-1 pb-0.5 text-caption text-(--neutral-300)">{e.prefix}:{id}</p>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
