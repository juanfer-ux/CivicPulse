import { useState } from 'react'
import { Bus, Calendar, CalendarBlank, CalendarCheck, CalendarDot, CalendarDots, CalendarPlus, CalendarStar, Car, CarProfile, CarSimple, ChatText, ClipboardText, FileText, Flag, Garage, Jeep, Megaphone, Motorcycle, NotePencil, PaperPlaneTilt, Siren, SteeringWheel, Truck, Van, type Icon, type IconWeight } from '@phosphor-icons/react'
import { OverviewRows } from '@/components/ProblemDetail'

type Option = { code: string; name: string; Icon: Icon }
const option = (code: string, name: string, Icon: Icon): Option => ({ code, name, Icon })

const REPORTED: { title: string; options: Option[] }[] = [
  { title: 'Calendars', options: [option('R1', 'CalendarCheck', CalendarCheck), option('R2', 'CalendarPlus', CalendarPlus), option('R3', 'CalendarDots', CalendarDots), option('R4', 'CalendarDot', CalendarDot), option('R5', 'CalendarStar', CalendarStar), option('R6', 'CalendarBlank', CalendarBlank)] },
  { title: 'Reports', options: [option('R7', 'ClipboardText', ClipboardText), option('R8', 'FileText', FileText), option('R9', 'NotePencil', NotePencil), option('R10', 'Megaphone', Megaphone), option('R11', 'ChatText', ChatText), option('R12', 'PaperPlaneTilt', PaperPlaneTilt), option('R13', 'Flag', Flag), option('R14', 'Siren', Siren)] },
]
const VEHICLE: Option[] = [option('V1', 'CarProfile', CarProfile), option('V2', 'CarSimple', CarSimple), option('V3', 'Car', Car), option('V4', 'Jeep', Jeep), option('V5', 'SteeringWheel', SteeringWheel), option('V6', 'Garage', Garage)]
/** V7: the icon follows the report's vehicle type (the database's six values). */
const BY_TYPE: [string, string, Icon][] = [['Car', 'CarProfile', CarProfile], ['Motorcycle', 'Motorcycle', Motorcycle], ['Van', 'Van', Van], ['Truck', 'Truck', Truck], ['Bus', 'Bus', Bus], ['Other', 'SteeringWheel', SteeringWheel]]

/** The weights to compare (owner's test, 2026-11-28); Phosphor calls solid "fill". The owner chose solid for these rows (decision 0050); bold stays for the send arrow and the trend icons only. */
const WEIGHTS: [string, IconWeight][] = [['Regular', 'regular'], ['Bold', 'bold'], ['Solid', 'fill']]

const rows = (reported: Icon, vehicle: Icon, type = 'Motorcycle') => [
  { Icon: Calendar, label: 'Occurred', value: '12 Oct, 08:40' },
  { Icon: reported, label: 'Reported', value: '12 Oct, 09:15' },
  { Icon: vehicle, label: 'Vehicle', value: type },
]

function Choice({ title, hint, selected, onClick, children }: { title: string; hint?: string; selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`flex w-[330px] flex-col rounded-lg border bg-(--neutral-900) p-1 text-left focus-visible:outline-2 focus-visible:outline-ring ${selected ? 'border-(--neutral-100)' : 'border-(--neutral-500) hover:border-(--neutral-300)'}`}>
      <span className="flex flex-wrap justify-between gap-x-2 px-2 pt-2 text-caption-medium text-(--neutral-100)">
        {title}
        {hint && <span className="text-(--neutral-300)">{hint}</span>}
      </span>
      {children}
    </button>
  )
}

/**
 * Icon options for the **Reported** and **Vehicle** rows of the Incident Overview (owner, 2026-11-28; Figma draws a clock on both). Dev-only gallery at /#overview-icons: click one of each to see them together in the preview.
 * Phosphor regular only, as published (decision 0025); Phosphor has no single icon that joins a report and a calendar.
 */
export function OverviewIconGallery() {
  const [reported, setReported] = useState('R1')
  const [vehicle, setVehicle] = useState('V7')
  const [weight, setWeight] = useState<IconWeight>('fill')
  const r = REPORTED.flatMap((g) => g.options).find((o) => o.code === reported)!
  const v = VEHICLE.find((o) => o.code === vehicle)
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading">Incident Overview icons</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">Options for the Reported and Vehicle rows, at the real 20 px. Click one of each; the preview shows them together in regular, bold and solid, and the weight buttons change every card below. The first row of every card is the Occurred icon, for comparison. Phosphor has no single icon that joins a report and a calendar.</p>
      </header>
      <section aria-label="Preview" className="sticky top-0 z-10 flex flex-wrap items-start gap-4 border-b border-(--neutral-600) bg-background pb-4">
        {WEIGHTS.map(([name, w]) => (
          <div key={w} className="w-[330px] rounded-lg bg-(--neutral-900) p-1">
            <p className="px-2 pt-2 text-caption-medium text-(--neutral-100)">{name}: {reported} + {vehicle}</p>
            <OverviewRows closed weight={w} rows={rows(r.Icon, v?.Icon ?? Motorcycle)} />
          </div>
        ))}
        <div role="group" aria-label="Weight of the cards below" className="flex w-full items-center gap-1">
          <span className="mr-2 text-meta text-muted-foreground">Cards below</span>
          {WEIGHTS.map(([name, w]) => (
            <button key={w} type="button" aria-pressed={weight === w} onClick={() => setWeight(w)} className={`rounded-sm border px-2 py-1 text-meta ${weight === w ? 'border-(--neutral-100) bg-(--neutral-900)' : 'border-(--neutral-500) hover:border-(--neutral-300)'}`}>
              {name}
            </button>
          ))}
        </div>
      </section>
      {REPORTED.map((g) => (
        <section key={g.title} className="flex flex-col gap-3">
          <h2 className="text-subtitle">Reported · {g.title}</h2>
          <div className="flex flex-wrap gap-4">
            {g.options.map((o) => (
              <Choice key={o.code} title={`${o.code} · ${o.name}`} selected={reported === o.code} onClick={() => setReported(o.code)}>
                <OverviewRows weight={weight} rows={rows(o.Icon, v?.Icon ?? Motorcycle).slice(0, 2)} />
              </Choice>
            ))}
          </div>
        </section>
      ))}
      <section className="flex flex-col gap-3">
        <h2 className="text-subtitle">Vehicle · one icon for every report</h2>
        <div className="flex flex-wrap gap-4">
          {VEHICLE.map((o) => (
            <Choice key={o.code} title={`${o.code} · ${o.name}`} selected={vehicle === o.code} onClick={() => setVehicle(o.code)}>
              <OverviewRows weight={weight} rows={rows(r.Icon, o.Icon).slice(2)} />
            </Choice>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-subtitle">Vehicle · the icon follows the type</h2>
        <Choice title="V7 · By vehicle type" hint={BY_TYPE.map(([, name]) => name).join(', ')} selected={vehicle === 'V7'} onClick={() => setVehicle('V7')}>
          <OverviewRows weight={weight} rows={BY_TYPE.map(([type, , Icon]) => ({ Icon, label: `Vehicle · ${type}`, value: type }))} />
        </Choice>
      </section>
    </main>
  )
}
