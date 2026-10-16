import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '../shared/volver.css'
import './style.css'

type Tipo = 'carta' | 'landing' | 'app'

const NOMBRE_TIPO: Record<Tipo, string> = { carta: 'Carta', landing: 'Landing', app: 'App' }

interface Ejemplo {
  id: string
  tipo: Tipo
  nombre: string
  rubro: string
  descripcion: string
  interacciones: string[]
  fondo: string
}

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
    <a href="/${e.id}/" class="tarjeta-enlace" aria-label="Abrir ${e.nombre}, ${e.rubro}">
      <div class="vista">
        <img src="/previews/${e.id}.jpg" alt="" loading="lazy" decoding="async" />
      </div>
    </a>
    <div class="tarjeta-texto">
      <p class="tipo">${NOMBRE_TIPO[e.tipo]} · ${e.rubro}</p>
      <h2><a href="/${e.id}/">${e.nombre}</a></h2>
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
