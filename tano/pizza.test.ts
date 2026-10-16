import { describe, expect, it } from 'vitest'
import { alternar, cambiarMitades, descripcion, MAX_POR_MITAD, pizzaVacia, precio } from './pizza'

describe('armado', () => {
  it('agrega y saca ingredientes', () => {
    let p = alternar(pizzaVacia(), 'izq', 'jamon')
    expect(p.izq).toEqual(['jamon'])
    p = alternar(p, 'izq', 'jamon')
    expect(p.izq).toEqual([])
  })

  it('pone un tope por mitad', () => {
    let p = cambiarMitades(pizzaVacia(), true)
    for (const id of ['jamon', 'calabresa', 'morron', 'aceitunas', 'cebolla']) p = alternar(p, 'der', id)
    expect(p.der).toHaveLength(MAX_POR_MITAD)
    expect(() => alternar(p, 'der', 'rucula')).toThrow('por mitad')
    expect(p.izq).toEqual([])
  })

  it('al pasar a mitad y mitad copia los ingredientes a las dos mitades', () => {
    const p = cambiarMitades(alternar(pizzaVacia(), 'izq', 'cebolla'), true)
    expect(p.izq).toEqual(['cebolla'])
    expect(p.der).toEqual(['cebolla'])
  })
})

describe('precio', () => {
  it('base según tamaño', () => {
    expect(precio({ ...pizzaVacia(), tamanio: 'chica' })).toBe(9500)
    expect(precio(pizzaVacia())).toBe(14500)
  })

  it('en la grande los ingredientes valen 1,5 veces', () => {
    expect(precio(alternar(pizzaVacia(), 'izq', 'jamon'))).toBe(14500 + 3900)
  })

  it('en mitad y mitad cada ingrediente cuesta la mitad', () => {
    let p = cambiarMitades({ ...pizzaVacia(), tamanio: 'chica' }, true)
    p = alternar(p, 'izq', 'jamon')
    expect(precio(p)).toBe(9500 + 1300)
  })
})

describe('descripcion', () => {
  it('describe la pizza mitad y mitad', () => {
    let p = cambiarMitades(pizzaVacia(), true)
    p = alternar(p, 'izq', 'calabresa')
    expect(descripcion(p)).toBe('Grande mitad y mitad: una mitad con calabresa y la otra con solo muzzarella')
  })
})
