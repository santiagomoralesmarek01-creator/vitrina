import { describe, expect, it } from 'vitest'
import {
  agregarAcomp,
  agregarBebida,
  alternarExtra,
  bebidaInicial,
  cambiarBase,
  cambiarCantidad,
  cambiarShots,
  cantidadTotal,
  capas,
  cubitos,
  DE_LA_CASA,
  deLaCasa,
  describir,
  enlaceContacto,
  esFrio,
  franjasRetiro,
  LLENO,
  MAX_CANTIDAD,
  nombreBebida,
  nombreItem,
  nombreValido,
  normalizar,
  precio,
  textoPedido,
  totalPedido,
  type Bebida,
} from './vaso'

const latte = bebidaInicial()
const suma = (b: Bebida) => capas(b).reduce((s, c) => s + c.alto, 0)

describe('precio', () => {
  it('latte mediano con leche entera y doble shot incluido', () => {
    expect(precio(latte)).toBe(3600)
  })
  it('chico americano está en el rango de un café chico', () => {
    const b = { ...latte, tamanio: 'chico' as const, leche: 'sin' as const }
    expect(precio(b)).toBe(3000)
  })
  it('suma shots de más, leche vegetal, jarabe y extras', () => {
    const b: Bebida = { ...latte, shots: 3, leche: 'avena', jarabe: 'vainilla', extras: ['crema', 'canela'] }
    expect(precio(b)).toBe(3600 + 700 + 600 + 500 + 700 + 200)
  })
  it('menos shots que los incluidos no descuenta', () => {
    expect(precio({ ...latte, shots: 1 })).toBe(3600)
  })
  it('las bases suman su suplemento', () => {
    expect(precio(cambiarBase(latte, 'matcha'))).toBe(4500)
  })
})

describe('armado', () => {
  it('los shots quedan dentro del rango de cada base', () => {
    expect(cambiarShots({ ...latte, shots: 4 }, 1).shots).toBe(4)
    expect(cambiarShots({ ...latte, shots: 1 }, -1).shots).toBe(1)
    expect(cambiarShots(cambiarBase(latte, 'chai'), -1).shots).toBe(0)
  })
  it('cambiar de base vuelve a los shots que trae', () => {
    expect(cambiarBase({ ...latte, shots: 4 }, 'chai').shots).toBe(0)
    expect(cambiarBase(cambiarBase(latte, 'chai'), 'espresso').shots).toBe(2)
  })
  it('el cold brew va siempre con hielo y no se le puede sacar', () => {
    const cb = cambiarBase(latte, 'coldbrew')
    expect(cb.extras).toContain('hielo')
    expect(alternarExtra(cb, 'hielo').extras).toContain('hielo')
    expect(cambiarBase(cb, 'espresso').extras).not.toContain('hielo')
  })
  it('alternar extras y normalizar sin repetidos', () => {
    const b = alternarExtra(alternarExtra(latte, 'canela'), 'crema')
    expect(b.extras).toEqual(['crema', 'canela'])
    expect(alternarExtra(b, 'canela').extras).toEqual(['crema'])
    expect(normalizar({ ...latte, extras: ['hielo', 'hielo', 'crema'] }).extras).toEqual(['crema', 'hielo'])
  })
  it('rechaza opciones desconocidas', () => {
    expect(() => normalizar({ ...latte, base: 'mate' as never })).toThrow()
  })
})

describe('capas del vaso', () => {
  it('latte caliente: espresso abajo, leche y espuma arriba', () => {
    expect(capas(latte).map((c) => c.id)).toEqual(['base', 'relleno', 'espuma'])
  })
  it('se llena hasta el mismo nivel en cualquier combinación', () => {
    for (const d of DE_LA_CASA) expect(suma(d.bebida)).toBeCloseTo(LLENO, 2)
    expect(suma({ ...latte, tamanio: 'chico', shots: 4, jarabe: 'caramelo', extras: ['crema'] })).toBeCloseTo(LLENO, 2)
  })
  it('las capas son contiguas', () => {
    const cs = capas({ ...latte, jarabe: 'caramelo', extras: ['crema'] })
    for (let i = 1; i < cs.length; i++) expect(cs[i].desde).toBeCloseTo(cs[i - 1].desde + cs[i - 1].alto, 2)
  })
  it('la altura del espresso es proporcional a los shots y al tamaño', () => {
    const alto = (b: Bebida) => capas(b).find((c) => c.id === 'base')!.alto
    expect(alto({ ...latte, shots: 4 })).toBeCloseTo(alto(latte) * 2, 2)
    expect(alto({ ...latte, tamanio: 'chico' })).toBeGreaterThan(alto({ ...latte, tamanio: 'grande' }))
  })
  it('frío: sin espuma y con cubitos según tamaño', () => {
    const helado = alternarExtra(latte, 'hielo')
    expect(esFrio(helado)).toBe(true)
    expect(capas(helado).some((c) => c.id === 'espuma')).toBe(false)
    expect(cubitos(helado)).toBe(4)
    expect(cubitos(latte)).toBe(0)
  })
  it('jarabe en el fondo, crema arriba de todo y shots extra en un dirty chai', () => {
    const cs = capas({ base: 'chai', tamanio: 'mediano', shots: 1, leche: 'entera', jarabe: 'vainilla', extras: ['crema'] })
    expect(cs.map((c) => c.id)).toEqual(['jarabe', 'base', 'shots', 'relleno', 'espuma', 'crema'])
  })
  it('cold brew sin leche ocupa todo el líquido', () => {
    const cs = capas(DE_LA_CASA.find((d) => d.id === 'bondi')!.bebida)
    expect(cs.map((c) => c.id)).toEqual(['base'])
  })
})

