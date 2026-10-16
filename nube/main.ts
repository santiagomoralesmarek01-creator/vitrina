import '@fontsource/zen-maru-gothic/500.css'
import '@fontsource/zen-maru-gothic/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { DULCES, ESPRESSO_BAR, FRIOS, LECHES, ORIGENES, TAMANIOS, precioBebida, type Bebida, type Leche, type Tamanio } from './carta'

const $ = (id: string) => document.getElementById(id)!
const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches

let tamanio: Tamanio = 'chico'
let leche: Leche = 'entera'

// ---------- Selectores segmentados ----------
function segmentado<T extends string>(
  contenedor: HTMLElement,
  opciones: { id: T; nombre: string; detalle?: string }[],
  actual: T,
  alCambiar: (id: T) => void,
) {
  contenedor.innerHTML =
    `<span class="indicador" aria-hidden="true"></span>` +
    opciones
      .map(
        (o) =>
          `<button type="button" role="radio" data-id="${o.id}" aria-checked="${o.id === actual}" tabindex="${o.id === actual ? 0 : -1}">
            ${o.nombre}${o.detalle ? `<small>${o.detalle}</small>` : ''}
          </button>`,
      )
      .join('')
  const botones = [...contenedor.querySelectorAll<HTMLButtonElement>('button')]
  const indicador = contenedor.querySelector<HTMLElement>('.indicador')!

  const elegir = (boton: HTMLButtonElement, enfocar = false) => {
    botones.forEach((b) => {
      const activo = b === boton
      b.setAttribute('aria-checked', String(activo))
      b.tabIndex = activo ? 0 : -1
    })
    // La píldora se desliza hasta la opción elegida.
    indicador.style.width = `${boton.offsetWidth}px`
    indicador.style.transform = `translateX(${boton.offsetLeft}px)`
    if (enfocar) boton.focus()
    alCambiar(boton.dataset.id as T)
  }

  contenedor.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button')
    if (b) elegir(b)
  })
  // Flechas para moverse entre opciones, como un grupo de radios.
  contenedor.addEventListener('keydown', (e) => {
    const i = botones.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0 || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return
    e.preventDefault()
    elegir(botones[(i + (e.key === 'ArrowRight' ? 1 : botones.length - 1)) % botones.length], true)
  })
  const ubicar = () => elegir(botones.find((b) => b.getAttribute('aria-checked') === 'true')!)
  requestAnimationFrame(ubicar)
  addEventListener('resize', ubicar)
}

// ---------- Precios que cuentan hasta el valor nuevo ----------
function animarPrecio(el: HTMLElement, destino: number) {
  const desde = Number(el.dataset.valor ?? destino)
  el.dataset.valor = String(destino)
  if (reducirMovimiento || desde === destino) {
    el.textContent = formatPesos(destino)
    return
  }
  el.classList.add('cambiando')
  const inicio = performance.now()
  const paso = (t: number) => {
    const k = Math.min(1, (t - inicio) / 350)
    const suave = 1 - (1 - k) ** 3
    el.textContent = formatPesos(Math.round((desde + (destino - desde) * suave) / 10) * 10)
    if (k < 1) requestAnimationFrame(paso)
    else el.classList.remove('cambiando')
  }
  requestAnimationFrame(paso)
}

function lista(contenedor: HTMLElement, bebidas: Bebida[]) {
  contenedor.innerHTML = bebidas
    .map(
      (b) => `
      <li class="item">
        <div>
          <p class="item-nombre">${b.nombre}${b.conLeche ? '<span class="marca-leche" title="Lleva leche">con leche</span>' : ''}</p>
          <p class="item-detalle">${b.detalle}</p>
        </div>
        <span class="precio" data-bebida="${b.id}">${formatPesos(precioBebida(b, tamanio, leche))}</span>
      </li>`,
    )
    .join('')
}

function actualizarPrecios() {
  for (const b of [...ESPRESSO_BAR, ...FRIOS]) {
    animarPrecio(document.querySelector<HTMLElement>(`[data-bebida="${b.id}"]`)!, precioBebida(b, tamanio, leche))
  }
}

