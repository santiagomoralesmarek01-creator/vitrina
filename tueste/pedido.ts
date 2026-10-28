// Pedido con retiro en la barra: ítems, total, horarios de retiro y texto del mensaje.
import { BEBIDAS, ORIGENES } from './cafes'
import { buscarMolienda, nombrePeso, precioGranos, type Molienda, type Peso } from './granos'

export type Item =
  | { tipo: 'bebida'; id: string; cantidad: number }
  | { tipo: 'granos'; origen: string; peso: Peso; molienda: Molienda; cantidad: number }

export const MAX_POR_ITEM = 9

/** Clave que identifica un ítem igual a otro (para sumar cantidades en vez de duplicar). */
export function clave(i: Item): string {
  return i.tipo === 'bebida' ? `b:${i.id}` : `g:${i.origen}:${i.peso}:${i.molienda}`
}

export function agregar(items: Item[], nuevo: Item): Item[] {
  const k = clave(nuevo)
  const existe = items.find((i) => clave(i) === k)
  if (!existe) return [...items, { ...nuevo, cantidad: Math.min(MAX_POR_ITEM, nuevo.cantidad) }]
  return items.map((i) => (clave(i) === k ? { ...i, cantidad: Math.min(MAX_POR_ITEM, i.cantidad + nuevo.cantidad) } : i))
}

/** Suma o resta unidades; si llega a cero, el ítem sale del pedido. */
export function cambiarCantidad(items: Item[], k: string, delta: number): Item[] {
  return items
    .map((i) => (clave(i) === k ? { ...i, cantidad: Math.min(MAX_POR_ITEM, i.cantidad + delta) } : i))
    .filter((i) => i.cantidad > 0)
}

export function precioUnitario(i: Item): number {
  if (i.tipo === 'bebida') {
    const b = BEBIDAS.find((x) => x.id === i.id)
    if (!b) throw new Error(`Bebida desconocida: ${i.id}`)
    return b.precio
  }
  const o = ORIGENES.find((x) => x.id === i.origen)
  if (!o) throw new Error(`Café desconocido: ${i.origen}`)
  return precioGranos(o, i.peso)
}

export const subtotal = (i: Item) => precioUnitario(i) * i.cantidad
export const total = (items: Item[]) => items.reduce((s, i) => s + subtotal(i), 0)
export const unidades = (items: Item[]) => items.reduce((s, i) => s + i.cantidad, 0)

export function descripcion(i: Item): string {
  if (i.tipo === 'bebida') return BEBIDAS.find((x) => x.id === i.id)!.nombre
  const o = ORIGENES.find((x) => x.id === i.origen)!
  return `Granos ${o.pais} ${nombrePeso(i.peso)}, ${buscarMolienda(i.molienda).enPedido}`
}

// ---------- Retiro ----------
export const HORARIO = { abre: 8, cierra: 20 }
const PASO = 15 // minutos

export interface Franja {
  valor: string
  etiqueta: string
}

const dosDigitos = (n: number) => String(n).padStart(2, '0')

/**
 * Horarios de retiro de 15 en 15 minutos: desde 15 minutos después de ahora (o de la apertura)
 * hasta 15 minutos antes del cierre. Si hoy ya no llega, ofrece mañana.
 */
export function franjasRetiro(ahora: Date, cantidad = 8): Franja[] {
  const minutos = ahora.getHours() * 60 + ahora.getMinutes()
  const primero = Math.ceil((Math.max(minutos, HORARIO.abre * 60) + PASO) / PASO) * PASO
  const ultimo = HORARIO.cierra * 60 - PASO
  const hoy = primero <= ultimo
  const desde = hoy ? primero : HORARIO.abre * 60 + 2 * PASO
  const dia = hoy ? 'hoy' : 'mañana'
  const franjas: Franja[] = []
  for (let m = desde; m <= ultimo && franjas.length < cantidad; m += PASO) {
    const hora = `${dosDigitos(Math.floor(m / 60))}:${dosDigitos(m % 60)}`
    franjas.push({ valor: `${dia} ${hora}`, etiqueta: `${dia === 'hoy' ? 'Hoy' : 'Mañana'} a las ${hora}` })
  }
  return franjas
}

// ---------- Mensaje ----------
export function textoPedido(items: Item[], datos: { nombre: string; retiro: Franja; negocio: string }, formato: (n: number) => string): string {
  const lineas = items.map((i) => `• ${i.cantidad} × ${descripcion(i)}: ${formato(subtotal(i))}`)
  return [
    `Hola ${datos.negocio}, soy ${datos.nombre.trim()}. Quiero hacer un pedido para retirar ${datos.retiro.etiqueta.toLowerCase()}:`,
    '',
    ...lineas,
    '',
    `Total: ${formato(total(items))}`,
    'Pago al retirar. ¡Gracias!',
  ].join('\n')
}

export const WHATSAPP_MRK = '5491162474436'

/** Enlace para pedir una web así (el botón del final de la demo). */
export function enlaceContacto(negocio: string): string {
  const texto = `Hola, vi la demo de ${negocio} en la Vitrina y quiero una web así para mi cafetería.`
  return `https://wa.me/${WHATSAPP_MRK}?text=${encodeURIComponent(texto)}`
}
