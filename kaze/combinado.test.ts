import { describe, expect, it } from 'vitest'
import {
  PLATOS,
  cambiarTamanio,
  cantidad,
  combinadoVacio,
  completarAlAzar,
  completo,
  descuento,
  estado,
  faltan,
  filtrar,
  filtroVacio,
  linkWhatsApp,
  mensajePedido,
  precioOmakase,
  restar,
  subtotal,
  sumar,
  total,
  type Combinado,
} from './combinado'

const llenar = (c: Combinado, id: string, n: number) => {
  for (let i = 0; i < n; i++) c = sumar(c, id)
  return c
}
const pesos = (n: number) => `$${n}`

describe('armado', () => {
  it('suma y resta piezas', () => {
    let c = sumar(sumar(combinadoVacio(15), 'geisha'), 'hot')
    expect(cantidad(c, 'geisha')).toBe(1)
    expect(faltan(c)).toBe(13)
    c = restar(c, 'geisha')
    expect(cantidad(c, 'geisha')).toBe(0)
    expect(c.piezas).toEqual(['hot'])
  })

  it('restar una pieza que no está no cambia nada', () => {
    const c = combinadoVacio(15)
    expect(restar(c, 'hot')).toBe(c)
  })

  it('no deja pasarse del tamaño', () => {
    const c = llenar(combinadoVacio(15), 'philadelphia', 15)
    expect(completo(c)).toBe(true)
    expect(() => sumar(c, 'hot')).toThrow('ya tiene sus 15')
  })

  it('rechaza piezas inexistentes', () => {
    expect(() => sumar(combinadoVacio(), 'pizza')).toThrow('No existe')
  })

  it('no achica la bandeja si sobran piezas', () => {
    const c = llenar(combinadoVacio(30), 'hot', 17)
    expect(() => cambiarTamanio(c, 15)).toThrow('sacá 2 piezas')
    expect(cambiarTamanio(c, 45).tamanio).toBe(45)
  })

  it('completa al azar hasta el tamaño', () => {
    const c = completarAlAzar(sumar(combinadoVacio(30), 'kappa'), () => 0.5)
    expect(c.piezas).toHaveLength(30)
    expect(cantidad(c, 'kappa')).toBe(30)
  })

  it('arma el texto del estado', () => {
    expect(estado(combinadoVacio(15))).toBe('Elegí 15 piezas')
    expect(estado(llenar(combinadoVacio(15), 'hot', 14))).toBe('Te falta 1 pieza')
    expect(estado(llenar(combinadoVacio(15), 'hot', 5))).toBe('Te faltan 10 piezas')
    expect(estado(llenar(combinadoVacio(15), 'hot', 15))).toBe('¡Bandeja completa!')
  })
})

describe('precio', () => {
  it('suma el precio por pieza', () => {
    const c = sumar(sumar(combinadoVacio(15), 'nigiri-salmon'), 'kappa')
    expect(subtotal(c)).toBe(2300 + 1400)
    expect(descuento(c)).toBe(0)
    expect(total(c)).toBe(3700)
  })

  it('aplica el descuento de combo sólo con la bandeja completa', () => {
    const c = llenar(combinadoVacio(15), 'philadelphia', 15)
    expect(subtotal(c)).toBe(27000)
    expect(descuento(c)).toBe(2700)
    expect(total(c)).toBe(24300)
  })

  it('el descuento crece con el tamaño', () => {
    const c = llenar(combinadoVacio(45), 'philadelphia', 45)
    expect(descuento(c)).toBe(Math.round((81000 * 0.15) / 100) * 100)
  })
})

describe('pedido', () => {
  it('arma el mensaje agrupado por pieza', () => {
    let c = llenar(combinadoVacio(15), 'hot', 10)
    c = llenar(c, 'geisha', 5)
    expect(mensajePedido(c, pesos)).toBe(
      'Hola Kaze, quiero un combinado de 15 piezas:\n• 5 × Geisha\n• 10 × Hot roll\nTotal: $27000',
    )
  })

  it('sólo arma el link con la bandeja completa', () => {
    expect(() => linkWhatsApp(llenar(combinadoVacio(15), 'hot', 3), pesos)).toThrow('Completá')
    const link = linkWhatsApp(llenar(combinadoVacio(15), 'hot', 15), pesos)
    expect(link).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
    expect(decodeURIComponent(link.split('text=')[1])).toContain('15 × Hot roll')
  })
})

describe('carta', () => {
  it('sin filtros muestra todo', () => {
    expect(filtrar(PLATOS, filtroVacio())).toHaveLength(PLATOS.length)
  })

  it('combina cocción con veggie y sin TACC', () => {
    const r = filtrar(PLATOS, { coccion: 'cocido', veggie: true, sintacc: true })
    expect(r.map((p) => p.id)).toEqual(['edamame'])
    expect(filtrar(PLATOS, { ...filtroVacio(), coccion: 'crudo' }).every((p) => p.etiquetas.includes('crudo'))).toBe(true)
  })
})

describe('omakase', () => {
  it('calcula por comensal y respeta los lugares', () => {
    expect(precioOmakase(2, 3)).toBe(144000)
    expect(() => precioOmakase(4, 3)).toThrow('Quedan 3 lugares')
    expect(() => precioOmakase(0, 3)).toThrow('al menos')
  })
})
