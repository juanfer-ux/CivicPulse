import { describe, expect, it } from 'vitest'
import { mix } from './tokens'

describe('mix', () => {
  it('blends two hex colors', () => {
    expect(mix('#ffffff', '#000000', 0.5)).toBe('#808080')
    expect(mix('#ff0000', '#18181b', 1)).toBe('#ff0000')
    expect(mix('#ff0000', '#18181b', 0)).toBe('#18181b')
  })
})
