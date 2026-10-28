// Lo que hay en la vidriera de Clotilde: porciones, masas finas, tortas enteras y café. Sin DOM.

export const NEGOCIO = 'Clotilde'

/** Cómo se dibuja la porción (ver dibujos.ts). */
export type Adorno = 'cacao' | 'merengue' | 'frutos' | 'cerezas' | 'pistacho' | 'ddl' | 'crema' | 'glaseado'

export interface Porcion {
  id: string
  nombre: string
  detalle: string
  /** Precio por porción, en pesos. */
  precio: number
  /** Capas de abajo hacia arriba: color y alto relativo. */
  capas: [string, number][]
  /** Color de la cara de arriba. */
  tope: string
  adorno: Adorno
}

export const PORCIONES: Porcion[] = [
  {
    id: 'chocotorta',
    nombre: 'Chocotorta',
    detalle: 'Chocolinas mojadas en café, dulce de leche y queso crema. La de siempre, alta.',
    precio: 5200,
    capas: [['#4a2c22', 2], ['#efe0c4', 3], ['#4a2c22', 2], ['#efe0c4', 3], ['#4a2c22', 2], ['#efe0c4', 3]],
    tope: '#5b3626',
    adorno: 'cacao',
  },
  {
    id: 'lemon',
    nombre: 'Lemon pie',
    detalle: 'Masa sablée, crema de limón bien ácida y merengue italiano flameado.',
    precio: 5600,
    capas: [['#d9a868', 2], ['#f3d24f', 5]],
    tope: '#fbf2df',
    adorno: 'merengue',
  },
  {
    id: 'cheesecake',
    nombre: 'Cheesecake de frutos rojos',
    detalle: 'Estilo Nueva York, horneado lento, con coulis de frambuesa y arándanos.',
    precio: 6200,
    capas: [['#b98a57', 2], ['#fbf1dc', 7]],
    tope: '#c22c4a',
    adorno: 'frutos',
  },
  {
    id: 'rogel',
    nombre: 'Rogel',
    detalle: 'Ocho capas de masa crocante con dulce de leche y merengue suizo arriba.',
    precio: 5800,
    capas: [
      ['#f0d49c', 1], ['#a8642c', 1], ['#f0d49c', 1], ['#a8642c', 1],
      ['#f0d49c', 1], ['#a8642c', 1], ['#f0d49c', 1], ['#a8642c', 1],
    ],
    tope: '#fffaf0',
    adorno: 'merengue',
  },
  {
    id: 'selva',
    nombre: 'Selva negra',
    detalle: 'Bizcochuelo de cacao con kirsch, crema chantilly y cerezas al marrasquino.',
    precio: 6000,
    capas: [['#3d2219', 3], ['#fbf4ea', 2], ['#3d2219', 3], ['#fbf4ea', 2]],
    tope: '#fbf4ea',
    adorno: 'cerezas',
  },
  {
    id: 'pistacho',
    nombre: 'Tarta de pistacho y frambuesa',
    detalle: 'Frangipane de pistacho, crema diplomática y frambuesas frescas. La de la casa.',
    precio: 6500,
    capas: [['#d8b07a', 2], ['#b9c98a', 4], ['#f6ecd6', 2]],
    tope: '#a9bf72',
    adorno: 'pistacho',
  },
  {
    id: 'balcarce',
    nombre: 'Postre Balcarce',
    detalle: 'Merengue crocante, dulce de leche, castañas y crema. Clásico de confitería.',
    precio: 5500,
    capas: [['#f3e3c2', 2], ['#b06f35', 2], ['#fbf5e8', 3], ['#b06f35', 2]],
    tope: '#f7ecd8',
    adorno: 'ddl',
  },
  {
    id: 'frutillas',
    nombre: 'Torta de frutillas con crema',
    detalle: 'Bizcochuelo de vainilla, almíbar suave, crema batida y frutillas enteras.',
    precio: 5900,
    capas: [['#f4dc9c', 3], ['#fdf6ee', 2], ['#f4dc9c', 3]],
    tope: '#fdf6ee',
    adorno: 'crema',
  },
]

export type DibujoMasa =
  | 'palmerita'
  | 'tartaleta'
  | 'canoncito'
  | 'bombon'
  | 'lemon'
  | 'macaron'
  | 'profiterol'
  | 'alfajor'

export interface Masa {
  id: string
  nombre: string
  plural: string
  detalle: string
  precio: number
  dibujo: DibujoMasa
}

export const MASAS: Masa[] = [
  { id: 'tartaleta', plural: 'Tartaletas de frutillas', nombre: 'Tartaleta de frutillas', detalle: 'Crema pastelera y frutilla abrillantada', precio: 1400, dibujo: 'tartaleta' },
  { id: 'canoncito', plural: 'Cañoncitos', nombre: 'Cañoncito', detalle: 'Hojaldre y dulce de leche, con azúcar impalpable', precio: 1200, dibujo: 'canoncito' },
  { id: 'palmerita', plural: 'Palmeritas bañadas', nombre: 'Palmerita bañada', detalle: 'Mitad en chocolate semiamargo', precio: 1100, dibujo: 'palmerita' },
  { id: 'bombon', plural: 'Bombones de pistacho', nombre: 'Bombón de pistacho', detalle: 'Ganache de pistacho, cobertura amarga', precio: 1300, dibujo: 'bombon' },
  { id: 'minilemon', plural: 'Mini lemons', nombre: 'Mini lemon', detalle: 'Crema de limón y copo de merengue', precio: 1300, dibujo: 'lemon' },
  { id: 'macaron', plural: 'Macarons de frambuesa', nombre: 'Macaron de frambuesa', detalle: 'Relleno de ganache blanca y frambuesa', precio: 1400, dibujo: 'macaron' },
  { id: 'profiterol', plural: 'Profiteroles', nombre: 'Profiterol', detalle: 'Crema chantilly y chocolate tibio', precio: 1200, dibujo: 'profiterol' },
  { id: 'alfajorcito', plural: 'Alfajorcitos de maicena', nombre: 'Alfajorcito de maicena', detalle: 'Dulce de leche y coco rallado', precio: 1100, dibujo: 'alfajor' },
]

