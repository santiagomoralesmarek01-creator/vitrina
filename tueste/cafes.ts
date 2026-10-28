// Datos de la barra: cafés de origen, familias de sabor de la rueda y bebidas.
// Sin DOM: lo usan la interfaz, el recomendador y los tests.

export const NEGOCIO = 'Cobre'

export type Familia = 'frutado' | 'citrico' | 'floral' | 'vinoso' | 'dulce' | 'chocolate' | 'especiado'
export type Proceso = 'Lavado' | 'Natural' | 'Honey'

export interface Perfil {
  acidez: number
  cuerpo: number
  dulzor: number
}

export interface Origen {
  id: string
  pais: string
  region: string
  productor: string
  altura: string
  proceso: Proceso
  variedad: string
  notas: string[]
  familias: Familia[]
  perfil: Perfil
  /** Precio de la bolsa de 250 g. */
  precio250: number
}

export interface FamiliaSabor {
  id: Familia
  nombre: string
  /** Dos notas para el anillo de afuera de la rueda. */
  notas: [string, string]
  color: string
}

// Rueda simplificada (inspirada en la de catadores): siete familias, dos notas cada una.
export const FAMILIAS: FamiliaSabor[] = [
  { id: 'frutado', nombre: 'Frutado', notas: ['Frutos rojos', 'Carozo'], color: '#b4504a' },
  { id: 'citrico', nombre: 'Cítrico', notas: ['Pomelo', 'Mandarina'], color: '#c9a443' },
  { id: 'floral', nombre: 'Floral', notas: ['Jazmín', 'Azahar'], color: '#b98fae' },
  { id: 'vinoso', nombre: 'Vinoso', notas: ['Vino tinto', 'Ciruela'], color: '#86405a' },
  { id: 'dulce', nombre: 'Dulce', notas: ['Panela', 'Caramelo'], color: '#d39158' },
  { id: 'chocolate', nombre: 'Cacao y nuez', notas: ['Cacao', 'Maní'], color: '#8a5a3e' },
  { id: 'especiado', nombre: 'Especiado', notas: ['Canela', 'Clavo'], color: '#7d7f4b' },
]

export const ORIGENES: Origen[] = [
  {
    id: 'etiopia',
    pais: 'Etiopía',
    region: 'Guji, Shakiso',
    productor: 'Cooperativa Dambi Uddo',
    altura: '2.100 – 2.300 msnm',
    proceso: 'Natural',
    variedad: 'Heirloom etíope',
    notas: ['arándano', 'jazmín', 'vino tinto'],
    familias: ['frutado', 'floral', 'vinoso'],
    perfil: { acidez: 4, cuerpo: 2, dulzor: 4 },
    precio250: 17500,
  },
  {
    id: 'kenia',
    pais: 'Kenia',
    region: 'Nyeri, Othaya',
    productor: 'Estación Gatomboya',
    altura: '1.800 – 1.900 msnm',
    proceso: 'Lavado',
    variedad: 'SL28 y SL34',
    notas: ['grosella negra', 'pomelo rosado', 'ciruela'],
    familias: ['citrico', 'frutado', 'vinoso'],
    perfil: { acidez: 5, cuerpo: 3, dulzor: 3 },
    precio250: 18000,
  },
  {
    id: 'colombia',
    pais: 'Colombia',
    region: 'Huila, Pitalito',
    productor: 'Finca La Esperanza',
    altura: '1.700 – 1.900 msnm',
    proceso: 'Lavado',
    variedad: 'Caturra y Castillo',
    notas: ['panela', 'mandarina', 'azahar'],
    familias: ['dulce', 'citrico', 'floral'],
    perfil: { acidez: 3, cuerpo: 3, dulzor: 4 },
    precio250: 15500,
  },
  {
    id: 'guatemala',
    pais: 'Guatemala',
    region: 'Huehuetenango',
    productor: 'Finca El Injerto Alto',
    altura: '1.600 – 1.800 msnm',
    proceso: 'Honey',
    variedad: 'Bourbon',
    notas: ['chocolate con leche', 'almendra', 'canela'],
    familias: ['chocolate', 'especiado', 'dulce'],
    perfil: { acidez: 3, cuerpo: 4, dulzor: 4 },
    precio250: 16000,
  },
  {
    id: 'brasil',
    pais: 'Brasil',
    region: 'Sul de Minas, Carmo de Minas',
    productor: 'Sítio Serra Alta',
    altura: '1.100 – 1.300 msnm',
    proceso: 'Natural',
    variedad: 'Bourbon amarillo',
    notas: ['cacao amargo', 'maní tostado', 'caramelo'],
    familias: ['chocolate', 'dulce'],
    perfil: { acidez: 2, cuerpo: 5, dulzor: 4 },
    precio250: 14000,
  },
]

