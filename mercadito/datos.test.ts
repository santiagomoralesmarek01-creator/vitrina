import { describe, expect, it } from 'vitest'
import { escala, generarDias, periodos, porCategoria, resumir, topProductos, variacion } from './datos'

const dias = generarDias(new Date(2026, 9, 16))

describe('datos', () => {
  it('genera siempre los mismos días', () => {
    expect(generarDias(new Date(2026, 9, 16))[10].ingresos).toBe(dias[10].ingresos)
    expect(dias).toHaveLength(180)
    expect(dias.at(-1)!.fecha.getDate()).toBe(16)
  })

  it('el total por día es la suma de sus categorías', () => {
    const d = dias[50]
    expect(Object.values(d.porCategoria).reduce((a, b) => a + b, 0)).toBe(d.ingresos)
  })

  it('divide en período actual y anterior sin superponerse', () => {
    const { actual, anterior } = periodos(dias, 30)
    expect(actual).toHaveLength(30)
    expect(anterior).toHaveLength(30)
    expect(anterior.at(-1)!.fecha < actual[0].fecha).toBe(true)
  })

  it('resume y calcula el ticket promedio', () => {
    const r = resumir(dias.slice(0, 7))
    expect(r.ticket).toBe(Math.round(r.ingresos / r.pedidos))
  })

  it('las categorías suman el total y vienen ordenadas', () => {
    const { actual } = periodos(dias, 7)
    const cats = porCategoria(actual)
    expect(cats.reduce((s, c) => s + c.total, 0)).toBe(resumir(actual).ingresos)
    expect(cats[0].total).toBeGreaterThanOrEqual(cats[1].total)
  })

  it('top productos trae la variación contra el período anterior', () => {
    const { actual, anterior } = periodos(dias, 30)
    const p = topProductos(actual, anterior)[0]
    expect(p.ingresos).toBe(p.unidades * p.precio)
    expect(typeof p.variacion).toBe('number')
  })
})

describe('variacion y escala', () => {
  it('variación con un decimal', () => {
    expect(variacion(110, 100)).toBe(10)
    expect(variacion(90, 120)).toBe(-25)
    expect(variacion(5, 0)).toBeNull()
  })

  it('escala con marcas redondas que cubren el máximo', () => {
    expect(escala(87)).toEqual([0, 25, 50, 75, 100])
    expect(escala(1_234_000).at(-1)).toBeGreaterThanOrEqual(1_234_000)
  })
})
