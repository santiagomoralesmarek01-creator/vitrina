export type Restriccion = 'vegetariano' | 'sinTacc'

export const RESTRICCIONES: Record<Restriccion, { nombre: string; version: string }> = {
  vegetariano: { nombre: 'Vegetariano', version: 'vegetariana' },
  sinTacc: { nombre: 'Sin TACC', version: 'sin TACC' },
}

/** Claves de los dibujos de línea (ver dibujos.ts). */
export type Dibujo =
  | 'trigo'
  | 'mandioca'
  | 'esparrago'
  | 'trucha'
  | 'hinojo'
  | 'hongo'
  | 'menta'
  | 'calabaza'
  | 'queso'
  | 'frutilla'

export interface Vino {
  cepa: string
  bodega: string
  region: string
  /** Precio de la copa, en pesos. */
  precio: number
}

export interface Plato {
  id: string
  nombre: string
  detalle: string
  /** De dónde viene el producto principal. */
  origen: string
  dibujo: Dibujo
  /** Restricciones que este plato ya cumple. */
  aptoPara: Restriccion[]
  vino: Vino
}

export interface Paso {
  n: number
  momento: string
  plato: Plato
  /** Versiones para quien no puede comer el plato original. */
  alternativas: Plato[]
}

export interface PasoServido {
  n: number
  momento: string
  plato: Plato
  /** Plato que se reemplazó, si hubo cambio. */
  original: Plato | null
  /** Restricciones que obligaron al cambio (vacío si se sirve el original). */
  cambio: Restriccion[]
}

export const PRECIO_MENU = 85000
export const SENIA = 0.3
export const MIN_COMENSALES = 2
export const MAX_COMENSALES = 8
export const TURNOS = ['20:00', '22:30'] as const
export type Turno = (typeof TURNOS)[number]

const AMBAS: Restriccion[] = ['vegetariano', 'sinTacc']

