export interface Sabor {
  id: string
  nombre: string
  detalle: string
  origen: 'Salteña' | 'Tucumana' | 'De la casa'
  /** La árabe es triangular y abierta; el resto, media luna con repulgue. */
  forma: 'media-luna' | 'triangulo'
  picante?: boolean
  dulce?: boolean
}

export const SABORES: Sabor[] = [
  { id: 'cuchillo', nombre: 'Carne a cuchillo', detalle: 'Matambre cortado a cuchillo, cebolla de verdeo, comino y huevo.', origen: 'Tucumana', forma: 'media-luna' },
  { id: 'picante', nombre: 'Carne picante', detalle: 'Carne, papa, huevo y ají molido de Cachi. Pica de verdad.', origen: 'Salteña', forma: 'media-luna', picante: true },
  { id: 'pollo', nombre: 'Pollo', detalle: 'Pollo desmenuzado, morrón asado, papa y pimentón.', origen: 'Salteña', forma: 'media-luna' },
  { id: 'humita', nombre: 'Humita', detalle: 'Choclo rallado, zapallo anco, albahaca y queso de cabra.', origen: 'Salteña', forma: 'media-luna' },
  { id: 'jyq', nombre: 'Jamón y queso', detalle: 'Jamón cocido natural y muzzarella. La que nunca falla.', origen: 'De la casa', forma: 'media-luna' },
  { id: 'verdura', nombre: 'Verdura', detalle: 'Acelga, salsa blanca, nuez moscada y queso rallado.', origen: 'De la casa', forma: 'media-luna' },
  { id: 'caprese', nombre: 'Caprese', detalle: 'Tomate, muzzarella y albahaca fresca.', origen: 'De la casa', forma: 'media-luna' },
  { id: 'cebolla', nombre: 'Cebolla y queso', detalle: 'Cebolla caramelizada despacio, queso y orégano.', origen: 'De la casa', forma: 'media-luna' },
  { id: 'arabe', nombre: 'Árabe', detalle: 'Abierta: carne, tomate, cebolla y jugo de limón.', origen: 'Tucumana', forma: 'triangulo' },
  { id: 'batata', nombre: 'Dulce de batata', detalle: 'Dulce de batata y queso fresco, con azúcar por arriba.', origen: 'De la casa', forma: 'media-luna', dulce: true },
]

export const PRECIOS = { unidad: 1800, media: 9900, docena: 18000 } as const
export const RECARGO_FRITAS = 0.1
export const MAX_EMPANADAS = 48

export type Coccion = 'horno' | 'fritas'
export type Pedido = Record<string, number>

export const cantidadTotal = (p: Pedido) => Object.values(p).reduce((s, n) => s + n, 0)

/** Suma o resta empanadas de un sabor, sin bajar de cero ni pasar el tope. */
export function sumar(p: Pedido, id: string, delta: number): Pedido {
  const actual = p[id] ?? 0
  const libre = MAX_EMPANADAS - cantidadTotal(p)
  const nuevo = Math.max(0, actual + Math.min(delta, libre))
  const copia = { ...p, [id]: nuevo }
  if (nuevo === 0) delete copia[id]
  return copia
}

export interface Combinacion {
  docenas: number
  medias: number
  sueltas: number
  /** Precio al horno, sin recargo. */
  base: number
}

/**
 * La combinación más barata de docenas, medias docenas y sueltas para exactamente `n` empanadas.
 * Programación dinámica: no asume que conviene siempre la caja más grande.
 */
export function mejorCombinacion(n: number, precios: { unidad: number; media: number; docena: number } = PRECIOS): Combinacion {
  const mejor: Combinacion[] = [{ docenas: 0, medias: 0, sueltas: 0, base: 0 }]
  for (let i = 1; i <= n; i++) {
    const opciones: Combinacion[] = []
    const a = mejor[i - 1]
    opciones.push({ ...a, sueltas: a.sueltas + 1, base: a.base + precios.unidad })
    if (i >= 6) {
      const b = mejor[i - 6]
      opciones.push({ ...b, medias: b.medias + 1, base: b.base + precios.media })
    }
    if (i >= 12) {
      const c = mejor[i - 12]
      opciones.push({ ...c, docenas: c.docenas + 1, base: c.base + precios.docena })
    }
    // A igual precio, la de menos cajas (más fácil de armar).
    opciones.sort((x, y) => x.base - y.base || x.docenas + x.medias + x.sueltas - (y.docenas + y.medias + y.sueltas))
    mejor.push(opciones[0])
  }
  return mejor[n]
}

const redondear = (monto: number) => Math.round(monto / 50) * 50

export const conCoccion = (monto: number, c: Coccion) => (c === 'fritas' ? redondear(monto * (1 + RECARGO_FRITAS)) : monto)

export interface Precio extends Combinacion {
  cantidad: number
  total: number
  /** Lo que costarían todas sueltas, menos el total. */
  ahorro: number
}

export function precio(p: Pedido, coccion: Coccion): Precio {
  const cantidad = cantidadTotal(p)
  const comb = mejorCombinacion(cantidad)
  const total = conCoccion(comb.base, coccion)
  const sueltas = conCoccion(cantidad * PRECIOS.unidad, coccion)
  return { ...comb, cantidad, total, ahorro: sueltas - total }
}

