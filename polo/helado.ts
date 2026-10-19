// Lógica de la heladería Polo Sur (sin DOM): envases, sabores, filtros y pedido.

export type EnvaseId = 'cucurucho' | 'cuarto' | 'medio' | 'kilo'
export type Categoria = 'crema' | 'agua' | 'ddl' | 'chocolate'

export interface Envase {
  id: EnvaseId
  nombre: string
  corto: string
  maxSabores: number
  precio: number
  /** El cucurucho de oblea tiene TACC; los potes no. */
  sinTacc: boolean
}

export const ENVASES: Envase[] = [
  { id: 'cucurucho', nombre: 'Cucurucho', corto: 'Cucurucho', maxSabores: 2, precio: 5800, sinTacc: false },
  { id: 'cuarto', nombre: '¼ kg', corto: 'Cuarto', maxSabores: 3, precio: 9900, sinTacc: true },
  { id: 'medio', nombre: '½ kg', corto: 'Medio', maxSabores: 4, precio: 17500, sinTacc: true },
  { id: 'kilo', nombre: '1 kg', corto: 'Kilo', maxSabores: 4, precio: 31000, sinTacc: true },
]

export interface Sabor {
  id: string
  nombre: string
  color: string
  categoria: Categoria
  sinTacc: boolean
  vegano: boolean
  /** Color de las chispas o trocitos, si tiene. */
  chispas?: string
}

export const SABORES: Sabor[] = [
  { id: 'frutilla-crema', nombre: 'Frutilla a la crema', color: '#ffb3c7', categoria: 'crema', sinTacc: true, vegano: false, chispas: '#e8506f' },
  { id: 'americana', nombre: 'Crema americana', color: '#fff4dc', categoria: 'crema', sinTacc: true, vegano: false },
  { id: 'menta', nombre: 'Menta granizada', color: '#b8f0dc', categoria: 'crema', sinTacc: true, vegano: false, chispas: '#5a3a2e' },
  { id: 'pistacho', nombre: 'Pistacho', color: '#d3eba6', categoria: 'crema', sinTacc: true, vegano: false, chispas: '#8fb35a' },
  { id: 'sambayon', nombre: 'Sambayón', color: '#ffe199', categoria: 'crema', sinTacc: true, vegano: false },
  { id: 'higos', nombre: 'Higos al malbec', color: '#e4b6e6', categoria: 'crema', sinTacc: true, vegano: false, chispas: '#8e3f7a' },
  { id: 'limon', nombre: 'Limón', color: '#f6f5a8', categoria: 'agua', sinTacc: true, vegano: true },
  { id: 'frutilla-agua', nombre: 'Frutilla al agua', color: '#ff9db0', categoria: 'agua', sinTacc: true, vegano: true },
  { id: 'maracuya', nombre: 'Maracuyá', color: '#ffd37e', categoria: 'agua', sinTacc: true, vegano: true, chispas: '#4a3a2a' },
  { id: 'frutos-rojos', nombre: 'Frutos rojos', color: '#d7a6e6', categoria: 'agua', sinTacc: true, vegano: true, chispas: '#9b3d6e' },
  { id: 'ddl', nombre: 'Dulce de leche', color: '#e2b07f', categoria: 'ddl', sinTacc: true, vegano: false },
  { id: 'ddl-granizado', nombre: 'DDL granizado', color: '#e8bd92', categoria: 'ddl', sinTacc: true, vegano: false, chispas: '#5a3a2e' },
  { id: 'tramontana', nombre: 'Tramontana', color: '#f1cfa4', categoria: 'ddl', sinTacc: false, vegano: false, chispas: '#6b4532' },
  { id: 'chocolate', nombre: 'Chocolate amargo', color: '#b9846e', categoria: 'chocolate', sinTacc: true, vegano: false },
  { id: 'choco-almendras', nombre: 'Chocolate con almendras', color: '#c79a82', categoria: 'chocolate', sinTacc: true, vegano: false, chispas: '#f3dcb9' },
  { id: 'choco-vegano', nombre: 'Chocolate vegano', color: '#a9806c', categoria: 'chocolate', sinTacc: true, vegano: true },
]

export const CATEGORIAS: Record<Categoria, string> = {
  crema: 'Cremas',
  agua: 'Al agua',
  ddl: 'Dulce de leche',
  chocolate: 'Chocolates',
}

export const SABOR_SEMANA = {
  id: 'higos',
  historia: 'Higos de Mendoza en almíbar de malbec sobre crema de queso suave. Sale sólo hasta el domingo.',
}

const envase = (id: EnvaseId) => ENVASES.find((e) => e.id === id)!
export const sabor = (id: string): Sabor => {
  const s = SABORES.find((x) => x.id === id)
  if (!s) throw new Error(`No tenemos el sabor "${id}"`)
  return s
}

