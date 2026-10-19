// Lógica de Domingo (brunch en Chacarita): menú, combos y reservas de mesa. Sin DOM.

export type Zona = 'ventana' | 'salon' | 'patio' | 'barra'

export interface Mesa {
  id: string
  numero: number
  capacidad: 2 | 4 | 6
  zona: Zona
  /** Posición del centro en el plano (viewBox 0 0 640 420). */
  x: number
  y: number
  forma: 'redonda' | 'cuadrada' | 'larga'
}

export const ZONAS: Record<Zona, string> = {
  ventana: 'Ventana',
  salon: 'Salón',
  patio: 'Patio',
  barra: 'Barra',
}

export const MESAS: Mesa[] = [
  { id: 'v1', numero: 1, capacidad: 2, zona: 'ventana', x: 70, y: 70, forma: 'redonda' },
  { id: 'v2', numero: 2, capacidad: 2, zona: 'ventana', x: 160, y: 70, forma: 'redonda' },
  { id: 'v3', numero: 3, capacidad: 2, zona: 'ventana', x: 250, y: 70, forma: 'redonda' },
  { id: 'v4', numero: 4, capacidad: 4, zona: 'ventana', x: 355, y: 72, forma: 'cuadrada' },
  { id: 's5', numero: 5, capacidad: 4, zona: 'salon', x: 95, y: 195, forma: 'cuadrada' },
  { id: 's6', numero: 6, capacidad: 4, zona: 'salon', x: 215, y: 195, forma: 'cuadrada' },
  { id: 's7', numero: 7, capacidad: 6, zona: 'salon', x: 345, y: 200, forma: 'larga' },
  { id: 'p8', numero: 8, capacidad: 4, zona: 'patio', x: 535, y: 80, forma: 'redonda' },
  { id: 'p9', numero: 9, capacidad: 6, zona: 'patio', x: 535, y: 205, forma: 'larga' },
  { id: 'p10', numero: 10, capacidad: 2, zona: 'patio', x: 535, y: 330, forma: 'redonda' },
  { id: 'b11', numero: 11, capacidad: 2, zona: 'barra', x: 190, y: 330, forma: 'redonda' },
  { id: 'b12', numero: 12, capacidad: 2, zona: 'barra', x: 280, y: 330, forma: 'redonda' },
]

export const MAX_PERSONAS = 6

/** De 9:00 a 15:00 cada media hora. */
export const HORARIOS: string[] = Array.from({ length: 13 }, (_, i) => {
  const min = 9 * 60 + i * 30
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
})

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** 'YYYY-MM-DD' en hora local (sin sorpresas de zona horaria). */
export function aISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function deISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Los lunes no abrimos. */
export function estaCerrado(iso: string): boolean {
  return deISO(iso).getDay() === 1
}

export interface Dia {
  iso: string
  nombre: string
  corto: string
  numero: number
  mes: string
  cerrado: boolean
}

/** Los próximos `n` días a partir de hoy (incluido). */
export function proximosDias(hoy: Date, n = 7): Dia[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i)
    const iso = aISO(d)
    return {
      iso,
      nombre: i === 0 ? 'hoy' : i === 1 ? 'mañana' : DIAS[d.getDay()],
      corto: DIAS[d.getDay()].slice(0, 3),
      numero: d.getDate(),
      mes: MESES[d.getMonth()],
      cerrado: estaCerrado(iso),
    }
  })
}

