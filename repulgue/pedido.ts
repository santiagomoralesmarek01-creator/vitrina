import { GUSTOS } from './gustos'

export const NEGOCIO = 'Pellizco'
export const PRECIOS = { unidad: 1300, media: 7200, docena: 13500 } as const
export const MAX_BOLSA = 120

/** Envío con costo fijo, gratis desde cierto monto. */
export const ENVIO = { costo: 1800, gratisDesde: 27000 } as const

export type Bolsa = Record<string, number>

export const cantidadTotal = (b: Bolsa) => Object.values(b).reduce((s, n) => s + n, 0)

/** Suma o resta empanadas de un gusto sin bajar de cero ni pasar el tope de la bolsa. */
export function sumar(b: Bolsa, id: string, delta: number): Bolsa {
  const actual = b[id] ?? 0
  const libre = MAX_BOLSA - cantidadTotal(b)
  const nuevo = Math.max(0, actual + Math.min(delta, libre))
  const copia = { ...b, [id]: nuevo }
  if (nuevo === 0) delete copia[id]
  return copia
}

export interface Combinacion {
  docenas: number
  medias: number
  sueltas: number
  total: number
}

type Precios = { unidad: number; media: number; docena: number }

/**
 * La combinación más barata de docenas, medias docenas y sueltas para exactamente `n` empanadas.
 * Programación dinámica: no da por hecho que siempre conviene la caja más grande.
 */
export function mejorCombinacion(n: number, precios: Precios = PRECIOS): Combinacion {
  const cantidad = Math.max(0, Math.floor(n))
  const mejor: Combinacion[] = [{ docenas: 0, medias: 0, sueltas: 0, total: 0 }]
  const piezas = (c: Combinacion) => c.docenas + c.medias + c.sueltas
  for (let i = 1; i <= cantidad; i++) {
    const a = mejor[i - 1]
    const opciones: Combinacion[] = [{ ...a, sueltas: a.sueltas + 1, total: a.total + precios.unidad }]
    if (i >= 6) {
      const b = mejor[i - 6]
      opciones.push({ ...b, medias: b.medias + 1, total: b.total + precios.media })
    }
    if (i >= 12) {
      const c = mejor[i - 12]
      opciones.push({ ...c, docenas: c.docenas + 1, total: c.total + precios.docena })
    }
    // A igual precio, la de menos paquetes.
    opciones.sort((x, y) => x.total - y.total || piezas(x) - piezas(y))
    mejor.push(opciones[0])
  }
  return mejor[cantidad]
}

/** Si con unas pocas empanadas más pagás lo mismo o menos, conviene avisarlo. */
export function sugerencia(cantidad: number, precios: Precios = PRECIOS): { sumar: number; total: number } | null {
  if (cantidad <= 0) return null
  const actual = mejorCombinacion(cantidad, precios).total
  for (let m = cantidad + 1; m <= Math.min(cantidad + 3, MAX_BOLSA); m++) {
    const otra = mejorCombinacion(m, precios).total
    if (otra <= actual) return { sumar: m - cantidad, total: otra }
  }
  return null
}

/** Lo que te ahorrás contra comprarlas todas sueltas. */
export const ahorro = (cantidad: number) => cantidad * PRECIOS.unidad - mejorCombinacion(cantidad).total

export function desglose(c: Combinacion): string {
  const partes: string[] = []
  if (c.docenas) partes.push(`${c.docenas} ${c.docenas === 1 ? 'docena' : 'docenas'}`)
  if (c.medias) partes.push(`${c.medias} ${c.medias === 1 ? 'media docena' : 'medias docenas'}`)
  if (c.sueltas) partes.push(`${c.sueltas} ${c.sueltas === 1 ? 'suelta' : 'sueltas'}`)
  return partes.join(' + ')
}

export type Entrega = { tipo: 'retiro' } | { tipo: 'envio'; direccion: string }

export const costoEnvio = (e: Entrega, subtotal: number) =>
  e.tipo === 'retiro' || subtotal === 0 || subtotal >= ENVIO.gratisDesde ? 0 : ENVIO.costo

export interface Resumen {
  cantidad: number
  combinacion: Combinacion
  subtotal: number
  envio: number
  total: number
}

export function resumen(b: Bolsa, e: Entrega): Resumen {
  const cantidad = cantidadTotal(b)
  const combinacion = mejorCombinacion(cantidad)
  const envio = costoEnvio(e, combinacion.total)
  return { cantidad, combinacion, subtotal: combinacion.total, envio, total: combinacion.total + envio }
}

export const nombreValido = (n: string) => n.trim().length >= 2

export type ErrorPedido = 'vacia' | 'nombre' | 'direccion'

export function validar(b: Bolsa, nombre: string, e: Entrega): ErrorPedido | null {
  if (cantidadTotal(b) === 0) return 'vacia'
  if (!nombreValido(nombre)) return 'nombre'
  if (e.tipo === 'envio' && e.direccion.trim().length < 5) return 'direccion'
  return null
}

/** El texto que le llegaría al local por WhatsApp. */
export function textoPedido(b: Bolsa, nombre: string, e: Entrega, formato: (n: number) => string): string {
  const r = resumen(b, e)
  const lineas = GUSTOS.filter((g) => b[g.id]).map((g) => `• ${b[g.id]} × ${g.nombre}`)
  const como =
    e.tipo === 'envio'
      ? `Envío a ${e.direccion.trim()}: ${r.envio ? formato(r.envio) : 'gratis'}`
      : 'Paso a retirar por el local.'
  return [
    `¡Hola, ${NEGOCIO}! Soy ${nombre.trim()} y quiero pedir:`,
    ...lineas,
    `${r.cantidad} ${r.cantidad === 1 ? 'empanada' : 'empanadas'} (${desglose(r.combinacion)}): ${formato(r.subtotal)}`,
    como,
    `Total: ${formato(r.total)}`,
  ].join('\n')
}

// ---------- Contacto (demo de la Vitrina) ----------
export const WHATSAPP_MRK = '5491162474436'

export const enlaceContacto = () =>
  `https://wa.me/${WHATSAPP_MRK}?text=${encodeURIComponent(`Hola, vi la demo de ${NEGOCIO} en la Vitrina y quiero una web así para mi local.`)}`
