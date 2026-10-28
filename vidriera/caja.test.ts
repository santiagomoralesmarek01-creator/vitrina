import { describe, expect, it } from 'vitest'
import {
  ahorro, cajaVacia, cambiarTamanio, completa, contenido, cuantas, faltan, lugar, precioCaja, quitar, quitarLugar, subtotal, sumar, surtida,
} from './caja'

describe('caja de masas finas', () => {
  it('se llena pieza por pieza y sabe cuántas faltan', () => {
    let c = cajaVacia(6)
    c = sumar(sumar(c, 'canoncito'), 'macaron')
    expect(c.piezas).toEqual(['canoncito', 'macaron'])
    expect(faltan(c)).toBe(4)
    expect(completa(c)).toBe(false)
  })

  it('no deja pasarse del tamaño', () => {
    const c = surtida(cajaVacia(6), ['palmerita'])
    expect(completa(c)).toBe(true)
    expect(cuantas(c, 'palmerita')).toBe(6)
    expect(() => sumar(c, 'macaron')).toThrow('ya tiene sus 6')
  })

  it('no acepta masas que no existen', () => {
    expect(() => sumar(cajaVacia(), 'medialuna')).toThrow()
  })

  it('quita por lugar o la última de un tipo', () => {
    let c = cajaVacia(6)
    for (const id of ['canoncito', 'macaron', 'canoncito']) c = sumar(c, id)
    expect(quitarLugar(c, 1).piezas).toEqual(['canoncito', 'canoncito'])
    expect(quitar(c, 'canoncito').piezas).toEqual(['canoncito', 'macaron'])
    expect(quitar(c, 'bombon')).toBe(c)
    expect(quitarLugar(c, 9)).toBe(c)
  })

  it('al achicar la caja sobran las últimas', () => {
    const c = surtida(cajaVacia(12), ['tartaleta', 'bombon'])
    const chica = cambiarTamanio(c, 6)
    expect(chica.piezas).toHaveLength(6)
    expect(completa(chica)).toBe(true)
    expect(cambiarTamanio(chica, 12).piezas).toHaveLength(6)
  })

  it('surtida completa repartiendo en orden', () => {
    const c = surtida(sumar(cajaVacia(6), 'profiterol'), ['tartaleta', 'bombon'])
    expect(c.piezas).toEqual(['profiterol', 'tartaleta', 'bombon', 'tartaleta', 'bombon', 'tartaleta'])
  })
})

describe('precio de la caja', () => {
  it('la de 6 suma cada masa', () => {
    const c = surtida(cajaVacia(6), ['canoncito'])
    expect(precioCaja(c)).toBe(7200)
    expect(ahorro(c)).toBe(0)
  })

  it('la de 12 completa tiene 10 % menos', () => {
    const c = surtida(cajaVacia(12), ['tartaleta', 'palmerita'])
    expect(subtotal(c)).toBe(6 * 1400 + 6 * 1100)
    expect(precioCaja(c)).toBe(13500)
    expect(ahorro(c)).toBe(1500)
  })

  it('la de 12 a medio llenar no tiene descuento todavía', () => {
    const c = surtida(cajaVacia(6), ['macaron'])
    expect(precioCaja(cambiarTamanio(c, 12))).toBe(8400)
  })
})

describe('acomodo', () => {
  it('ubica cada lugar en filas según el tamaño', () => {
    expect(lugar(cajaVacia(6), 4)).toEqual({ fila: 1, columna: 1 })
    expect(lugar(cajaVacia(12), 4)).toEqual({ fila: 1, columna: 0 })
    expect(lugar(cajaVacia(12), 11)).toEqual({ fila: 2, columna: 3 })
  })

  it('agrupa el contenido en el orden en que aparece', () => {
    let c = cajaVacia(6)
    for (const id of ['macaron', 'canoncito', 'macaron']) c = sumar(c, id)
    expect(contenido(c)).toEqual([
      { id: 'macaron', cantidad: 2 },
      { id: 'canoncito', cantidad: 1 },
    ])
  })
})
