import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '../shared/volver.css'
import './style.css'

type Tipo = 'carta' | 'landing' | 'app' | 'plantilla'

const NOMBRE_TIPO: Record<Tipo, string> = { carta: 'Carta', landing: 'Landing', app: 'App', plantilla: 'Plantilla' }

interface Ejemplo {
  id: string
  tipo: Tipo
  nombre: string
  rubro: string
  descripcion: string
  interacciones: string[]
  fondo: string
  /** Dirección propia; por defecto, /<id>/. Las plantillas viven en public/plantillas (repo prototipos). */
  href?: string
}

const PLANTILLA = (id: string) => `/plantillas/plantillas/${id}/`

const EJEMPLOS: Ejemplo[] = [
  {
    id: 'bodegon',
    tipo: 'carta',
    nombre: 'Bodegón Don Ernesto',
    rubro: 'Carta de parrilla',
    descripcion: 'Pizarra y papel madera, como la carta de siempre pero en el celular.',
    interacciones: ['Pestañas que siguen el scroll', 'Filtros sin TACC y veggie', 'Pedido con total y envío por WhatsApp'],
    fondo: '#e2cfae',
  },
  {
    id: 'nube',
    tipo: 'carta',
    nombre: 'nube',
    rubro: 'Carta de café de especialidad',
    descripcion: 'Minimalista y luminosa, con dibujos de línea y modo noche.',
    interacciones: ['Tarjetas de origen que se dan vuelta', 'Precios según tamaño y leche', 'Modo día y noche'],
    fondo: '#e8eef5',
  },
  {
    id: 'pulso',
    tipo: 'landing',
    nombre: 'Pulso',
    rubro: 'Estudio de yoga y pilates',
    descripcion: 'Formas orgánicas que respiran y tipografía serif en cursiva.',
    interacciones: ['Respiración guiada', 'Horarios filtrables con reserva', 'Carrusel y planes con descuento'],
    fondo: '#ece2d4',
  },
  {
    id: 'volta',
    tipo: 'landing',
    nombre: 'Volta',
    rubro: 'Bicis eléctricas',
    descripcion: 'Oscura y tecnológica, con acento neón que cambia con tu elección.',
    interacciones: ['Configurador de color y modelo', 'Calculadora de ahorro', 'Animaciones al bajar'],
    fondo: '#13171c',
  },
  {
    id: 'tano',
    tipo: 'carta',
    nombre: 'Tano',
    rubro: 'Pizzería napolitana',
    descripcion: 'Cartel de neón viejo y mantel a cuadros, con una pizza que se arma en pantalla.',
    interacciones: ['Armador de pizza en SVG', 'Mitad y mitad', 'Precio en vivo y pedido'],
    fondo: '#c8321f',
  },
  {
    id: 'neblina',
    tipo: 'carta',
    nombre: 'Neblina',
    rubro: 'Bar de tragos de autor',
    descripcion: 'Art déco nocturno, dorado sobre negro, con cuenta regresiva del happy hour.',
    interacciones: ['Test que te recomienda un trago', 'Perfil de sabor en radar', 'Happy hour en vivo'],
    fondo: '#0d0c0b',
  },
  {
    id: 'filo',
    tipo: 'app',
    nombre: 'Filo',
    rubro: 'Turnero de barbería',
    descripcion: 'Reserva en cinco pasos con horarios ocupados de verdad y resumen siempre a la vista.',
    interacciones: ['Reserva paso a paso', 'Mis turnos guardados', 'Evento para el calendario (.ics)'],
    fondo: '#f3f2ee',
  },
  {
    id: 'mercadito',
    tipo: 'app',
    nombre: 'Mercadito Verde',
    rubro: 'Panel de ventas',
    descripcion: 'Dashboard de una tienda orgánica: indicadores, comparación con el período anterior y modo oscuro.',
    interacciones: ['Gráficos con tooltip y vista de tabla', 'Rango de 7, 30 o 90 días', 'Tabla ordenable con búsqueda'],
    fondo: '#f4f5f1',
  },
  {
    id: 'kaze',
    tipo: 'carta',
    nombre: 'Kaze',
    rubro: 'Sushi y cocina nikkei',
    descripcion: 'Papel washi, tinta sumi y un sello bermellón: editorial japonés con mucho aire.',
    interacciones: ['Combinado que llena la bandeja pieza por pieza', 'Carta con filtros crudo, cocido y veggie', 'Omakase con lugares disponibles'],
    fondo: '#f3ede0',
  },
  {
    id: 'polo',
    tipo: 'carta',
    nombre: 'Polo Sur',
    rubro: 'Heladería artesanal',
    descripcion: 'Pastel, redondeada y juguetona, con un pingüino de mascota.',
    interacciones: ['Bochas que se apilan con el color de cada sabor', 'Envases con límite de sabores', 'Filtros sin TACC y veganos'],
    fondo: '#e9f6f1',
  },
  {
    id: 'miga',
    tipo: 'app',
    nombre: 'Miga',
    rubro: 'Tortas por encargo',
    descripcion: 'Pastelería editorial en rosa y chocolate, con la torta dibujada en vivo.',
    interacciones: ['Configurador que dibuja la torta capa por capa', 'Calendario de retiro con 48 h de aviso', 'Seña del 50 % y pedido por WhatsApp'],
    fondo: '#f6e9e4',
  },
  {
    id: 'bunker',
    tipo: 'carta',
    nombre: 'Bunker',
    rubro: 'Smash burgers',
    descripcion: 'Callejera y neo-brutalista: mostaza, negro, ketchup y sombras duras.',
    interacciones: ['Burger que crece capa por capa', 'Medidor de altura y calorías', 'Las de la casa cargan en el armador'],
    fondo: '#f2c230',
  },
  {
    id: 'domingo',
    tipo: 'app',
    nombre: 'Domingo',
    rubro: 'Brunch y reservas',
    descripcion: 'Soleada y relajada, en salvia, crema y durazno.',
    interacciones: ['Reserva eligiendo la mesa en el plano del salón', 'Carta dulce y salada', 'Combos de brunch para compartir'],
    fondo: '#f4efe3',
  },
  {
    id: 'lupulo',
    tipo: 'carta',
    nombre: 'Lúpulo',
    rubro: 'Taproom de cerveza artesanal',
    descripcion: 'Etiqueta de cerveza artesanal: papel kraft, tinta negra y cobre.',
    interacciones: ['Vasos con el color real de cada cerveza', 'Filtros por amargor y alcohol', 'Vuelo de degustación de 4 cervezas'],
    fondo: '#e8d6b4',
  },
  {
    id: 'raiz',
    tipo: 'landing',
    nombre: 'Raíz',
    rubro: 'Restaurante de autor',
    descripcion: 'Alta cocina en blanco hueso y carbón, con dibujos de una sola línea.',
    interacciones: ['Menú de siete pasos que se revela al bajar', 'Maridaje y versiones vegetariana y sin TACC', 'Reserva con seña'],
    fondo: '#f5f2ec',
  },
  {
    id: 'nortena',
    tipo: 'carta',
    nombre: 'La Norteña',
    rubro: 'Empanadas salteñas y tucumanas',
    descripcion: 'Colorida y artesanal, con guardas de aguayo hechas en CSS.',
    interacciones: ['Docena mixta que llena la bandeja', 'Mejor precio entre docenas, medias y sueltas', 'Zonas de envío por barrio'],
    fondo: '#f7efe3',
  },
  // Plantillas listas para entregar: el diseño ya está hecho y se cambia sólo el contenido del local.
  {
    id: 'local-barrio',
    tipo: 'plantilla',
    nombre: 'Barrio',
    rubro: 'Rotisería · plan Local',
    descripcion: 'Papel crema y terracota, con el frente del local dibujado y su nombre en el cartel.',
    interacciones: ['Semana de viandas con descuento por días', 'Pedido por WhatsApp con envío', 'Carta del salón para el QR'],
    fondo: '#f3e9d8',
    href: PLANTILLA('local-barrio'),
  },
  {
    id: 'local-cafe',
    tipo: 'plantilla',
    nombre: 'Brote',
    rubro: 'Cafetería · plan Local',
    descripcion: 'Crema y salvia, serif en cursiva y bordes ondulados, con una mesa de café humeante.',
    interacciones: ['Box de merienda para llenar', 'Opción de regalo con tarjeta', 'Carta del salón para el QR'],
    fondo: '#cfdccf',
    href: PLANTILLA('local-cafe'),
  },
  {
    id: 'local-horno',
    tipo: 'plantilla',
    nombre: 'Horno',
    rubro: 'Pizzería · plan Local',
    descripcion: 'Pizzería porteña: verde botella, bronce y piso a cuadros, con el horno encendido.',
    interacciones: ['Pizza mitad y mitad dibujada', '¿Cuántas pizzas pido? para la juntada', 'Carta del salón para el QR'],
    fondo: '#1f3a2e',
    href: PLANTILLA('local-horno'),
  },
  {
    id: 'local-noche',
    tipo: 'plantilla',
    nombre: 'Noche',
    rubro: 'Hamburguesería · plan Local',
    descripcion: 'Carbón, brasas y humo, con tipografía muy condensada.',
    interacciones: ['Burger capa por capa con precio en vivo', 'Pedido por WhatsApp con envío', 'Modo claro de papel'],
    fondo: '#141110',
    href: PLANTILLA('local-noche'),
  },
  {
    id: 'carta-clasica',
    tipo: 'plantilla',
    nombre: 'Clásica',
    rubro: 'Restaurante · plan Carta',
    descripcion: 'Carta impresa: papel marfil con doble filete y línea de puntos hasta el precio.',
    interacciones: ['Índice que sigue la lectura', 'Filtros vegetariano, vegano y sin TACC', 'Agotados tachados'],
    fondo: '#e9e1d0',
    href: PLANTILLA('carta-clasica'),
  },
  {
    id: 'app-comanda',
    tipo: 'app',
    nombre: 'Comanda',
    rubro: 'Tablero de cocina',
    descripcion: 'Los pedidos del local como tickets de comandera, de nuevos a entregados, con reloj de demora.',
    interacciones: ['Arrastrar tickets entre columnas', 'Demoras en ámbar y rojo', 'Números del turno'],
    fondo: '#eceae4',
    href: PLANTILLA('app-comanda'),
  },
]

