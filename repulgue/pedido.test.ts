import { describe, expect, it } from 'vitest'
import {
  ENVIO,
  MAX_BOLSA,
  PRECIOS,
  ahorro,
  cantidadTotal,
  desglose,
  enlaceContacto,
  mejorCombinacion,
  resumen,
  sugerencia,
  sumar,
  textoPedido,
  validar,
} from './pedido'

const fmt = (n: number) => `$${n}`

/** Fuerza bruta: todas las combinaciones posibles para exactamente n. */
function bruta(n: number) {
  let mejor = Infinity
  for (let d = 0; d * 12 <= n; d++)
    for (let m = 0; d * 12 + m * 6 <= n; m++) {
      const s = n - d * 12 - m * 6
      mejor = Math.min(mejor, d * PRECIOS.docena + m * PRECIOS.media + s * PRECIOS.unidad)
    }
  return mejor
}

describe('mejor combinación', () => {
  it('nada cuesta nada', () => {
    expect(mejorCombinacion(0)).toEqual({ docenas: 0, medias: 0, sueltas: 0, total: 0 })
  })

  it('sueltas, media y docena', () => {
    expect(mejorCombinacion(3)).toEqual({ docenas: 0, medias: 0, sueltas: 3, total: 3900 })
    expect(mejorCombinacion(6)).toEqual({ docenas: 0, medias: 1, sueltas: 0, total: 7200 })
    expect(mejorCombinacion(12)).toEqual({ docenas: 1, medias: 0, sueltas: 0, total: 13500 })
    expect(mejorCombinacion(20)).toEqual({ docenas: 1, medias: 1, sueltas: 2, total: 13500 + 7200 + 2600 })
  })

  it('coincide con la fuerza bruta hasta el tope de la bolsa', () => {
    for (let n = 0; n <= MAX_BOLSA; n++) expect(mejorCombinacion(n).total).toBe(bruta(n))
  })

  it('no siempre conviene la caja más grande', () => {
    // Con docena cara, dos medias salen mejor.
    const c = mejorCombinacion(12, { unidad: 1000, media: 5000, docena: 11000 })
    expect(c).toEqual({ docenas: 0, medias: 2, sueltas: 0, total: 10000 })
  })

  it('arma bien el desglose', () => {
    expect(desglose(mejorCombinacion(19))).toBe('1 docena + 1 media docena + 1 suelta')
    expect(desglose(mejorCombinacion(30))).toBe('2 docenas + 1 media docena')
  })

  it('calcula el ahorro contra todas sueltas', () => {
    expect(ahorro(12)).toBe(12 * 1300 - 13500)
    expect(ahorro(2)).toBe(0)
  })
})

describe('sugerencia', () => {
  it('con 11 conviene llevar la docena: sale menos', () => {
    expect(sugerencia(11)).toEqual({ sumar: 1, total: 13500 })
  })

  it('con 5 no: la media docena sale más que 5 sueltas', () => {
    expect(sugerencia(5)).toBeNull()
  })

  it('sin empanadas no sugiere nada', () => {
    expect(sugerencia(0)).toBeNull()
  })
})

describe('bolsa', () => {
  it('suma y resta sin bajar de cero', () => {
    let b = sumar({}, 'carne', 2)
    b = sumar(b, 'humita', 1)
    expect(cantidadTotal(b)).toBe(3)
    b = sumar(b, 'humita', -5)
    expect(b).toEqual({ carne: 2 })
  })

  it('no pasa el tope', () => {
    const b = sumar({ carne: MAX_BOLSA - 1 }, 'pollo', 5)
    expect(cantidadTotal(b)).toBe(MAX_BOLSA)
  })
})

describe('pedido', () => {
  it('cobra el envío salvo que pase el mínimo', () => {
    expect(resumen({ carne: 6 }, { tipo: 'envio', direccion: 'Jorge Newbery 3900' }).envio).toBe(ENVIO.costo)
    expect(resumen({ carne: 24 }, { tipo: 'envio', direccion: 'Jorge Newbery 3900' }).envio).toBe(0)
    expect(resumen({ carne: 6 }, { tipo: 'retiro' }).total).toBe(7200)
  })

  it('valida en orden', () => {
    expect(validar({}, 'Ana', { tipo: 'retiro' })).toBe('vacia')
    expect(validar({ carne: 1 }, ' ', { tipo: 'retiro' })).toBe('nombre')
    expect(validar({ carne: 1 }, 'Ana', { tipo: 'envio', direccion: 'x' })).toBe('direccion')
    expect(validar({ carne: 1 }, 'Ana', { tipo: 'retiro' })).toBeNull()
  })

  it('arma el texto del pedido', () => {
    const t = textoPedido({ humita: 2, carne: 4 }, 'Lucía', { tipo: 'retiro' }, fmt)
    expect(t).toContain('¡Hola, Pellizco! Soy Lucía')
    expect(t.indexOf('Carne suave')).toBeLessThan(t.indexOf('Humita'))
    expect(t).toContain('6 empanadas (1 media docena): $7200')
    expect(t).toContain('Paso a retirar')
    expect(t).toContain('Total: $7200')
  })

  it('el contacto lleva el mensaje codificado', () => {
    const url = new URL(enlaceContacto())
    expect(url.origin + url.pathname).toBe('https://wa.me/5491162474436')
    expect(url.searchParams.get('text')).toBe(
      'Hola, vi la demo de Pellizco en la Vitrina y quiero una web así para mi local.',
    )
  })
})