export const MENU: Paso[] = [
  {
    n: 1,
    momento: 'Para empezar',
    plato: {
      id: 'pan',
      nombre: 'Pan de masa madre y manteca de campo',
      detalle: 'Trigo agroecológico molido a piedra, fermentación de 36 horas y manteca batida con sal de Salinas Grandes.',
      origen: 'Molino Ruta 5 · Pehuajó',
      dibujo: 'trigo',
      aptoPara: ['vegetariano'],
      vino: { cepa: 'Espumante brut nature', bodega: 'Cuvée Piedra Infinita', region: 'Tupungato', precio: 6500 },
    },
    alternativas: [
      {
        id: 'mandioca',
        nombre: 'Pan de mandioca y queso de cabra',
        detalle: 'Almidón de mandioca, queso de cabra estacionado y manteca de campo. Horneado aparte, sin harina de trigo.',
        origen: 'Cooperativa Ñandutí · Misiones',
        dibujo: 'mandioca',
        aptoPara: AMBAS,
        vino: { cepa: 'Espumante brut nature', bodega: 'Cuvée Piedra Infinita', region: 'Tupungato', precio: 6500 },
      },
    ],
  },
  {
    n: 2,
    momento: 'Huerta',
    plato: {
      id: 'esparragos',
      nombre: 'Espárragos, yema curada y avellanas',
      detalle: 'Espárragos verdes cosechados esa mañana, yema curada en sal y azúcar mascabo, avellanas tostadas.',
      origen: 'Huerta Las Tunas · Villa Elisa',
      dibujo: 'esparrago',
      aptoPara: AMBAS,
      vino: { cepa: 'Sauvignon blanc', bodega: 'Finca Los Arenales', region: 'Gualtallary', precio: 7200 },
    },
    alternativas: [],
  },
  {
    n: 3,
    momento: 'Río',
    plato: {
      id: 'trucha',
      nombre: 'Trucha del Limay, hinojo y suero de manteca',
      detalle: 'Trucha curada apenas veinte minutos, hinojo en tres texturas y un suero de manteca tibio con eneldo.',
      origen: 'Truchas del Limay · Río Negro',
      dibujo: 'trucha',
      aptoPara: ['sinTacc'],
      vino: { cepa: 'Chardonnay', bodega: 'Viento Sur', region: 'Alto Valle de Río Negro', precio: 7800 },
    },
    alternativas: [
      {
        id: 'hinojo',
        nombre: 'Hinojo asado, suero de manteca y eneldo',
        detalle: 'Hinojo entero asado en las brasas, su propio jugo reducido, suero de manteca y aceite de eneldo.',
        origen: 'Huerta Las Tunas · Villa Elisa',
        dibujo: 'hinojo',
        aptoPara: AMBAS,
        vino: { cepa: 'Chardonnay', bodega: 'Viento Sur', region: 'Alto Valle de Río Negro', precio: 7800 },
      },
    ],
  },
  {
    n: 4,
    momento: 'Bosque',
    plato: {
      id: 'hongos',
      nombre: 'Hongos de pino y polenta de maíz capia',
      detalle: 'Hongos de pino recolectados en Tandil, polenta cremosa de maíz capia y un caldo de sus propios tallos.',
      origen: 'Recolectores de la Sierra · Tandil',
      dibujo: 'hongo',
      aptoPara: AMBAS,
      vino: { cepa: 'Pinot noir', bodega: 'Bodega del Fin', region: 'Trevelin, Chubut', precio: 8400 },
    },
    alternativas: [],
  },
  {
    n: 5,
    momento: 'Fuego',
    plato: {
      id: 'cordero',
      nombre: 'Cordero patagónico, arvejas y menta',
      detalle: 'Paleta de cordero cocida doce horas, arvejas frescas, menta y un crocante de pan de centeno.',
      origen: 'Estancia La Querencia · Santa Cruz',
      dibujo: 'menta',
      aptoPara: [],
      vino: { cepa: 'Malbec de altura', bodega: 'Altos de Tolombón', region: 'Cafayate', precio: 9200 },
    },
    alternativas: [
      {
        id: 'cordero-sin-tacc',
        nombre: 'Cordero patagónico, arvejas y menta',
        detalle: 'Paleta de cordero cocida doce horas, arvejas frescas y menta. El crocante es de semillas de girasol.',
        origen: 'Estancia La Querencia · Santa Cruz',
        dibujo: 'menta',
        aptoPara: ['sinTacc'],
        vino: { cepa: 'Malbec de altura', bodega: 'Altos de Tolombón', region: 'Cafayate', precio: 9200 },
      },
      {
        id: 'calabaza',
        nombre: 'Calabaza asada a las brasas, arvejas y menta',
        detalle: 'Calabaza anco asada entera en las cenizas, arvejas frescas, menta y semillas de girasol tostadas.',
        origen: 'Chacra Doña Elba · Tandil',
        dibujo: 'calabaza',
        aptoPara: AMBAS,
        vino: { cepa: 'Garnacha', bodega: 'Paraje Viejo', region: 'Valle de Uco', precio: 8800 },
      },
    ],
  },
  {
    n: 6,
    momento: 'Tambo',
    plato: {
      id: 'quesos',
      nombre: 'Quesos de Tandil, miel de monte y centeno',
      detalle: 'Tres quesos de leche cruda de distintas edades, miel de monte santiagueño y galletas de centeno.',
      origen: 'Tambo La Paciencia · Tandil',
      dibujo: 'queso',
      aptoPara: ['vegetariano'],
      vino: { cepa: 'Cabernet franc', bodega: 'Finca Altamira', region: 'Paraje Altamira', precio: 8600 },
    },
    alternativas: [
      {
        id: 'quesos-sin-tacc',
        nombre: 'Quesos de Tandil, miel de monte y nueces',
        detalle: 'Tres quesos de leche cruda de distintas edades, miel de monte santiagueño y nueces tostadas.',
        origen: 'Tambo La Paciencia · Tandil',
        dibujo: 'queso',
        aptoPara: AMBAS,
        vino: { cepa: 'Cabernet franc', bodega: 'Finca Altamira', region: 'Paraje Altamira', precio: 8600 },
      },
    ],
  },
  {
    n: 7,
    momento: 'Final',
    plato: {
      id: 'frutillas',
      nombre: 'Frutillas de Coronda, leche de cabra y merengue',
      detalle: 'Frutillas de la primera cosecha, helado de leche de cabra y merengue seco con pimienta rosa.',
      origen: 'Quinta Los Fresnos · Coronda',
      dibujo: 'frutilla',
      aptoPara: AMBAS,
      vino: { cepa: 'Torrontés tardío', bodega: 'Valle Calchaquí', region: 'Salta', precio: 6900 },
    },
    alternativas: [],
  },
]

