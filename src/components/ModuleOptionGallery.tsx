import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CaretDown, Check, ChartBar, ChartScatter, DotsSixVertical, GearSix, Hash, Info, PushPin } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/**
 * Where the "Apply and pin modules across every recurrence and incident" option lives in the sidebar's Modules section (owner's idea, 2026-11-09: an icon that deploys the info, or a wheel). Dev-only gallery at /#module-options: four live mock sections, each with its own copy of the option (follow the open case, or stay with the case each module was placed on). The section title row has the same look as the sidebar's Recurrences / Incidents rows (title left, 32 px high, icon buttons right); the menu has the look of the sidebar's view menu. Nothing here touches the app.
 */

const ROWS = [
  { title: 'Recurrence timeline', Icon: ChartScatter },
  { title: 'Numbers', Icon: Hash },
  { title: 'Answer chart', Icon: ChartBar },
]
const FOLLOW = 'Follow the open case'
const STAY = 'Stay with each case'
const HELP = 'Follow: the dock stays and shows whichever recurrence or incident is open. Stay: each module keeps the case it was placed on and shows only there.'

const Frame = ({ name, note, children }: { name: string; note: string; children: ReactNode }) => (
  <div className="flex w-[260px] min-w-0 flex-col gap-2">
    <div>
      <p className="text-label">{name}</p>
      <p className="text-meta text-muted-foreground">{note}</p>
    </div>
    {children}
  </div>
)

/** The section: the title row (icons on the right) and the module rows; `extra` goes under the rows. `status` shows what the option is set to. */
function Section({ follow, actions, below, children }: { follow: boolean; actions: ReactNode; below?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg bg-(--neutral-700)">
      <div className="relative flex h-8 items-center justify-between px-3">
        <span className="text-body-sm text-(--neutral-100)">Modules</span>
        <div className="flex items-center gap-1">{actions}</div>
        {children}
      </div>
      {below}
      <ul className="flex flex-col gap-0.5 p-2">
        {ROWS.map(({ title, Icon }) => (
          <li key={title} className="flex items-center gap-2 rounded-sm px-1 py-1.5 text-body-sm hover:bg-(--neutral-800)">
            <DotsSixVertical className="size-3.5 text-(--neutral-300)" aria-hidden />
            <Icon weight="regular" className="size-4 text-(--neutral-200)" aria-hidden />
            {title}
          </li>
        ))}
      </ul>
      <p className="border-t border-(--neutral-600) px-3 py-2 text-meta text-muted-foreground">Dock: {follow ? FOLLOW.toLowerCase() : STAY.toLowerCase()}</p>
    </div>
  )
}

const IconButton = ({ label, on, onClick, children }: { label: string; on?: boolean; onClick: () => void; children: ReactNode }) => (
  <Button size="icon" variant="ghost" aria-label={label} aria-pressed={on} title={label} onClick={onClick} className={`size-7 ${on ? 'bg-(--neutral-600)' : ''}`}>
    {children}
  </Button>
)

/** Closes a popover on an outside press or Escape, like the sidebar's view menu. */
function useDismiss(onClose: () => void) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && onClose()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => (document.removeEventListener('pointerdown', down), document.removeEventListener('keydown', key))
  }, [onClose])
  return box
}

const Radio = ({ label, on, pick }: { label: string; on: boolean; pick: () => void }) => (
  <Button role="menuitemradio" aria-checked={on} variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-body-sm hover:bg-(--neutral-800)" onClick={pick}>
    <span className="flex size-4 items-center justify-center">{on && <Check weight="bold" className="size-3.5" aria-hidden />}</span>
    {label}
  </Button>
)

/** 1: a gear in the title row opens a small menu with two radio items, the same pattern as the sidebar's view menu. */
function GearMenu() {
  const [follow, setFollow] = useState(true)
  const [open, setOpen] = useState(false)
  const box = useDismiss(() => setOpen(false))
  return (
    <Section follow={follow} actions={<IconButton label="Module settings" on={open} onClick={() => setOpen(!open)}><GearSix weight="regular" className="size-4 text-(--neutral-100)" /></IconButton>}>
      {open && (
        <div ref={box} role="menu" aria-label="Module settings" className="absolute top-full right-0 z-20 mt-1 w-60 rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-1 shadow-lg">
          <p className="px-2 pt-1 pb-0.5 text-caption-medium text-(--neutral-300)">Apply modules across every case</p>
          <Radio label={FOLLOW} on={follow} pick={() => setFollow(true)} />
          <Radio label={STAY} on={!follow} pick={() => setFollow(false)} />
        </div>
      )}
    </Section>
  )
}