export function nombreDia(iso: string): string {
  const d = deISO(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** Horarios que todavía se pueden reservar (hoy, con al menos 30 minutos de anticipación). */
export function horariosLibres(iso: string, ahora: Date): string[] {
  if (estaCerrado(iso)) return []
  const hoy = aISO(ahora)
  if (iso < hoy) return []
  if (iso > hoy) return [...HORARIOS]
  const limite = ahora.getHours() * 60 + ahora.getMinutes() + 30
  return HORARIOS.filter((h) => aMinutos(h) >= limite)
}

/** Una mesa sirve si entran todos y no sobran más de dos sillas (no damos la de 6 a una pareja). */
export function entra(mesa: Mesa, personas: number): boolean {
  return personas >= 1 && personas <= mesa.capacidad && mesa.capacidad - personas <= 2
}

export function hash(s: string): number {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function sembrado(semilla: number) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Qué tan lleno está el salón según la hora y el día: el fin de semana y el mediodía explotan. */
export function demanda(iso: string, hora: string): number {
  const dia = deISO(iso).getDay()
  const finde = dia === 0 || dia === 6
  const min = aMinutos(hora)
  const pico = min >= 10 * 60 + 30 && min <= 13 * 60 ? 0.25 : 0
  return Math.min(0.85, (finde ? 0.45 : 0.22) + pico)
}

/** Ocupación simulada: siempre la misma para el mismo día, horario y mesa. */
export function ocupada(mesa: Mesa, iso: string, hora: string): boolean {
  if (estaCerrado(iso)) return true
  return sembrado(hash(`${iso}|${hora}|${mesa.id}`))() < demanda(iso, hora)
}

export type Estado = 'libre' | 'ocupada' | 'no-entra'

export function estadoMesa(mesa: Mesa, iso: string, hora: string, personas: number): Estado {
  if (ocupada(mesa, iso, hora)) return 'ocupada'
  return entra(mesa, personas) ? 'libre' : 'no-entra'
}

export function mesasDisponibles(iso: string, hora: string, personas: number): Mesa[] {
  return MESAS.filter((m) => estadoMesa(m, iso, hora, personas) === 'libre')
}

const ALFABETO = 'ACDEFGHJKMNPQRTUVWXY34679' // sin 0/O, 1/I/L, 2/Z, 5/S, 8/B

/** Código de reserva: "DOM-" + 5 caracteres fáciles de dictar. */
export function codigoReserva(iso: string, hora: string, mesaId: string, personas: number): string {
  const r = sembrado(hash(`${iso}${hora}${mesaId}${personas}`))
  let c = ''
  for (let i = 0; i < 5; i++) c += ALFABETO[Math.floor(r() * ALFABETO.length)]
  return `DOM-${c}`
}

// ---------- Menú ----------

export type Tipo = 'dulce' | 'salado'

export interface Plato {
  id: string
  nombre: string
  detalle: string
  precio: number
  tipo: Tipo
  etiqueta?: string
}

export const PLATOS: Plato[] = [
  { id: 'medialunas', nombre: 'Medialunas de manteca', detalle: 'Hojaldradas acá, todas las mañanas. Precio por dos.', precio: 3200, tipo: 'dulce' },
  { id: 'pancakes', nombre: 'Pancakes de ricota', detalle: 'Tres pisos con frutos rojos, crema batida y miel de caña.', precio: 11900, tipo: 'dulce', etiqueta: 'La más pedida' },
  { id: 'french', nombre: 'French toast de brioche', detalle: 'Con dulce de leche, banana caramelizada y nueces.', precio: 12400, tipo: 'dulce' },
  { id: 'granola', nombre: 'Yogur con granola', detalle: 'Granola de la casa, fruta de estación y un hilo de miel.', precio: 7800, tipo: 'dulce', etiqueta: 'Veggie' },
  { id: 'budin', nombre: 'Budín de limón y amapola', detalle: 'Porción generosa con glasé de limón.', precio: 4900, tipo: 'dulce' },
  { id: 'cinnamon', nombre: 'Cinnamon roll', detalle: 'Masa madre, canela de Ceilán y frosting de queso crema.', precio: 5600, tipo: 'dulce' },
  { id: 'palta', nombre: 'Tostón de palta', detalle: 'Pan de masa madre, palta, huevo poché, semillas y lima.', precio: 12900, tipo: 'salado', etiqueta: 'Veggie' },
  { id: 'benedictinos', nombre: 'Huevos benedictinos', detalle: 'Muffin inglés, jamón crudo, holandesa y verdes.', precio: 14500, tipo: 'salado', etiqueta: 'La más pedida' },
  { id: 'shakshuka', nombre: 'Shakshuka', detalle: 'Huevos en salsa de tomate especiada, feta y pan tostado.', precio: 13800, tipo: 'salado' },
  { id: 'tostado', nombre: 'Tostado de miga XL', detalle: 'Jamón cocido natural y queso tybo, con ensalada.', precio: 9200, tipo: 'salado' },
  { id: 'revuelto', nombre: 'Revuelto cremoso', detalle: 'Huevos de campo, ciboulette, queso de cabra y masa madre.', precio: 10600, tipo: 'salado' },
  { id: 'bagel', nombre: 'Bagel de salmón', detalle: 'Salmón ahumado, queso crema, alcaparras y cebolla morada.', precio: 15900, tipo: 'salado' },
]

export const BEBIDAS: { nombre: string; precio: number }[] = [
  { nombre: 'Café de filtro', precio: 3500 },
  { nombre: 'Flat white', precio: 4600 },
  { nombre: 'Jugo de naranja exprimido', precio: 4900 },
  { nombre: 'Limonada con menta y jengibre', precio: 5200 },
]

export function platosDe(tipo: Tipo): Plato[] {
  return PLATOS.filter((p) => p.tipo === tipo)
}

export interface Combo {
  id: string
  nombre: string
  personas: number
  incluye: string[]
  /** Valor de lo que incluye si se pidiera suelto. */
  suelto: number
  precio: number
}

export const COMBOS: Combo[] = [
  {
    id: 'domingo2',
    nombre: 'Brunch Domingo para 2',
    personas: 2,
    incluye: ['2 cafés o flat whites', '2 jugos de naranja', 'Huevos benedictinos', 'Pancakes de ricota', 'Medialunas para compartir'],
    suelto: 2 * 4600 + 2 * 4900 + 14500 + 11900 + 3200,
    precio: 42900,
  },
  {
    id: 'dulce1',
    nombre: 'Mañana dulce',
    personas: 1,
    incluye: ['Flat white', 'French toast de brioche', 'Yogur con granola chico'],
    suelto: 4600 + 12400 + 5200,
    precio: 18900,
  },
  {
    id: 'salado1',
    nombre: 'Salado completo',
    personas: 1,
    incluye: ['Café de filtro', 'Jugo de naranja', 'Tostón de palta', 'Medialuna'],
    suelto: 3500 + 4900 + 12900 + 1600,
    precio: 19500,
  },
]

export function ahorro(c: Combo): number {
  return c.suelto - c.precio
}

export function porPersona(c: Combo): number {
  return Math.round(c.precio / c.personas / 100) * 100
}

export const HORARIO_SEMANA: { dias: string; horas: string; numeros: number[] }[] = [
  { dias: 'Martes a viernes', horas: '9 a 16 h', numeros: [2, 3, 4, 5] },
  { dias: 'Sábados, domingos y feriados', horas: '9 a 17 h', numeros: [6, 0] },
  { dias: 'Lunes', horas: 'Cerrado (descansamos)', numeros: [1] },
]
