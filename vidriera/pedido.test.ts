import { describe, expect, it } from 'vitest'
import { cajaVacia, surtida } from './caja'
import { limpiarDedicatoria, precioTorta, renglones } from './catalogo'
import {
  cambiarBebida, cambiarPorcion, cantidad, enlaceContacto, lineas, pedidoVacio, quitarLinea, retiroGeneral, sumarCaja, sumarTorta, textoPedido, total, vacio,
  type Encargo,
} from './pedido'

const encargo: Encargo = { torta: 'lemon', porciones: 12, dedicatoria: 'Feliz cumple, Abu', fecha: '2026-10-31', hora: '17:00' }

describe('tortas enteras', () => {
  it('la de 12 es el precio base y las otras escalan redondeando a $500', () => {
    expect(precioTorta('chocotorta', 12)).toBe(42000)
    expect(precioTorta('lemon', 8)).toBe(31500)
    expect(precioTorta('cheesecake', 16)).toBe(67500)
    expect(() => precioTorta('lemon', 30)).toThrow()
  })

  it('la dedicatoria se limpia y tiene tope', () => {
    expect(limpiarDedicatoria('  Feliz\n cumple   Abu')).toBe('Feliz cumple Abu')
    expect([...limpiarDedicatoria('x'.repeat(40))]).toHaveLength(26)
  })

  it('la dedicatoria larga se parte en dos renglones por un espacio', () => {
    expect(renglones('')).toEqual([])
    expect(renglones('Feliz día')).toEqual(['Feliz día'])
    expect(renglones('Feliz cumple, querida Abu')).toEqual(['Feliz cumple,', 'querida Abu'])
    expect(renglones('Supercalifragilístico')).toEqual(['Supercalifragilístico'])
  })

  it('sin fecha no se puede encargar', () => {
    expect(() => sumarTorta(pedidoVacio(), { ...encargo, fecha: '' })).toThrow('día')
  })
})

describe('pedido', () => {
  it('suma y resta porciones y bebidas sin bajar de cero', () => {
    let p = cambiarPorcion(pedidoVacio(), 'rogel', 2)
    p = cambiarBebida(p, 'cortado', 1)
    p = cambiarBebida(p, 'cortado', -3)
    expect(p.porciones).toEqual({ rogel: 2 })
    expect(p.bebidas).toEqual({})
    expect(() => cambiarPorcion(p, 'flan', 1)).toThrow()
  })

  it('sólo acepta cajas completas', () => {
    expect(() => sumarCaja(pedidoVacio(), cajaVacia(6))).toThrow('completa')
  })

  it('calcula líneas, total y cantidad', () => {
    let p = cambiarPorcion(pedidoVacio(), 'chocotorta', 2)
    p = sumarCaja(p, surtida(cajaVacia(12), ['canoncito']))
    p = sumarTorta(p, encargo)
    p = cambiarBebida(p, 'cafe', 2)
    expect(lineas(p).map((l) => l.clave)).toEqual(['porcion:chocotorta', 'caja:0', 'torta:0', 'bebida:cafe'])
    expect(total(p)).toBe(10400 + 13000 + 45000 + 5200)
    expect(cantidad(p)).toBe(6)
    expect(vacio(p)).toBe(false)
  })

  it('quita líneas desde el resumen', () => {
    let p = cambiarPorcion(pedidoVacio(), 'chocotorta', 2)
    p = sumarTorta(p, encargo)
    p = quitarLinea(quitarLinea(p, 'porcion:chocotorta'), 'torta:0')
    expect(vacio(p)).toBe(true)
  })

  it('lo demás se retira con la primera torta', () => {
    let p = cambiarPorcion(pedidoVacio(), 'rogel', 1)
    expect(retiroGeneral(p)).toBe('hoy, en el mostrador')
    p = sumarTorta(p, { ...encargo, fecha: '2026-11-04', hora: '10:00' })
    p = sumarTorta(p, encargo)
    expect(retiroGeneral(p)).toBe('junto con la torta, el sábado 31 de octubre a las 17:00')
  })
})

describe('mensaje para el local', () => {
  it('arma el texto con grupos, detalle y total', () => {
    let p = cambiarPorcion(pedidoVacio(), 'chocotorta', 2)
    p = sumarCaja(p, surtida(cajaVacia(6), ['canoncito', 'macaron', 'canoncito']))
    p = sumarTorta(p, encargo)
    p = cambiarBebida(p, 'cortado', 1)
    const t = textoPedido(p, { nombre: ' Sofía ', nota: 'Sin velitas' })
    expect(t).toContain('Hola Clotilde, quiero hacer este pedido:')
    expect(t).toContain('*Porciones*\n• 2 × Porción de chocotorta: $ 10.400')
    expect(t).toContain('• Caja de 6 masas finas: $ 7.600')
    expect(t).toContain('4 cañoncitos, 2 macarons de frambuesa')
    expect(t).toContain('Dedicatoria: "Feliz cumple, Abu"')
    expect(t).toContain('Para retirar el sábado 31 de octubre a las 17:00')
    expect(t).toContain('*Total: $ 65.900*')
    expect(t).toContain('Retiro: junto con la torta')
    expect(t).toContain('A nombre de: Sofía')
    expect(t).toContain('Nota: Sin velitas')
  })

  it('si es sólo una torta no repite el retiro ni pone renglones vacíos', () => {
    const t = textoPedido(sumarTorta(pedidoVacio(), { ...encargo, dedicatoria: '' }), { nombre: '', nota: '' })
    expect(t).not.toContain('Retiro:')
    expect(t).not.toContain('Dedicatoria')
    expect(t).not.toContain('A nombre de')
  })

  it('no arma mensaje de un pedido vacío', () => {
    expect(() => textoPedido(pedidoVacio(), { nombre: '', nota: '' })).toThrow('vacío')
  })

  it('el enlace de contacto va codificado', () => {
    const url = enlaceContacto()
    expect(url.startsWith('https://wa.me/5491162474436?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toBe(
      'Hola, vi la demo de Clotilde en la Vitrina y quiero una web así para mi cafetería.',
    )
  })
})
