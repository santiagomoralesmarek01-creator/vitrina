import { describe, expect, it } from 'vitest'
import {
  acomodar,
  agregar,
  alternar,
  altura,
  armarDeLaCasa,
  burgerInicial,
  calorias,
  cantidadValida,
  comboInicial,
  cuantas,
  DE_LA_CASA,
  enlaceWhatsApp,
  MAX_MEDALLONES,
  precioBurger,
  precioCombo,
  sacar,
  sacarEn,
  textoPedido,
  total,
  veredicto,
  type Burger,
} from './burger'

const simple: Burger = { pan: 'papa', capas: ['medallon'] }

describe('capas', () => {
  it('las nuevas van arriba de todo', () => {
    const b = agregar(agregar(burgerInicial(), 'bacon'), 'medallon')
    expect(b.capas).toEqual(['medallon', 'cheddar', 'bacon', 'medallon'])
  })

  it('hasta 4 medallones', () => {
    let b = simple
    for (let i = 1; i < MAX_MEDALLONES; i++) b = agregar(b, 'medallon')
    expect(cuantas(b, 'medallon')).toBe(4)
    expect(() => agregar(b, 'medallon')).toThrow('Hasta 4 medallones')
  })

  it('siempre queda al menos un medallón', () => {
    expect(() => sacar(simple, 'medallon')).toThrow('Sin medallón')
    expect(() => sacarEn(simple, 0)).toThrow('Sin medallón')
  })

  it('los extras van una sola vez y se alternan', () => {
    const b = alternar(simple, 'huevo')
    expect(() => agregar(b, 'huevo')).toThrow('una sola vez')
    expect(alternar(b, 'huevo').capas).toEqual(['medallon'])
  })

  it('sacar quita la de más arriba de ese tipo', () => {
    const b: Burger = { pan: 'papa', capas: ['medallon', 'cheddar', 'medallon', 'cheddar', 'bacon'] }
    expect(sacar(b, 'cheddar').capas).toEqual(['medallon', 'cheddar', 'medallon', 'bacon'])
    expect(sacarEn(b, 0).capas).toEqual(['cheddar', 'medallon', 'cheddar', 'bacon'])
  })

  it('acomoda en el orden de la casa', () => {
    const b: Burger = { pan: 'papa', capas: ['bacon', 'cheddar', 'medallon', 'salsa', 'cheddar', 'medallon', 'crispy', 'medallon'] }
    expect(acomodar(b).capas).toEqual(['salsa', 'medallon', 'cheddar', 'medallon', 'cheddar', 'medallon', 'bacon', 'crispy'])
  })
})

describe('precio', () => {
  it('base con un medallón', () => {
    expect(precioBurger(simple)).toBe(8900)
  })

  it('suma medallones, cheddar, extras y pan', () => {
    const b: Burger = { pan: 'brioche', capas: ['medallon', 'cheddar', 'medallon', 'cheddar', 'bacon'] }
    expect(precioBurger(b)).toBe(8900 + 1200 + 3400 + 900 * 2 + 2200)
  })

  it('el combo suma papas y bebida', () => {
    expect(precioCombo(comboInicial())).toBe(0)
    expect(precioCombo({ activo: true, papas: 'cheddar', bebida: 'birra' })).toBe(4900 + 2400 + 1900)
    expect(() => precioCombo({ activo: true, papas: 'nada', bebida: 'gaseosa' })).toThrow()
  })

  it('el total multiplica por la cantidad, entre 1 y 9', () => {
    expect(total({ burger: simple, combo: { ...comboInicial(), activo: true }, cantidad: 2 })).toBe((8900 + 4900) * 2)
    expect(cantidadValida(0)).toBe(1)
    expect(cantidadValida(40)).toBe(9)
  })
})

describe('medidor', () => {
  it('altura y calorías', () => {
    expect(altura(simple)).toBe(24 + 34 + 12)
    expect(calorias(simple)).toBe(210 + 250)
  })

  it('el veredicto crece con la altura', () => {
    expect(veredicto(altura(simple))).toBe('Entra en una mano')
    const antiaerea = armarDeLaCasa(DE_LA_CASA.find((d) => d.id === 'antiaerea')!)
    expect(veredicto(altura(antiaerea))).toBe('Pedí servilletas extra')
  })
})

describe('las de la casa', () => {
  it('se arman respetando límites y orden', () => {
    for (const d of DE_LA_CASA) {
      const b = armarDeLaCasa(d)
      expect(cuantas(b, 'medallon')).toBe(d.medallones)
      expect(cuantas(b, 'medallon')).toBeLessThanOrEqual(MAX_MEDALLONES)
      expect(acomodar(b)).toEqual(b)
    }
  })

  it('La Bunker queda armada como en la carta', () => {
    const b = armarDeLaCasa(DE_LA_CASA[0])
    expect(b.capas).toEqual(['salsa', 'medallon', 'cheddar', 'medallon', 'cheddar', 'bacon'])
    expect(precioBurger(b)).toBe(16900)
  })
})

describe('pedido', () => {
  it('arma el texto para WhatsApp', () => {
    const burger = armarDeLaCasa(DE_LA_CASA[0])
    const texto = textoPedido({ burger, combo: { activo: true, papas: 'batata', bebida: 'gaseosa' }, cantidad: 2 }, 'La Bunker')
    expect(texto).toContain('2 × La Bunker (Doble en pan de papa: 2 medallones, 2 cheddar, bacon, salsa bunker)')
    expect(texto).toContain('En combo: bastones de batata + gaseosa 500 ml')
    expect(texto).toMatch(/Total: \$\s45\.600/)
    expect(enlaceWhatsApp(texto)).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
  })
})
