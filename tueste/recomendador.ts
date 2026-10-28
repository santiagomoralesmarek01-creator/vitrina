// "¿Cómo lo tomás?": cuatro preguntas → bebida de la barra, método y café de origen, con el porqué.
import { BEBIDAS, METODOS, ORIGENES, type Bebida, type Familia, type Metodo, type Origen } from './cafes'

export interface Respuestas {
  leche: 'solo' | 'con-leche'
  sabor: 'frutado' | 'achocolatado' | 'floral'
  intensidad: 'intenso' | 'suave'
  temperatura: 'caliente' | 'frio'
}

export interface Pregunta<K extends keyof Respuestas = keyof Respuestas> {
  clave: K
  titulo: string
  opciones: { valor: Respuestas[K]; nombre: string; pista: string }[]
}

export const PREGUNTAS: Pregunta[] = [
  {
    clave: 'leche',
    titulo: '¿Con leche o solo?',
    opciones: [
      { valor: 'solo', nombre: 'Solo', pista: 'El café y nada más' },
      { valor: 'con-leche', nombre: 'Con leche', pista: 'Vaca o avena, da igual' },
    ],
  },
  {
    clave: 'sabor',
    titulo: '¿Qué sabores te tiran más?',
    opciones: [
      { valor: 'frutado', nombre: 'Frutado', pista: 'Frutos rojos, vino, cítricos' },
      { valor: 'achocolatado', nombre: 'Achocolatado', pista: 'Cacao, caramelo, nueces' },
      { valor: 'floral', nombre: 'Floral', pista: 'Jazmín, azahar, té' },
    ],
  },
  {
    clave: 'intensidad',
    titulo: '¿Intenso o suave?',
    opciones: [
      { valor: 'intenso', nombre: 'Intenso', pista: 'Concentrado, con cuerpo' },
      { valor: 'suave', nombre: 'Suave', pista: 'Liviano, para tomar despacio' },
    ],
  },
  {
    clave: 'temperatura',
    titulo: '¿Frío o caliente?',
    opciones: [
      { valor: 'caliente', nombre: 'Caliente', pista: 'En taza' },
      { valor: 'frio', nombre: 'Frío', pista: 'Con hielo' },
    ],
  },
]

export interface Recomendacion {
  bebida: Bebida
  metodo: Metodo
  origen: Origen
  porque: string[]
}

const FAMILIAS_DE: Record<Respuestas['sabor'], Familia[]> = {
  frutado: ['frutado', 'vinoso', 'citrico'],
  achocolatado: ['chocolate', 'dulce'],
  floral: ['floral', 'citrico'],
}

/** Qué bebida de la barra va con esas respuestas. */
export function elegirBebida(r: Respuestas): Bebida {
  const id = ((): string => {
    const leche = r.leche === 'con-leche'
    const intenso = r.intensidad === 'intenso'
    if (r.temperatura === 'frio') {
      if (leche) return intenso ? 'iced-latte' : 'cold-brew-avena'
      if (!intenso) return 'iced-v60'
      return r.sabor === 'achocolatado' ? 'cold-brew' : 'espresso-tonic'
    }
    if (leche) {
      if (!intenso) return 'latte'
      return r.sabor === 'achocolatado' ? 'flat-white' : 'cortado'
    }
    if (intenso) return r.sabor === 'achocolatado' ? 'espresso' : 'aeropress'
    return r.sabor === 'frutado' ? 'v60' : 'chemex'
  })()
  return BEBIDAS.find((b) => b.id === id)!
}

/** El café de origen que mejor encaja: primero el sabor; después cuerpo (leche o intenso) o acidez (suave). */
export function elegirOrigen(r: Respuestas, origenes: Origen[] = ORIGENES): Origen {
  const buscadas = FAMILIAS_DE[r.sabor]
  const puntos = (o: Origen) => {
    const sabor = o.familias.filter((f) => buscadas.includes(f)).length * 3
    const cuerpo = r.leche === 'con-leche' || r.intensidad === 'intenso'
    return sabor + (cuerpo ? o.perfil.cuerpo : o.perfil.acidez) + o.perfil.dulzor * 0.5
  }
  return [...origenes].sort((a, b) => puntos(b) - puntos(a) || a.id.localeCompare(b.id))[0]
}

const POR_METODO: Record<Metodo, string> = {
  espresso: 'El espresso concentra todo en 30 ml: dulzor, cuerpo y un final largo.',
  v60: 'El V60 filtra rápido y en papel fino: deja pasar la acidez y las notas más delicadas.',
  chemex: 'El filtro grueso de la Chemex se queda con los aceites: taza limpia, casi como un té.',
  aeropress: 'La AeroPress combina inmersión y presión: más cuerpo que un filtrado, sin la intensidad de un espresso.',
  coldbrew: 'El cold brew extrae en frío durante 18 horas: sale dulce, redondo y sin amargor.',
}

export function recomendar(r: Respuestas, origenes: Origen[] = ORIGENES): Recomendacion {
  const bebida = elegirBebida(r)
  const origen = elegirOrigen(r, origenes)
  const notas = origen.notas.join(', ')
  const porque = [
    POR_METODO[bebida.metodo],
    `${origen.pais} (${origen.region}, proceso ${origen.proceso.toLowerCase()}) tiene notas de ${notas}${
      r.leche === 'con-leche' ? ` y cuerpo para bancarse la leche` : ''
    }.`,
    r.temperatura === 'frio'
      ? 'En frío los sabores se sienten más dulces y la acidez, más fresca.'
      : r.intensidad === 'suave'
        ? 'Pedilo y tomalo despacio: a medida que se enfría aparecen más notas.'
        : 'Tomalo recién hecho, que es cuando la crema y el aroma están en su mejor momento.',
  ]
  return { bebida, metodo: bebida.metodo, origen, porque }
}

export const nombreMetodo = (m: Metodo) => METODOS[m]
