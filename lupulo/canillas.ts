// Lógica de Lúpulo (taproom en Saavedra): canillas, color SRM, filtros y vuelos de degustación. Sin DOM.

export type Estilo = 'Golden' | 'Lager' | 'APA' | 'IPA' | 'Hazy' | 'Red' | 'Sour' | 'Stout' | 'Porter'

export interface Canilla {
  numero: number
  nombre: string
  estilo: Estilo
  /** Graduación alcohólica en %. */
  abv: number
  /** Amargor (International Bitterness Units). */
  ibu: number
  /** Color (Standard Reference Method). */
  srm: number
  pinta: number
  media: number
  notas: string
  /** De la casa o invitada. */
  origen: string
  agotada?: boolean
}

export const CANILLAS: Canilla[] = [
  { numero: 1, nombre: 'Siesta', estilo: 'Golden', abv: 4.6, ibu: 18, srm: 4, pinta: 5800, media: 3600, notas: 'Liviana, pan tostado y un final seco. La de toda la tarde.', origen: 'De la casa' },
  { numero: 2, nombre: 'Andén 7', estilo: 'Lager', abv: 4.9, ibu: 20, srm: 3, pinta: 5900, media: 3700, notas: 'Lager helada con malta Pilsen y lúpulo Saaz.', origen: 'De la casa' },
  { numero: 3, nombre: 'Cancha de Tierra', estilo: 'APA', abv: 5.4, ibu: 38, srm: 7, pinta: 6300, media: 3900, notas: 'Cascade y Mosaic: pomelo, pino y caramelo suave.', origen: 'De la casa' },
  { numero: 4, nombre: 'Barrio Parque', estilo: 'IPA', abv: 6.5, ibu: 62, srm: 8, pinta: 6800, media: 4200, notas: 'West Coast bien amarga, resina y cítricos.', origen: 'De la casa' },
  { numero: 5, nombre: 'Niebla del Sur', estilo: 'Hazy', abv: 6.8, ibu: 30, srm: 5, pinta: 7400, media: 4600, notas: 'Turbia y jugosa: mango, durazno y avena.', origen: 'Invitada · Mar del Plata', agotada: true },
  { numero: 6, nombre: 'Doble Turno', estilo: 'IPA', abv: 8.2, ibu: 78, srm: 9, pinta: 7900, media: 4900, notas: 'Doble IPA con Citra y Simcoe. Pegá despacio.', origen: 'De la casa' },
  { numero: 7, nombre: 'Ladrillo', estilo: 'Red', abv: 5.6, ibu: 26, srm: 17, pinta: 6200, media: 3800, notas: 'Irish Red: caramelo, galletita y final tostado.', origen: 'De la casa' },
  { numero: 8, nombre: 'Frambuesa Rota', estilo: 'Sour', abv: 4.2, ibu: 8, srm: 12, pinta: 7200, media: 4400, notas: 'Catharina sour con frambuesas patagónicas.', origen: 'Invitada · El Bolsón' },
  { numero: 9, nombre: 'Medianoche', estilo: 'Stout', abv: 6.2, ibu: 40, srm: 40, pinta: 6900, media: 4300, notas: 'Café, cacao amargo y cuerpo cremoso con nitro.', origen: 'De la casa' },
  { numero: 10, nombre: 'Vagón Negro', estilo: 'Porter', abv: 5.8, ibu: 32, srm: 30, pinta: 6600, media: 4000, notas: 'Robust porter: chocolate con leche y regaliz.', origen: 'De la casa', agotada: true },
  { numero: 11, nombre: 'Ruta 40', estilo: 'Hazy', abv: 7.1, ibu: 35, srm: 6, pinta: 7600, media: 4700, notas: 'NEIPA con Nelson Sauvin: uva blanca y maracuyá.', origen: 'Invitada · Mendoza' },
  { numero: 12, nombre: 'Pulpería', estilo: 'Stout', abv: 9.4, ibu: 55, srm: 38, pinta: 8400, media: 5200, notas: 'Imperial stout con dulce de leche y vainilla.', origen: 'De la casa' },
]

export const ESTILOS: Estilo[] = ['Golden', 'Lager', 'APA', 'IPA', 'Hazy', 'Red', 'Sour', 'Stout', 'Porter']

// Escala SRM de referencia (1 a 40), en hex.
const ESCALA_SRM = [
  '#ffe699', '#ffd878', '#ffca5a', '#ffbf42', '#fbb123', '#f8a600', '#f39c00', '#ea8f00', '#e58500', '#de7c00',
  '#d77200', '#cf6900', '#cb6200', '#c35900', '#bb5100', '#b54c00', '#b04500', '#a63e00', '#a13700', '#9b3200',
  '#952d00', '#8e2900', '#882300', '#821e00', '#7b1a00', '#771900', '#701400', '#6a0e00', '#660d00', '#5e0b00',
  '#5a0a02', '#560a05', '#520907', '#4c0505', '#470606', '#440607', '#3f0708', '#3b0607', '#3a070b', '#36080a',
]

