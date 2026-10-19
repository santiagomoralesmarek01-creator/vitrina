// Lógica de encargos de Miga: precios, límites, mensaje y fechas de retiro. Sin DOM.
import { formatPesos } from '../shared/dinero'

export interface Tamanio {
  porciones: number
  precio: number
  /** Cuántos pisos tiene la torta (para el dibujo). */
  pisos: number
  detalle: string
}

export const TAMANIOS: Tamanio[] = [
  { porciones: 10, precio: 42000, pisos: 1, detalle: '18 cm · un piso' },
  { porciones: 15, precio: 58000, pisos: 1, detalle: '22 cm · un piso alto' },
  { porciones: 20, precio: 76000, pisos: 2, detalle: 'Dos pisos' },
  { porciones: 30, precio: 108000, pisos: 3, detalle: 'Tres pisos' },
]

export interface Opcion {
  id: string
  nombre: string
  /** Recargo por porción, en pesos. */
  porPorcion: number
  color: string
  detalle?: string
}

export const BIZCOCHUELOS: Opcion[] = [
  { id: 'vainilla', nombre: 'Vainilla', porPorcion: 0, color: '#efd29b', detalle: 'Con chaucha de vainilla' },
  { id: 'chocolate', nombre: 'Chocolate', porPorcion: 0, color: '#6a3b29', detalle: 'Cacao amargo 70 %' },
  { id: 'redvelvet', nombre: 'Red velvet', porPorcion: 250, color: '#a3313c', detalle: 'Con suero de manteca' },
  { id: 'limon', nombre: 'Limón', porPorcion: 0, color: '#f1df8c', detalle: 'Ralladura y almíbar' },
]

export const RELLENOS: Opcion[] = [
  { id: 'ddl', nombre: 'Dulce de leche', porPorcion: 0, color: '#b0703a' },
  { id: 'frutillas', nombre: 'Crema y frutillas', porPorcion: 220, color: '#f7e2df' },
  { id: 'ganache', nombre: 'Ganache', porPorcion: 180, color: '#3b2119' },
  { id: 'lemoncurd', nombre: 'Lemon curd', porPorcion: 160, color: '#f0c541' },
  { id: 'frutosrojos', nombre: 'Mousse de frutos rojos', porPorcion: 260, color: '#c25472' },
  { id: 'pistacho', nombre: 'Crema de pistacho', porPorcion: 380, color: '#a9b96b' },
]

export const COBERTURAS: Opcion[] = [
  { id: 'merengue', nombre: 'Merengue italiano', porPorcion: 0, color: '#fbf4ea', detalle: 'Flameado a soplete' },
  { id: 'ganache', nombre: 'Ganache', porPorcion: 160, color: '#3a2019', detalle: 'Con chorreado' },
  { id: 'buttercream', nombre: 'Buttercream', porPorcion: 120, color: '#ecc4c1', detalle: 'Rosa empolvado' },
  { id: 'fondant', nombre: 'Fondant', porPorcion: 350, color: '#fffaf3', detalle: 'Liso, con perlas' },
]

export const MAX_RELLENOS = 2
export const MAX_MENSAJE = 24
export const PRECIO_MENSAJE = 2500

export interface Torta {
  porciones: number
  bizcochuelo: string
  rellenos: string[]
  cobertura: string
  mensaje: string
}

export const tortaInicial = (): Torta => ({
  porciones: 15,
  bizcochuelo: 'vainilla',
  rellenos: ['ddl'],
  cobertura: 'merengue',
  mensaje: '',
})

export const tamanio = (porciones: number): Tamanio => {
  const t = TAMANIOS.find((x) => x.porciones === porciones)
  if (!t) throw new Error(`No hacemos tortas de ${porciones} porciones`)
  return t
}

const buscar = (lista: Opcion[], id: string): Opcion => {
  const o = lista.find((x) => x.id === id)
  if (!o) throw new Error(`Opción desconocida: ${id}`)
  return o
}
export const bizcochuelo = (id: string) => buscar(BIZCOCHUELOS, id)
export const relleno = (id: string) => buscar(RELLENOS, id)
export const cobertura = (id: string) => buscar(COBERTURAS, id)

/** Suma o saca un relleno. Hasta dos, y al menos uno. */
export function alternarRelleno(t: Torta, id: string): Torta {
  relleno(id)
  if (t.rellenos.includes(id)) {
    if (t.rellenos.length === 1) throw new Error('La torta lleva al menos un relleno')
    return { ...t, rellenos: t.rellenos.filter((x) => x !== id) }
  }
  if (t.rellenos.length >= MAX_RELLENOS) throw new Error(`Podés combinar hasta ${MAX_RELLENOS} rellenos`)
  return { ...t, rellenos: [...t.rellenos, id] }
}

