import { readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps bold for the send button arrow and the stat trend icons only', () => {
  const files = (readdirSync('src', { recursive: true }) as string[]).filter((f) => f.endsWith('.tsx'))
  const bold = files.flatMap((f) => (readFileSync(`src/${f}`, 'utf8').match(/weight=\{?['"]bold|weight: ['"]bold/g) ?? []).map(() => f))
  expect(bold.sort()).toEqual(['components/Composer.tsx', 'components/ui/stat-card.tsx'])
})