lista($('espresso'), ESPRESSO_BAR)
lista($('frios'), FRIOS)

segmentado($('tamanios'), TAMANIOS.map((t) => ({ id: t.id, nombre: t.nombre, detalle: `${t.ml} ml` })), tamanio, (id) => {
  tamanio = id
  actualizarPrecios()
})
segmentado($('leches'), LECHES.map((l) => ({ id: l.id, nombre: l.nombre, detalle: l.extra ? `+${formatPesos(l.extra)}` : 'incluida' })), leche, (id) => {
  leche = id
  actualizarPrecios()
})

// ---------- Tarjetas de origen ----------
const puntos = (n: number) =>
  `<span class="puntos" aria-label="${n} de 5">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'lleno' : ''}"></i>`).join('')}</span>`

$('origenes').innerHTML = ORIGENES.map(
  (o, i) => `
  <button type="button" class="tarjeta" aria-pressed="false" aria-label="${o.nombre}, ${o.region}. Ver detalles">
    <span class="cara frente">
      <span class="tarjeta-num">0${i + 1}</span>
      <span class="tarjeta-nombre">${o.nombre}</span>
      <span class="tarjeta-region">${o.region}</span>
      <span class="notas">${o.notas.map((n) => `<span>${n}</span>`).join('')}</span>
      <span class="tarjeta-precio">${formatPesos(o.precio)}</span>
      <span class="girar" aria-hidden="true">↻</span>
    </span>
    <span class="cara dorso">
      <span class="dato"><small>Proceso</small>${o.proceso}</span>
      <span class="dato"><small>Altura</small>${o.altura}</span>
      <span class="dato"><small>Lo preparamos en</small>${o.metodo}</span>
      <span class="perfil">
        <span>Acidez ${puntos(o.perfil.acidez)}</span>
        <span>Cuerpo ${puntos(o.perfil.cuerpo)}</span>
        <span>Dulzor ${puntos(o.perfil.dulzor)}</span>
      </span>
    </span>
  </button>`,
).join('')

$('origenes').addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLButtonElement>('.tarjeta')
  if (!t) return
  const girada = t.getAttribute('aria-pressed') !== 'true'
  t.setAttribute('aria-pressed', String(girada))
})

// ---------- Dulces ----------
const ICONOS: Record<string, string> = {
  medialunas: '<path d="M4 16c4-10 20-10 24 0-4-2-6 2-12 2S8 14 4 16Z"/>',
  budin: '<rect x="5" y="10" width="22" height="12" rx="3"/><path d="M8 10c2-4 14-4 16 0"/>',
  cookie: '<circle cx="16" cy="16" r="10"/><circle cx="12" cy="13" r="1.2"/><circle cx="19" cy="15" r="1.2"/><circle cx="14" cy="20" r="1.2"/>',
  tostado: '<path d="M6 12a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v12H6Z"/><path d="M6 17h20"/>',
}
$('dulces').innerHTML = DULCES.map(
  (d) => `
  <li class="dulce">
    <svg viewBox="0 0 32 32" aria-hidden="true">${ICONOS[d.id]}</svg>
    <p class="item-nombre">${d.nombre}</p>
    <p class="item-detalle">${d.detalle}</p>
    <span class="precio">${formatPesos(d.precio)}</span>
  </li>`,
).join('')

// ---------- Modo noche ----------
const raiz = document.documentElement
const temaActual = () => raiz.dataset.tema ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'noche' : 'dia')
const botonTema = $('tema')
const etiquetar = () => botonTema.setAttribute('aria-label', temaActual() === 'noche' ? 'Cambiar a modo día' : 'Cambiar a modo noche')
botonTema.addEventListener('click', () => {
  const nuevo = temaActual() === 'noche' ? 'dia' : 'noche'
  raiz.dataset.tema = nuevo
  try {
    localStorage.setItem('nube-tema', nuevo)
  } catch {
    // Sin almacenamiento: el cambio vale solo para esta visita.
  }
  etiquetar()
})
etiquetar()

botonVolver(temaActual() === 'noche' ? 'oscuro' : 'claro')
