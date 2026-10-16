export type Tamanio = 'chica' | 'grande'
export type Mitad = 'izq' | 'der'

export const TAMANIOS: Record<Tamanio, { nombre: string; porciones: number; base: number }> = {
  chica: { nombre: 'Chica', porciones: 4, base: 9500 },
  grande: { nombre: 'Grande', porciones: 8, base: 14500 },
}

export interface Ingrediente {
  id: string
  nombre: string
  precio: number
  color: string
  forma: 'circulo' | 'tira' | 'hoja' | 'anillo' | 'cuadrado'
}

export const INGREDIENTES: Ingrediente[] = [
  { id: 'jamon', nombre: 'Jamón cocido', precio: 2600, color: '#e8a3a0', forma: 'cuadrado' },
  { id: 'calabresa', nombre: 'Calabresa', precio: 2900, color: '#b3362b', forma: 'circulo' },
  { id: 'morron', nombre: 'Morrón asado', precio: 1800, color: '#d84a2f', forma: 'tira' },
  { id: 'aceitunas', nombre: 'Aceitunas negras', precio: 1500, color: '#2a2622', forma: 'anillo' },
  { id: 'cebolla', nombre: 'Cebolla', precio: 1200, color: '#f3e7f0', forma: 'anillo' },
  { id: 'champi', nombre: 'Champiñones', precio: 2200, color: '#c9ab85', forma: 'circulo' },
  { id: 'rucula', nombre: 'Rúcula', precio: 1900, color: '#4f8a3a', forma: 'hoja' },
  { id: 'tomate', nombre: 'Tomate en rodajas', precio: 1400, color: '#e5452f', forma: 'circulo' },
  { id: 'albahaca', nombre: 'Albahaca', precio: 900, color: '#2f7d4a', forma: 'hoja' },
]

export const MAX_POR_MITAD = 5

export interface Pizza {
  tamanio: Tamanio
  mitades: boolean
  /** Ingredientes de cada mitad. Si no es mitad y mitad, se usa solo 'izq' para toda la pizza. */
  izq: string[]
  der: string[]
}

export const pizzaVacia = (): Pizza => ({ tamanio: 'grande', mitades: false, izq: [], der: [] })

/** Agrega o saca un ingrediente de una mitad (o de toda la pizza). */
export function alternar(p: Pizza, mitad: Mitad, id: string): Pizza {
  const lado = p.mitades ? mitad : 'izq'
  const actual = p[lado]
  if (actual.includes(id)) return { ...p, [lado]: actual.filter((x) => x !== id) }
  if (actual.length >= MAX_POR_MITAD) throw new Error(`Hasta ${MAX_POR_MITAD} ingredientes ${p.mitades ? 'por mitad' : ''}`.trim())
  return { ...p, [lado]: [...actual, id] }
}

/** Al pasar a mitad y mitad, las dos mitades arrancan con lo que ya tenía la pizza. */
export function cambiarMitades(p: Pizza, mitades: boolean): Pizza {
  if (mitades === p.mitades) return p
  return mitades ? { ...p, mitades, der: [...p.izq] } : { ...p, mitades, der: [] }
}

/** En mitad y mitad cada ingrediente cubre media pizza, así que cuesta la mitad (redondeado a $50). */
export function precio(p: Pizza): number {
  const porId = (id: string) => INGREDIENTES.find((i) => i.id === id)!.precio
  const factor = p.tamanio === 'grande' ? 1.5 : 1
  const extra = p.mitades
    ? [...p.izq, ...p.der].reduce((s, id) => s + Math.round((porId(id) * factor) / 2 / 50) * 50, 0)
    : p.izq.reduce((s, id) => s + Math.round((porId(id) * factor) / 50) * 50, 0)
  return TAMANIOS[p.tamanio].base + extra
}

export function descripcion(p: Pizza): string {
  const nombres = (ids: string[]) =>
    ids.length ? ids.map((id) => INGREDIENTES.find((i) => i.id === id)!.nombre.toLowerCase()).join(', ') : 'solo muzzarella'
  const tam = TAMANIOS[p.tamanio].nombre
  return p.mitades
    ? `${tam} mitad y mitad: una mitad con ${nombres(p.izq)} y la otra con ${nombres(p.der)}`
    : `${tam} con ${nombres(p.izq)}`
}

export const CLASICAS: { id: string; nombre: string; detalle: string; ingredientes: string[] }[] = [
  { id: 'margherita', nombre: 'Margherita', detalle: 'Tomate, muzzarella de búfala y albahaca fresca.', ingredientes: ['albahaca'] },
  { id: 'napolitana', nombre: 'Napolitana', detalle: 'Rodajas de tomate, ajo y orégano.', ingredientes: ['tomate'] },
  { id: 'calabresa', nombre: 'Calabresa', detalle: 'Longaniza calabresa y un toque de ají.', ingredientes: ['calabresa'] },
  { id: 'especial', nombre: 'Especial', detalle: 'Jamón, morrón asado y aceitunas negras.', ingredientes: ['jamon', 'morron', 'aceitunas'] },
  { id: 'fugazzeta', nombre: 'Fugazzeta', detalle: 'Cebolla dorada y mucha muzzarella.', ingredientes: ['cebolla'] },
  { id: 'rucula', nombre: 'Rúcula y champis', detalle: 'Champiñones salteados y rúcula fresca al salir del horno.', ingredientes: ['champi', 'rucula'] },
]

/** Generador pseudoaleatorio con semilla: los ingredientes caen siempre en el mismo lugar. */
export function sembrado(semilla: number) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
