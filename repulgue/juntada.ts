import { CON_CARNE, VEGETARIANOS } from './gustos'
import type { Bolsa } from './pedido'

export type Modo = 'principal' | 'picada'

/** Empanadas por persona según la ocasión. */
export const POR_PERSONA: Record<Modo, number> = { principal: 3, picada: 1.5 }
export const MAX_PERSONAS = 40

/** Peso de cada gusto dentro de su grupo: las clásicas salen más. */
const PESOS: Record<string, number> = {
  carne: 3,
  jyq: 3,
  pollo: 2,
  picante: 1,
  humita: 2,
  caprese: 2,
  espinaca: 1,
  cebolla: 1,
}

export interface Sugerencia {
  personas: number
  vegetarianos: number
  total: number
  docenas: number
  medias: number
  /** Cuántas tienen que ser vegetarianas sí o sí. */
  minimoVeggie: number
  reparto: Bolsa
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n) || 0))

/**
 * Reparte `n` empanadas entre `ids` proporcional a los pesos (método del resto mayor),
 * así la suma da exacto y los gustos con más salida reciben más.
 */
export function repartir(n: number, ids: string[]): Bolsa {
  const r: Bolsa = {}
  if (n <= 0 || ids.length === 0) return r
  const pesos = ids.map((id) => PESOS[id] ?? 1)
  const suma = pesos.reduce((s, p) => s + p, 0)
  const exactos = pesos.map((p) => (n * p) / suma)
  const base = exactos.map(Math.floor)
  let resto = n - base.reduce((s, x) => s + x, 0)
  const orden = exactos.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const { i } of orden) {
    if (resto === 0) break
    base[i]++
    resto--
  }
  ids.forEach((id, i) => {
    if (base[i] > 0) r[id] = base[i]
  })
  return r
}

/** Cuántas pedir para una juntada y cómo repartir los gustos. Redondea a medias docenas. */
export function calcular(personasIn: number, modo: Modo, vegetarianosIn: number): Sugerencia {
  const personas = clamp(personasIn, 0, MAX_PERSONAS)
  const vegetarianos = clamp(vegetarianosIn, 0, personas)
  const por = POR_PERSONA[modo]
  const justas = Math.ceil(personas * por)
  const total = justas === 0 ? 0 : Math.ceil(justas / 6) * 6
  const minimoVeggie = Math.ceil(vegetarianos * por)

  let veggie: number
  if (personas === vegetarianos) veggie = total
  else {
    // Lo que comen los vegetarianos, más un cuarto de lo que sobra para que haya variedad en la mesa.
    veggie = minimoVeggie + Math.round((total - minimoVeggie) * 0.25)
  }
  veggie = Math.min(total, veggie)

  const reparto = { ...repartir(veggie, VEGETARIANOS), ...repartir(total - veggie, CON_CARNE) }
  return {
    personas,
    vegetarianos,
    total,
    docenas: Math.floor(total / 12),
    medias: (total % 12) / 6,
    minimoVeggie,
    reparto,
  }
}

export function cantidadEnPalabras(s: Sugerencia): string {
  if (s.total === 0) return 'Nada todavía'
  const partes: string[] = []
  if (s.docenas) partes.push(`${s.docenas} ${s.docenas === 1 ? 'docena' : 'docenas'}`)
  if (s.medias) partes.push(s.docenas ? 'media' : 'media docena')
  return partes.join(' y ')
}
