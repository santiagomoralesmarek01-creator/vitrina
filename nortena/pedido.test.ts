import { describe, expect, it } from 'vitest'
import {
  MAX_EMPANADAS,
  buscarZona,
  cantidadTotal,
  desglose,
  entrega,
  linkWhatsApp,
  mejorCombinacion,
  mensajeWhatsApp,
  pedidoListo,
  precio,
  sugerencia,
  sumar,
  ZONAS,
} from './pedido'

const fmt = (n: number) => `$${n}`

describe('armado', () => {
  it('suma y resta sin bajar de cero', () => {
    let p = sumar({}, 'humita', 1)
    p = sumar(p, 'humita', 1)
    expect(p).toEqual({ humita: 2 })
    p = sumar(sumar(sumar(p, 'humita', -1), 'humita', -1), 'humita', -1)
    expect(p).toEqual({})
  })

  it('no pasa del tope de empanadas', () => {
    let p = sumar({}, 'pollo', MAX_EMPANADAS - 1)
    p = sumar(p, 'jyq', 5)
    expect(cantidadTotal(p)).toBe(MAX_EMPANADAS)
    expect(p.jyq).toBe(1)
  })
})

describe('combinación más barata', () => {
  it('pocas empanadas van sueltas', () => {
    expect(mejorCombinacion(5)).toEqual({ docenas: 0, medias: 0, sueltas: 5, base: 9000 })
  })

  it('seis ya conviene media docena', () => {
    expect(mejorCombinacion(6)).toMatchObject({ medias: 1, sueltas: 0, base: 9900 })
  })

  it('doce, una docena; dieciocho, docena y media', () => {
    expect(mejorCombinacion(12)).toMatchObject({ docenas: 1, medias: 0, sueltas: 0, base: 18000 })
    expect(mejorCombinacion(18)).toMatchObject({ docenas: 1, medias: 1, base: 27900 })
    expect(mejorCombinacion(29)).toMatchObject({ docenas: 2, medias: 0, sueltas: 5, base: 45000 })
  })

  it('no asume que conviene la caja más grande', () => {
    // Con una docena cara, dos medias salen mejor.
    const raros = { unidad: 2000, media: 9000, docena: 20000 }
    expect(mejorCombinacion(12, raros)).toMatchObject({ docenas: 0, medias: 2, base: 18000 })
  })

  it('cero es cero', () => {
    expect(precio({}, 'horno')).toMatchObject({ cantidad: 0, total: 0, ahorro: 0 })
  })
})

describe('precio y ahorro', () => {
  it('al horno, con el ahorro contra comprar sueltas', () => {
    const pr = precio({ cuchillo: 6, humita: 6 }, 'horno')
    expect(pr.total).toBe(18000)
    expect(pr.ahorro).toBe(12 * 1800 - 18000)
  })

  it('fritas llevan 10 % más, redondeado a $50', () => {
    const pr = precio({ picante: 6 }, 'fritas')
    expect(pr.total).toBe(10900)
    expect(pr.ahorro).toBe(11900 - 10900)
  })

  it('sugiere completar cuando sale lo mismo o menos', () => {
    expect(sugerencia(11)).toEqual({ sumar: 1, base: 18000 })
    expect(sugerencia(10)).toBeNull()
    expect(sugerencia(0)).toBeNull()
  })

  it('describe la combinación', () => {
    expect(desglose(mejorCombinacion(19))).toBe('1 docena + 1 media docena + 1 suelta')
    expect(desglose(mejorCombinacion(36))).toBe('3 docenas')
  })
})

describe('zonas de envío', () => {
  it('encuentra el barrio sin tildes ni mayúsculas', () => {
    expect(buscarZona('san cristobal')?.id).toBe('san-cristobal')
    expect(buscarZona('  ALMAGRO ')?.id).toBe('almagro')
    expect(buscarZona('Palermo Soho')?.id).toBe('palermo')
    expect(buscarZona('Palermo Viejo')?.id).toBe('palermo')
    expect(buscarZona('Abasto')?.id).toBe('balvanera')
    expect(buscarZona('Mataderos')).toBeUndefined()
    expect(buscarZona('al')).toBeUndefined()
  })

  it('Almagro es gratis y algunos barrios son sólo retiro', () => {
    expect(entrega('envio', buscarZona('Almagro'), 18000)).toMatchObject({ tipo: 'envio', costo: 0 })
    expect(entrega('envio', buscarZona('Belgrano'), 50000)).toMatchObject({ tipo: 'no-llegamos' })
    expect(ZONAS.filter((z) => z.costo === null).length).toBeGreaterThan(0)
  })

  it('pide un mínimo para el envío', () => {
    const palermo = buscarZona('Palermo')
    expect(entrega('envio', palermo, 9900)).toEqual({ tipo: 'falta-minimo', zona: palermo, falta: 18000 - 9900 })
    expect(entrega('envio', palermo, 18000)).toMatchObject({ tipo: 'envio', costo: 2800 })
  })

  it('retiro no pide barrio ni mínimo', () => {
    expect(entrega('retiro', undefined, 1800)).toEqual({ tipo: 'retiro' })
    expect(pedidoListo(1, entrega('retiro', undefined, 1800))).toBe(true)
    expect(pedidoListo(0, entrega('retiro', undefined, 0))).toBe(false)
    expect(pedidoListo(3, entrega('envio', undefined, 5400))).toBe(false)
  })
})

describe('WhatsApp', () => {
  it('arma el mensaje con sabores, cajas, envío y total', () => {
    const p = { cuchillo: 8, humita: 4 }
    const texto = mensajeWhatsApp(p, 'horno', entrega('envio', buscarZona('Boedo'), 18000), fmt, 'Av. La Plata 1200')
    expect(texto).toContain('• 8 × Carne a cuchillo')
    expect(texto).toContain('• 4 × Humita')
    expect(texto).toContain('12 empanadas al horno (1 docena): $18000')
    expect(texto).toContain('Envío a Boedo (Av. La Plata 1200): $1500')
    expect(texto.endsWith('Total: $19500')).toBe(true)
  })

  it('codifica el texto en el link', () => {
    expect(linkWhatsApp('¡Hola!\nDos')).toBe('https://wa.me/5491148620000?text=%C2%A1Hola!%0ADos')
  })
})
