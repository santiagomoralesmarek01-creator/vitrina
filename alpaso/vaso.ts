// Lógica de Al Paso: armado de la bebida, capas del vaso, precios, pedido y franjas de retiro. Sin DOM.
import { formatPesos } from '../shared/dinero'

export const NEGOCIO = 'Al Paso'

export type BaseId = 'espresso' | 'coldbrew' | 'matcha' | 'chocolate' | 'chai'
export type TamanioId = 'chico' | 'mediano' | 'grande'
export type LecheId = 'sin' | 'entera' | 'descremada' | 'avena' | 'almendras'
export type JarabeId = 'ninguno' | 'vainilla' | 'caramelo' | 'avellana' | 'ddl'
export type ExtraId = 'crema' | 'canela' | 'hielo'

export interface Base {
  id: BaseId
  nombre: string
  detalle: string
  /** Suplemento sobre el precio del tamaño. */
  precio: number
  color: string
  /** Color del relleno cuando va sin leche (agua sobre la base). */
  colorAgua: string
  /** Shots que trae sin cobrar de más. */
  shotsIncluidos: number
  shotsMin: number
  shotsMax: number
  /** Siempre va con hielo. */
  siempreFrio: boolean
  /** Parte del vaso que ocupa la base (con leche / sin leche). Para el espresso cuentan los shots. */
  fraccion: { conLeche: number; sinLeche: number } | null
}

export const BASES: Base[] = [
  { id: 'espresso', nombre: 'Espresso', detalle: 'Blend de la casa, tueste medio', precio: 0, color: '#3a1d10', colorAgua: '#6e3d1f', shotsIncluidos: 2, shotsMin: 1, shotsMax: 4, siempreFrio: false, fraccion: null },
  { id: 'coldbrew', nombre: 'Cold brew', detalle: '18 horas en frío', precio: 600, color: '#4a2511', colorAgua: '#4a2511', shotsIncluidos: 0, shotsMin: 0, shotsMax: 2, siempreFrio: true, fraccion: { conLeche: 0.45, sinLeche: 1 } },
  { id: 'matcha', nombre: 'Matcha', detalle: 'Ceremonial, batido a mano', precio: 900, color: '#6da834', colorAgua: '#9cc95a', shotsIncluidos: 0, shotsMin: 0, shotsMax: 2, siempreFrio: false, fraccion: { conLeche: 0.2, sinLeche: 0.2 } },
  { id: 'chocolate', nombre: 'Chocolate', detalle: 'Cacao amargo 70 %', precio: 500, color: '#5b2c17', colorAgua: '#7a4126', shotsIncluidos: 0, shotsMin: 0, shotsMax: 2, siempreFrio: false, fraccion: { conLeche: 0.28, sinLeche: 0.28 } },
  { id: 'chai', nombre: 'Té chai', detalle: 'Especiado, con jengibre', precio: 700, color: '#b8742f', colorAgua: '#cf9452', shotsIncluidos: 0, shotsMin: 0, shotsMax: 2, siempreFrio: false, fraccion: { conLeche: 0.3, sinLeche: 0.3 } },
]

export interface Tamanio {
  id: TamanioId
  nombre: string
  ml: number
  precio: number
  /** Escala del dibujo del vaso (el grande es 1). */
  escala: number
}

export const TAMANIOS: Tamanio[] = [
  { id: 'chico', nombre: 'Chico', ml: 240, precio: 3000, escala: 0.74 },
  { id: 'mediano', nombre: 'Mediano', ml: 360, precio: 3600, escala: 0.87 },
  { id: 'grande', nombre: 'Grande', ml: 480, precio: 4200, escala: 1 },
]

export interface Opcion<T extends string> {
  id: T
  nombre: string
  precio: number
  color: string
}

export const LECHES: Opcion<LecheId>[] = [
  { id: 'sin', nombre: 'Sin leche', precio: 0, color: '' },
  { id: 'entera', nombre: 'Entera', precio: 0, color: '#f4e7d3' },
  { id: 'descremada', nombre: 'Descremada', precio: 0, color: '#eceeea' },
  { id: 'avena', nombre: 'Avena', precio: 600, color: '#e8d1a8' },
  { id: 'almendras', nombre: 'Almendras', precio: 800, color: '#efdcc2' },
]