/** Junta espacios repetidos y corta en el máximo de caracteres (cuenta letras, no bytes). */
export function limpiarMensaje(s: string): string {
  return [...s.replace(/\s+/g, ' ').replace(/^ /, '')].slice(0, MAX_MENSAJE).join('')
}

export const largoMensaje = (s: string) => [...s].length

export const redondear = (n: number, a = 100) => Math.round(n / a) * a

/** Precio final: base del tamaño + recargos por porción + mensaje escrito. */
export function precio(t: Torta): number {
  const p = tamanio(t.porciones)
  const porPorcion =
    bizcochuelo(t.bizcochuelo).porPorcion +
    t.rellenos.reduce((s, id) => s + relleno(id).porPorcion, 0) +
    cobertura(t.cobertura).porPorcion
  const mensaje = t.mensaje.trim() ? PRECIO_MENSAJE : 0
  return redondear(p.precio + porPorcion * p.porciones + mensaje)
}

/** Seña del 50 %, redondeada hacia arriba a los $100. */
export const senia = (total: number) => Math.ceil(total / 2 / 100) * 100

export function descripcion(t: Torta): string {
  const rell = t.rellenos.map((id) => relleno(id).nombre.toLowerCase()).join(' y ')
  return `Torta de ${t.porciones} porciones, bizcochuelo de ${bizcochuelo(t.bizcochuelo).nombre.toLowerCase()}, relleno de ${rell} y cobertura de ${cobertura(t.cobertura).nombre.toLowerCase()}`
}

// ---------- Fechas de retiro ----------

export const ANTICIPACION_HORAS = 48
export const DIAS_A_LA_VISTA = 28

/** Horarios de retiro por día de la semana (0 = domingo). Los lunes está cerrado. */
export const HORARIOS: Record<number, string[]> = {
  0: ['10:00', '12:00'],
  1: [],
  2: ['10:00', '12:00', '16:00', '18:00'],
  3: ['10:00', '12:00', '16:00', '18:00'],
  4: ['10:00', '12:00', '16:00', '18:00'],
  5: ['10:00', '12:00', '16:00', '18:00'],
  6: ['10:00', '12:00', '16:00', '18:00'],
}

export type EstadoDia = 'libre' | 'cerrado' | 'anticipacion' | 'completo'

export interface Dia {
  clave: string
  fecha: Date
  estado: EstadoDia
  /** Horarios que todavía se pueden elegir ese día. */
  turnos: string[]
}

const dos = (n: number) => String(n).padStart(2, '0')

