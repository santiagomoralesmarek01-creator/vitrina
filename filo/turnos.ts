export interface Servicio {
  id: string
  nombre: string
  detalle: string
  minutos: number
  precio: number
}

export interface Barbero {
  id: string
  nombre: string
  especialidad: string
  /** Días que trabaja: 0 domingo … 6 sábado. */
  dias: number[]
}

export const SERVICIOS: Servicio[] = [
  { id: 'corte', nombre: 'Corte', detalle: 'Lavado, corte y peinado.', minutos: 30, precio: 9000 },
  { id: 'barba', nombre: 'Barba', detalle: 'Perfilado con navaja y toalla caliente.', minutos: 30, precio: 6500 },
  { id: 'combo', nombre: 'Corte + barba', detalle: 'El combo completo.', minutos: 60, precio: 13500 },
  { id: 'color', nombre: 'Color', detalle: 'Tintura o decoloración. Incluye corte.', minutos: 90, precio: 24000 },
]

export const BARBEROS: Barbero[] = [
  { id: 'nico', nombre: 'Nico', especialidad: 'Fades y degradados', dias: [2, 3, 4, 5, 6] },
  { id: 'lean', nombre: 'Lean', especialidad: 'Barbas y navaja', dias: [2, 3, 4, 5, 6] },
  { id: 'majo', nombre: 'Majo', especialidad: 'Color y cortes largos', dias: [3, 4, 5, 6] },
]

export const APERTURA = 10 * 60
export const CIERRE = 20 * 60
export const BLOQUE = 30

export const minutosAHora = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const claveDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Abierto de martes a sábado. */
export const abierto = (d: Date) => d.getDay() >= 2 && d.getDay() <= 6

export function proximosDias(desde: Date, cantidad = 14): Date[] {
  return Array.from({ length: cantidad }, (_, i) => new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i))
}

function hash(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/**
 * Bloques de 30 minutos ya reservados para un barbero en un día. En una app real
 * vendrían de la base; acá se generan siempre iguales para que la demo sea creíble.
 */
export function ocupados(barbero: string, dia: Date, propios: Turno[] = []): Set<number> {
  const set = new Set<number>()
  let h = hash(barbero + claveDia(dia))
  for (let m = APERTURA; m < CIERRE; m += BLOQUE) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
    if (h % 100 < 38) set.add(m)
  }
  for (const t of propios) {
    if (t.barbero !== barbero || t.dia !== claveDia(dia)) continue
    for (let m = t.inicio; m < t.inicio + t.minutos; m += BLOQUE) set.add(m)
  }
  return set
}

export interface Horario {
  inicio: number
  /** Barbero que lo atiende; con "cualquiera" se elige el primero libre. */
  barbero: string | null
}

export function horarios(servicio: Servicio, barbero: string | 'cualquiera', dia: Date, ahora: Date, propios: Turno[] = []): Horario[] {
  const candidatos = (barbero === 'cualquiera' ? BARBEROS : BARBEROS.filter((b) => b.id === barbero)).filter((b) =>
    b.dias.includes(dia.getDay()),
  )
  const esHoy = claveDia(dia) === claveDia(ahora)
  const minutoActual = ahora.getHours() * 60 + ahora.getMinutes()
  const lista: Horario[] = []
  for (let inicio = APERTURA; inicio + servicio.minutos <= CIERRE; inicio += BLOQUE) {
    if (esHoy && inicio <= minutoActual + 30) continue
    const libre = candidatos.find((b) => {
      const oc = ocupados(b.id, dia, propios)
      for (let m = inicio; m < inicio + servicio.minutos; m += BLOQUE) if (oc.has(m)) return false
      return true
    })
    lista.push({ inicio, barbero: libre?.id ?? null })
  }
  return lista
}

export interface Turno {
  codigo: string
  servicio: string
  barbero: string
  dia: string
  inicio: number
  minutos: number
  nombre: string
}

/** Evento de calendario (.ics) para que el turno quede agendado en el celular. */
export function ics(t: Turno): string {
  const [a, m, d] = t.dia.split('-')
  const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}${String(min % 60).padStart(2, '0')}00`
  const servicio = SERVICIOS.find((s) => s.id === t.servicio)!.nombre
  const barbero = BARBEROS.find((b) => b.id === t.barbero)!.nombre
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Filo Barberia//Turnos//ES',
    'BEGIN:VEVENT',
    `UID:${t.codigo}@filo.barberia`,
    `DTSTART;TZID=America/Argentina/Buenos_Aires:${a}${m}${d}T${hora(t.inicio)}`,
    `DTEND;TZID=America/Argentina/Buenos_Aires:${a}${m}${d}T${hora(t.inicio + t.minutos)}`,
    `SUMMARY:${servicio} con ${barbero} en Filo`,
    'LOCATION:Filo Barbería\\, Av. Scalabrini Ortiz 1500\\, CABA',
    `DESCRIPTION:Código de turno ${t.codigo}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function codigo(rand = Math.random): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => letras[Math.floor(rand() * letras.length)]).join('')
}
