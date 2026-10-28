// Granos para llevar: precio según peso y molienda según el método de cada uno.
import type { Origen } from './cafes'

export type Peso = 250 | 500 | 1000

export const PESOS: { peso: Peso; nombre: string; factor: number }[] = [
  { peso: 250, nombre: '250 g', factor: 1 },
  { peso: 500, nombre: '500 g', factor: 1.9 },
  { peso: 1000, nombre: '1 kg', factor: 3.6 },
]

export type Molienda = 'entero' | 'espresso' | 'moka' | 'v60' | 'prensa'

export interface TipoMolienda {
  id: Molienda
  nombre: string
  /** 0 = grano entero; de 1 (más fina) a 4 (más gruesa). */
  nivel: number
  /** Tamaño aproximado de la partícula, en micrones (0 para grano entero). */
  micrones: number
  parecido: string
  /** Cómo se nombra en el pedido. */
  enPedido: string
}

export const MOLIENDAS: TipoMolienda[] = [
  { id: 'entero', nombre: 'Grano entero', nivel: 0, micrones: 0, parecido: 'Lo molés en casa justo antes de prepararlo. Dura más fresco.', enPedido: 'en grano entero' },
  { id: 'espresso', nombre: 'Espresso', nivel: 1, micrones: 250, parecido: 'Fina, como azúcar impalpable.', enPedido: 'molido para espresso' },
  { id: 'moka', nombre: 'Moka (cafetera italiana)', nivel: 2, micrones: 450, parecido: 'Fina-media, como sal fina.', enPedido: 'molido para moka' },
  { id: 'v60', nombre: 'V60 y filtro', nivel: 3, micrones: 700, parecido: 'Media, como arena de playa.', enPedido: 'molido para V60' },
  { id: 'prensa', nombre: 'Prensa francesa', nivel: 4, micrones: 1000, parecido: 'Gruesa, como sal parrillera.', enPedido: 'molido para prensa francesa' },
]

/** Precio de la bolsa: los pesos grandes tienen descuento; redondeado a $100. */
export function precioGranos(origen: Pick<Origen, 'precio250'>, peso: Peso): number {
  const p = PESOS.find((x) => x.peso === peso)
  if (!p) throw new Error(`Peso desconocido: ${peso}`)
  return Math.round((origen.precio250 * p.factor) / 100) * 100
}

/** Cuánto se ahorra frente a llevar bolsas de 250 g. */
export function ahorro(origen: Pick<Origen, 'precio250'>, peso: Peso): number {
  return origen.precio250 * (peso / 250) - precioGranos(origen, peso)
}

export const nombrePeso = (peso: Peso) => PESOS.find((x) => x.peso === peso)!.nombre
export const buscarMolienda = (id: Molienda) => MOLIENDAS.find((m) => m.id === id)!