const aRGB = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const aHex = (rgb: number[]) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')

/** Color aproximado de una cerveza según su SRM (interpolando la escala de referencia). */
export function srmAHex(srm: number): string {
  if (!Number.isFinite(srm)) throw new Error('SRM inválido')
  const s = Math.min(40, Math.max(1, srm))
  const abajo = Math.floor(s)
  const arriba = Math.min(40, abajo + 1)
  const t = s - abajo
  const a = aRGB(ESCALA_SRM[abajo - 1])
  const b = aRGB(ESCALA_SRM[arriba - 1])
  return aHex(a.map((c, i) => c + (b[i] - c) * t))
}

/** ¿El texto encima del color va claro u oscuro? */
export function esOscura(srm: number): boolean {
  const [r, g, b] = aRGB(srmAHex(srm))
  return 0.299 * r + 0.587 * g + 0.114 * b < 140
}

// ---------- Filtros ----------

export interface Filtro {
  estilos: Estilo[]
  ibu: [number, number]
  abv: [number, number]
}

export const LIMITES = { ibu: [0, 80] as [number, number], abv: [4, 10] as [number, number] }

export const filtroInicial = (): Filtro => ({ estilos: [], ibu: [...LIMITES.ibu], abv: [...LIMITES.abv] })

export function filtrar(lista: Canilla[], f: Filtro): Canilla[] {
  return lista.filter(
    (c) =>
      (f.estilos.length === 0 || f.estilos.includes(c.estilo)) &&
      c.ibu >= f.ibu[0] &&
      c.ibu <= f.ibu[1] &&
      c.abv >= f.abv[0] &&
      c.abv <= f.abv[1],
  )
}

export type Orden = 'canilla' | 'nombre' | 'abv' | 'ibu'

/** Ordena sin mutar. ABV e IBU de mayor a menor; las agotadas siempre al final. */
export function ordenar(lista: Canilla[], orden: Orden): Canilla[] {
  const cmp: Record<Orden, (a: Canilla, b: Canilla) => number> = {
    canilla: (a, b) => a.numero - b.numero,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
    abv: (a, b) => b.abv - a.abv || a.numero - b.numero,
    ibu: (a, b) => b.ibu - a.ibu || a.numero - b.numero,
  }
  return [...lista].sort((a, b) => Number(!!a.agotada) - Number(!!b.agotada) || cmp[orden](a, b))
}

export function alternarEstilo(estilos: Estilo[], e: Estilo): Estilo[] {
  return estilos.includes(e) ? estilos.filter((x) => x !== e) : [...estilos, e]
}

// ---------- Vuelo de degustación ----------

export const TAMANIO_VUELO = 4

/** Agrega o saca una canilla del vuelo. Tira error si está agotada o el vuelo ya está lleno. */
export function alternarVuelo(vuelo: number[], c: Canilla): number[] {
  if (vuelo.includes(c.numero)) return vuelo.filter((n) => n !== c.numero)
  if (c.agotada) throw new Error(`${c.nombre} está agotada`)
  if (vuelo.length >= TAMANIO_VUELO) throw new Error(`El vuelo lleva ${TAMANIO_VUELO} cervezas: sacá una para sumar otra`)
  return [...vuelo, c.numero]
}

export const vueloCompleto = (vuelo: number[]) => vuelo.length === TAMANIO_VUELO

const redondear100 = (n: number) => Math.round(n / 100) * 100

/** Una probeta de 150 ml cuesta un tercio de la pinta, redondeado a $100. */
export function precioProbeta(c: Canilla): number {
  return redondear100(c.pinta / 3)
}

/** El vuelo completo tiene 10 % de descuento sobre las cuatro probetas. */
export function precioVuelo(vuelo: number[], lista: Canilla[] = CANILLAS): number {
  const suma = vuelo.reduce((s, n) => s + precioProbeta(lista.find((c) => c.numero === n)!), 0)
  return vueloCompleto(vuelo) ? redondear100(suma * 0.9) : suma
}

// ---------- Horarios ----------

/** Abrimos martes a domingo de 17 a 1. Happy hour martes a viernes de 17 a 20. */
export function estadoTaproom(d: Date): 'happy' | 'abierto' | 'cerrado' {
  const h = d.getHours()
  const dia = d.getDay()
  // De 0 a 1 todavía cuenta como la noche anterior.
  if (h < 1) return (dia + 6) % 7 === 1 ? 'cerrado' : 'abierto'
  if (dia === 1 || h < 17) return 'cerrado'
  if (dia >= 2 && dia <= 5 && h < 20) return 'happy'
  return 'abierto'
}

/** En happy hour Golden y Lager tienen la pinta a $4.500. */
export const PRECIO_HAPPY = 4500
