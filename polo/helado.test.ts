import { describe, expect, it } from 'vitest'
import {
  ENVIO,
  SABORES,
  alternarSabor,
  aptoCeliacos,
  cambiarEnvase,
  costoEnvio,
  describir,
  filtrarSabores,
  filtroVacio,
  heladoVacio,
  linkWhatsApp,
  lleno,
  mensajePedido,
  pedidoVacio,
  quitarDelPedido,
  sumarAlPedido,
  total,
  vegano,
  type Helado,
  type Pedido,
} from './helado'

const armar = (h: Helado, ...ids: string[]) => ids.reduce(alternarSabor, h)
const pesos = (n: number) => `$${n}`

describe('sabores', () => {
  it('suma y saca un sabor al tocarlo dos veces', () => {
    let h = alternarSabor(heladoVacio(), 'ddl')
    expect(h.sabores).toEqual(['ddl'])
    h = alternarSabor(h, 'ddl')
    expect(h.sabores).toEqual([])
  })

  it('respeta el máximo de cada envase con un mensaje amable', () => {
    const h = armar(heladoVacio('cucurucho'), 'ddl', 'limon')
    expect(lleno(h)).toBe(true)
    expect(() => alternarSabor(h, 'menta')).toThrow('En el cucurucho entran hasta 2 sabores')
    const k = armar(heladoVacio('kilo'), 'ddl', 'limon', 'menta', 'pistacho')
    expect(() => alternarSabor(k, 'sambayon')).toThrow('pote de 1 kg entran hasta 4')
  })

  it('rechaza sabores que no existen', () => {
    expect(() => alternarSabor(heladoVacio(), 'pizza')).toThrow('No tenemos')
  })

  it('al achicar el envase se quedan los primeros sabores', () => {
    const h = armar(heladoVacio('medio'), 'ddl', 'limon', 'menta')
    const r = cambiarEnvase(h, 'cucurucho')
    expect(r.helado.sabores).toEqual(['ddl', 'limon'])
    expect(r.quitados).toEqual(['menta'])
    expect(cambiarEnvase(h, 'kilo').quitados).toEqual([])
  })
})

describe('aptos', () => {
  it('el cucurucho nunca es sin TACC', () => {
    expect(aptoCeliacos(armar(heladoVacio('cucurucho'), 'limon'))).toBe(false)
    expect(aptoCeliacos(armar(heladoVacio('cuarto'), 'limon'))).toBe(true)
    expect(aptoCeliacos(armar(heladoVacio('cuarto'), 'limon', 'tramontana'))).toBe(false)
  })

  it('es vegano sólo si todos los sabores lo son', () => {
    expect(vegano(heladoVacio())).toBe(false)
    expect(vegano(armar(heladoVacio(), 'limon', 'choco-vegano'))).toBe(true)
    expect(vegano(armar(heladoVacio(), 'limon', 'ddl'))).toBe(false)
  })
})

describe('filtros', () => {
  it('sin filtros están todos', () => {
    expect(filtrarSabores(SABORES, filtroVacio())).toHaveLength(SABORES.length)
  })

  it('combina categoría, sin TACC y vegano', () => {
    const r = filtrarSabores(SABORES, { categoria: 'chocolate', sinTacc: true, vegano: true })
    expect(r.map((s) => s.id)).toEqual(['choco-vegano'])
    expect(filtrarSabores(SABORES, { ...filtroVacio(), categoria: 'ddl', sinTacc: true }).map((s) => s.id)).not.toContain('tramontana')
  })
})

describe('pedido', () => {
  it('no suma un helado sin sabores', () => {
    expect(() => sumarAlPedido(pedidoVacio(), heladoVacio())).toThrow('al menos un sabor')
  })

  it('suma, quita y calcula el total', () => {
    let p = sumarAlPedido(pedidoVacio(), armar(heladoVacio('cuarto'), 'ddl'))
    p = sumarAlPedido(p, armar(heladoVacio('cucurucho'), 'limon'))
    expect(total(p)).toBe(9900 + 5800)
    p = quitarDelPedido(p, 0)
    expect(total(p)).toBe(5800)
  })

  it('cobra envío salvo que supere el mínimo', () => {
    let p: Pedido = { ...sumarAlPedido(pedidoVacio(), armar(heladoVacio('medio'), 'ddl')), entrega: 'envio' }
    expect(costoEnvio(p)).toBe(ENVIO)
    expect(total(p)).toBe(17500 + ENVIO)
    p = sumarAlPedido(p, armar(heladoVacio('kilo'), 'menta'))
    expect(costoEnvio(p)).toBe(0)
  })

  it('describe y arma el mensaje de WhatsApp', () => {
    const h = armar(heladoVacio('cuarto'), 'ddl', 'limon', 'menta')
    expect(describir(h)).toBe('Pote de ¼ kg de dulce de leche, limón y menta granizada')
    const p = sumarAlPedido(pedidoVacio(), h)
    expect(mensajePedido(p, pesos)).toBe(
      '¡Hola Polo Sur! Quiero pedir:\n• Pote de ¼ kg de dulce de leche, limón y menta granizada ($9900)\nLo paso a buscar por el local.\nTotal: $9900',
    )
    expect(() => linkWhatsApp(pedidoVacio(), pesos)).toThrow('vacío')
    expect(linkWhatsApp(p, pesos)).toMatch(/^https:\/\/wa\.me\/\d+\?text=%C2%A1Hola/)
  })
})
