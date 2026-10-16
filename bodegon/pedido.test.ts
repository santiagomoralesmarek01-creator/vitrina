import { describe, expect, it } from 'vitest'
import { SECCIONES } from './carta'
import { cambiarCantidad, filtrar, mensaje, resumen } from './pedido'

const platos = SECCIONES.flatMap((s) => s.platos)

describe('pedido', () => {
  it('suma y resta sin bajar de cero', () => {
    let p = cambiarCantidad({}, 'flan', 1)
    p = cambiarCantidad(p, 'flan', 1)
    expect(p).toEqual({ flan: 2 })
    p = cambiarCantidad(p, 'flan', -5)
    expect(p).toEqual({})
  })

  it('calcula unidades y total', () => {
    const p = { vacio: 1, flan: 2 }
    expect(resumen(p, platos)).toEqual({ unidades: 3, total: 21900 + 2 * 6900 })
  })

  it('arma el mensaje con mesa y total', () => {
    const texto = mensaje({ sifon: 2 }, platos, ' 7 ')
    expect(texto).toBe('¡Hola! Pedido para la mesa 7:\n• 2 × Soda en sifón — $ 6.400\nTotal: $ 6.400')
  })
})

describe('filtrar', () => {
  it('deja solo los platos que cumplen todos los filtros', () => {
    const veggieSinTacc = filtrar(SECCIONES, ['veggie', 'sin-tacc']).flatMap((s) => s.platos.map((p) => p.id))
    expect(veggieSinTacc).toContain('provoleta')
    expect(veggieSinTacc).not.toContain('sorrentinos')
    expect(veggieSinTacc).not.toContain('vacio')
  })

  it('sin filtros devuelve todo', () => {
    expect(filtrar(SECCIONES, []).flatMap((s) => s.platos)).toHaveLength(platos.length)
  })
})
