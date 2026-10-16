export interface Categoria {
  id: string
  nombre: string
  ticket: number
  peso: number
}

export const CATEGORIAS: Categoria[] = [
  { id: 'verduras', nombre: 'Frutas y verduras', ticket: 6800, peso: 0.32 },
  { id: 'almacen', nombre: 'Almacén natural', ticket: 9400, peso: 0.24 },
  { id: 'lacteos', nombre: 'Lácteos y huevos', ticket: 7200, peso: 0.16 },
  { id: 'panaderia', nombre: 'Panadería', ticket: 5100, peso: 0.14 },
  { id: 'bebidas', nombre: 'Bebidas', ticket: 4300, peso: 0.08 },
  { id: 'limpieza', nombre: 'Limpieza ecológica', ticket: 8900, peso: 0.06 },
]

export const PRODUCTOS = [
  { id: 'palta', nombre: 'Palta Hass', categoria: 'verduras', precio: 2900 },
  { id: 'tomate', nombre: 'Tomate perita (kg)', categoria: 'verduras', precio: 3400 },
  { id: 'banana', nombre: 'Banana orgánica (kg)', categoria: 'verduras', precio: 2600 },
  { id: 'avena', nombre: 'Avena arrollada', categoria: 'almacen', precio: 3800 },
  { id: 'miel', nombre: 'Miel de monte', categoria: 'almacen', precio: 8900 },
  { id: 'yerba', nombre: 'Yerba agroecológica', categoria: 'almacen', precio: 6200 },
  { id: 'huevos', nombre: 'Huevos de campo (12)', categoria: 'lacteos', precio: 5600 },
  { id: 'yogur', nombre: 'Yogur natural', categoria: 'lacteos', precio: 2700 },
  { id: 'masa-madre', nombre: 'Pan de masa madre', categoria: 'panaderia', precio: 5200 },
  { id: 'kombucha', nombre: 'Kombucha de jengibre', categoria: 'bebidas', precio: 3300 },
  { id: 'detergente', nombre: 'Detergente biodegradable', categoria: 'limpieza', precio: 4800 },
] as const

export interface Dia {
  fecha: Date
  pedidos: number
  ingresos: number
  clientesNuevos: number
  porCategoria: Record<string, number>
  porProducto: Record<string, number>
}

function rng(semilla: number) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 180 días de ventas inventadas pero creíbles: más los fines de semana y con tendencia en alza. */
export function generarDias(hasta: Date, cantidad = 180, semilla = 42): Dia[] {
  const r = rng(semilla)
  const dias: Dia[] = []
  for (let i = cantidad - 1; i >= 0; i--) {
    const fecha = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() - i)
    const finde = fecha.getDay() === 0 || fecha.getDay() === 6 ? 1.45 : fecha.getDay() === 1 ? 0.8 : 1
    const tendencia = 1 + (cantidad - i) / cantidad / 2.5
    const pedidos = Math.round((38 + r() * 14) * finde * tendencia)
    const porCategoria: Record<string, number> = {}
    let ingresos = 0
    for (const c of CATEGORIAS) {
      const monto = Math.round((pedidos * c.peso * c.ticket * (0.85 + r() * 0.3)) / 100) * 100
      porCategoria[c.id] = monto
      ingresos += monto
    }
    const porProducto: Record<string, number> = {}
    for (const p of PRODUCTOS) porProducto[p.id] = Math.round(pedidos * (0.08 + r() * 0.12) * (p.categoria === 'verduras' ? 1.6 : 1))
    dias.push({ fecha, pedidos, ingresos, clientesNuevos: Math.round(pedidos * (0.08 + r() * 0.06)), porCategoria, porProducto })
  }
  return dias
}

export interface Resumen {
  ingresos: number
  pedidos: number
  ticket: number
  clientesNuevos: number
}

export function resumir(dias: Dia[]): Resumen {
  const ingresos = dias.reduce((s, d) => s + d.ingresos, 0)
  const pedidos = dias.reduce((s, d) => s + d.pedidos, 0)
  return { ingresos, pedidos, ticket: pedidos ? Math.round(ingresos / pedidos) : 0, clientesNuevos: dias.reduce((s, d) => s + d.clientesNuevos, 0) }
}

/** Los últimos n días y los n anteriores, para comparar. */
export function periodos(dias: Dia[], n: number) {
  return { actual: dias.slice(-n), anterior: dias.slice(-2 * n, -n) }
}

/** Variación porcentual con un decimal; null si no hay base para comparar. */
export function variacion(actual: number, anterior: number): number | null {
  if (!anterior) return null
  return Math.round(((actual - anterior) / anterior) * 1000) / 10
}

export function porCategoria(dias: Dia[]) {
  return CATEGORIAS.map((c) => ({ ...c, total: dias.reduce((s, d) => s + d.porCategoria[c.id], 0) })).sort((a, b) => b.total - a.total)
}

export function topProductos(actual: Dia[], anterior: Dia[]) {
  return PRODUCTOS.map((p) => {
    const unidades = actual.reduce((s, d) => s + d.porProducto[p.id], 0)
    const antes = anterior.reduce((s, d) => s + d.porProducto[p.id], 0)
    return { ...p, unidades, ingresos: unidades * p.precio, variacion: variacion(unidades, antes) }
  })
}

/** Escala "linda" para un eje: tope redondo y 4 o 5 marcas. */
export function escala(maximo: number): number[] {
  if (maximo <= 0) return [0]
  const crudo = maximo / 4
  const potencia = 10 ** Math.floor(Math.log10(crudo))
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo)!
  const marcas = []
  for (let v = 0; v <= maximo + paso * 0.999; v += paso) marcas.push(Math.round(v))
  return marcas
}
