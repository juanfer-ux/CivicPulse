import { describe, expect, it } from 'vitest'
import { twoLines } from '@/lib/address'

describe('twoLines', () => {
  it('breaks after the first comma only and leaves a location without one alone', () => {
    expect(twoLines('Cl 72 #24-30,  entrada del colegio, piso 2')).toBe('Cl 72 #24-30,\nentrada del colegio, piso 2')
    expect(twoLines('Parque La Serena')).toBe('Parque La Serena')
  })
})