const cumple = (p: Plato, r: Restriccion[]) => r.every((x) => p.aptoPara.includes(x))

/** Los siete pasos tal como se sirven según las restricciones elegidas. */
export function pasosPara(restricciones: Restriccion[], menu: Paso[] = MENU): PasoServido[] {
  return menu.map((paso) => {
    if (cumple(paso.plato, restricciones)) return { n: paso.n, momento: paso.momento, plato: paso.plato, original: null, cambio: [] }
    // Primero la alternativa que cumple todo; entre varias, la que menos se aleja (menos restricciones extra).
    const alt = paso.alternativas
      .filter((p) => cumple(p, restricciones))
      .sort((a, b) => a.aptoPara.length - b.aptoPara.length)[0]
    if (!alt) throw new Error(`El paso ${paso.n} no tiene versión ${restricciones.map((r) => RESTRICCIONES[r].version).join(' y ')}`)
    return {
      n: paso.n,
      momento: paso.momento,
      plato: alt,
      original: paso.plato,
      cambio: restricciones.filter((r) => !paso.plato.aptoPara.includes(r)),
    }
  })
}

/** Suma de las siete copas. */
export function precioMaridaje(pasos: PasoServido[]): number {
  return pasos.reduce((s, p) => s + p.plato.vino.precio, 0)
}

export function clampComensales(n: number): number {
  if (!Number.isFinite(n)) return MIN_COMENSALES
  return Math.min(MAX_COMENSALES, Math.max(MIN_COMENSALES, Math.round(n)))
}

export interface Totales {
  menu: number
  maridaje: number
  porPersona: number
  comensales: number
  total: number
  senia: number
  saldo: number
}

export function totales(pasos: PasoServido[], maridaje: boolean, comensales: number): Totales {
  const c = clampComensales(comensales)
  const vino = maridaje ? precioMaridaje(pasos) : 0
  const porPersona = PRECIO_MENU + vino
  const total = porPersona * c
  const senia = Math.round(total * SENIA)
  return { menu: PRECIO_MENU, maridaje: vino, porPersona, comensales: c, total, senia, saldo: total - senia }
}

/** Lunes cerrado; domingo sólo el primer turno (cerramos temprano); el resto, los dos. */
export function turnosDelDia(fecha: Date): Turno[] {
  const dia = fecha.getDay()
  if (dia === 1) return []
  if (dia === 0) return ['20:00']
  return [...TURNOS]
}

export interface FechaReserva {
  iso: string
  fecha: Date
  turnos: Turno[]
}

const dosCifras = (n: number) => String(n).padStart(2, '0')
export const isoLocal = (d: Date) => `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`

/** Los próximos `dias` días a partir de mañana, con los turnos que se pueden reservar. */
export function proximasFechas(hoy: Date, dias = 14): FechaReserva[] {
  return Array.from({ length: dias }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i + 1)
    return { iso: isoLocal(fecha), fecha, turnos: turnosDelDia(fecha) }
  })
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export const diaCorto = (d: Date) => DIAS[d.getDay()]
export const mesCorto = (d: Date) => MESES[d.getMonth()]
/** "sábado 24 de octubre" */
export const fechaLarga = (d: Date) => `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}`

/** ¿Se puede reservar esa combinación? Devuelve el motivo si no. */
export function validarReserva(fecha: FechaReserva | undefined, turno: Turno | null, nombre: string): string | null {
  if (!fecha) return 'Elegí una fecha.'
  if (!fecha.turnos.length) return 'Ese día estamos cerrados.'
  if (!turno || !fecha.turnos.includes(turno)) return 'Elegí un turno disponible para ese día.'
  if (nombre.trim().length < 2) return 'Dejanos un nombre para la reserva.'
  return null
}
