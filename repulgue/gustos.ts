/** El repulgue es el código: cada gusto se cierra distinto para reconocerlo sin abrirlo. */
export type Repulgue = 'trenzado' | 'cuernitos' | 'pellizco' | 'tenedor' | 'arriba' | 'ola' | 'punto' | 'tajos'

export interface Gusto {
  id: string
  nombre: string
  detalle: string
  repulgue: Repulgue
  /** Cómo se reconoce, en una línea. */
  pista: string
  vegetariano: boolean
  picante?: boolean
}

export const GUSTOS: Gusto[] = [
  {
    id: 'carne',
    nombre: 'Carne suave',
    detalle: 'Roast beef cortado a cuchillo, cebolla, huevo y aceituna verde.',
    repulgue: 'trenzado',
    pista: 'Repulgue trenzado al costado, como un cordón.',
    vegetariano: false,
  },
  {
    id: 'picante',
    nombre: 'Carne picante',
    detalle: 'La misma carne con ají molido, pimentón ahumado y un toque de comino.',
    repulgue: 'cuernitos',
    pista: 'Trenzado con dos cuernitos en las puntas: avisa que pica.',
    vegetariano: false,
    picante: true,
  },
  {
    id: 'pollo',
    nombre: 'Pollo al verdeo',
    detalle: 'Pollo de campo desmenuzado, mucho verdeo, morrón asado y crema.',
    repulgue: 'pellizco',
    pista: 'Repulgue de pellizco: dientes separados, hechos con dos dedos.',
    vegetariano: false,
  },
  {
    id: 'jyq',
    nombre: 'Jamón y queso',
    detalle: 'Jamón cocido natural, muzzarella y un poco de provolone.',
    repulgue: 'tenedor',
    pista: 'Sin repulgue: el borde va cerrado con el tenedor.',
    vegetariano: false,
  },
  {
    id: 'humita',
    nombre: 'Humita',
    detalle: 'Choclo rallado, zapallo, cebolla de verdeo y queso de cabra.',
    repulgue: 'arriba',
    pista: 'Parada, con el repulgue arriba, de punta a punta.',
    vegetariano: true,
  },
  {
    id: 'espinaca',
    nombre: 'Espinaca y ricota',
    detalle: 'Espinaca salteada, ricota, nuez moscada y parmesano.',
    repulgue: 'ola',
    pista: 'Borde en ola, liso, sin trenzar.',
    vegetariano: true,
  },
  {
    id: 'caprese',
    nombre: 'Caprese',
    detalle: 'Tomate confitado, muzzarella fresca y albahaca.',
    repulgue: 'punto',
    pista: 'Cerrada con tenedor y con un punto de tomate arriba.',
    vegetariano: true,
  },
  {
    id: 'cebolla',
    nombre: 'Cebolla y queso',
    detalle: 'Cebolla caramelizada dos horas, queso azul y tomillo.',
    repulgue: 'tajos',
    pista: 'Borde liso y tres tajos en la panza para que respire.',
    vegetariano: true,
  },
]

export const gustoPorId = (id: string) => GUSTOS.find((g) => g.id === id)

export const VEGETARIANOS = GUSTOS.filter((g) => g.vegetariano).map((g) => g.id)
export const CON_CARNE = GUSTOS.filter((g) => !g.vegetariano).map((g) => g.id)
