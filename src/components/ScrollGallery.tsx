import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

/** Open /#scroll (no sign-in): scrollbar styles built on the shadcn ScrollArea, shown on the occurrences history (owner, 2026-11-05). Pick one and it becomes the default for every scrolling area. */

const OCCURRENCES = [
  { title: 'Occurrence 1 · 6 Aug · 3 reports', rows: ['PRK-0011 Community reporting channel · 6 Aug, 22:18', 'PRK-0010 SIMUR (Yo reporto tránsito) · 6 Aug, 19:48', 'PRK-0009 Salvajes en la Vía · 6 Aug, 17:18'], tow: '10 Aug · Tow · Policía de Tránsito' },
  { title: 'Occurrence 2 · 30 Aug · 3 reports', rows: ['PRK-0031 SIMUR (Yo reporto tránsito) · 30 Aug, 21:18', 'PRK-0030 Civic Pulse direct report · 30 Aug, 18:48', 'PRK-0029 Salvajes en la Vía · 30 Aug, 17:18'], tow: '3 Sept · Fine · Policía de Tránsito' },
  { title: 'Occurrence 3 · 23 Sept · 3 reports', rows: ['PRK-0061 Community reporting channel · 23 Sept, 20:18', 'PRK-0060 SIMUR (Yo reporto tránsito) · 23 Sept, 18:48', 'PRK-0059 Salvajes en la Vía · 23 Sept, 17:18'] },
  { title: 'Occurrence 4 · 1 Oct · 2 reports', rows: ['PRK-0086 Community reporting channel · 1 Oct, 22:18', 'PRK-0085 SIMUR (Yo reporto tránsito) · 1 Oct, 17:18'] },
]

function History() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-section-label uppercase text-(--neutral-200)">Occurrences history</h3>
      {OCCURRENCES.map((o) => (
        <div key={o.title} className="flex flex-col gap-1">
          <p className="text-body-sm-medium text-foreground">{o.title}</p>
          {o.rows.map((r) => (
            <p key={r} className="text-meta text-muted-foreground">
              {r}
            </p>
          ))}
          {o.tow && (
            <div className="mt-1 rounded-sm border-[0.5px] border-(--neutral-400) p-2">
              <p className="text-body-sm-medium text-foreground">{o.tow}</p>
              <p className="text-meta text-muted-foreground">Vehicle towed from the school entrance</p>
              <p className="text-meta text-muted-foreground">Outcome: Cleared</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Option({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div>
        <p className="text-label">{name}</p>
        <p className="min-h-[42px] text-meta text-muted-foreground">{note}</p>
      </div>
      {children}
    </div>
  )
}

const card = 'h-[360px] w-full rounded-lg border bg-(--neutral-800) '

export function ScrollGallery() {
  return (
    <div className="min-h-svh bg-background p-8 text-foreground">
      <h1 className="text-title">Scrollbar styles</h1>
      <p className="mb-8 mt-1 max-w-3xl text-meta text-muted-foreground">
        All built on the shadcn ScrollArea (Radix), on the occurrences history card (360 px tall, neutral-800). Thumbs use neutral tokens only. Hover over a card to see the bar where it appears on hover.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        <Option name="A · Thin, on hover" note="6 px, round thumb neutral-400, no track, shows on hover.">
          <ScrollArea className={card} type="hover" barClassName="p-0 hover:p-0 data-vertical:w-1.5" thumbClassName="bg-(--neutral-400) hover:bg-(--neutral-300)">
            <History />
          </ScrollArea>
        </Option>
        <Option name="B · Hairline, always" note="3 px, thumb neutral-500, always visible, quiet.">
          <ScrollArea className={card} type="always" barClassName="p-0 hover:p-0 data-vertical:w-[3px]" thumbClassName="bg-(--neutral-500) hover:bg-(--neutral-400)">
            <History />
          </ScrollArea>
        </Option>
        <Option name="C · Track + thumb" note="8 px, track neutral-700, thumb neutral-400, always visible.">
          <ScrollArea className={card} type="always" barClassName="bg-(--neutral-700) p-0 hover:p-0 data-vertical:w-2" thumbClassName="bg-(--neutral-400) hover:bg-(--neutral-300)">
            <History />
          </ScrollArea>
        </Option>
        <Option name="D · Only while scrolling" note="6 px, appears when you scroll and fades out after (type scroll).">
          <ScrollArea className={card} type="scroll" barClassName="p-0 hover:p-0 data-vertical:w-1.5" thumbClassName="bg-(--neutral-400) hover:bg-(--neutral-300)">
            <History />
          </ScrollArea>
        </Option>
        <Option name="E · Square, 4 px" note="4 px, thumb neutral-400, no radius, always visible, no track (the earlier pick).">
          <ScrollArea className={card} barClassName="p-0 hover:p-0 data-vertical:w-1" thumbClassName="rounded-none bg-(--neutral-400) hover:bg-(--neutral-300)">
            <History />
          </ScrollArea>
        </Option>
        <Option name="F · Accent" note="4 px, thumb indigo-400, on hover.">
          <ScrollArea className={card} type="hover" barClassName="p-0 hover:p-0 data-vertical:w-1" thumbClassName="bg-(--indigo-400) hover:bg-(--indigo-300)">
            <History />
          </ScrollArea>
        </Option>
        <Option name="G · Inset, grows on hover (CHOSEN: the app default)" note="10 px grab area, round 4 px thumb that grows to 6 px on hover, neutral-300 (neutral-200 on hover), always visible, no track.">
          <ScrollArea className={card}>
            <History />
          </ScrollArea>
        </Option>
        <Option name="H · Horizontal (the timeline), style G" note="The default sideways, for the timeline when there are many occurrences.">
          <ScrollArea className={card} horizontal>
            <div className="w-[900px] p-4">
              <h3 className="text-section-label uppercase text-(--neutral-200)">Timeline · PR-00083</h3>
              <p className="mt-2 text-meta text-muted-foreground">A wide chart scrolls sideways; the bar sits at the bottom edge.</p>
              <div className="mt-6 flex items-end gap-16">
                {[10, 16, 12, 22, 14, 18, 9, 20].map((h, i) => (
                  <div key={i} className="size-3 rounded-full bg-(--red-300)" style={{ marginBottom: h * 4 }} />
                ))}
              </div>
            </div>
          </ScrollArea>
        </Option>
      </div>
    </div>
  )
}
