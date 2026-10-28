import { describe, expect, it } from 'vitest'
import { formatPesos } from '../shared/dinero'
import { MAX_POR_ITEM, agregar, cambiarCantidad, clave, enlaceContacto, franjasRetiro, textoPedido, total, unidades, type Item } from './pedido'

const espresso: Item = { tipo: 'bebida', id: 'espresso', cantidad: 1 }
const granos: Item = { tipo: 'granos', origen: 'etiopia', peso: 500, molienda: 'v60', cantidad: 1 }

describe('pedido', () => {
  it('suma cantidades si el ítem ya estaba', () => {
    const p = agregar(agregar([], espresso), espresso)
    expect(p).toHaveLength(1)
    expect(p[0].cantidad).toBe(2)
  })

  it('los granos con otra molienda son otro ítem', () => {
    const p = agregar(agregar([], granos), { ...granos, molienda: 'prensa' })
    expect(p).toHaveLength(2)
  })

  it('tope por ítem', () => {
    let p: Item[] = []
    for (let k = 0; k < 12; k++) p = agregar(p, espresso)
    expect(p[0].cantidad).toBe(MAX_POR_ITEM)
  })

  it('al restar a cero el ítem sale', () => {
    const p = cambiarCantidad(agregar([], espresso), clave(espresso), -1)
    expect(p).toEqual([])
  })

  it('calcula total y unidades', () => {
    const p = agregar(agregar(agregar([], espresso), espresso), granos)
    expect(total(p)).toBe(2800 * 2 + 33300)
    expect(unidades(p)).toBe(3)
  })
})

describe('retiro', () => {
  const a = (h: number, m = 0) => new Date(2026, 9, 28, h, m)

  it('primer horario: 15 minutos después, redondeado al cuarto de hora', () => {
    expect(franjasRetiro(a(10, 7))[0]).toEqual({ valor: 'hoy 10:30', etiqueta: 'Hoy a las 10:30' })
  })

  it('antes de abrir arranca a las 8:15', () => {
    expect(franjasRetiro(a(6, 40))[0].valor).toBe('hoy 08:15')
  })

  it('cerca del cierre ofrece los últimos y no se pasa', () => {
    expect(franjasRetiro(a(19, 20)).map((f) => f.valor)).toEqual(['hoy 19:45'])
  })

  it('con el local cerrado ofrece mañana', () => {
    const f = franjasRetiro(a(21))
    expect(f[0]).toEqual({ valor: 'mañana 08:30', etiqueta: 'Mañana a las 08:30' })
    expect(f).toHaveLength(8)
  })
})

describe('mensaje', () => {
  it('arma el texto con ítems, total y retiro', () => {
    const p = agregar(agregar([], espresso), granos)
    const t = textoPedido(p, { nombre: ' Lucía ', retiro: { valor: 'hoy 10:30', etiqueta: 'Hoy a las 10:30' }, negocio: 'Cobre' }, formatPesos)
    expect(t).toContain('Hola Cobre, soy Lucía. Quiero hacer un pedido para retirar hoy a las 10:30:')
    expect(t).toContain('• 1 × Espresso: ' + formatPesos(2800))
    expect(t).toContain('• 1 × Granos Etiopía 500 g, molido para V60: ' + formatPesos(33300))
    expect(t).toContain('Total: ' + formatPesos(36100))
  })

  it('enlace de contacto con el texto codificado', () => {
    const url = enlaceContacto('Cobre')
    expect(url.startsWith('https://wa.me/5491162474436?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toBe(
      'Hola, vi la demo de Cobre en la Vitrina y quiero una web así para mi cafetería.',
    )
  })
})
