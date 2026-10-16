export type Tipo = 'yoga' | 'pilates' | 'yin'
export type Nivel = 'inicial' | 'intermedio' | 'todos'
export type Dia = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab'

export interface Clase {
  id: string
  dia: Dia
  hora: string
  tipo: Tipo
  nombre: string
  nivel: Nivel
  profe: string
  cupos: number
}

export const DIAS: { id: Dia; nombre: string }[] = [
  { id: 'lun', nombre: 'Lunes' },
  { id: 'mar', nombre: 'Martes' },
  { id: 'mie', nombre: 'Miércoles' },
  { id: 'jue', nombre: 'Jueves' },
  { id: 'vie', nombre: 'Viernes' },
  { id: 'sab', nombre: 'Sábado' },
]

export const TIPOS: Record<Tipo, string> = { yoga: 'Yoga flow', pilates: 'Pilates', yin: 'Yin & meditación' }

const c = (id: string, dia: Dia, hora: string, tipo: Tipo, nivel: Nivel, profe: string, cupos: number): Clase => ({
  id,
  dia,
  hora,
  tipo,
  nombre: TIPOS[tipo],
  nivel,
  profe,
  cupos,
})

export const CLASES: Clase[] = [
  c('l1', 'lun', '08:00', 'yoga', 'todos', 'Lucía', 6),
  c('l2', 'lun', '19:00', 'pilates', 'inicial', 'Martín', 3),
  c('m1', 'mar', '09:30', 'yin', 'todos', 'Sol', 8),
  c('m2', 'mar', '18:30', 'yoga', 'intermedio', 'Lucía', 0),
  c('x1', 'mie', '08:00', 'pilates', 'intermedio', 'Martín', 5),
  c('x2', 'mie', '20:00', 'yin', 'todos', 'Sol', 10),
  c('j1', 'jue', '09:30', 'yoga', 'inicial', 'Lucía', 4),
  c('j2', 'jue', '19:00', 'pilates', 'todos', 'Martín', 2),
  c('v1', 'vie', '08:00', 'yoga', 'intermedio', 'Lucía', 7),
  c('v2', 'vie', '18:00', 'yin', 'todos', 'Sol', 9),
  c('s1', 'sab', '10:00', 'yoga', 'todos', 'Lucía', 12),
  c('s2', 'sab', '11:30', 'pilates', 'inicial', 'Martín', 1),
]

export interface Filtros {
  tipos: Tipo[]
  nivel: Nivel | 'cualquiera'
}

/** Sin tipos elegidos se muestran todos. "todos" (apto para todo nivel) entra en cualquier nivel. */
export function filtrarClases(clases: Clase[], f: Filtros): Clase[] {
  return clases.filter(
    (cl) =>
      (f.tipos.length === 0 || f.tipos.includes(cl.tipo)) &&
      (f.nivel === 'cualquiera' || cl.nivel === f.nivel || cl.nivel === 'todos'),
  )
}

export function reservar(clases: Clase[], id: string): Clase[] {
  return clases.map((cl) => {
    if (cl.id !== id) return cl
    if (cl.cupos === 0) throw new Error('No quedan lugares en esta clase')
    return { ...cl, cupos: cl.cupos - 1 }
  })
}

export const PLANES = [
  { id: 'suelta', nombre: 'Clase suelta', mensual: 12000, clases: '1 clase', destacado: false },
  { id: 'dos', nombre: '2 por semana', mensual: 52000, clases: '8 clases al mes', destacado: true },
  { id: 'libre', nombre: 'Pase libre', mensual: 78000, clases: 'Todas las que quieras', destacado: false },
] as const

/** El trimestral tiene 15 % de descuento sobre tres meses. La clase suelta no cambia. */
export function precioPlan(mensual: number, periodo: 'mensual' | 'trimestral', id: string): number {
  if (periodo === 'mensual' || id === 'suelta') return mensual
  return Math.round((mensual * 0.85) / 100) * 100
}
