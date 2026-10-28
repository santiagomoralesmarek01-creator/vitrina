import { describe, expect, it } from 'vitest'
import { VEGETARIANOS } from './gustos'
import { cantidadTotal } from './pedido'
import { calcular, cantidadEnPalabras, repartir } from './juntada'

const veggieEn = (r: Record<string, number>) => VEGETARIANOS.reduce((s, id) => s + (r[id] ?? 0), 0)

describe('cuántas pedir', () => {
  it('comida principal: 3 por persona, redondeado a media docena', () => {
    const s = calcular(10, 'principal', 0)
    expect(s.total).toBe(30)
    expect(s.docenas).toBe(2)
    expect(s.medias).toBe(1)
    expect(cantidadEnPalabras(s)).toBe('2 docenas y media')
  })

  it('picada: una y media por persona', () => {
    expect(calcular(8, 'picada', 0).total).toBe(12)
    expect(calcular(9, 'picada', 0).total).toBe(18) // 13,5 → 14 → 18
  })

  it('sin gente no hay pedido', () => {
    const s = calcular(0, 'principal', 3)
    expect(s.total).toBe(0)
    expect(s.vegetarianos).toBe(0)
    expect(s.reparto).toEqual({})
    expect(cantidadEnPalabras(s)).toBe('Nada todavía')
  })

  it('no puede haber más vegetarianos que personas', () => {
    expect(calcular(4, 'principal', 9).vegetarianos).toBe(4)
  })
})

describe('reparto', () => {
  it('la suma da justo el total', () => {
    for (let personas = 1; personas <= 40; personas++)
      for (const modo of ['principal', 'picada'] as const)
        for (const veg of [0, 1, Math.floor(personas / 2), personas]) {
          const s = calcular(personas, modo, veg)
          expect(cantidadTotal(s.reparto)).toBe(s.total)
          expect(veggieEn(s.reparto)).toBeGreaterThanOrEqual(s.minimoVeggie)
        }
  })

  it('si son todos vegetarianos, no va nada con carne', () => {
    const s = calcular(6, 'principal', 6)
    expect(veggieEn(s.reparto)).toBe(s.total)
  })

  it('aunque nadie sea vegetariano, hay alguna veggie en la mesa', () => {
    const s = calcular(10, 'principal', 0)
    expect(veggieEn(s.reparto)).toBeGreaterThan(0)
    expect(s.reparto.carne).toBeGreaterThan(s.reparto.picante ?? 0)
  })

  it('repartir respeta el total y los pesos', () => {
    const r = repartir(9, ['carne', 'picante'])
    expect(r).toEqual({ carne: 7, picante: 2 })
    expect(repartir(0, ['carne'])).toEqual({})
  })
})