export const JARABES: Opcion<JarabeId>[] = [
  { id: 'ninguno', nombre: 'Sin jarabe', precio: 0, color: '' },
  { id: 'vainilla', nombre: 'Vainilla', precio: 500, color: '#f2c95c' },
  { id: 'caramelo', nombre: 'Caramelo', precio: 500, color: '#d98b2b' },
  { id: 'avellana', nombre: 'Avellana', precio: 500, color: '#a8692f' },
  { id: 'ddl', nombre: 'Dulce de leche', precio: 600, color: '#b5651d' },
]

export const EXTRAS: Opcion<ExtraId>[] = [
  { id: 'crema', nombre: 'Crema', precio: 700, color: '#fffaf1' },
  { id: 'canela', nombre: 'Canela', precio: 200, color: '#9b5a2a' },
  { id: 'hielo', nombre: 'Hielo', precio: 0, color: '' },
]

export const PRECIO_SHOT = 700
export const ML_SHOT = 30
export const ML_JARABE = 15
/** Hasta dónde se llena el vaso (el resto queda para la tapa). */
export const LLENO = 0.92
export const ALTO_ESPUMA = 0.1
export const ALTO_CREMA = 0.12

export interface Bebida {
  base: BaseId
  tamanio: TamanioId
  shots: number
  leche: LecheId
  jarabe: JarabeId
  extras: ExtraId[]
}

const porId = <T extends { id: string }>(lista: T[], id: string): T => {
  const x = lista.find((o) => o.id === id)
  if (!x) throw new Error(`Opción desconocida: ${id}`)
  return x
}
export const base = (b: Bebida) => porId(BASES, b.base)
export const tamanio = (b: Bebida) => porId(TAMANIOS, b.tamanio)
export const leche = (b: Bebida) => porId(LECHES, b.leche)
export const jarabe = (b: Bebida) => porId(JARABES, b.jarabe)

const ORDEN_EXTRAS: ExtraId[] = ['crema', 'canela', 'hielo']

/** Deja la bebida en un estado válido: shots dentro del rango, extras sin repetir y el cold brew con hielo. */
export function normalizar(b: Bebida): Bebida {
  const bs = base(b)
  tamanio(b)
  leche(b)
  jarabe(b)
  const shots = Math.min(bs.shotsMax, Math.max(bs.shotsMin, Math.round(b.shots) || 0))
  const extras = new Set(b.extras.filter((e) => ORDEN_EXTRAS.includes(e)))
  if (bs.siempreFrio) extras.add('hielo')
  return { ...b, shots, extras: ORDEN_EXTRAS.filter((e) => extras.has(e)) }
}

export const bebidaInicial = (): Bebida => ({ base: 'espresso', tamanio: 'mediano', shots: 2, leche: 'entera', jarabe: 'ninguno', extras: [] })

/** Cambiar de base vuelve los shots a los que trae esa base. */
export function cambiarBase(b: Bebida, id: BaseId): Bebida {
  const nueva = porId(BASES, id)
  const extras = base(b).siempreFrio && !nueva.siempreFrio ? b.extras.filter((e) => e !== 'hielo') : b.extras
  return normalizar({ ...b, base: id, shots: nueva.shotsIncluidos, extras })
}

export function cambiarShots(b: Bebida, delta: number): Bebida {
  return normalizar({ ...b, shots: b.shots + delta })
}

export function alternarExtra(b: Bebida, id: ExtraId): Bebida {
  if (id === 'hielo' && base(b).siempreFrio) return normalizar(b)
  const extras = b.extras.includes(id) ? b.extras.filter((e) => e !== id) : [...b.extras, id]
  return normalizar({ ...b, extras })
}

export const esFrio = (b: Bebida) => base(b).siempreFrio || b.extras.includes('hielo')
export const tieneEspuma = (b: Bebida) => b.leche !== 'sin' && !esFrio(b)

export function precio(b: Bebida): number {
  const bs = base(b)
  const extras = b.extras.reduce((s, e) => s + porId(EXTRAS, e).precio, 0)
  return tamanio(b).precio + bs.precio + Math.max(0, b.shots - bs.shotsIncluidos) * PRECIO_SHOT + leche(b).precio + jarabe(b).precio + extras
}

// ---------- Capas del vaso ----------
export type CapaId = 'jarabe' | 'base' | 'shots' | 'relleno' | 'espuma' | 'crema'