/** 2: a pin toggle in the title row, no menu: pressed = the dock follows. The hover title explains it. */
function PinToggle() {
  const [follow, setFollow] = useState(true)
  return (
    <Section follow={follow} actions={<IconButton label={follow ? 'Pinned: modules follow the open case. Click to stay with each case.' : 'Not pinned: modules stay with each case. Click to follow the open case.'} on={follow} onClick={() => setFollow(!follow)}><PushPin weight={follow ? 'fill' : 'regular'} className="size-4 text-(--neutral-100)" /></IconButton>} />
  )
}

/** 3: an info icon opens a popover that explains the option and holds a Yes / No switch (the first version, tucked away). */
function InfoPopover() {
  const [follow, setFollow] = useState(true)
  const [open, setOpen] = useState(false)
  const box = useDismiss(() => setOpen(false))
  return (
    <Section follow={follow} actions={<IconButton label="About applying modules" on={open} onClick={() => setOpen(!open)}><Info weight="regular" className="size-4 text-(--neutral-100)" /></IconButton>}>
      {open && (
        <div ref={box} role="dialog" aria-label="Apply and pin modules" className="absolute top-full right-0 z-20 mt-1 w-64 rounded-sm border border-(--neutral-500) bg-(--neutral-800) p-3 shadow-lg">
          <p className="text-body-sm-medium">Apply and pin modules across every recurrence and incident?</p>
          <p className="mt-1 text-meta text-muted-foreground">{HELP}</p>
          <div className="mt-2 flex gap-1" role="group">
            {[[true, 'Yes'], [false, 'No']].map(([v, l]) => (
              <button key={String(l)} type="button" aria-pressed={follow === v} onClick={() => setFollow(v as boolean)} className={`flex-1 rounded-sm border px-2 py-1 text-meta ${follow === v ? 'border-(--neutral-100) text-(--neutral-100)' : 'border-(--neutral-500) text-(--neutral-300)'}`}>{String(l)}</button>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

/** 4: a caret under the title opens the option inline, pushing the list down (stays open until closed, nothing floats). */
function Inline() {
  const [follow, setFollow] = useState(true)
  const [open, setOpen] = useState(false)
  return (
    <Section
      follow={follow}
      actions={<IconButton label={open ? 'Hide module settings' : 'Show module settings'} on={open} onClick={() => setOpen(!open)}><CaretDown className={`size-4 text-(--neutral-100) transition-transform ${open ? 'rotate-180' : ''}`} /></IconButton>}
      below={open ? (
        <div className="mx-2 mb-1 flex flex-col gap-1 rounded-sm border border-(--neutral-600) p-2">
          <p className="text-meta">Apply modules across every case</p>
          <div className="flex gap-1" role="group">
            {[[true, FOLLOW], [false, STAY]].map(([v, l]) => (
              <button key={String(l)} type="button" aria-pressed={follow === v} onClick={() => setFollow(v as boolean)} className={`flex-1 rounded-sm border px-1 py-1 text-meta ${follow === v ? 'border-(--neutral-100) text-(--neutral-100)' : 'border-(--neutral-500) text-(--neutral-300)'}`}>{String(l)}</button>
            ))}
          </div>
        </div>
      ) : undefined}
    />
  )
}

export function ModuleOptionGallery() {
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-6 p-8">
      <header>
        <h1 className="text-heading">Where the module option lives</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">The question "Apply and pin modules across every recurrence and incident?" takes a lot of room as a box under the list. Four ways to tuck it behind an icon in the Modules title row. The title row matches the sidebar's Recurrences and Incidents rows; the line at the bottom of each mock shows what the option is set to. All four are live.</p>
      </header>
      <div className="flex flex-wrap items-start gap-8">
        <Frame name="1 · Gear and menu" note="A gear opens a small menu with two choices, the same pattern as the sidebar's view menu. Familiar, and the wording says what each choice does.">
          <GearMenu />
        </Frame>
        <Frame name="2 · Pin toggle" note="One pin icon, filled when on: no menu, one click to flip. The hover text explains it. Smallest, but the meaning has to be learned.">
          <PinToggle />
        </Frame>
        <Frame name="3 · Info and popover" note="An info icon opens the full question with its explanation and the Yes / No switch. Best for teaching the option; one extra click to change it.">
          <InfoPopover />
        </Frame>
        <Frame name="4 · Inline caret" note="A caret opens the option inside the section and pushes the list down. Nothing floats; it stays open until you close it.">
          <Inline />
        </Frame>
      </div>
    </main>
  )
}