const grilla = document.getElementById('grilla')!

// Cantidad de cada tipo en los filtros, calculada para que nunca quede desactualizada.
document.querySelectorAll<HTMLElement>('#filtros [data-filtro]').forEach((b) => {
  const f = b.dataset.filtro
  b.querySelector('span')!.textContent = String(EJEMPLOS.filter((e) => f === 'todos' || e.tipo === f).length)
})
grilla.innerHTML = EJEMPLOS.map(
  (e, i) => `
  <article class="tarjeta" data-tipo="${e.tipo}" style="--fondo-tarjeta: ${e.fondo}; --i: ${i}">
    <a href="${e.href ?? `/${e.id}/`}" class="tarjeta-enlace" aria-label="Abrir ${e.nombre}, ${e.rubro}">
      <div class="vista">
        <img src="/previews/${e.id}.jpg" alt="" loading="lazy" decoding="async" />
      </div>
    </a>
    <div class="tarjeta-texto">
      <p class="tipo">${NOMBRE_TIPO[e.tipo]} · ${e.rubro}</p>
      <h2><a href="${e.href ?? `/${e.id}/`}">${e.nombre}</a></h2>
      <p class="descripcion">${e.descripcion}</p>
      <ul class="interacciones">${e.interacciones.map((x) => `<li>${x}</li>`).join('')}</ul>
    </div>
  </article>`,
).join('')

// Al pasar el mouse (o enfocar con teclado) la captura se recorre de arriba a abajo.
grilla.querySelectorAll<HTMLElement>('.tarjeta').forEach((t) => {
  const img = t.querySelector('img')!
  const vista = t.querySelector<HTMLElement>('.vista')!
  const recorrido = () => {
    const distancia = Math.max(0, img.offsetHeight - vista.clientHeight)
    vista.style.setProperty('--recorrido', `-${distancia}px`)
    vista.style.setProperty('--tiempo', `${Math.max(2, distancia / 220)}s`)
  }
  img.complete ? recorrido() : img.addEventListener('load', recorrido)
  addEventListener('resize', recorrido)
})

// Filtros con transición de vista cuando el navegador la soporta.
const filtros = document.getElementById('filtros')!
filtros.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-filtro]')
  if (!b) return
  const filtro = b.dataset.filtro
  const aplicar = () => {
    filtros.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)))
    grilla.querySelectorAll<HTMLElement>('.tarjeta').forEach((t) => {
      t.hidden = filtro !== 'todos' && t.dataset.tipo !== filtro
    })
  }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
  if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(aplicar)
  else aplicar()
})