export interface Capa {
  id: CapaId
  nombre: string
  color: string
  /** Desde dónde empieza, en fracción del alto del vaso (0 = fondo). */
  desde: number
  /** Alto en fracción del vaso. */
  alto: number
}

const r3 = (n: number) => Math.round(n * 1000) / 1000

/** Capas de abajo hacia arriba, con la altura proporcional al volumen de cada parte. */
export function capas(b: Bebida): Capa[] {
  const bs = base(b)
  const ml = tamanio(b).ml
  const frio = esFrio(b)
  const conLeche = b.leche !== 'sin'
  const arriba = (tieneEspuma(b) ? ALTO_ESPUMA : 0) + (b.extras.includes('crema') ? ALTO_CREMA : 0)
  const liquido = LLENO - arriba

  const altoJarabe = b.jarabe === 'ninguno' ? 0 : ML_JARABE / ml
  const altoShots = (b.shots * ML_SHOT) / ml
  let altoBase: number
  let altoExtraShots = 0
  if (bs.fraccion === null) {
    altoBase = altoShots
  } else {
    altoExtraShots = altoShots
    const f = conLeche ? bs.fraccion.conLeche : bs.fraccion.sinLeche
    altoBase = Math.min(f * liquido, liquido - altoJarabe - altoExtraShots)
  }
  const altoRelleno = Math.max(0, liquido - altoJarabe - altoBase - altoExtraShots)

  const temp = frio ? 'fría' : 'caliente'
  const lista: Omit<Capa, 'desde'>[] = [
    { id: 'jarabe', nombre: `Jarabe de ${jarabe(b).nombre.toLowerCase()}`, color: jarabe(b).color, alto: altoJarabe },
    { id: 'base', nombre: bs.fraccion === null ? `Espresso (${b.shots} ${b.shots === 1 ? 'shot' : 'shots'})` : bs.nombre, color: bs.color, alto: altoBase },
    { id: 'shots', nombre: `${b.shots} ${b.shots === 1 ? 'shot' : 'shots'} de espresso`, color: BASES[0].color, alto: altoExtraShots },
    { id: 'relleno', nombre: conLeche ? `Leche ${leche(b).nombre.toLowerCase()}` : `Agua ${temp}`, color: conLeche ? leche(b).color : bs.colorAgua, alto: altoRelleno },
    { id: 'espuma', nombre: 'Espuma', color: '#fbf4ea', alto: tieneEspuma(b) ? ALTO_ESPUMA : 0 },
    { id: 'crema', nombre: 'Crema', color: '#fffdf8', alto: b.extras.includes('crema') ? ALTO_CREMA : 0 },
  ]
  let desde = 0
  const out: Capa[] = []
  for (const c of lista) {
    if (c.alto <= 0.0001) continue
    out.push({ ...c, desde: r3(desde), alto: r3(c.alto) })
    desde += c.alto
  }
  return out
}

/** Cuántos cubitos se ven según el tamaño (0 si va caliente). */
export const cubitos = (b: Bebida) => (esFrio(b) ? { chico: 3, mediano: 4, grande: 5 }[b.tamanio] : 0)

// ---------- Nombres y descripción ----------
export function nombreBebida(b: Bebida): string {
  const frio = esFrio(b)
  const conLeche = b.leche !== 'sin'
  switch (b.base) {
    case 'espresso':
      if (!conLeche) return frio ? 'Americano helado' : 'Americano'
      if (b.tamanio === 'chico' && b.shots <= 1 && !frio) return 'Cortado'
      return frio ? 'Latte helado' : 'Latte'
    case 'coldbrew':
      return conLeche ? 'Cold brew con leche' : 'Cold brew'
    case 'matcha':
      return `${conLeche ? 'Matcha latte' : 'Matcha'}${frio ? ' helado' : ''}`
    case 'chocolate':
      return frio ? 'Chocolate frío' : 'Chocolate caliente'
    case 'chai':
      return `${b.shots > 0 ? 'Dirty chai' : conLeche ? 'Chai latte' : 'Té chai'}${frio ? ' helado' : ''}`
  }
}

const lista = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

