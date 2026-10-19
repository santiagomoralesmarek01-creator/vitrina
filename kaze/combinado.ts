// Lógica del armador de combinados de Kaze (sin DOM).

export type Tamanio = 15 | 30 | 45
export type Dibujo = 'nigiri' | 'uramaki' | 'hot' | 'sashimi' | 'geisha' | 'acevichado' | 'hosomaki'

export interface Pieza {
  id: string
  nombre: string
  detalle: string
  /** Precio por pieza suelta, en pesos. */
  precio: number
  dibujo: Dibujo
  /** Color principal (para el dibujo y la leyenda). */
  color: string
}

export const PIEZAS: Pieza[] = [
  { id: 'nigiri-salmon', nombre: 'Nigiri de salmón', detalle: 'Salmón rosado sobre arroz de shari tibio.', precio: 2300, dibujo: 'nigiri', color: '#f08a5d' },
  { id: 'nigiri-blanca', nombre: 'Nigiri de pesca blanca', detalle: 'Pesca del día, ralladura de lima y sal en escamas.', precio: 2100, dibujo: 'nigiri', color: '#f3e3d6' },
  { id: 'sashimi', nombre: 'Sashimi de salmón', detalle: 'Corte grueso, sin arroz.', precio: 2500, dibujo: 'sashimi', color: '#ef7d4f' },
  { id: 'philadelphia', nombre: 'Uramaki Philadelphia', detalle: 'Salmón, queso crema y palta, con sésamo.', precio: 1800, dibujo: 'uramaki', color: '#f6efe2' },
  { id: 'geisha', nombre: 'Geisha', detalle: 'Envuelto en salmón, relleno de queso y palta.', precio: 2200, dibujo: 'geisha', color: '#ee8152' },
  { id: 'hot', nombre: 'Hot roll', detalle: 'Rebozado en panko y frito, con salsa tare.', precio: 1900, dibujo: 'hot', color: '#c98a3a' },
  { id: 'acevichado', nombre: 'Nikkei acevichado', detalle: 'Langostino furai, topping de salmón y leche de tigre.', precio: 2400, dibujo: 'acevichado', color: '#f2a03d' },
  { id: 'kappa', nombre: 'Hosomaki de pepino', detalle: 'Rollo fino de alga con pepino y sésamo. Veggie.', precio: 1400, dibujo: 'hosomaki', color: '#7fae5a' },
]

/** Descuento que se aplica cuando la bandeja está completa. */
export const TAMANIOS: Record<Tamanio, { descuento: number; columnas: number }> = {
  15: { descuento: 0.1, columnas: 5 },
  30: { descuento: 0.12, columnas: 6 },
  45: { descuento: 0.15, columnas: 9 },
}

export const TAMANIOS_LISTA: Tamanio[] = [15, 30, 45]

export interface Combinado {
  tamanio: Tamanio
  /** Una entrada por pieza, en el orden en que se agregaron. */
  piezas: string[]
}

export const combinadoVacio = (tamanio: Tamanio = 30): Combinado => ({ tamanio, piezas: [] })

const pieza = (id: string): Pieza => {
  const p = PIEZAS.find((x) => x.id === id)
  if (!p) throw new Error(`No existe la pieza "${id}"`)
  return p
}

export const cantidad = (c: Combinado, id: string) => c.piezas.filter((x) => x === id).length
export const faltan = (c: Combinado) => c.tamanio - c.piezas.length
export const completo = (c: Combinado) => faltan(c) === 0

export function sumar(c: Combinado, id: string): Combinado {
  pieza(id)
  if (completo(c)) throw new Error(`La bandeja ya tiene sus ${c.tamanio} piezas`)
  return { ...c, piezas: [...c.piezas, id] }
}

/** Saca la última pieza agregada de ese tipo. */
export function restar(c: Combinado, id: string): Combinado {
  const i = c.piezas.lastIndexOf(id)
  if (i === -1) return c
  return { ...c, piezas: [...c.piezas.slice(0, i), ...c.piezas.slice(i + 1)] }
}

export function cambiarTamanio(c: Combinado, tamanio: Tamanio): Combinado {
  if (c.piezas.length > tamanio) {
    const sobran = c.piezas.length - tamanio
    throw new Error(`Para pasar a ${tamanio} piezas sacá ${sobran} ${sobran === 1 ? 'pieza' : 'piezas'}`)
  }
  return { ...c, tamanio }
}

/** Completa lo que falta repartiendo entre las piezas elegidas (o las clásicas si está vacía). */
export function completarAlAzar(c: Combinado, azar: () => number = Math.random): Combinado {
  const base = c.piezas.length ? [...new Set(c.piezas)] : ['nigiri-salmon', 'philadelphia', 'geisha', 'hot']
  let r = c
  while (!completo(r)) r = sumar(r, base[Math.floor(azar() * base.length) % base.length])
  return r
}

const redondear = (n: number) => Math.round(n / 100) * 100

export const subtotal = (c: Combinado) => c.piezas.reduce((s, id) => s + pieza(id).precio, 0)

export const descuento = (c: Combinado) => (completo(c) ? redondear(subtotal(c) * TAMANIOS[c.tamanio].descuento) : 0)

export const total = (c: Combinado) => subtotal(c) - descuento(c)

/** "te faltan 3 piezas", "te falta 1 pieza" o "¡bandeja completa!" */
export function estado(c: Combinado): string {
  const n = faltan(c)
  if (n === 0) return '¡Bandeja completa!'
  if (n === c.tamanio) return `Elegí ${c.tamanio} piezas`
  return n === 1 ? 'Te falta 1 pieza' : `Te faltan ${n} piezas`
}