// ---------- Helado que se está armando ----------

export interface Helado {
  envase: EnvaseId
  sabores: string[]
}

export const heladoVacio = (e: EnvaseId = 'cuarto'): Helado => ({ envase: e, sabores: [] })

export const maxSabores = (h: Helado) => envase(h.envase).maxSabores
export const lleno = (h: Helado) => h.sabores.length >= maxSabores(h)

/** Suma el sabor, o lo saca si ya estaba. Avisa con un mensaje amable si no entra. */
export function alternarSabor(h: Helado, id: string): Helado {
  sabor(id)
  if (h.sabores.includes(id)) return quitarSabor(h, id)
  if (lleno(h)) {
    const e = envase(h.envase)
    const donde = e.id === 'cucurucho' ? 'el cucurucho' : `el pote de ${e.nombre}`
    throw new Error(`En ${donde} entran hasta ${e.maxSabores} sabores. Sacá uno para probar otro.`)
  }
  return { ...h, sabores: [...h.sabores, id] }
}

export const quitarSabor = (h: Helado, id: string): Helado => ({ ...h, sabores: h.sabores.filter((x) => x !== id) })

/** Cambia el envase; si entran menos sabores, se quedan los primeros que elegiste. */
export function cambiarEnvase(h: Helado, e: EnvaseId): { helado: Helado; quitados: string[] } {
  const max = envase(e).maxSabores
  return { helado: { envase: e, sabores: h.sabores.slice(0, max) }, quitados: h.sabores.slice(max) }
}

export const aptoCeliacos = (h: Helado) => envase(h.envase).sinTacc && h.sabores.every((id) => sabor(id).sinTacc)
export const vegano = (h: Helado) => h.sabores.length > 0 && h.sabores.every((id) => sabor(id).vegano)

export const precioHelado = (h: Helado) => envase(h.envase).precio

export function describir(h: Helado): string {
  const e = envase(h.envase)
  const nombres = h.sabores.map((id) => sabor(id).nombre.toLowerCase())
  const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : (nombres[0] ?? 'sin sabores')
  return `${e.nombre === 'Cucurucho' ? 'Cucurucho' : `Pote de ${e.nombre}`} de ${lista}`
}

// ---------- Filtros ----------

export interface Filtro {
  categoria: Categoria | 'todas'
  sinTacc: boolean
  vegano: boolean
}

export const filtroVacio = (): Filtro => ({ categoria: 'todas', sinTacc: false, vegano: false })

export function filtrarSabores(lista: Sabor[], f: Filtro): Sabor[] {
  return lista.filter(
    (s) => (f.categoria === 'todas' || s.categoria === f.categoria) && (!f.sinTacc || s.sinTacc) && (!f.vegano || s.vegano),
  )
}

// ---------- Pedido ----------

export type Entrega = 'retiro' | 'envio'
export const ENVIO = 2500
/** Desde este monto el envío es gratis. */
export const ENVIO_GRATIS = 40000

export interface Pedido {
  helados: Helado[]
  entrega: Entrega
}

export const pedidoVacio = (): Pedido => ({ helados: [], entrega: 'retiro' })

export function sumarAlPedido(p: Pedido, h: Helado): Pedido {
  if (h.sabores.length === 0) throw new Error('Elegí al menos un sabor')
  if (p.helados.length >= 10) throw new Error('Para más de 10 helados escribinos y lo armamos juntos')
  return { ...p, helados: [...p.helados, { envase: h.envase, sabores: [...h.sabores] }] }
}

export const quitarDelPedido = (p: Pedido, i: number): Pedido => ({ ...p, helados: p.helados.filter((_, k) => k !== i) })

export const subtotal = (p: Pedido) => p.helados.reduce((s, h) => s + precioHelado(h), 0)

export function costoEnvio(p: Pedido): number {
  if (p.entrega === 'retiro' || p.helados.length === 0) return 0
  return subtotal(p) >= ENVIO_GRATIS ? 0 : ENVIO
}

export const total = (p: Pedido) => subtotal(p) + costoEnvio(p)

export const WHATSAPP = '5491160000000'

export function mensajePedido(p: Pedido, formato: (n: number) => string): string {
  const lineas = p.helados.map((h) => `• ${describir(h)} (${formato(precioHelado(h))})`)
  const entrega = p.entrega === 'retiro' ? 'Lo paso a buscar por el local.' : `Envío a domicilio${costoEnvio(p) ? ` (${formato(costoEnvio(p))})` : ' (gratis)'}.`
  return ['¡Hola Polo Sur! Quiero pedir:', ...lineas, entrega, `Total: ${formato(total(p))}`].join('\n')
}

export function linkWhatsApp(p: Pedido, formato: (n: number) => string): string {
  if (p.helados.length === 0) throw new Error('Tu pedido está vacío')
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensajePedido(p, formato))}`
}