export type Metodo = 'espresso' | 'v60' | 'chemex' | 'aeropress' | 'coldbrew'

export const METODOS: Record<Metodo, string> = {
  espresso: 'Espresso',
  v60: 'V60',
  chemex: 'Chemex',
  aeropress: 'AeroPress',
  coldbrew: 'Cold brew',
}

export type Seccion = 'espresso' | 'filtrado' | 'frio'

export const SECCIONES: Record<Seccion, string> = {
  espresso: 'Espresso bar',
  filtrado: 'Filtrados',
  frio: 'Fríos',
}

export interface Bebida {
  id: string
  nombre: string
  detalle: string
  seccion: Seccion
  metodo: Metodo
  conLeche: boolean
  precio: number
}

export const BEBIDAS: Bebida[] = [
  { id: 'espresso', nombre: 'Espresso', detalle: 'Doble, 36 g en 28 segundos.', seccion: 'espresso', metodo: 'espresso', conLeche: false, precio: 2800 },
  { id: 'cortado', nombre: 'Cortado', detalle: 'Espresso doble y un dedo de leche texturizada.', seccion: 'espresso', metodo: 'espresso', conLeche: true, precio: 3200 },
  { id: 'flat-white', nombre: 'Flat white', detalle: 'Ristretto doble y leche sedosa, 180 ml.', seccion: 'espresso', metodo: 'espresso', conLeche: true, precio: 4200 },
  { id: 'latte', nombre: 'Latte', detalle: 'Espresso y leche, 300 ml. Con avena, sin cargo.', seccion: 'espresso', metodo: 'espresso', conLeche: true, precio: 4400 },
  { id: 'v60', nombre: 'V60 de origen', detalle: 'Filtrado a mano, 300 ml. Elegís el origen en la barra.', seccion: 'filtrado', metodo: 'v60', conLeche: false, precio: 4500 },
  { id: 'aeropress', nombre: 'AeroPress', detalle: 'Inmersión y presión: más cuerpo, igual de limpio.', seccion: 'filtrado', metodo: 'aeropress', conLeche: false, precio: 4300 },
  { id: 'chemex', nombre: 'Chemex para dos', detalle: '600 ml en jarra de vidrio. Para compartir.', seccion: 'filtrado', metodo: 'chemex', conLeche: false, precio: 7800 },
  { id: 'cold-brew', nombre: 'Cold brew', detalle: '18 horas en frío. Denso, dulce, sin amargor.', seccion: 'frio', metodo: 'coldbrew', conLeche: false, precio: 4600 },
  { id: 'cold-brew-avena', nombre: 'Cold brew con avena', detalle: 'Nuestro cold brew con leche de avena.', seccion: 'frio', metodo: 'coldbrew', conLeche: true, precio: 5200 },
  { id: 'iced-v60', nombre: 'V60 con hielo', detalle: 'Filtrado caliente directo sobre hielo: brillante.', seccion: 'frio', metodo: 'v60', conLeche: false, precio: 4900 },
  { id: 'espresso-tonic', nombre: 'Espresso tonic', detalle: 'Tónica, hielo y espresso de origen arriba.', seccion: 'frio', metodo: 'espresso', conLeche: false, precio: 5000 },
  { id: 'iced-latte', nombre: 'Iced latte', detalle: 'Espresso doble, leche fría y hielo.', seccion: 'frio', metodo: 'espresso', conLeche: true, precio: 4700 },
]

export const buscarOrigen = (id: string) => ORIGENES.find((o) => o.id === id)
export const buscarBebida = (id: string) => BEBIDAS.find((b) => b.id === id)

// ---------- Rueda de sabores ----------

/** Los cafés de la carta que tienen esa familia entre sus notas (null = todos). */
export function cafesConFamilia(familia: Familia | null, origenes: Origen[] = ORIGENES): Origen[] {
  return familia ? origenes.filter((o) => o.familias.includes(familia)) : origenes
}

/** Frase para anunciar el resultado del filtro. */
export function resumenFamilia(familia: Familia | null, origenes: Origen[] = ORIGENES): string {
  if (!familia) return 'Tocá una familia de la rueda para ver qué cafés la tienen.'
  const nombre = FAMILIAS.find((f) => f.id === familia)!.nombre
  const cafes = cafesConFamilia(familia, origenes).map((o) => o.pais)
  if (cafes.length === 0) return `Ningún café de esta tanda tiene notas de ${nombre.toLowerCase()}.`
  const lista = cafes.length === 1 ? cafes[0] : `${cafes.slice(0, -1).join(', ')} y ${cafes.at(-1)}`
  return `${nombre}: ${lista}.`
}