/** Fecha local → "2026-10-21". */
export const claveFecha = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`

export function desdeClave(clave: string, hora = '00:00'): Date {
  const [a, m, d] = clave.split('-').map(Number)
  const [h, min] = hora.split(':').map(Number)
  return new Date(a, m - 1, d, h, min)
}

/** Días con la agenda llena (simulado, siempre los mismos para una fecha dada). */
export function estaCompleto(clave: string): boolean {
  const h = [...clave].reduce((acc, c) => Math.imul(acc ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0
  return h % 5 === 0
}

/** Horarios de un día que respetan las 48 h de anticipación. */
export function turnosDisponibles(clave: string, ahora: Date): string[] {
  const fecha = desdeClave(clave)
  const limite = ahora.getTime() + ANTICIPACION_HORAS * 3600_000
  return (HORARIOS[fecha.getDay()] ?? []).filter((h) => desdeClave(clave, h).getTime() >= limite)
}

export function estadoDia(clave: string, ahora: Date): Dia {
  const fecha = desdeClave(clave)
  const base = { clave, fecha, turnos: [] as string[] }
  if (!HORARIOS[fecha.getDay()]?.length) return { ...base, estado: 'cerrado' }
  const turnos = turnosDisponibles(clave, ahora)
  if (!turnos.length) return { ...base, estado: 'anticipacion' }
  if (estaCompleto(clave)) return { ...base, estado: 'completo' }
  return { ...base, estado: 'libre', turnos }
}

/** Los próximos días a partir de hoy (incluido). */
export function proximosDias(ahora: Date, cantidad = DIAS_A_LA_VISTA): Dia[] {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  return Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i)
    return estadoDia(claveFecha(d), ahora)
  })
}

/** Grilla de calendario que arranca en lunes: huecos en null antes del primer día. */
export function grillaCalendario(dias: Dia[]): (Dia | null)[] {
  if (!dias.length) return []
  const huecos = (dias[0].fecha.getDay() + 6) % 7
  return [...Array<null>(huecos).fill(null), ...dias]
}

/** El primer día que se puede elegir, para sugerirlo. */
export const primerDiaLibre = (dias: Dia[]) => dias.find((d) => d.estado === 'libre')

export interface Retiro {
  clave: string | null
  hora: string | null
}

export function faltantes(retiro: Retiro): string[] {
  const f: string[] = []
  if (!retiro.clave) f.push('el día de retiro')
  if (!retiro.hora) f.push('el horario')
  return f
}

const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
export const fechaLegible = (clave: string) => fechaLarga.format(desdeClave(clave))

export const WHATSAPP = '5491150420000'

export function textoPedido(t: Torta, retiro: Retiro, nombre = ''): string {
  const total = precio(t)
  const lineas = [
    `¡Hola, Miga! ${nombre.trim() ? `Soy ${nombre.trim()} y q` : 'Q'}uiero encargar una torta:`,
    `• ${t.porciones} porciones (${tamanio(t.porciones).detalle.toLowerCase()})`,
    `• Bizcochuelo: ${bizcochuelo(t.bizcochuelo).nombre}`,
    `• Relleno: ${t.rellenos.map((id) => relleno(id).nombre).join(' + ')}`,
    `• Cobertura: ${cobertura(t.cobertura).nombre}`,
  ]
  if (t.mensaje.trim()) lineas.push(`• Mensaje: "${t.mensaje.trim()}"`)
  if (retiro.clave && retiro.hora) lineas.push(`• Retiro: ${fechaLegible(retiro.clave)} a las ${retiro.hora} h`)
  lineas.push(`Total: ${formatPesos(total)} · Seña (50 %): ${formatPesos(senia(total))}`)
  return lineas.join('\n')
}

export const enlaceWhatsApp = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`

// ---------- Tortas de la casa ----------

export interface TortaDeLaCasa extends Torta {
  id: string
  nombre: string
  detalle: string
  etiqueta?: string
}

export const DE_LA_CASA: TortaDeLaCasa[] = [
  {
    id: 'clasica',
    nombre: 'La de Caballito',
    detalle: 'Vainilla, mucho dulce de leche y merengue italiano flameado. La que pide el barrio.',
    etiqueta: 'La más pedida',
    porciones: 15,
    bizcochuelo: 'vainilla',
    rellenos: ['ddl'],
    cobertura: 'merengue',
    mensaje: '',
  },
  {
    id: 'lemon',
    nombre: 'Lemon pie alta',
    detalle: 'Bizcochuelo de limón, lemon curd casero y una nube de merengue tostado.',
    porciones: 15,
    bizcochuelo: 'limon',
    rellenos: ['lemoncurd'],
    cobertura: 'merengue',
    mensaje: '',
  },
  {
    id: 'velvet',
    nombre: 'Red velvet',
    detalle: 'Capas rojas, mousse de frutos rojos y buttercream rosa empolvado.',
    porciones: 20,
    bizcochuelo: 'redvelvet',
    rellenos: ['frutosrojos'],
    cobertura: 'buttercream',
    mensaje: '',
  },
  {
    id: 'negra',
    nombre: 'Chocolate negro',
    detalle: 'Chocolate al 70 %, ganache y dulce de leche, con chorreado brillante.',
    porciones: 10,
    bizcochuelo: 'chocolate',
    rellenos: ['ganache', 'ddl'],
    cobertura: 'ganache',
    mensaje: '',
  },
  {
    id: 'pistacho',
    nombre: 'Pistacho y frambuesa',
    detalle: 'Crema de pistacho siciliano con frutos rojos sobre vainilla.',
    etiqueta: 'Nueva',
    porciones: 20,
    bizcochuelo: 'vainilla',
    rellenos: ['pistacho', 'frutosrojos'],
    cobertura: 'buttercream',
    mensaje: '',
  },
  {
    id: 'blanca',
    nombre: 'Blanca de fiesta',
    detalle: 'Tres pisos de vainilla con crema y frutillas, vestida de fondant y perlas.',
    etiqueta: 'Casamientos',
    porciones: 30,
    bizcochuelo: 'vainilla',
    rellenos: ['frutillas', 'ddl'],
    cobertura: 'fondant',
    mensaje: '',
  },
]