/** "mediano · 2 shots · leche de avena · vainilla · con crema y canela" */
export function describir(b: Bebida): string {
  const partes = [tamanio(b).nombre.toLowerCase()]
  if (b.shots > 0) partes.push(`${b.shots} ${b.shots === 1 ? 'shot' : 'shots'}`)
  partes.push(b.leche === 'sin' ? 'sin leche' : `leche ${b.leche === 'avena' || b.leche === 'almendras' ? 'de ' : ''}${leche(b).nombre.toLowerCase()}`)
  if (b.jarabe !== 'ninguno') partes.push(`jarabe de ${jarabe(b).nombre.toLowerCase()}`)
  const con = b.extras.filter((e) => e !== 'hielo').map((e) => porId(EXTRAS, e).nombre.toLowerCase())
  if (con.length) partes.push(`con ${lista(con)}`)
  if (esFrio(b)) partes.push('con hielo')
  return partes.join(' · ')
}

export const mismaBebida = (a: Bebida, b: Bebida) => JSON.stringify(normalizar(a)) === JSON.stringify(normalizar(b))

// ---------- Las de la casa ----------
export interface DeLaCasa {
  id: string
  nombre: string
  detalle: string
  bebida: Bebida
}

export const DE_LA_CASA: DeLaCasa[] = [
  { id: 'cortado', nombre: 'Cortado de parado', detalle: 'Un shot, poca leche, cero vueltas. Para tomar en la barra.', bebida: { base: 'espresso', tamanio: 'chico', shots: 1, leche: 'entera', jarabe: 'ninguno', extras: [] } },
  { id: 'avena', nombre: 'Avena y vainilla', detalle: 'Latte con leche de avena y un toque de vainilla. El más pedido.', bebida: { base: 'espresso', tamanio: 'mediano', shots: 2, leche: 'avena', jarabe: 'vainilla', extras: [] } },
  { id: 'bondi', nombre: 'Cold brew del bondi', detalle: 'Grande, negro y con hielo. Aguanta todo el viaje.', bebida: { base: 'coldbrew', tamanio: 'grande', shots: 0, leche: 'sin', jarabe: 'ninguno', extras: ['hielo'] } },
  { id: 'semaforo', nombre: 'Verde semáforo', detalle: 'Matcha helado con leche de almendras. Arrancás cuando cambia.', bebida: { base: 'matcha', tamanio: 'mediano', shots: 0, leche: 'almendras', jarabe: 'ninguno', extras: ['hielo'] } },
  { id: 'dirty', nombre: 'Dirty chai', detalle: 'Chai especiado con un shot de espresso y canela arriba.', bebida: { base: 'chai', tamanio: 'mediano', shots: 1, leche: 'entera', jarabe: 'ninguno', extras: ['canela'] } },
  { id: 'todo', nombre: 'Choco con todo', detalle: 'Chocolate, dulce de leche, crema y canela. Sin culpa.', bebida: { base: 'chocolate', tamanio: 'grande', shots: 0, leche: 'entera', jarabe: 'ddl', extras: ['crema', 'canela'] } },
]

export const deLaCasa = (b: Bebida) => DE_LA_CASA.find((d) => mismaBebida(d.bebida, b))

// ---------- Para acompañar ----------
export interface Acompaniamiento {
  id: string
  nombre: string
  detalle: string
  precio: number
}

export const ACOMPANIAMIENTOS: Acompaniamiento[] = [
  { id: 'medialunas', nombre: 'Dos medialunas', detalle: 'De manteca, recién horneadas', precio: 2200 },
  { id: 'alfajor', nombre: 'Alfajor de maicena', detalle: 'Con dulce de leche y coco', precio: 1600 },
  { id: 'cookie', nombre: 'Cookie gigante', detalle: 'Chocolate amargo y sal', precio: 2000 },
  { id: 'budin', nombre: 'Budín de limón', detalle: 'Porción con glaseado', precio: 2400 },
  { id: 'tostado', nombre: 'Tostado de miga', detalle: 'Jamón y queso, calentito', precio: 4300 },
]

// ---------- Pedido ----------
export type Item =
  | { tipo: 'bebida'; bebida: Bebida; cantidad: number }
  | { tipo: 'acomp'; id: string; cantidad: number }

export const MAX_CANTIDAD = 9

export function agregarBebida(items: Item[], b: Bebida): Item[] {
  const n = normalizar(b)
  const i = items.findIndex((it) => it.tipo === 'bebida' && mismaBebida(it.bebida, n))
  if (i >= 0) return cambiarCantidad(items, i, 1)
  return [...items, { tipo: 'bebida', bebida: n, cantidad: 1 }]
}

