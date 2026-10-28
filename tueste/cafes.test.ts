import { describe, expect, it } from 'vitest'
import { BEBIDAS, FAMILIAS, ORIGENES, cafesConFamilia, resumenFamilia } from './cafes'

describe('rueda de sabores', () => {
  it('sin familia elegida muestra todos los cafés', () => {
    expect(cafesConFamilia(null)).toHaveLength(ORIGENES.length)
  })

  it('floral resalta Etiopía y Colombia', () => {
    expect(cafesConFamilia('floral').map((o) => o.id)).toEqual(['etiopia', 'colombia'])
  })

  it('especiado resalta solo Guatemala', () => {
    expect(cafesConFamilia('especiado').map((o) => o.id)).toEqual(['guatemala'])
  })

  it('cada familia de la rueda tiene al menos un café en la carta', () => {
    for (const f of FAMILIAS) expect(cafesConFamilia(f.id).length).toBeGreaterThan(0)
  })

  it('arma la frase del resultado', () => {
    expect(resumenFamilia('chocolate')).toBe('Cacao y nuez: Guatemala y Brasil.')
    expect(resumenFamilia('dulce')).toBe('Dulce: Colombia, Guatemala y Brasil.')
    expect(resumenFamilia('floral', [ORIGENES[4]])).toBe('Ningún café de esta tanda tiene notas de floral.')
  })
})

describe('datos', () => {
  it('perfiles entre 1 y 5', () => {
    for (const o of ORIGENES) for (const v of Object.values(o.perfil)) expect(v).toBeGreaterThanOrEqual(1), expect(v).toBeLessThanOrEqual(5)
  })

  it('ids únicos', () => {
    expect(new Set(BEBIDAS.map((b) => b.id)).size).toBe(BEBIDAS.length)
    expect(new Set(ORIGENES.map((o) => o.id)).size).toBe(ORIGENES.length)
  })
})
