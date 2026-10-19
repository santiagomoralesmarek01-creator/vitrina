// Lógica del armador de Bunker: capas, límites, precio, altura y calorías. Sin DOM.
import { formatPesos } from '../shared/dinero'

export type PanId = 'papa' | 'brioche' | 'sintacc'
export type CapaId = 'medallon' | 'cheddar' | 'bacon' | 'caramelizada' | 'pepinos' | 'crispy' | 'huevo' | 'salsa'

export interface Pan {
  id: PanId
  nombre: string
  precio: number
  calorias: number
}

export const PANES: Pan[] = [
  { id: 'papa', nombre: 'De papa', precio: 0, calorias: 210 },
  { id: 'brioche', nombre: 'Brioche', precio: 1200, calorias: 270 },
  { id: 'sintacc', nombre: 'Sin TACC', precio: 2500, calorias: 230 },
]

export interface Capa {
  id: CapaId
  nombre: string
  precio: number
  /** Cuántas veces puede ir en la misma burger. */
  maximo: number
  /** Alto aproximado en milímetros, para el medidor. */
  mm: number
  calorias: number
}

export const CAPAS: Record<CapaId, Capa> = {
  medallon: { id: 'medallon', nombre: 'Medallón smash', precio: 3400, maximo: 4, mm: 12, calorias: 250 },
  cheddar: { id: 'cheddar', nombre: 'Cheddar', precio: 900, maximo: 4, mm: 3, calorias: 70 },
  bacon: { id: 'bacon', nombre: 'Bacon', precio: 2200, maximo: 1, mm: 6, calorias: 130 },
  caramelizada: { id: 'caramelizada', nombre: 'Cebolla caramelizada', precio: 1300, maximo: 1, mm: 7, calorias: 60 },
  pepinos: { id: 'pepinos', nombre: 'Pepinos', precio: 700, maximo: 1, mm: 4, calorias: 5 },
  crispy: { id: 'crispy', nombre: 'Cebolla crispy', precio: 1200, maximo: 1, mm: 9, calorias: 110 },
  huevo: { id: 'huevo', nombre: 'Huevo a la plancha', precio: 1500, maximo: 1, mm: 10, calorias: 90 },
  salsa: { id: 'salsa', nombre: 'Salsa Bunker', precio: 600, maximo: 1, mm: 3, calorias: 80 },
}

export const EXTRAS: CapaId[] = ['bacon', 'caramelizada', 'pepinos', 'crispy', 'huevo', 'salsa']

/** Precio de la burger con pan de papa y un medallón, sin nada más. */
export const BASE = 8900
export const MM_PAN = { base: 24, tapa: 34 }
export const MIN_MEDALLONES = 1
export const MAX_MEDALLONES = 4

export interface Burger {
  pan: PanId
  /** Capas de abajo hacia arriba, entre la base y la tapa del pan. */
  capas: CapaId[]
}

export const burgerInicial = (): Burger => ({ pan: 'papa', capas: ['medallon', 'cheddar'] })

export const cuantas = (b: Burger, id: CapaId) => b.capas.filter((c) => c === id).length

export function puedeAgregar(b: Burger, id: CapaId): boolean {
  return cuantas(b, id) < CAPAS[id].maximo
}

/** Suma una capa arriba de todo (abajo de la tapa). */
export function agregar(b: Burger, id: CapaId): Burger {
  if (!puedeAgregar(b, id)) {
    throw new Error(
      id === 'medallon'
        ? `Hasta ${MAX_MEDALLONES} medallones. Más es un edificio.`
        : id === 'cheddar'
          ? `Hasta ${CAPAS.cheddar.maximo} fetas de cheddar`
          : `${CAPAS[id].nombre} va una sola vez`,
    )
  }
  return { ...b, capas: [...b.capas, id] }
}

/** Saca la capa de más arriba de ese tipo. Siempre queda al menos un medallón. */
export function sacar(b: Burger, id: CapaId): Burger {
  const i = b.capas.lastIndexOf(id)
  if (i === -1) return b
  if (id === 'medallon' && cuantas(b, 'medallon') <= MIN_MEDALLONES) throw new Error('Sin medallón no hay burger')
  return { ...b, capas: b.capas.filter((_, k) => k !== i) }
}

