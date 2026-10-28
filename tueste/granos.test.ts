import { describe, expect, it } from 'vitest'
import { MOLIENDAS, ahorro, precioGranos } from './granos'

const cafe = { precio250: 16000 }

describe('precio de granos', () => {
  it('250 g vale el precio de lista', () => {
    expect(precioGranos(cafe, 250)).toBe(16000)
  })

  it('500 g y 1 kg tienen descuento por volumen', () => {
    expect(precioGranos(cafe, 500)).toBe(30400)
    expect(precioGranos(cafe, 1000)).toBe(57600)
    expect(ahorro(cafe, 1000)).toBe(6400)
  })

  it('redondea a $100', () => {
    expect(precioGranos({ precio250: 15550 }, 500)).toBe(29500)
  })

  it('rechaza pesos que no se venden', () => {
    expect(() => precioGranos(cafe, 750 as never)).toThrow('Peso')
  })
})

describe('molienda', () => {
  it('va de grano entero a más gruesa, sin repetir nivel', () => {
    expect(MOLIENDAS.map((m) => m.nivel)).toEqual([0, 1, 2, 3, 4])
    const tam = MOLIENDAS.slice(1).map((m) => m.micrones)
    expect([...tam].sort((a, b) => a - b)).toEqual(tam)
  })
})
