// Fechas de retiro de las tortas enteras: 48 h de aviso, lunes y feriados cerrado. Sin DOM.

export const AVISO_HORAS = 48
export const SEMANAS_A_LA_VISTA = 5

/** Horarios de retiro por día de la semana (0 = domingo). Los lunes está cerrado. */
export const HORARIOS: Record<number, string[]> = {
  0: ['09:00', '12:00'],
  1: [],
  2: ['10:00', '13:00', '17:00', '19:00'],
  3: ['10:00', '13:00', '17:00', '19:00'],
  4: ['10:00', '13:00', '17:00', '19:00'],
  5: ['10:00', '13:00', '17:00', '19:00'],
  6: ['09:00', '12:00', '16:00', '19:00'],
}

/** Feriados en que el local no abre. */
export const FERIADOS: Record<string, string> = {
  '2026-11-23': 'Feriado de la Soberanía Nacional',
  '2026-12-08': 'Feriado de la Inmaculada Concepción',
  '2026-12-25': 'Navidad',
  '2027-01-01': 'Año Nuevo',
}

export type Estado = 'libre' | 'cerrado' | 'aviso' | 'pasado'

export interface Dia {
  clave: string
  fecha: Date
  estado: Estado
  /** Por qué no se puede elegir (para lectores de pantalla y el cartelito). */
  motivo: string
  /** Horarios de ese día que respetan las 48 h. */
  horarios: string[]
}

const dos = (n: number) => String(n).padStart(2, '0')

/** Fecha local → "2026-10-28". */
export const clave = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`

export function desdeClave(c: string, hora = '00:00'): Date {
  const [a, m, d] = c.split('-').map(Number)
  const [h, min] = hora.split(':').map(Number)
  return new Date(a, m - 1, d, h, min)
}

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** "sábado 31 de octubre" */
export function fechaLarga(c: string): string {
  const d = desdeClave(c)
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

/** "sábado 31 de octubre a las 17:00" */
export const retiroLargo = (c: string, hora: string) => `${fechaLarga(c)} a las ${hora}`

export function horariosDisponibles(c: string, ahora: Date): string[] {
  const limite = ahora.getTime() + AVISO_HORAS * 3600_000
  if (FERIADOS[c]) return []
  return (HORARIOS[desdeClave(c).getDay()] ?? []).filter((h) => desdeClave(c, h).getTime() >= limite)
}

export function dia(c: string, ahora: Date): Dia {
  const fecha = desdeClave(c)
  const base = { clave: c, fecha, horarios: [] as string[] }
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  if (fecha < hoy) return { ...base, estado: 'pasado', motivo: 'Ya pasó' }
  if (FERIADOS[c]) return { ...base, estado: 'cerrado', motivo: `Cerrado: ${FERIADOS[c]}` }
  if (!HORARIOS[fecha.getDay()]?.length) return { ...base, estado: 'cerrado', motivo: 'Los lunes está cerrado' }
  const horarios = horariosDisponibles(c, ahora)
  if (!horarios.length) return { ...base, estado: 'aviso', motivo: 'Necesitamos 48 h de aviso' }
  return { ...base, estado: 'libre', motivo: '', horarios }
}

export const sePuede = (c: string, hora: string, ahora: Date) => horariosDisponibles(c, ahora).includes(hora)

/**
 * Calendario de semanas completas, de lunes a domingo, desde la semana de hoy.
 * Los días anteriores a hoy vienen como "pasado".
 */
export function calendario(ahora: Date, semanas = SEMANAS_A_LA_VISTA): Dia[] {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7))
  return Array.from({ length: semanas * 7 }, (_, i) =>
    dia(clave(new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i)), ahora),
  )
}

/** El primer día y horario que se pueden elegir. */
export function primerRetiro(ahora: Date): { clave: string; hora: string } | null {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  for (let i = 0; i < 60; i++) {
    const c = clave(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i))
    const h = horariosDisponibles(c, ahora)
    if (h.length) return { clave: c, hora: h[0] }
  }
  return null
}
