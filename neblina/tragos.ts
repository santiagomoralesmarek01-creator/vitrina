export type Base = 'gin' | 'ron' | 'whisky' | 'aperitivo' | 'sin-alcohol'
export type Momento = 'charlar' | 'bailar' | 'cerrar'

export interface Perfil {
  dulce: number
  acido: number
  amargo: number
  fuerza: number
}

export interface Trago {
  id: string
  nombre: string
  base: Base
  ingredientes: string
  precio: number
  perfil: Perfil
  momentos: Momento[]
  de_la_casa?: boolean
}

export const BASES: Record<Base, string> = {
  gin: 'Gin',
  ron: 'Ron',
  whisky: 'Whisky',
  aperitivo: 'Aperitivos',
  'sin-alcohol': 'Sin alcohol',
}

export const TRAGOS: Trago[] = [
  { id: 'neblina', nombre: 'Neblina', base: 'gin', ingredientes: 'Gin, lavanda, limón, clara y niebla de humo de romero.', precio: 9800, perfil: { dulce: 2, acido: 4, amargo: 1, fuerza: 3 }, momentos: ['charlar'], de_la_casa: true },
  { id: 'negroni', nombre: 'Negroni', base: 'gin', ingredientes: 'Gin, Campari y vermut rosso.', precio: 8900, perfil: { dulce: 2, acido: 1, amargo: 5, fuerza: 5 }, momentos: ['cerrar', 'charlar'] },
  { id: 'gin-tonic', nombre: 'Gin tonic de pomelo', base: 'gin', ingredientes: 'Gin, tónica, pomelo rosado y pimienta rosa.', precio: 8200, perfil: { dulce: 2, acido: 3, amargo: 3, fuerza: 2 }, momentos: ['charlar', 'bailar'] },
  { id: 'mojito', nombre: 'Mojito', base: 'ron', ingredientes: 'Ron blanco, menta, lima, azúcar y soda.', precio: 7900, perfil: { dulce: 3, acido: 4, amargo: 1, fuerza: 2 }, momentos: ['bailar'] },
  { id: 'daiquiri', nombre: 'Daiquiri de maracuyá', base: 'ron', ingredientes: 'Ron, maracuyá fresco, lima y almíbar.', precio: 8500, perfil: { dulce: 4, acido: 4, amargo: 1, fuerza: 3 }, momentos: ['bailar'] },
  { id: 'old-fashioned', nombre: 'Old fashioned', base: 'whisky', ingredientes: 'Bourbon, azúcar, amargo de angostura y piel de naranja.', precio: 9900, perfil: { dulce: 3, acido: 1, amargo: 3, fuerza: 5 }, momentos: ['cerrar'] },
  { id: 'whisky-sour', nombre: 'Whisky sour', base: 'whisky', ingredientes: 'Whisky, limón, almíbar y clara batida.', precio: 9200, perfil: { dulce: 3, acido: 4, amargo: 1, fuerza: 4 }, momentos: ['charlar'] },
  { id: 'spritz', nombre: 'Spritz', base: 'aperitivo', ingredientes: 'Aperol, espumante, soda y naranja.', precio: 7600, perfil: { dulce: 3, acido: 2, amargo: 3, fuerza: 1 }, momentos: ['charlar', 'bailar'] },
  { id: 'fernet', nombre: 'Fernet de autor', base: 'aperitivo', ingredientes: 'Fernet, cola casera de especias y hielo grande.', precio: 7200, perfil: { dulce: 2, acido: 1, amargo: 5, fuerza: 3 }, momentos: ['bailar', 'cerrar'] },
  { id: 'limonada', nombre: 'Limonada de jengibre', base: 'sin-alcohol', ingredientes: 'Limón, jengibre, menta y soda. Cero alcohol.', precio: 5200, perfil: { dulce: 3, acido: 5, amargo: 1, fuerza: 0 }, momentos: ['charlar', 'bailar'] },
  { id: 'nojito', nombre: 'Frutos rojos sin alcohol', base: 'sin-alcohol', ingredientes: 'Frutos rojos, albahaca, lima y tónica.', precio: 5600, perfil: { dulce: 4, acido: 3, amargo: 2, fuerza: 0 }, momentos: ['charlar', 'cerrar'] },
]

// ---------- Test "¿Qué trago sos?" ----------
export interface Respuestas {
  sabor: 'dulce' | 'citrico' | 'amargo'
  fuerza: 'nada' | 'suave' | 'fuerte'
  momento: Momento
}

const OBJETIVO_SABOR: Record<Respuestas['sabor'], Omit<Perfil, 'fuerza'>> = {
  dulce: { dulce: 4, acido: 2, amargo: 1 },
  citrico: { dulce: 2, acido: 5, amargo: 1 },
  amargo: { dulce: 2, acido: 1, amargo: 5 },
}
const OBJETIVO_FUERZA: Record<Respuestas['fuerza'], number> = { nada: 0, suave: 2, fuerte: 5 }

/** El trago más cercano al perfil buscado; si pidió sin alcohol, solo se consideran esos. */
export function recomendar(r: Respuestas, tragos: Trago[] = TRAGOS): Trago {
  const objetivo: Perfil = { ...OBJETIVO_SABOR[r.sabor], fuerza: OBJETIVO_FUERZA[r.fuerza] }
  const candidatos = r.fuerza === 'nada' ? tragos.filter((t) => t.base === 'sin-alcohol') : tragos.filter((t) => t.base !== 'sin-alcohol')
  const distancia = (t: Trago) =>
    (Object.keys(objetivo) as (keyof Perfil)[]).reduce((s, k) => s + (t.perfil[k] - objetivo[k]) ** 2, 0) -
    (t.momentos.includes(r.momento) ? 3 : 0)
  return [...candidatos].sort((a, b) => distancia(a) - distancia(b) || a.id.localeCompare(b.id))[0]
}

// ---------- Happy hour ----------
export const HAPPY = { desde: 18, hasta: 21 }

/** Si el happy hour está activo y cuántos milisegundos faltan para que termine o empiece. */
export function estadoHappy(ahora: Date): { activo: boolean; ms: number } {
  const hoy = (h: number) => new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), h).getTime()
  const t = ahora.getTime()
  if (t >= hoy(HAPPY.desde) && t < hoy(HAPPY.hasta)) return { activo: true, ms: hoy(HAPPY.hasta) - t }
  const proximo = t < hoy(HAPPY.desde) ? hoy(HAPPY.desde) : hoy(HAPPY.desde) + 86_400_000
  return { activo: false, ms: proximo - t }
}

export function reloj(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}
