import type { ReactNode } from 'react'
import { CaretRight, Info } from '@phosphor-icons/react'

/**
 * Ways to show the notes under an agent answer (the "limitations" bullets), owner's request 2026-11-08: rows with a divider and a small gap instead of bullets. Dev-only gallery at /#notes: sample text, nothing here changes the app.
 */

const NOTES = [
  'Counts exclude reports marked duplicate or rejected.',
  'Only localities in your authorized scope are included.',
  'Raw counts are not adjusted for population, area or reporting rates: they show where reports concentrate, not where the problem is worst.',
  'Localities on the map are outlined and tinted because they are in the answer: the tint is the same for all and is not a risk level.',
  'All records are synthetic.',
]
const LABELS = ['Counts', 'Scope', 'Rates', 'Map', 'Data']

const Frame = ({ name, note, children }: { name: string; note: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-2">
    <div>
      <p className="text-label">{name}</p>
      <p className="min-h-[34px] text-meta text-muted-foreground">{note}</p>
    </div>
    <div className="rounded-[6px] border-[0.5px] border-(--neutral-500) bg-(--neutral-900) p-4">{children}</div>
  </div>
)

const Box = ({ children }: { children: ReactNode }) => <div className="rounded-[6px] border-[0.5px] border-(--neutral-500) bg-(--neutral-700)">{children}</div>

export function NotesGallery() {
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-8 p-8">
      <header>
        <h1 className="text-heading">Notes under an answer, as rows</h1>
        <p className="max-w-[760px] text-body-sm text-muted-foreground">The same five notes drawn several ways. The first one is today's bullets. Panel width here is the agent panel's content width, 474 px.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <Frame name="0 · Today (bullets)" note="A bulleted list, small muted text.">
          <ul className="list-disc pl-4 text-meta text-muted-foreground">
            {NOTES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Frame>

        <Frame name="1 · Rows with a divider" note="No bullets: each note is a row with a line under it. Compact, reads like a table.">
          <ul className="flex flex-col text-meta text-muted-foreground">
            {NOTES.map((n) => (
              <li key={n} className="border-b border-(--neutral-600) py-2 first:pt-0 last:border-b-0 last:pb-0">
                {n}
              </li>
            ))}
          </ul>
        </Frame>

        <Frame name="2 · Rows with a divider and a small gap" note="As asked: a line under each note and a small gap between the rows, the same rhythm as the Quick questions.">
          <ul className="flex flex-col gap-1.5 text-meta text-muted-foreground">
            {NOTES.map((n) => (
              <li key={n} className="border-b border-(--neutral-600) px-1 py-2.5">
                {n}
              </li>
            ))}
          </ul>
        </Frame>

        <Frame name="3 · Numbered rows" note="A small number tile, the note, a line under it. Good for referring to one ('see note 3').">
          <ul className="flex flex-col text-meta text-muted-foreground">
            {NOTES.map((n, i) => (
              <li key={n} className="flex items-start gap-3 border-b border-(--neutral-600) py-2.5 last:border-b-0">
                <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-(--neutral-600) text-caption-strong text-(--neutral-100)">{i + 1}</span>
                <span className="pt-0.5">{n}</span>
              </li>
            ))}
          </ul>
        </Frame>

        <Frame name="4 · Label and text (a table)" note="Two columns: a short label on the left, the note on the right, a line between rows. The most table-like.">
          <dl className="flex flex-col text-meta">
            {NOTES.map((n, i) => (
              <div key={n} className="grid grid-cols-[72px_1fr] gap-3 border-b border-(--neutral-600) py-2.5 last:border-b-0">
                <dt className="text-(--neutral-100)">{LABELS[i]}</dt>
                <dd className="text-muted-foreground">{n}</dd>
              </div>
            ))}
          </dl>
        </Frame>

        <Frame name="5 · In a box, like the chart" note="The same box as the chart above it (neutral-700, 0.5 px line), a title row and the notes divided inside.">
          <Box>
            <p className="px-4 py-3 text-caption-medium text-(--neutral-200)">Notes · 5</p>
            <ul className="flex flex-col text-meta text-muted-foreground">
              {NOTES.map((n) => (
                <li key={n} className="border-t border-(--neutral-600) px-4 py-2.5">
                  {n}
                </li>
              ))}
            </ul>
          </Box>
        </Frame>

        <Frame name="6 · Icon rows" note="A small info icon in front of each note, a line between the rows.">
          <ul className="flex flex-col text-meta text-muted-foreground">
            {NOTES.map((n) => (
              <li key={n} className="flex items-start gap-2.5 border-b border-(--neutral-600) py-2.5 first:pt-0 last:border-b-0 last:pb-0">
                <Info weight="regular" className="mt-0.5 size-3.5 shrink-0 text-(--neutral-300)" aria-hidden />
                {n}
              </li>
            ))}
          </ul>
        </Frame>

        <Frame name="7 · Collapsed, like Evidence" note="One line, 'Notes · 5', that opens the rows (option 2). Keeps the answer short; the notes are one click away.">
          <p className="flex items-center gap-1.5 text-meta text-muted-foreground">
            <CaretRight weight="bold" className="size-3" aria-hidden /> Notes · 5
          </p>
          <ul className="mt-3 hidden" aria-hidden />
          <p className="mt-4 text-caption-medium text-(--neutral-300)">Open:</p>
          <p className="mt-1 flex items-center gap-1.5 text-meta text-muted-foreground">
            <CaretRight weight="bold" className="size-3 rotate-90" aria-hidden /> Notes · 5
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-meta text-muted-foreground">
            {NOTES.slice(0, 3).map((n) => (
              <li key={n} className="border-b border-(--neutral-600) px-1 py-2.5">
                {n}
              </li>
            ))}
          </ul>
        </Frame>
      </div>
    </main>
  )
}