/** Si sumando pocas empanadas más se paga lo mismo o menos, lo avisamos. */
export function sugerencia(cantidad: number): { sumar: number; base: number } | null {
  if (cantidad === 0) return null
  const actual = mejorCombinacion(cantidad).base
  for (let m = cantidad + 1; m <= Math.min(cantidad + 3, MAX_EMPANADAS); m++) {
    const otra = mejorCombinacion(m).base
    if (otra <= actual) return { sumar: m - cantidad, base: otra }
  }
  return null
}

// ---------- Envíos ----------
export interface Zona {
  id: string
  nombre: string
  /** null: no llegamos, sólo retiro. 0: envío gratis. */
  costo: number | null
  minimo: number
  alias?: string[]
}

export const ZONAS: Zona[] = [
  { id: 'almagro', nombre: 'Almagro', costo: 0, minimo: 9900 },
  { id: 'boedo', nombre: 'Boedo', costo: 1500, minimo: 12000 },
  { id: 'balvanera', nombre: 'Balvanera', costo: 1500, minimo: 12000, alias: ['abasto', 'once'] },
  { id: 'villa-crespo', nombre: 'Villa Crespo', costo: 1800, minimo: 12000 },
  { id: 'caballito', nombre: 'Caballito', costo: 1800, minimo: 12000 },
  { id: 'san-cristobal', nombre: 'San Cristóbal', costo: 1800, minimo: 12000 },
  { id: 'palermo', nombre: 'Palermo', costo: 2800, minimo: 18000, alias: ['palermo soho', 'palermo hollywood', 'palermo chico'] },
  { id: 'recoleta', nombre: 'Recoleta', costo: 2800, minimo: 18000, alias: ['barrio norte'] },
  { id: 'parque-patricios', nombre: 'Parque Patricios', costo: 2500, minimo: 18000 },
  { id: 'flores', nombre: 'Flores', costo: null, minimo: 0 },
  { id: 'san-telmo', nombre: 'San Telmo', costo: null, minimo: 0 },
  { id: 'belgrano', nombre: 'Belgrano', costo: null, minimo: 0 },
]

export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/** Encuentra el barrio aunque lo escriban sin tilde, en minúscula o con el sub-barrio ("Palermo Soho"). */
export function buscarZona(texto: string): Zona | undefined {
  const t = normalizar(texto)
  if (t.length < 3) return undefined
  return (
    ZONAS.find((z) => [z.nombre, ...(z.alias ?? [])].some((n) => normalizar(n) === t)) ??
    ZONAS.find((z) => [z.nombre, ...(z.alias ?? [])].some((n) => t.startsWith(normalizar(n) + ' ')))
  )
}

export type Entrega =
  | { tipo: 'retiro' }
  | { tipo: 'sin-barrio' }
  | { tipo: 'no-llegamos'; zona: Zona }
  | { tipo: 'falta-minimo'; zona: Zona; falta: number }
  | { tipo: 'envio'; zona: Zona; costo: number }

export function entrega(modo: 'envio' | 'retiro', zona: Zona | undefined, subtotal: number): Entrega {
  if (modo === 'retiro') return { tipo: 'retiro' }
  if (!zona) return { tipo: 'sin-barrio' }
  if (zona.costo === null) return { tipo: 'no-llegamos', zona }
  if (subtotal < zona.minimo) return { tipo: 'falta-minimo', zona, falta: zona.minimo - subtotal }
  return { tipo: 'envio', zona, costo: zona.costo }
}

/** ¿Se puede mandar el pedido así como está? */
export const pedidoListo = (cantidad: number, e: Entrega) => cantidad > 0 && (e.tipo === 'retiro' || e.tipo === 'envio')

export const costoEnvio = (e: Entrega) => (e.tipo === 'envio' ? e.costo : 0)

// ---------- WhatsApp ----------
export const WHATSAPP = '5491148620000'

export function desglose(c: Combinacion): string {
  const partes: string[] = []
  if (c.docenas) partes.push(`${c.docenas} ${c.docenas === 1 ? 'docena' : 'docenas'}`)
  if (c.medias) partes.push(`${c.medias} ${c.medias === 1 ? 'media docena' : 'medias docenas'}`)
  if (c.sueltas) partes.push(`${c.sueltas} ${c.sueltas === 1 ? 'suelta' : 'sueltas'}`)
  return partes.join(' + ')
}

export function mensajeWhatsApp(
  p: Pedido,
  coccion: Coccion,
  e: Entrega,
  formato: (n: number) => string,
  direccion = '',
): string {
  const pr = precio(p, coccion)
  const lineas = SABORES.filter((s) => p[s.id]).map((s) => `• ${p[s.id]} × ${s.nombre}`)
  const envio = costoEnvio(e)
  const como =
    e.tipo === 'envio'
      ? `Envío a ${e.zona.nombre}${direccion.trim() ? ` (${direccion.trim()})` : ''}: ${envio ? formato(envio) : 'gratis'}`
      : 'Paso a retirar por el local.'
  return [
    '¡Hola, La Norteña! Quiero hacer un pedido:',
    ...lineas,
    `${pr.cantidad} empanadas ${coccion === 'horno' ? 'al horno' : 'fritas'} (${desglose(pr)}): ${formato(pr.total)}`,
    como,
    `Total: ${formato(pr.total + envio)}`,
  ].join('\n')
}

export const linkWhatsApp = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`
