export type Tamanio = 'chico' | 'mediano' | 'grande'
export type Leche = 'entera' | 'avena' | 'almendras'

export const TAMANIOS: { id: Tamanio; nombre: string; ml: number; extra: number }[] = [
  { id: 'chico', nombre: 'Chico', ml: 180, extra: 0 },
  { id: 'mediano', nombre: 'Mediano', ml: 240, extra: 900 },
  { id: 'grande', nombre: 'Grande', ml: 360, extra: 1700 },
]

export const LECHES: { id: Leche; nombre: string; extra: number }[] = [
  { id: 'entera', nombre: 'Entera', extra: 0 },
  { id: 'avena', nombre: 'Avena', extra: 700 },
  { id: 'almendras', nombre: 'Almendras', extra: 900 },
]

export interface Bebida {
  id: string
  nombre: string
  detalle: string
  precio: number
  /** Si cambia con el tamaño y la leche elegidos arriba. */
  conTamanio: boolean
  conLeche: boolean
}

export interface Origen {
  id: string
  nombre: string
  region: string
  proceso: string
  altura: string
  notas: string[]
  metodo: string
  precio: number
  /** De 1 a 5. */
  perfil: { acidez: number; cuerpo: number; dulzor: number }
}

export interface Dulce {
  id: string
  nombre: string
  detalle: string
  precio: number
}

export const ESPRESSO_BAR: Bebida[] = [
  { id: 'espresso', nombre: 'Espresso', detalle: 'Doble, de nuestro blend de la semana.', precio: 3200, conTamanio: false, conLeche: false },
  { id: 'cortado', nombre: 'Cortado', detalle: 'Espresso con un toque de leche texturizada.', precio: 3600, conTamanio: false, conLeche: true },
  { id: 'flat', nombre: 'Flat white', detalle: 'Doble ristretto y leche sedosa.', precio: 4400, conTamanio: true, conLeche: true },
  { id: 'latte', nombre: 'Latte', detalle: 'Suave y cremoso, con arte latte.', precio: 4600, conTamanio: true, conLeche: true },
  { id: 'americano', nombre: 'Americano', detalle: 'Espresso alargado con agua caliente.', precio: 3800, conTamanio: true, conLeche: false },
]

export const FRIOS: Bebida[] = [
  { id: 'cold-brew', nombre: 'Cold brew', detalle: '18 horas de extracción en frío.', precio: 4800, conTamanio: true, conLeche: false },
  { id: 'iced-latte', nombre: 'Iced latte', detalle: 'Espresso, leche fría y hielo.', precio: 5000, conTamanio: true, conLeche: true },
  { id: 'tonic', nombre: 'Espresso tonic', detalle: 'Agua tónica, hielo y espresso cítrico.', precio: 5400, conTamanio: false, conLeche: false },
]

export const ORIGENES: Origen[] = [
  {
    id: 'etiopia',
    nombre: 'Etiopía',
    region: 'Yirgacheffe',
    proceso: 'Lavado',
    altura: '1.900–2.200 m',
    notas: ['Jazmín', 'Limón', 'Té negro'],
    metodo: 'V60',
    precio: 5900,
    perfil: { acidez: 5, cuerpo: 2, dulzor: 4 },
  },
  {
    id: 'colombia',
    nombre: 'Colombia',
    region: 'Huila',
    proceso: 'Honey',
    altura: '1.700 m',
    notas: ['Panela', 'Durazno', 'Cacao'],
    metodo: 'Chemex',
    precio: 5400,
    perfil: { acidez: 3, cuerpo: 4, dulzor: 5 },
  },
  {
    id: 'brasil',
    nombre: 'Brasil',
    region: 'Cerrado Mineiro',
    proceso: 'Natural',
    altura: '1.100 m',
    notas: ['Maní tostado', 'Chocolate', 'Caramelo'],
    metodo: 'Aeropress',
    precio: 4900,
    perfil: { acidez: 2, cuerpo: 5, dulzor: 4 },
  },
]

export const DULCES: Dulce[] = [
  { id: 'medialunas', nombre: 'Medialunas de manteca', detalle: 'Hojaldradas, horneadas cada hora.', precio: 1500 },
  { id: 'budin', nombre: 'Budín de limón y amapola', detalle: 'Con glaseado cítrico.', precio: 3900 },
  { id: 'cookie', nombre: 'Cookie de chocolate', detalle: 'Con sal marina y chips de 70 %.', precio: 3200 },
  { id: 'tostado', nombre: 'Tostado de masa madre', detalle: 'Jamón natural, queso y manteca de hierbas.', precio: 7800 },
]

/** Precio de una bebida según el tamaño y la leche elegidos. */
export function precioBebida(b: Bebida, tamanio: Tamanio, leche: Leche): number {
  const extraTamanio = b.conTamanio ? TAMANIOS.find((t) => t.id === tamanio)!.extra : 0
  const extraLeche = b.conLeche ? LECHES.find((l) => l.id === leche)!.extra : 0
  return b.precio + extraTamanio + extraLeche
}
