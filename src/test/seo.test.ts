import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Regression tests for today's SEO/GEO audit: this is an internal, signed-in-only tool, so the
// one thing that must never silently regress is "stay out of search and AI-answer-engine indexes."
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const html = readFileSync(resolve(root, 'index.html'), 'utf-8')
const robotsTxt = readFileSync(resolve(root, 'public/robots.txt'), 'utf-8')

describe('SEO/GEO regressions', () => {
  it('robots.txt disallows everything', () => {
    expect(robotsTxt).toMatch(/User-agent:\s*\*/)
    expect(robotsTxt).toMatch(/Disallow:\s*\/\s*$/m)
  })

  it('index.html tells crawlers not to index this internal tool', () => {
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"\s*\/?>/)
  })

  it('index.html has a real title and meta description', () => {
    expect(html).toMatch(/<title>[^<]{10,}<\/title>/)
    expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/)
  })

  it('index.html has Open Graph and Twitter card tags for safe link previews', () => {
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:url']) {
      expect(html).toContain(`property="${prop}"`)
    }
    for (const name of ['twitter:card', 'twitter:title', 'twitter:image']) {
      expect(html).toContain(`name="${name}"`)
    }
  })

  it('index.html declares a language', () => {
    expect(html).toMatch(/<html[^>]*\blang="en"/)
  })
})
