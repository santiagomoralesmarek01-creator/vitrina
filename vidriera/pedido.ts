// El pedido: porciones, cajas de masas, tortas enteras y café. Totales y texto para el local. Sin DOM.
import { formatPesos } from '../shared/dinero'
import { contenido, precioCaja, TAMANIOS_CAJA, type Caja } from './caja'
import { bebida, masa, NEGOCIO, porcion, precioTorta, torta } from './catalogo'
import { desdeClave, retiroLargo } from './retiro'

export interface Encargo {
  torta: string
  porciones: number
  dedicatoria: string
  fecha: string
  hora: string
}

export interface Pedido {
  porciones: Record<string, number>
  cajas: Caja[]
  tortas: Encargo[]
  bebidas: Record<string, number>
}

export const pedidoVacio = (): Pedido => ({ porciones: {}, cajas: [], tortas: [], bebidas: {} })

const ajustar = (m: Record<string, number>, id: string, delta: number) => {
  const n = Math.max(0, Math.min(20, (m[id] ?? 0) + delta))
  const r = { ...m }
  if (n) r[id] = n
  else delete r[id]
  return r
}

export function cambiarPorcion(p: Pedido, id: string, delta: number): Pedido {
  porcion(id)
  return { ...p, porciones: ajustar(p.porciones, id, delta) }
}

export function cambiarBebida(p: Pedido, id: string, delta: number): Pedido {
  bebida(id)
  return { ...p, bebidas: ajustar(p.bebidas, id, delta) }
}

export function sumarCaja(p: Pedido, c: Caja): Pedido {
  if (c.piezas.length !== c.tamanio) throw new Error('La caja tiene que estar completa')
  return { ...p, cajas: [...p.cajas, { ...c, piezas: [...c.piezas] }] }
}

export function sumarTorta(p: Pedido, e: Encargo): Pedido {
  torta(e.torta)
  precioTorta(e.torta, e.porciones)
  if (!e.fecha || !e.hora) throw new Error('Elegí el día y el horario de retiro')
  return { ...p, tortas: [...p.tortas, { ...e, dedicatoria: e.dedicatoria.trim() }] }
}

export const quitarCaja = (p: Pedido, i: number): Pedido => ({ ...p, cajas: p.cajas.filter((_, j) => j !== i) })
export const quitarTorta = (p: Pedido, i: number): Pedido => ({ ...p, tortas: p.tortas.filter((_, j) => j !== i) })

export interface Linea {
  /** Para poder quitarla desde el resumen: "porcion:rogel", "caja:0", "torta:1", "bebida:cafe". */
  clave: string
  titulo: string
  detalle: string
  cantidad: number
  subtotal: number
}

/** "3 cañoncitos, 2 macarons de frambuesa" */
export function detalleCaja(c: Caja): string {
  return contenido(c)
    .map(({ id, cantidad }) => `${cantidad} ${(cantidad === 1 ? masa(id).nombre : masa(id).plural).toLowerCase()}`)
    .join(', ')
}

export function lineas(p: Pedido): Linea[] {
  const r: Linea[] = []
  for (const [id, n] of Object.entries(p.porciones)) {
    const x = porcion(id)
    r.push({ clave: `porcion:${id}`, titulo: `Porción de ${x.nombre.toLowerCase()}`, detalle: '', cantidad: n, subtotal: n * x.precio })
  }
  p.cajas.forEach((c, i) =>
    r.push({ clave: `caja:${i}`, titulo: `${TAMANIOS_CAJA[c.tamanio].nombre} masas finas`, detalle: detalleCaja(c), cantidad: 1, subtotal: precioCaja(c) }),
  )
  p.tortas.forEach((e, i) => {
    const partes = [`Para retirar el ${retiroLargo(e.fecha, e.hora)}`]
    if (e.dedicatoria) partes.unshift(`Dedicatoria: "${e.dedicatoria}"`)
    r.push({
      clave: `torta:${i}`,
      titulo: `${torta(e.torta).nombre} entera, ${e.porciones} porciones`,
      detalle: partes.join(' · '),
      cantidad: 1,
      subtotal: precioTorta(e.torta, e.porciones),
    })
  })
  for (const [id, n] of Object.entries(p.bebidas)) {
    const x = bebida(id)
    r.push({ clave: `bebida:${id}`, titulo: x.nombre, detalle: '', cantidad: n, subtotal: n * x.precio })
  }
  return r
}

export function quitarLinea(p: Pedido, c: string): Pedido {
  const [tipo, id] = c.split(':')
  if (tipo === 'porcion') return cambiarPorcion(p, id, -99)
  if (tipo === 'bebida') return cambiarBebida(p, id, -99)
  if (tipo === 'caja') return quitarCaja(p, Number(id))
  if (tipo === 'torta') return quitarTorta(p, Number(id))
  return p
}

export const total = (p: Pedido) => lineas(p).reduce((s, l) => s + l.subtotal, 0)
export const cantidad = (p: Pedido) => lineas(p).reduce((s, l) => s + l.cantidad, 0)
export const vacio = (p: Pedido) => cantidad(p) === 0

/** Lo que no es torta entera se retira junto con la primera torta, o en el día si no hay tortas. */
export function retiroGeneral(p: Pedido): string {
  if (!p.tortas.length) return 'hoy, en el mostrador'
  const primera = [...p.tortas].sort(
    (a, b) => desdeClave(a.fecha, a.hora).getTime() - desdeClave(b.fecha, b.hora).getTime(),
  )[0]
  return `junto con la torta, el ${retiroLargo(primera.fecha, primera.hora)}`
}

export interface Cliente {
  nombre: string
  nota: string
}

/** El mensaje tal como le llegaría al local por WhatsApp (con *negritas* de WhatsApp). */
export function textoPedido(p: Pedido, cliente: Cliente): string {
  const ls = lineas(p)
  if (!ls.length) throw new Error('El pedido está vacío')
  const r: string[] = [`Hola ${NEGOCIO}, quiero hacer este pedido:`, '']
  const grupo = (titulo: string, prefijo: string) => {
    const g = ls.filter((l) => l.clave.startsWith(prefijo))
    if (!g.length) return
    r.push(`*${titulo}*`)
    for (const l of g) {
      const cant = l.cantidad > 1 ? `${l.cantidad} × ` : ''
      r.push(`• ${cant}${l.titulo}: ${formatPesos(l.subtotal)}`)
      if (l.detalle) for (const d of l.detalle.split(' · ')) r.push(`   ${d}`)
    }
    r.push('')
  }
  grupo('Porciones', 'porcion:')
  grupo('Masas finas', 'caja:')
  grupo('Tortas enteras', 'torta:')
  grupo('Para tomar', 'bebida:')
  r.push(`*Total: ${formatPesos(total(p))}*`)
  const soloTortas = ls.every((l) => l.clave.startsWith('torta:'))
  if (!soloTortas) r.push(`Retiro: ${retiroGeneral(p)}`)
  const nombre = cliente.nombre.trim()
  if (nombre) r.push(`A nombre de: ${nombre}`)
  const nota = cliente.nota.trim()
  if (nota) r.push(`Nota: ${nota}`)
  return r.join('\n')
}

export const WHATSAPP_MRK = '5491162474436'

export function enlaceContacto(): string {
  const msg = `Hola, vi la demo de ${NEGOCIO} en la Vitrina y quiero una web así para mi cafetería.`
  return `https://wa.me/${WHATSAPP_MRK}?text=${encodeURIComponent(msg)}`
}
