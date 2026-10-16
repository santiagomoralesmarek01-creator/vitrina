export type Etiqueta = 'sin-tacc' | 'veggie' | 'picante' | 'de-la-casa'

export interface Plato {
  id: string
  nombre: string
  detalle: string
  precio: number
  etiquetas: Etiqueta[]
}

export interface Seccion {
  id: string
  titulo: string
  bajada: string
  platos: Plato[]
}

export const SECCIONES: Seccion[] = [
  {
    id: 'picar',
    titulo: 'Para picar',
    bajada: 'Para abrir el apetito mientras se calienta la parrilla.',
    platos: [
      { id: 'provoleta', nombre: 'Provoleta a la parrilla', detalle: 'Con orégano, aceite de oliva y tomates confitados.', precio: 9800, etiquetas: ['sin-tacc', 'veggie'] },
      { id: 'empanadas', nombre: 'Empanadas de carne cortada a cuchillo', detalle: 'Fritas o al horno. Precio por dos.', precio: 6400, etiquetas: ['de-la-casa'] },
      { id: 'chorizo', nombre: 'Choripán con chimichurri', detalle: 'Chorizo de cerdo artesanal en pan de campo.', precio: 7200, etiquetas: [] },
      { id: 'mollejas', nombre: 'Mollejas al limón', detalle: 'Crocantes por fuera, tiernas por dentro.', precio: 14500, etiquetas: ['sin-tacc'] },
    ],
  },
  {
    id: 'parrilla',
    titulo: 'A la parrilla',
    bajada: 'Leña de quebracho y paciencia. Todos los cortes con guarnición a elección.',
    platos: [
      { id: 'vacio', nombre: 'Vacío', detalle: '400 g, jugoso y con su grasa justa.', precio: 21900, etiquetas: ['sin-tacc', 'de-la-casa'] },
      { id: 'ojo', nombre: 'Ojo de bife', detalle: '350 g. Pedilo al punto que quieras.', precio: 25600, etiquetas: ['sin-tacc'] },
      { id: 'entrana', nombre: 'Entraña', detalle: 'La favorita del parrillero.', precio: 23800, etiquetas: ['sin-tacc'] },
      { id: 'pollo', nombre: 'Medio pollo deshuesado', detalle: 'Marinado en limón, ajo y pimentón.', precio: 15900, etiquetas: ['sin-tacc', 'picante'] },
      { id: 'parrillada', nombre: 'Parrillada para dos', detalle: 'Asado, vacío, chorizo, morcilla y mollejas.', precio: 48900, etiquetas: ['de-la-casa'] },
    ],
  },
  {
    id: 'pastas',
    titulo: 'Pastas caseras',
    bajada: 'Amasadas todas las mañanas por la abuela Nélida.',
    platos: [
      { id: 'sorrentinos', nombre: 'Sorrentinos de calabaza', detalle: 'Con salsa de crema y nuez.', precio: 14200, etiquetas: ['veggie'] },
      { id: 'noquis', nombre: 'Ñoquis de papa', detalle: 'Con tuco de la casa. Los 29, con moneda abajo del plato.', precio: 12800, etiquetas: ['veggie', 'de-la-casa'] },
      { id: 'tallarines', nombre: 'Tallarines al pesto', detalle: 'Albahaca, ajo, nuez y queso duro.', precio: 13100, etiquetas: ['veggie'] },
    ],
  },
  {
    id: 'postres',
    titulo: 'Postres',
    bajada: 'Siempre hay lugar.',
    platos: [
      { id: 'flan', nombre: 'Flan casero mixto', detalle: 'Con dulce de leche y crema.', precio: 6900, etiquetas: ['sin-tacc', 'veggie', 'de-la-casa'] },
      { id: 'panqueque', nombre: 'Panqueque con dulce de leche', detalle: 'Flambeado con ron en la mesa.', precio: 7400, etiquetas: ['veggie'] },
      { id: 'queso-dulce', nombre: 'Queso y dulce', detalle: 'Batata o membrillo, vos elegís.', precio: 5600, etiquetas: ['sin-tacc', 'veggie'] },
    ],
  },
  {
    id: 'bebidas',
    titulo: 'Bebidas',
    bajada: 'El vino de la casa viene en pingüino.',
    platos: [
      { id: 'pinguino', nombre: 'Vino de la casa en pingüino', detalle: 'Tinto o blanco, 1 litro.', precio: 9900, etiquetas: ['sin-tacc', 'veggie'] },
      { id: 'sifon', nombre: 'Soda en sifón', detalle: 'Para cortar el vino, como corresponde.', precio: 3200, etiquetas: ['sin-tacc', 'veggie'] },
      { id: 'fernet', nombre: 'Fernet con cola', detalle: '¿Qué más hace falta decir?', precio: 6500, etiquetas: ['sin-tacc', 'veggie'] },
      { id: 'agua', nombre: 'Agua mineral', detalle: 'Con o sin gas, 500 ml.', precio: 2800, etiquetas: ['sin-tacc', 'veggie'] },
    ],
  },
]

export const ETIQUETAS: Record<Etiqueta, { nombre: string; icono: string }> = {
  'sin-tacc': { nombre: 'Sin TACC', icono: '🌾' },
  veggie: { nombre: 'Veggie', icono: '🌱' },
  picante: { nombre: 'Picante', icono: '🌶️' },
  'de-la-casa': { nombre: 'De la casa', icono: '★' },
}
