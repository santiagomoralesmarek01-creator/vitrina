import { formatPesos } from '../shared/dinero'
import type { Etiqueta, Plato, Seccion } from './carta'

/** Cantidades por id de plato. */
export type Pedido = Record<string, number>

export function cambiarCantidad(pedido: Pedido, id: string, delta: number): Pedido {
  const cantidad = Math.max(0, Math.min(20, (pedido[id] ?? 0) + delta))
  const nuevo = { ...pedido }
  if (cantidad === 0) delete nuevo[id]
  else nuevo[id] = cantidad
  return nuevo
}

export function lineas(pedido: Pedido, platos: Plato[]) {
  return platos.filter((p) => pedido[p.id]).map((p) => ({ plato: p, cantidad: pedido[p.id], subtotal: p.precio * pedido[p.id] }))
}

export function resumen(pedido: Pedido, platos: Plato[]) {
  const ls = lineas(pedido, platos)
  return { unidades: ls.reduce((s, l) => s + l.cantidad, 0), total: ls.reduce((s, l) => s + l.subtotal, 0) }
}

/** Platos que cumplen TODOS los filtros activos. */
export function filtrar(secciones: Seccion[], filtros: Etiqueta[]): Seccion[] {
  return secciones.map((s) => ({ ...s, platos: s.platos.filter((p) => filtros.every((f) => p.etiquetas.includes(f))) }))
}

/** Texto para mandar el pedido por WhatsApp. */
export function mensaje(pedido: Pedido, platos: Plato[], mesa: string): string {
  const { total } = resumen(pedido, platos)
  const renglones = lineas(pedido, platos).map((l) => `• ${l.cantidad} × ${l.plato.nombre} — ${formatPesos(l.subtotal)}`)
  const cabecera = mesa.trim() ? `¡Hola! Pedido para la mesa ${mesa.trim()}:` : '¡Hola! Quiero hacer este pedido:'
  return [cabecera, ...renglones, `Total: ${formatPesos(total)}`].join('\n')
}
