import { describe, expect, it } from 'vitest'
import {
  CANILLAS,
  TAMANIO_VUELO,
  alternarEstilo,
  alternarVuelo,
  esOscura,
  estadoTaproom,
  filtrar,
  filtroInicial,
  ordenar,
  precioProbeta,
  precioVuelo,
  srmAHex,
} from './canillas'

const canilla = (n: number) => CANILLAS.find((c) => c.numero === n)!

describe('srmAHex', () => {
  it('devuelve los extremos de la escala', () => {
    expect(srmAHex(1)).toBe('#ffe699')
    expect(srmAHex(40)).toBe('#36080a')
  })

  it('limita fuera de rango', () => {
    expect(srmAHex(0)).toBe(srmAHex(1))
    expect(srmAHex(65)).toBe(srmAHex(40))
  })

  it('interpola entre valores enteros', () => {
    const medio = srmAHex(1.5)
    expect(medio).toMatch(/^#[0-9a-f]{6}$/)
    expect(medio).toBe('#ffdf89') // entre #ffe699 y #ffd878
  })

  it('más SRM es más oscuro', () => {
    const luz = (hex: string) => [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0)
    expect(luz(srmAHex(4))).toBeGreaterThan(luz(srmAHex(17)))
    expect(luz(srmAHex(17))).toBeGreaterThan(luz(srmAHex(38)))
  })

  it('detecta cervezas oscuras', () => {
    expect(esOscura(40)).toBe(true)
    expect(esOscura(3)).toBe(false)
  })

  it('rechaza valores que no son números', () => {
    expect(() => srmAHex(Number.NaN)).toThrow()
  })
})

describe('canillas', () => {
  it('hay 12 con números únicos y precios enteros', () => {
    expect(CANILLAS).toHaveLength(12)
    expect(new Set(CANILLAS.map((c) => c.numero)).size).toBe(12)
    for (const c of CANILLAS) {
      expect(Number.isInteger(c.pinta)).toBe(true)
      expect(c.media).toBeLessThan(c.pinta)
    }
  })
})

describe('filtros', () => {
  it('sin filtro devuelve todas', () => {
    expect(filtrar(CANILLAS, filtroInicial())).toHaveLength(12)
  })

  it('filtra por estilo', () => {
    const r = filtrar(CANILLAS, { ...filtroInicial(), estilos: ['Stout', 'Porter'] })
    expect(r.map((c) => c.numero)).toEqual([9, 10, 12])
  })

  it('filtra por rangos de IBU y ABV (inclusive)', () => {
    const r = filtrar(CANILLAS, { ...filtroInicial(), ibu: [30, 40], abv: [5, 7] })
    expect(r.map((c) => c.numero)).toEqual([3, 5, 9, 10])
  })

  it('alterna estilos', () => {
    expect(alternarEstilo(['IPA'], 'Hazy')).toEqual(['IPA', 'Hazy'])
    expect(alternarEstilo(['IPA', 'Hazy'], 'IPA')).toEqual(['Hazy'])
  })

  it('ordena por nombre, ABV e IBU con las agotadas al final', () => {
    const porAbv = ordenar(CANILLAS, 'abv')
    expect(porAbv[0].nombre).toBe('Pulpería')
    expect(porAbv.slice(-2).every((c) => c.agotada)).toBe(true)
    expect(ordenar(CANILLAS, 'ibu')[0].nombre).toBe('Doble Turno')
    expect(ordenar(CANILLAS, 'nombre')[0].nombre).toBe('Andén 7')
  })

  it('no muta la lista original', () => {
    const copia = [...CANILLAS]
    ordenar(CANILLAS, 'nombre')
    expect(CANILLAS).toEqual(copia)
  })
})

describe('vuelo', () => {
  it('suma y saca cervezas', () => {
    let v = alternarVuelo([], canilla(1))
    v = alternarVuelo(v, canilla(4))
    expect(v).toEqual([1, 4])
    expect(alternarVuelo(v, canilla(1))).toEqual([4])
  })

  it('no deja sumar agotadas', () => {
    expect(() => alternarVuelo([], canilla(5))).toThrow('agotada')
  })

  it(`lleva exactamente ${TAMANIO_VUELO}`, () => {
    const v = [1, 2, 3, 4]
    expect(() => alternarVuelo(v, canilla(6))).toThrow('4 cervezas')
  })

  it('la probeta cuesta un tercio de la pinta', () => {
    expect(precioProbeta(canilla(1))).toBe(1900)
    expect(precioProbeta(canilla(12))).toBe(2800)
  })

  it('el vuelo completo tiene 10 % de descuento', () => {
    expect(precioVuelo([1, 2])).toBe(1900 + 2000)
    // 1900 + 2000 + 2100 + 2300 = 8300 → 7470 → 7500
    expect(precioVuelo([1, 2, 3, 4])).toBe(7500)
  })
})

describe('horarios', () => {
  it('happy hour martes a viernes de 17 a 20', () => {
    expect(estadoTaproom(new Date(2026, 9, 20, 18, 30))).toBe('happy') // martes
    expect(estadoTaproom(new Date(2026, 9, 20, 21, 0))).toBe('abierto')
    expect(estadoTaproom(new Date(2026, 9, 24, 18, 0))).toBe('abierto') // sábado
  })

  it('cerrado los lunes y antes de las 17', () => {
    expect(estadoTaproom(new Date(2026, 9, 19, 19, 0))).toBe('cerrado')
    expect(estadoTaproom(new Date(2026, 9, 20, 12, 0))).toBe('cerrado')
  })

  it('después de medianoche cuenta como la noche anterior', () => {
    expect(estadoTaproom(new Date(2026, 9, 20, 0, 30))).toBe('cerrado') // la noche del lunes
    expect(estadoTaproom(new Date(2026, 9, 19, 0, 30))).toBe('abierto') // la noche del domingo
  })
})