/** Saca la capa en una posición puntual de la pila. */
export function sacarEn(b: Burger, indice: number): Burger {
  const id = b.capas[indice]
  if (!id) return b
  if (id === 'medallon' && cuantas(b, 'medallon') <= MIN_MEDALLONES) throw new Error('Sin medallón no hay burger')
  return { ...b, capas: b.capas.filter((_, k) => k !== indice) }
}

export const alternar = (b: Burger, id: CapaId) => (cuantas(b, id) ? sacar(b, id) : agregar(b, id))

/** Orden de la casa: salsa y pepinos abajo, cada medallón con su cheddar, y lo crocante arriba. */
const ABAJO: CapaId[] = ['salsa', 'pepinos']
const ARRIBA: CapaId[] = ['bacon', 'caramelizada', 'huevo', 'crispy']

export function acomodar(b: Burger): Burger {
  const med = cuantas(b, 'medallon')
  const ched = cuantas(b, 'cheddar')
  const centro: CapaId[] = []
  for (let i = 0; i < Math.max(med, ched); i++) {
    if (i < med) centro.push('medallon')
    if (i < ched) centro.push('cheddar')
  }
  return {
    ...b,
    capas: [...ABAJO.filter((id) => cuantas(b, id)), ...centro, ...ARRIBA.filter((id) => cuantas(b, id))],
  }
}

export function precioBurger(b: Burger): number {
  const pan = PANES.find((p) => p.id === b.pan)!
  const extras = b.capas.reduce((s, id) => s + CAPAS[id].precio, 0)
  // El primer medallón ya está en la base.
  return BASE + pan.precio + extras - CAPAS.medallon.precio
}

/** Alto en milímetros, pan incluido. */
export const altura = (b: Burger) => MM_PAN.base + MM_PAN.tapa + b.capas.reduce((s, id) => s + CAPAS[id].mm, 0)

export const calorias = (b: Burger) =>
  PANES.find((p) => p.id === b.pan)!.calorias + b.capas.reduce((s, id) => s + CAPAS[id].calorias, 0)

/** Cartel del medidor de altura. */
export function veredicto(mm: number): string {
  if (mm < 85) return 'Entra en una mano'
  if (mm < 110) return 'A dos manos'
  if (mm < 135) return 'Abrí bien grande'
  return 'Pedí servilletas extra'
}

/** Nombre de la burger según cuántos medallones lleva. */
export function nombreTamanio(b: Burger): string {
  return ['Simple', 'Doble', 'Triple', 'Cuádruple'][cuantas(b, 'medallon') - 1] ?? 'Simple'
}

// ---------- Combo ----------

export interface Opcion {
  id: string
  nombre: string
  precio: number
}

export const PAPAS: Opcion[] = [
  { id: 'clasicas', nombre: 'Papas clásicas', precio: 0 },
  { id: 'cheddar', nombre: 'Papas con cheddar y bacon', precio: 2400 },
  { id: 'batata', nombre: 'Bastones de batata', precio: 1000 },
]

export const BEBIDAS: Opcion[] = [
  { id: 'gaseosa', nombre: 'Gaseosa 500 ml', precio: 0 },
  { id: 'limonada', nombre: 'Limonada con jengibre', precio: 600 },
  { id: 'birra', nombre: 'Pinta de IPA', precio: 1900 },
]

export const PRECIO_COMBO = 4900

export interface Combo {
  activo: boolean
  papas: string
  bebida: string
}

export const comboInicial = (): Combo => ({ activo: false, papas: 'clasicas', bebida: 'gaseosa' })

export function precioCombo(c: Combo): number {
  if (!c.activo) return 0
  const papas = PAPAS.find((p) => p.id === c.papas)
  const bebida = BEBIDAS.find((p) => p.id === c.bebida)
  if (!papas || !bebida) throw new Error('Opción de combo desconocida')
  return PRECIO_COMBO + papas.precio + bebida.precio
}

export const MAX_CANTIDAD = 9

export const cantidadValida = (n: number) => Math.min(MAX_CANTIDAD, Math.max(1, Math.round(n) || 1))

export interface Pedido {
  burger: Burger
  combo: Combo
  cantidad: number
}

export const total = (p: Pedido) => (precioBurger(p.burger) + precioCombo(p.combo)) * cantidadValida(p.cantidad)

