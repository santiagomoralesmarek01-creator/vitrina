/** Horario del horno: martes a domingo, mediodía y noche. Una hornada cada 20 minutos. */
export interface Turno {
  desde: number // minutos desde las 0 h
  hasta: number
}

/** Índice = getDay() (0 domingo … 6 sábado). Lunes cerrado. */
export const TURNOS: Turno[][] = [
  [
    { desde: 11 * 60 + 30, hasta: 15 * 60 },
    { desde: 19 * 60, hasta: 23 * 60 + 30 },
  ],
  [],
  [
    { desde: 11 * 60 + 30, hasta: 15 * 60 },
    { desde: 19 * 60, hasta: 23 * 60 + 30 },
  ],
  [
    { desde: 11 * 60 + 30, hasta: 15 * 60 },
    { desde: 19 * 60, hasta: 23 * 60 + 30 },
  ],
  [
    { desde: 11 * 60 + 30, hasta: 15 * 60 },
    { desde: 19 * 60, hasta: 23 * 60 + 30 },
  ],
  [
    { desde: 11 * 60 + 30, hasta: 15 * 60 },
    { desde: 19 * 60, hasta: 24 * 60 },
  ],
  [
    { desde: 11 * 60 + 30, hasta: 15 * 60 },
    { desde: 19 * 60, hasta: 24 * 60 },
  ],
]

export const CADA = 20
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

export type EstadoHorno =
  | {
      abierto: true
      /** Minutos que faltan para la próxima hornada (0: está saliendo). */
      minutos: number
      hora: string
      /** De 0 a 1: cuánto de la hornada actual ya se horneó. */
      progreso: number
      /** Hasta qué hora se toman pedidos en este turno. */
      cierra: string
    }
  | { abierto: false; cuando: string; hora: string }

/** Hornadas del turno: a la hora de abrir y cada 20 minutos, la última antes de cerrar. */
export function hornadas(t: Turno): number[] {
  const r: number[] = []
  for (let m = t.desde; m < t.hasta; m += CADA) r.push(m)
  return r
}

export function estadoHorno(fecha: Date, turnos: Turno[][] = TURNOS): EstadoHorno {
  const dia = fecha.getDay()
  const ahora = fecha.getHours() * 60 + fecha.getMinutes() + fecha.getSeconds() / 60
  const actual = turnos[dia].find((t) => ahora >= t.desde && ahora < t.hasta)
  if (actual) {
    const lista = hornadas(actual)
    const proxima = lista.find((m) => m >= Math.floor(ahora)) ?? null
    if (proxima !== null) {
      const minutos = Math.max(0, Math.ceil(proxima - ahora))
      return {
        abierto: true,
        minutos,
        hora: hhmm(proxima),
        progreso: Math.min(1, Math.max(0, 1 - (proxima - ahora) / CADA)),
        cierra: hhmm(actual.hasta),
      }
    }
  }
  // Cerrado (o pasó la última hornada): buscamos el próximo turno.
  for (let d = 0; d < 8; d++) {
    const diaBuscado = (dia + d) % 7
    const turno = turnos[diaBuscado].find((t) => d > 0 || t.desde > ahora)
    if (turno) {
      const cuando = d === 0 ? 'hoy' : d === 1 ? 'mañana' : `el ${DIAS[diaBuscado]}`
      return { abierto: false, cuando, hora: hhmm(turno.desde) }
    }
  }
  return { abierto: false, cuando: 'pronto', hora: '' }
}

export function textoHorno(e: EstadoHorno): string {
  if (!e.abierto) return e.hora ? `Horno apagado. Prendemos ${e.cuando} a las ${e.hora}.` : 'Horno apagado.'
  if (e.minutos === 0) return `Sale una hornada ahora (${e.hora}).`
  return `Próxima hornada en ${e.minutos} min (${e.hora}).`
}
