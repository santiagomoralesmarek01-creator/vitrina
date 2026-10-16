export type Medio = 'colectivo' | 'auto' | 'app'

export const MEDIOS: Record<Medio, { nombre: string; porViaje: number; porKm: number; co2PorKm: number }> = {
  // Valores de referencia para el ejemplo.
  colectivo: { nombre: 'Colectivo', porViaje: 700, porKm: 0, co2PorKm: 0.08 },
  auto: { nombre: 'Auto', porViaje: 0, porKm: 260, co2PorKm: 0.17 },
  app: { nombre: 'Auto de aplicación', porViaje: 1200, porKm: 850, co2PorKm: 0.17 },
}

/** La bici gasta luz: unos pocos pesos por kilómetro. */
export const BICI_POR_KM = 4
export const SEMANAS_POR_MES = 4.33

export interface Calculo {
  actualMes: number
  biciMes: number
  ahorroMes: number
  co2Mes: number
  mesesParaPagarla: number | null
}

/** kmPorDia es ida y vuelta; se cuentan dos viajes por día. */
export function calcularAhorro(kmPorDia: number, diasPorSemana: number, medio: Medio, precioBici: number): Calculo {
  const dias = diasPorSemana * SEMANAS_POR_MES
  const m = MEDIOS[medio]
  const actualMes = Math.round(dias * (2 * m.porViaje + kmPorDia * m.porKm))
  const biciMes = Math.round(dias * kmPorDia * BICI_POR_KM)
  const ahorroMes = Math.max(0, actualMes - biciMes)
  return {
    actualMes,
    biciMes,
    ahorroMes,
    co2Mes: Math.round(dias * kmPorDia * m.co2PorKm),
    mesesParaPagarla: ahorroMes > 0 ? Math.ceil(precioBici / ahorroMes) : null,
  }
}

export const MODELOS = [
  { id: 'urbana', nombre: 'Volta Urbana', precio: 1_890_000, autonomia: 80, peso: 21, rueda: 28 },
  { id: 'plegable', nombre: 'Volta Plegable', precio: 1_590_000, autonomia: 55, peso: 17, rueda: 20 },
] as const

export const COLORES = [
  { id: 'neon', nombre: 'Neón', valor: '#c6ff3d' },
  { id: 'coral', nombre: 'Coral', valor: '#ff6b5b' },
  { id: 'hielo', nombre: 'Hielo', valor: '#7fd7ff' },
  { id: 'grafito', nombre: 'Grafito', valor: '#9aa0a6' },
] as const