/** Cantidades por tipo, en el orden de la carta. */
export function resumen(c: Combinado): { pieza: Pieza; cantidad: number }[] {
  return PIEZAS.map((p) => ({ pieza: p, cantidad: cantidad(c, p.id) })).filter((x) => x.cantidad > 0)
}

export const WHATSAPP = '5491150000000'

export function mensajePedido(c: Combinado, formato: (n: number) => string): string {
  const lineas = resumen(c).map(({ pieza, cantidad }) => `• ${cantidad} × ${pieza.nombre}`)
  return [
    `Hola Kaze, quiero un combinado de ${c.tamanio} piezas:`,
    ...lineas,
    `Total: ${formato(total(c))}`,
  ].join('\n')
}

export function linkWhatsApp(c: Combinado, formato: (n: number) => string): string {
  if (!completo(c)) throw new Error('Completá la bandeja antes de pedir')
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensajePedido(c, formato))}`
}

// ---------- Carta ----------

export type Etiqueta = 'crudo' | 'cocido' | 'veggie' | 'sintacc'

export interface Plato {
  id: string
  nombre: string
  japones: string
  detalle: string
  precio: number
  etiquetas: Etiqueta[]
}

export const PLATOS: Plato[] = [
  { id: 'tiradito', nombre: 'Tiradito nikkei', japones: '刺身', detalle: 'Pesca blanca, leche de tigre de ají amarillo, choclo y cebolla morada.', precio: 15800, etiquetas: ['crudo', 'sintacc'] },
  { id: 'ceviche', nombre: 'Ceviche de salmón', japones: '鮭', detalle: 'Salmón, maracuyá, palta, cancha crocante y cilantro.', precio: 17200, etiquetas: ['crudo', 'sintacc'] },
  { id: 'tataki', nombre: 'Tataki de atún', japones: '叩き', detalle: 'Atún sellado, ponzu cítrico, nabo y cebolla de verdeo.', precio: 19500, etiquetas: ['crudo'] },
  { id: 'gyozas', nombre: 'Gyozas de cerdo', japones: '餃子', detalle: 'Seis unidades, a la plancha, con salsa de soja y vinagre de arroz.', precio: 11900, etiquetas: ['cocido'] },
  { id: 'gyozas-hongos', nombre: 'Gyozas de hongos', japones: '茸', detalle: 'Shiitake, portobello y repollo. Seis unidades.', precio: 11400, etiquetas: ['cocido', 'veggie'] },
  { id: 'langostinos', nombre: 'Langostinos furai', japones: '海老', detalle: 'Rebozados en panko, con mayo de ají limo.', precio: 16900, etiquetas: ['cocido'] },
  { id: 'robata', nombre: 'Pulpo a la robata', japones: '蛸', detalle: 'Pulpo grillado al carbón, papa amarilla y salsa anticuchera.', precio: 24800, etiquetas: ['cocido', 'sintacc'] },
  { id: 'edamame', nombre: 'Edamame', japones: '枝豆', detalle: 'Vainas de soja al vapor con sal marina y togarashi.', precio: 6900, etiquetas: ['cocido', 'veggie', 'sintacc'] },
  { id: 'yasai', nombre: 'Yasai roll', japones: '野菜', detalle: 'Palta, mango, pepino y queso crema, con sésamo negro. Ocho piezas.', precio: 12800, etiquetas: ['crudo', 'veggie'] },
  { id: 'chaufa', nombre: 'Arroz chaufa', japones: '炒飯', detalle: 'Arroz salteado al wok con verduras, huevo y langostinos.', precio: 15400, etiquetas: ['cocido'] },
]

export const ETIQUETAS: Record<Etiqueta, string> = {
  crudo: 'Crudo',
  cocido: 'Cocido',
  veggie: 'Veggie',
  sintacc: 'Sin TACC',
}

export interface Filtro {
  /** Crudo y cocido se excluyen entre sí. */
  coccion: 'todo' | 'crudo' | 'cocido'
  veggie: boolean
  sintacc: boolean
}

export const filtroVacio = (): Filtro => ({ coccion: 'todo', veggie: false, sintacc: false })

export function filtrar(platos: Plato[], f: Filtro): Plato[] {
  return platos.filter(
    (p) =>
      (f.coccion === 'todo' || p.etiquetas.includes(f.coccion)) &&
      (!f.veggie || p.etiquetas.includes('veggie')) &&
      (!f.sintacc || p.etiquetas.includes('sintacc')),
  )
}

// ---------- Omakase ----------

export const OMAKASE = {
  precio: 72000,
  lugares: 8,
  pasos: [
    'Sopa dashi de hongos',
    'Tiradito de pesca blanca con yuzu',
    'Nigiri de langostino flambeado',
    'Toro curado en kombu',
    'Ceviche caliente de vieiras',
    'Gunkan de huevas y quinoa crocante',
    'Pesca del día a la robata',
    'Temaki de la casa',
    'Mochi de maracuyá',
  ],
}

/** Valida la cantidad de comensales para la barra (entre 1 y los lugares libres). */
export function precioOmakase(comensales: number, libres: number): number {
  if (!Number.isInteger(comensales) || comensales < 1) throw new Error('Elegí al menos un comensal')
  if (comensales > libres) throw new Error(libres === 1 ? 'Queda 1 lugar en la barra' : `Quedan ${libres} lugares en la barra`)
  return comensales * OMAKASE.precio
}
