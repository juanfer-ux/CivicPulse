import { useState, type ComponentType } from 'react'
import { Bandaids, Barricade, Bag, BagSimple, BeerBottle, Bone, Boot, Bridge, Bulldozer, Car, CarProfile, CarSimple, Cigarette, Coffee, Cookie, FishSimple, Hammer, LightningSlash, LinkBreak, LinkSimpleBreak, OrangeSlice, Package, Pipe, Recycle, RoadHorizon, ShoppingBag, Siren, Tire, Trash, TrashSimple, TrafficCone, TrafficSign, Truck, Wall, WarningDiamond, Wrench, type IconProps } from '@phosphor-icons/react'

/**
 * (2026-11-14, later: the Illegal Dumping row also has garbage-like icons, bags, a tire, a boot, a bottle, a cup, a cigarette, a fish skeleton and bone, an orange slice and a cookie, and Damaged Infrastructure has broken-looking ones, a broken link, a patch, a cut power line, a wall, a bulldozer. Phosphor has no banana peel and no "broken" icon.)
 * Duotone icons for the three category cards of the agent panel's landing (owner's request, 2026-11-14). Dev-only gallery at /#category-icons: each category with several Phosphor candidates drawn in the real card (Figma Category_Card: 8 px padding, 80 px picture block, name in `meta`). Colors, size and weight can be switched. Nothing here touches the app.
 */

type Icon = ComponentType<IconProps>
const CATEGORIES: { title: string; icons: [string, Icon][] }[] = [
  { title: 'Obstructive Parking', icons: [['Car', Car], ['CarProfile', CarProfile], ['CarSimple', CarSimple]] },
  { title: 'Illegal Dumping', icons: [['Trash', Trash], ['TrashSimple', TrashSimple], ['Recycle', Recycle], ['Truck', Truck], ['Bag', Bag], ['BagSimple', BagSimple], ['ShoppingBag', ShoppingBag], ['Package', Package], ['Tire', Tire], ['Boot', Boot], ['BeerBottle', BeerBottle], ['Coffee', Coffee], ['Cigarette', Cigarette], ['FishSimple', FishSimple], ['Bone', Bone], ['OrangeSlice', OrangeSlice], ['Cookie', Cookie]] },
  { title: 'Damaged Infrastructure', icons: [['TrafficCone', TrafficCone], ['Barricade', Barricade], ['WarningDiamond', WarningDiamond], ['Bridge', Bridge], ['Pipe', Pipe], ['Wrench', Wrench], ['Hammer', Hammer], ['RoadHorizon', RoadHorizon], ['LinkBreak', LinkBreak], ['LinkSimpleBreak', LinkSimpleBreak], ['Bandaids', Bandaids], ['LightningSlash', LightningSlash], ['Wall', Wall], ['Bulldozer', Bulldozer], ['TrafficSign', TrafficSign], ['Siren', Siren]] },
]
const COLORS = [['neutral-300', 'var(--neutral-300)'], ['neutral-100', 'var(--neutral-100)'], ['indigo-400', 'var(--indigo-400)'], ['indigo-300', 'var(--indigo-300)']] as const
const SIZES = [32, 40, 48, 56] as const
const WEIGHTS = ['duotone', 'regular', 'fill'] as const

/** The Category_Card as in AgentHome: the picture block holds the icon instead of a photo. */
function Card({ name, label, Icon, color, size, weight }: { name: string; label: string; Icon: Icon; color: string; size: number; weight: (typeof WEIGHTS)[number] }) {
  return (
    <div className="flex w-[202px] flex-col gap-1.5 rounded-lg bg-(--neutral-700) p-2" title={name}>
      <div className="grid h-20 place-items-center rounded-sm bg-(--neutral-800)" style={{ color }}>
        <Icon weight={weight} size={size} aria-hidden />
      </div>
      <p className="truncate p-1 text-meta text-(--neutral-100)">{label}</p>
      <p className="px-1 pb-0.5 text-caption text-(--neutral-300)">{name}</p>
    </div>
  )
}

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

export function CategoryIconGallery() {
  const [color, setColor] = useState<(typeof COLORS)[number][0]>('indigo-300')
  const [size, setSize] = useState<(typeof SIZES)[number]>(48)
  const [weight, setWeight] = useState<(typeof WEIGHTS)[number]>('duotone')
  const hex = COLORS.find(([n]) => n === color)![1]
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-8 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-heading">Category card icons</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">Phosphor icons for each category of the agent panel's landing, in the real card (the picture block is the flat `neutral-800` here so the icon reads). Duotone draws the icon with a 20 % tint of the same color behind its lines.</p>
        <div className="flex flex-col gap-2">
          <Pick label="Weight" value={weight} options={WEIGHTS} onChange={setWeight} />
          <Pick label="Color" value={color} options={COLORS.map(([n]) => n)} onChange={setColor} />
          <Pick label="Size" value={size} options={SIZES} onChange={setSize} />
        </div>
      </header>
      {CATEGORIES.map((c) => (
        <section key={c.title} className="flex flex-col gap-3">
          <h2 className="font-display-semi text-display-xs text-(--neutral-200)">{c.title}</h2>
          <div className="flex flex-wrap gap-4">
            {c.icons.map(([name, Icon]) => (
              <Card key={name} name={name} label={c.title} Icon={Icon} color={hex} size={size} weight={weight} />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