export interface Torta {
  id: string
  nombre: string
  detalle: string
  /** Precio de la torta de 12 porciones. */
  precio12: number
  /** Para el dibujo de la torta entera. */
  costado: string
  tope: string
  /** Color de la letra de la dedicatoria. */
  tinta: string
}

export const TORTAS: Torta[] = [
  { id: 'chocotorta', nombre: 'Chocotorta', detalle: 'Bañada en cacao, con galletitas de borde', precio12: 42000, costado: '#4a2c22', tope: '#6a4130', tinta: '#fbe9c9' },
  { id: 'lemon', nombre: 'Lemon pie', detalle: 'Merengue italiano flameado a soplete', precio12: 45000, costado: '#d9a868', tope: '#fbf2df', tinta: '#7a4a1c' },
  { id: 'cheesecake', nombre: 'Cheesecake', detalle: 'Con coulis de frutos rojos', precio12: 52000, costado: '#f7ecd6', tope: '#c22c4a', tinta: '#fff6ea' },
  { id: 'rogel', nombre: 'Rogel', detalle: 'Ocho capas y merengue suizo', precio12: 48000, costado: '#f0d49c', tope: '#fffaf0', tinta: '#8a4b1f' },
  { id: 'selva', nombre: 'Selva negra', detalle: 'Chantilly, virutas y cerezas', precio12: 50000, costado: '#3d2219', tope: '#fbf4ea', tinta: '#5a2330' },
]

export interface TamanioTorta {
  porciones: number
  /** Multiplica el precio de la de 12. */
  factor: number
  detalle: string
}

export const TAMANIOS_TORTA: TamanioTorta[] = [
  { porciones: 8, factor: 0.7, detalle: '18 cm' },
  { porciones: 12, factor: 1, detalle: '22 cm' },
  { porciones: 16, factor: 1.3, detalle: '26 cm' },
]

export const MAX_DEDICATORIA = 26

export interface Bebida {
  id: string
  nombre: string
  detalle: string
  precio: number
}

export const BEBIDAS: Bebida[] = [
  { id: 'cafe', nombre: 'Café', detalle: 'Espresso de tueste medio', precio: 2600 },
  { id: 'cortado', nombre: 'Cortado', detalle: 'En jarrito, con espuma', precio: 2900 },
  { id: 'lagrima', nombre: 'Lágrima', detalle: 'Leche caliente y un hilo de café', precio: 2900 },
  { id: 'capuccino', nombre: 'Capuccino', detalle: 'Con canela o cacao', precio: 3600 },
  { id: 'submarino', nombre: 'Submarino', detalle: 'Con barra de chocolate semiamargo', precio: 3900 },
  { id: 'te', nombre: 'Té en hebras', detalle: 'Earl grey, verde o frutos rojos', precio: 2800 },
  { id: 'jugo', nombre: 'Exprimido de naranja', detalle: 'Recién hecho', precio: 3400 },
]

function buscar<T extends { id: string }>(lista: T[], id: string, que: string): T {
  const x = lista.find((y) => y.id === id)
  if (!x) throw new Error(`No hay ${que} "${id}"`)
  return x
}

export const porcion = (id: string) => buscar(PORCIONES, id, 'porción')
export const masa = (id: string) => buscar(MASAS, id, 'masa')
export const torta = (id: string) => buscar(TORTAS, id, 'torta')
export const bebida = (id: string) => buscar(BEBIDAS, id, 'bebida')

export function tamanioTorta(porciones: number): TamanioTorta {
  const t = TAMANIOS_TORTA.find((x) => x.porciones === porciones)
  if (!t) throw new Error(`No hacemos tortas de ${porciones} porciones`)
  return t
}

/** Precio de una torta entera: escala la de 12 y redondea a $500. La dedicatoria va sin cargo. */
export function precioTorta(id: string, porciones: number): number {
  return Math.round((torta(id).precio12 * tamanioTorta(porciones).factor) / 500) * 500
}

/** Junta espacios, saca saltos de línea y corta en el máximo (cuenta letras, no bytes). */
export function limpiarDedicatoria(s: string): string {
  return [...s.replace(/\s+/g, ' ').replace(/^ /, '')].slice(0, MAX_DEDICATORIA).join('')
}

/**
 * Parte la dedicatoria en hasta dos renglones para escribirla sobre la torta,
 * cortando en el espacio más cercano a la mitad si es larga.
 */
export function renglones(s: string, porRenglon = 14): string[] {
  const t = s.trim()
  if (!t) return []
  if ([...t].length <= porRenglon) return [t]
  const mitad = Math.floor(t.length / 2)
  let corte = -1
  for (let d = 0; d <= mitad; d++) {
    if (t[mitad - d] === ' ') { corte = mitad - d; break }
    if (t[mitad + d] === ' ') { corte = mitad + d; break }
  }
  if (corte <= 0) return [t]
  return [t.slice(0, corte).trim(), t.slice(corte + 1).trim()]
}
