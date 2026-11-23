import { describe, expect, it } from 'vitest'
import { Bus, MapPin, Pill, Storefront } from '@phosphor-icons/react'
import { placeIcon } from '@/lib/placeIcons'

describe('placeIcon', () => {
  it('picks the icon of what a place is, then of its kind', () => {
    expect(placeIcon('pharmacy', 'other')).toBe(Pill)
    expect(placeIcon('bus stop', 'bus')).toBe(Bus)
    expect(placeIcon('bakery', 'shop')).toBe(Storefront)
    expect(placeIcon('weird thing', 'other')).toBe(MapPin)
  })
})
