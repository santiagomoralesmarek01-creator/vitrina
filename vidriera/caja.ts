// La caja de masas finas: se llena pieza por pieza y se cierra con moño. Sin DOM.
import { masa } from './catalogo'

export type TamanioCaja = 6 | 12

export const TAMANIOS_CAJA: Record<TamanioCaja, { nombre: string; columnas: number; descuento: number }> = {
  6: { nombre: 'Caja de 6', columnas: 3, descuento: 0 },
  12: { nombre: 'Caja de 12', columnas: 4, descuento: 0.1 },
}

export interface Caja {
  tamanio: TamanioCaja
  /** Una entrada por masa, en el orden en que se acomodaron. */
  piezas: string[]
}

export const cajaVacia = (tamanio: TamanioCaja = 6): Caja => ({ tamanio, piezas: [] })

export const faltan = (c: Caja) => c.tamanio - c.piezas.length
export const completa = (c: Caja) => faltan(c) === 0
export const cuantas = (c: Caja, id: string) => c.piezas.filter((x) => x === id).length

export function sumar(c: Caja, id: string): Caja {
  masa(id)
  if (completa(c)) throw new Error(`La caja ya tiene sus ${c.tamanio} masas`)
  return { ...c, piezas: [...c.piezas, id] }
}

/** Saca la pieza de un lugar de la caja (las de atrás se corren un lugar). */
export function quitarLugar(c: Caja, lugar: number): Caja {
  if (lugar < 0 || lugar >= c.piezas.length) return c
  return { ...c, piezas: c.piezas.filter((_, i) => i !== lugar) }
}

/** Saca la última masa de ese tipo que se acomodó. */
export function quitar(c: Caja, id: string): Caja {
  const i = c.piezas.lastIndexOf(id)
  return i < 0 ? c : quitarLugar(c, i)
}

/** Cambiar de tamaño conserva lo que entra; si la caja nueva es más chica, sobran las últimas. */
export function cambiarTamanio(c: Caja, tamanio: TamanioCaja): Caja {
  return { tamanio, piezas: c.piezas.slice(0, tamanio) }
}

/** Completa los lugares vacíos repartiendo de la selección de la casa, en orden. */
export function surtida(c: Caja, ids: string[]): Caja {
  let r = c
  let i = 0
  while (!completa(r) && ids.length) r = sumar(r, ids[i++ % ids.length])
  return r
}

export const subtotal = (c: Caja) => c.piezas.reduce((s, id) => s + masa(id).precio, 0)

/** La caja de 12 completa tiene 10 % menos, redondeado a $100. */
export function precioCaja(c: Caja): number {
  const desc = completa(c) ? TAMANIOS_CAJA[c.tamanio].descuento : 0
  return Math.round((subtotal(c) * (1 - desc)) / 100) * 100
}

export const ahorro = (c: Caja) => subtotal(c) - precioCaja(c)

/** Fila y columna (desde 0) de cada lugar de la caja. */
export function lugar(c: Caja, i: number): { fila: number; columna: number } {
  const col = TAMANIOS_CAJA[c.tamanio].columnas
  return { fila: Math.floor(i / col), columna: i % col }
}

/** "3 cañoncitos, 2 macarons de frambuesa…" agrupado en el orden en que aparecen. */
export function contenido(c: Caja): { id: string; cantidad: number }[] {
  const orden: string[] = []
  for (const id of c.piezas) if (!orden.includes(id)) orden.push(id)
  return orden.map((id) => ({ id, cantidad: cuantas(c, id) }))
}