export function agregarAcomp(items: Item[], id: string): Item[] {
  porId(ACOMPANIAMIENTOS, id)
  const i = items.findIndex((it) => it.tipo === 'acomp' && it.id === id)
  if (i >= 0) return cambiarCantidad(items, i, 1)
  return [...items, { tipo: 'acomp', id, cantidad: 1 }]
}

/** Suma o resta; si llega a 0 lo saca del pedido. */
export function cambiarCantidad(items: Item[], indice: number, delta: number): Item[] {
  return items
    .map((it, i) => (i === indice ? { ...it, cantidad: Math.min(MAX_CANTIDAD, it.cantidad + delta) } : it))
    .filter((it) => it.cantidad > 0)
}

export const precioUnitario = (it: Item) => (it.tipo === 'bebida' ? precio(it.bebida) : porId(ACOMPANIAMIENTOS, it.id).precio)
export const subtotal = (it: Item) => precioUnitario(it) * it.cantidad
export const totalPedido = (items: Item[]) => items.reduce((s, it) => s + subtotal(it), 0)
export const cantidadTotal = (items: Item[]) => items.reduce((s, it) => s + it.cantidad, 0)

export function nombreItem(it: Item): string {
  if (it.tipo === 'acomp') return porId(ACOMPANIAMIENTOS, it.id).nombre
  const casa = deLaCasa(it.bebida)
  return casa ? casa.nombre : `${nombreBebida(it.bebida)} ${tamanio(it.bebida).nombre.toLowerCase()}`
}

export const detalleItem = (it: Item) => (it.tipo === 'acomp' ? porId(ACOMPANIAMIENTOS, it.id).detalle : describir(it.bebida))

// ---------- Retiro ----------
export const ABRE = 7 * 60
export const CIERRA = 21 * 60
export const DEMORA = 10

export interface Franja {
  id: string
  etiqueta: string
  detalle: string
}

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** "Lo antes posible" (si está abierto) y las próximas franjas de 15 minutos hasta el cierre. */
export function franjasRetiro(ahora: Date, cuantas = 4): Franja[] {
  const min = ahora.getHours() * 60 + ahora.getMinutes()
  const abierto = min >= ABRE && min < CIERRA - DEMORA
  if (abierto) {
    const out: Franja[] = [{ id: 'ya', etiqueta: 'Lo antes posible', detalle: `Listo en ${DEMORA} min` }]
    let t = Math.ceil((min + DEMORA + 10) / 15) * 15
    while (out.length <= cuantas && t <= CIERRA) {
      out.push({ id: hhmm(t), etiqueta: hhmm(t), detalle: `Entre ${hhmm(t)} y ${hhmm(t + 10)}` })
      t += 15
    }
    return out
  }
  const manana = min >= CIERRA - DEMORA
  return Array.from({ length: cuantas }, (_, i) => {
    const t = ABRE + 30 + i * 15
    return { id: `${manana ? 'm' : 'h'}${hhmm(t)}`, etiqueta: `${manana ? 'Mañana' : 'Hoy'} ${hhmm(t)}`, detalle: 'Abrimos a las 07:00' }
  })
}

export function retiroTexto(f: Franja): string {
  if (f.id === 'ya') return `lo antes posible (listo en ${DEMORA} min)`
  return /^\d/.test(f.id) ? `hoy a las ${f.etiqueta}` : f.etiqueta.replace(/^Mañana/, 'mañana a las').replace(/^Hoy/, 'hoy a las')
}

export const nombreValido = (n: string) => n.trim().length >= 2

export function textoPedido(items: Item[], nombre: string, franja: Franja): string {
  const lineas = items.map((it) => {
    const det = it.tipo === 'bebida' ? ` (${describir(it.bebida)})` : ''
    return `• ${it.cantidad} × ${nombreItem(it)}${det}: ${formatPesos(subtotal(it))}`
  })
  return [
    `Hola ${NEGOCIO}, soy ${nombre.trim()}. Quiero pedir para retirar:`,
    ...lineas,
    `Total: ${formatPesos(totalPedido(items))}`,
    `Retiro: ${retiroTexto(franja)}`,
    'Pago al retirar.',
  ].join('\n')
}

export const WHATSAPP_MRK = '5491162474436'
export const enlaceContacto = () =>
  `https://wa.me/${WHATSAPP_MRK}?text=${encodeURIComponent(`Hola, vi la demo de ${NEGOCIO} en la Vitrina y quiero una web así para mi cafetería.`)}`