// ---------- Las de la casa ----------

export interface DeLaCasa {
  id: string
  nombre: string
  detalle: string
  pan: PanId
  medallones: number
  cheddar: number
  extras: CapaId[]
  sticker?: string
}

export const DE_LA_CASA: DeLaCasa[] = [
  {
    id: 'bunker',
    nombre: 'La Bunker',
    detalle: 'Doble smash, doble cheddar, bacon crocante y salsa Bunker.',
    pan: 'papa',
    medallones: 2,
    cheddar: 2,
    extras: ['salsa', 'bacon'],
    sticker: 'La N.º 1',
  },
  {
    id: 'oklahoma',
    nombre: 'Oklahoma',
    detalle: 'Cebolla aplastada en la plancha con la carne, cheddar y pepinos.',
    pan: 'papa',
    medallones: 2,
    cheddar: 2,
    extras: ['pepinos', 'caramelizada'],
  },
  {
    id: 'simple',
    nombre: 'Cheese simple',
    detalle: 'Un medallón, una feta, pepinos y salsa. Para arrancar.',
    pan: 'papa',
    medallones: 1,
    cheddar: 1,
    extras: ['salsa', 'pepinos'],
  },
  {
    id: 'colegiales',
    nombre: 'La Colegiales',
    detalle: 'Triple en brioche con huevo a la plancha, bacon y cebolla crispy.',
    pan: 'brioche',
    medallones: 3,
    cheddar: 3,
    extras: ['bacon', 'huevo', 'crispy'],
    sticker: 'Picante',
  },
  {
    id: 'antiaerea',
    nombre: 'Antiaérea',
    detalle: 'Cuatro medallones, cuatro cheddar y todo lo que hay en la cocina.',
    pan: 'brioche',
    medallones: 4,
    cheddar: 4,
    extras: ['salsa', 'bacon', 'caramelizada', 'huevo', 'crispy'],
    sticker: 'Desafío',
  },
  {
    id: 'celiaca',
    nombre: 'Doble sin TACC',
    detalle: 'Pan sin TACC, plancha separada, doble cheddar y pepinos.',
    pan: 'sintacc',
    medallones: 2,
    cheddar: 2,
    extras: ['pepinos', 'salsa'],
  },
]

export function armarDeLaCasa(d: DeLaCasa): Burger {
  const capas: CapaId[] = [
    ...Array<CapaId>(d.medallones).fill('medallon'),
    ...Array<CapaId>(d.cheddar).fill('cheddar'),
    ...d.extras,
  ]
  return acomodar({ pan: d.pan, capas })
}

// ---------- Pedido por WhatsApp ----------

export const WHATSAPP = '5491160330000'

export function describirBurger(b: Burger): string {
  const pan = PANES.find((p) => p.id === b.pan)!.nombre.toLowerCase()
  const med = cuantas(b, 'medallon')
  const ched = cuantas(b, 'cheddar')
  const partes = [med > 1 ? `${med} medallones` : '1 medallón']
  if (ched) partes.push(`${ched} cheddar`)
  for (const id of EXTRAS) if (cuantas(b, id)) partes.push(CAPAS[id].nombre.toLowerCase())
  return `${nombreTamanio(b)} en pan ${pan}: ${partes.join(', ')}`
}

export function textoPedido(p: Pedido, nombreCasa?: string): string {
  const n = cantidadValida(p.cantidad)
  const lineas = [
    '¡Hola, Bunker! Quiero pedir:',
    `• ${n} × ${nombreCasa ? `${nombreCasa} (${describirBurger(p.burger)})` : describirBurger(p.burger)}`,
    `  De abajo para arriba: pan, ${p.burger.capas.map((id) => CAPAS[id].nombre.toLowerCase()).join(', ')}, pan`,
  ]
  if (p.combo.activo) {
    const papas = PAPAS.find((x) => x.id === p.combo.papas)!.nombre
    const bebida = BEBIDAS.find((x) => x.id === p.combo.bebida)!.nombre
    lineas.push(`• En combo: ${papas.toLowerCase()} + ${bebida.toLowerCase()}`)
  }
  lineas.push(`Total: ${formatPesos(total(p))}`)
  return lineas.join('\n')
}

export const enlaceWhatsApp = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`
