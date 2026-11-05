import { useState } from 'react'
import '@fontsource-variable/atkinson-hyperlegible-next'
import '@fontsource-variable/public-sans'
import '@fontsource-variable/roboto-flex/grad.css'

/**
 * Font comparison (owner, 2026-11-05): the same product text in Manrope (what we use now) and three candidates from Google Fonts.
 * Open /#fonts (no sign-in). Sizes, line heights and letter-spacing come from our text styles and are identical in every column;
 * only the family changes. The sliders move every weight together (Manrope and the others are variable fonts) and Roboto Flex's grade.
 * Delete this file, its route in main.tsx and the two unused font packages once a font is picked.
 */
const FONTS = [
  { name: 'Manrope', note: 'what we use now', family: "'Manrope Variable', 'Manrope', sans-serif", grad: false },
  { name: 'Atkinson Hyperlegible Next', note: 'built for low-vision legibility', family: "'Atkinson Hyperlegible Next Variable', sans-serif", grad: false },
  { name: 'Roboto Flex', note: 'has a grade axis (GRAD)', family: "'Roboto Flex Variable', sans-serif", grad: true },
  { name: 'Public Sans', note: 'made for government sites', family: "'Public Sans Variable', sans-serif", grad: false },
] as const

// Figma weight of each style, in the code's numbers (Regular 400, Medium 500, SemiBold 600, Bold 700).
const W = { regular: 400, medium: 500, semibold: 600, bold: 700 }

function Column({ font, offset, grad }: { font: (typeof FONTS)[number]; offset: number; grad: number }) {
  const base = { fontFamily: font.family, fontVariationSettings: font.grad ? `'GRAD' ${grad}` : undefined }
  const w = (n: number) => ({ ...base, fontWeight: n + offset })
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-sm border border-(--neutral-400) bg-(--neutral-700) p-5" aria-label={font.name}>
      <header>
        <h2 className="text-subtitle text-foreground">{font.name}</h2>
        <p className="text-meta text-muted-foreground">{font.note}</p>
      </header>

      <div className="flex flex-col gap-1">
        <p className="text-heading text-foreground" style={w(W.semibold)}>Users</p>
        <p className="text-stat text-(--neutral-100)" style={w(W.bold)}>140</p>
        <p className="text-label text-(--neutral-200)" style={w(W.semibold)}>Reports this week</p>
      </div>

      <div className="flex flex-col" aria-label="Sidebar rows">
        {['Recurring obstructive parking', 'Which localities have the most reports', 'Kennedy: illegal dumping'].map((t) => (
          <p key={t} className="truncate py-1 text-body-sm-medium text-foreground" style={w(W.medium)}>{t}</p>
        ))}
      </div>

      <div className="flex flex-col gap-1 border-y border-(--neutral-400) py-3">
        <p className="text-meta-medium text-muted-foreground" style={w(W.medium)}>Name · Email · Status</p>
        <p className="text-body-sm-medium text-foreground" style={w(W.medium)}>Ana Operadora</p>
        <p className="text-body-sm text-muted-foreground" style={w(W.regular)}>ana@example.test</p>
        <p className="text-caption-strong text-foreground" style={w(W.semibold)}>Active · Invited</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-caption text-muted-foreground" style={w(W.medium)}>Reference codes (can you tell them apart?)</p>
        <p className="text-meta text-foreground" style={w(W.regular)}>INC-2026-0417 · PRK-0021 · PR-00088</p>
        <p className="text-meta text-foreground" style={w(W.regular)}>Il1| O0o rn m cl d 5S 8B</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-title text-foreground" style={w(W.semibold)}>Obstructive parking</p>
        <p className="text-body text-muted-foreground" style={w(W.regular)}>
          AI agents connect scattered incidents into patterns and recommend an intervention, with the evidence behind it.
        </p>
        <p className="text-body-sm text-muted-foreground" style={w(W.regular)}>4 occurrences · 6 Aug – 6 Oct 2026 · 11 reports · 2 interventions</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-sm bg-(--brand-primary) px-4 py-2 text-button text-primary-foreground" style={w(W.semibold)}>Sign in</span>
        <span className="text-button-sm text-foreground" style={w(W.semibold)}>Forgot password?</span>
      </div>
    </section>
  )
}

export function FontGallery() {
  const [offset, setOffset] = useState(0)
  const [grad, setGrad] = useState(0)
  const [smooth, setSmooth] = useState(true)
  return (
    <main className="min-h-svh bg-background p-6" style={{ WebkitFontSmoothing: smooth ? 'antialiased' : 'auto' }}>
      <h1 className="text-heading text-foreground">Font comparison</h1>
      <p className="mb-4 text-body-sm text-muted-foreground">Same sizes, line heights and spacing in every column; only the font changes. Look at it at 1440 px or wider.</p>
      <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-sm border border-(--neutral-400) bg-card p-4">
        <label className="flex items-center gap-3 text-label">
          Weight offset
          <input type="range" min={-100} max={100} step={10} value={offset} onChange={(e) => setOffset(+e.target.value)} />
          <output className="w-12 text-meta text-muted-foreground">{offset > 0 ? `+${offset}` : offset}</output>
        </label>
        <label className="flex items-center gap-3 text-label">
          Roboto Flex grade
          <input type="range" min={-200} max={150} step={10} value={grad} onChange={(e) => setGrad(+e.target.value)} />
          <output className="w-12 text-meta text-muted-foreground">{grad}</output>
        </label>
        <label className="flex items-center gap-2 text-label">
          <input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} />
          Grayscale smoothing (antialiased)
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FONTS.map((f) => (
          <Column key={f.name} font={f} offset={offset} grad={grad} />
        ))}
      </div>
    </main>
  )
}
