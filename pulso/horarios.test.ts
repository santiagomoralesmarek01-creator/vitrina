import { describe, expect, it } from 'vitest'
import { CLASES, filtrarClases, precioPlan, reservar } from './horarios'

describe('filtrarClases', () => {
  it('sin filtros devuelve todas', () => {
    expect(filtrarClases(CLASES, { tipos: [], nivel: 'cualquiera' })).toHaveLength(CLASES.length)
  })

  it('filtra por tipo', () => {
    const r = filtrarClases(CLASES, { tipos: ['yin'], nivel: 'cualquiera' })
    expect(r.every((c) => c.tipo === 'yin')).toBe(true)
    expect(r).toHaveLength(3)
  })

  it('las clases para todo nivel aparecen con cualquier nivel elegido', () => {
    const r = filtrarClases(CLASES, { tipos: ['pilates'], nivel: 'inicial' })
    expect(r.map((c) => c.id).sort()).toEqual(['j2', 'l2', 's2'])
  })
})

describe('reservar', () => {
  it('descuenta un lugar', () => {
    expect(reservar(CLASES, 's2').find((c) => c.id === 's2')!.cupos).toBe(0)
  })

  it('no deja reservar una clase llena', () => {
    expect(() => reservar(CLASES, 'm2')).toThrow('No quedan lugares')
  })
})

describe('precioPlan', () => {
  it('aplica 15 % en trimestral, salvo la clase suelta', () => {
    expect(precioPlan(52000, 'trimestral', 'dos')).toBe(44200)
    expect(precioPlan(12000, 'trimestral', 'suelta')).toBe(12000)
    expect(precioPlan(78000, 'mensual', 'libre')).toBe(78000)
  })
})