describe('nombres', () => {
  it('nombra según base, leche y temperatura', () => {
    expect(nombreBebida(latte)).toBe('Latte')
    expect(nombreBebida({ ...latte, leche: 'sin' })).toBe('Americano')
    expect(nombreBebida(alternarExtra(latte, 'hielo'))).toBe('Latte helado')
    expect(nombreBebida({ ...latte, tamanio: 'chico', shots: 1 })).toBe('Cortado')
    expect(nombreBebida({ ...cambiarBase(latte, 'chai'), shots: 1 })).toBe('Dirty chai')
  })
  it('describe la bebida', () => {
    expect(describir({ ...latte, leche: 'avena', jarabe: 'vainilla', extras: ['crema', 'canela'] })).toBe(
      'mediano · 2 shots · leche de avena · jarabe de vainilla · con crema y canela',
    )
  })
  it('reconoce las de la casa', () => {
    expect(deLaCasa(DE_LA_CASA[1].bebida)?.nombre).toBe('Avena y vainilla')
    expect(deLaCasa({ ...DE_LA_CASA[1].bebida, jarabe: 'caramelo' })).toBeUndefined()
  })
})

describe('pedido', () => {
  it('la misma bebida suma cantidad y los acompañamientos se agrupan', () => {
    let items = agregarBebida([], latte)
    items = agregarBebida(items, { ...latte })
    items = agregarAcomp(items, 'medialunas')
    items = agregarAcomp(items, 'medialunas')
    expect(items).toHaveLength(2)
    expect(cantidadTotal(items)).toBe(4)
    expect(totalPedido(items)).toBe(3600 * 2 + 2200 * 2)
  })
  it('restar hasta cero lo saca y hay un máximo', () => {
    let items = agregarAcomp([], 'cookie')
    expect(cambiarCantidad(items, 0, -1)).toEqual([])
    for (let i = 0; i < 20; i++) items = agregarAcomp(items, 'cookie')
    expect(items[0].cantidad).toBe(MAX_CANTIDAD)
  })
  it('usa el nombre de la casa si coincide', () => {
    expect(nombreItem(agregarBebida([], DE_LA_CASA[0].bebida)[0])).toBe('Cortado de parado')
    expect(nombreItem(agregarBebida([], latte)[0])).toBe('Latte mediano')
  })
  it('valida el nombre', () => {
    expect(nombreValido(' ')).toBe(false)
    expect(nombreValido('Sofi')).toBe(true)
  })
})

describe('retiro', () => {
  const a = (h: number, m: number) => new Date(2026, 9, 28, h, m)
  it('abierto: lo antes posible y franjas de 15 minutos', () => {
    const f = franjasRetiro(a(10, 2))
    expect(f.map((x) => x.id)).toEqual(['ya', '10:30', '10:45', '11:00', '11:15'])
    expect(f[0].detalle).toBe('Listo en 10 min')
  })
  it('no ofrece franjas después del cierre', () => {
    const f = franjasRetiro(a(20, 30))
    expect(f.map((x) => x.id)).toEqual(['ya', '21:00'])
  })
  it('cerrado de noche: franjas de mañana', () => {
    const f = franjasRetiro(a(22, 0))
    expect(f[0].etiqueta).toBe('Mañana 07:30')
    expect(f.some((x) => x.id === 'ya')).toBe(false)
  })
  it('antes de abrir: franjas de hoy', () => {
    expect(franjasRetiro(a(6, 0))[0].etiqueta).toBe('Hoy 07:30')
  })
})

describe('texto', () => {
  it('arma el mensaje del pedido', () => {
    const items = agregarAcomp(agregarBebida([], latte), 'alfajor')
    const t = textoPedido(items, '  Sofi ', { id: 'ya', etiqueta: 'Lo antes posible', detalle: '' })
    expect(t).toContain('Hola Al Paso, soy Sofi. Quiero pedir para retirar:')
    expect(t).toContain('• 1 × Latte mediano (mediano · 2 shots · leche entera)')
    expect(t).toContain('• 1 × Alfajor de maicena')
    expect(t).toMatch(/Total: \$\s?5\.200/)
    expect(t).toContain('Retiro: lo antes posible (listo en 10 min)')
  })
  it('retiro con hora', () => {
    const t = textoPedido(agregarBebida([], latte), 'Sofi', franjasRetiro(new Date(2026, 9, 28, 10, 2))[1])
    expect(t).toContain('Retiro: hoy a las 10:30')
  })
  it('enlace de contacto con el texto codificado', () => {
    const url = enlaceContacto()
    expect(url.startsWith('https://wa.me/5491162474436?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Hola, vi la demo de Al Paso en la Vitrina y quiero una web así para mi cafetería.')
  })
})
