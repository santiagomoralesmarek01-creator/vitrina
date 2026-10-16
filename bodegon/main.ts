import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700-italic.css'
import '@fontsource/caveat/600.css'
import '@fontsource/work-sans/400.css'
import '@fontsource/work-sans/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { ETIQUETAS, SECCIONES, type Etiqueta } from './carta'
import { cambiarCantidad, filtrar, lineas, mensaje, resumen, type Pedido } from './pedido'

const WHATSAPP = '5491100000000' // ficticio
const platos = SECCIONES.flatMap((s) => s.platos)
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

let pedido: Pedido = {}
let filtros: Etiqueta[] = []

// ---------- Pestañas que siguen el scroll ----------
const pestanias = $('pestanias')
pestanias.innerHTML = SECCIONES.map((s) => `<li><a href="#${s.id}" data-id="${s.id}">${s.titulo}</a></li>`).join('')

function marcarPestania(id: string) {
  for (const a of pestanias.querySelectorAll<HTMLAnchorElement>('a')) {
    const activa = a.dataset.id === id
    a.classList.toggle('activa', activa)
    if (activa) {
      a.setAttribute('aria-current', 'true')
      // En el celular la fila de pestañas se desplaza para mostrar la activa.
      a.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    } else a.removeAttribute('aria-current')
  }
}

const observador = new IntersectionObserver(
  (entradas) => {
    const visible = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
    if (visible) marcarPestania(visible.target.id)
  },
  { rootMargin: '-120px 0px -60% 0px' },
)

// ---------- Filtros ----------
const filtrosEl = $('filtros')
const FILTRABLES: Etiqueta[] = ['sin-tacc', 'veggie', 'de-la-casa']
filtrosEl.innerHTML = FILTRABLES.map(
  (f) => `<button type="button" class="chip" data-filtro="${f}" aria-pressed="false">${ETIQUETAS[f].icono} ${ETIQUETAS[f].nombre}</button>`,
).join('')
filtrosEl.addEventListener('click', (e) => {
  const boton = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-filtro]')
  if (!boton) return
  const f = boton.dataset.filtro as Etiqueta
  filtros = filtros.includes(f) ? filtros.filter((x) => x !== f) : [...filtros, f]
  boton.setAttribute('aria-pressed', String(filtros.includes(f)))
  pintarSecciones()
})

// ---------- Carta ----------
const seccionesEl = $('secciones')

function controles(id: string) {
  const n = pedido[id] ?? 0
  return n === 0
    ? `<button type="button" class="sumar" data-id="${id}" data-delta="1" aria-label="Agregar">+</button>`
    : `<div class="cantidad" role="group" aria-label="Cantidad">
         <button type="button" data-id="${id}" data-delta="-1" aria-label="Quitar uno">−</button>
         <output aria-live="polite">${n}</output>
         <button type="button" data-id="${id}" data-delta="1" aria-label="Agregar uno">+</button>
       </div>`
}

function pintarSecciones() {
  observador.disconnect()
  seccionesEl.innerHTML = filtrar(SECCIONES, filtros)
    .map(
      (s) => `
      <section class="seccion" id="${s.id}" aria-labelledby="t-${s.id}">
        <h2 id="t-${s.id}">${s.titulo}</h2>
        <p class="bajada">${s.bajada}</p>
        ${
          s.platos.length === 0
            ? `<p class="vacio">No hay platos de esta sección con esos filtros.</p>`
            : `<ul class="platos">${s.platos
                .map(
                  (p) => `
          <li class="plato${p.etiquetas.includes('de-la-casa') ? ' plato--casa' : ''}">
            <div class="plato-texto">
              <p class="plato-linea"><span class="plato-nombre">${p.nombre}</span><span class="puntos" aria-hidden="true"></span><span class="plato-precio">${formatPesos(p.precio)}</span></p>
              <p class="plato-detalle">${p.detalle}</p>
              <p class="etiquetas">${p.etiquetas.map((e) => `<span class="etiqueta etiqueta--${e}">${ETIQUETAS[e].icono} ${ETIQUETAS[e].nombre}</span>`).join('')}</p>
            </div>
            <div class="plato-acciones" data-controles="${p.id}">${controles(p.id)}</div>
          </li>`,
                )
                .join('')}</ul>`
        }
      </section>`,
    )
    .join('')
  seccionesEl.querySelectorAll('.seccion').forEach((s) => observador.observe(s))
}

seccionesEl.addEventListener('click', (e) => {
  const boton = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-delta]')
  if (!boton) return
  const id = boton.dataset.id!
  pedido = cambiarCantidad(pedido, id, Number(boton.dataset.delta))
  const caja = seccionesEl.querySelector<HTMLElement>(`[data-controles="${id}"]`)!
  caja.innerHTML = controles(id)
  caja.querySelector<HTMLButtonElement>(`[data-delta="${boton.dataset.delta}"]`)?.focus()
  actualizarPedido(true)
})

// ---------- Pedido ----------
const barra = $('barra')
const dialogo = $<HTMLDialogElement>('pedido')

function actualizarPedido(animar = false) {
  const { unidades, total } = resumen(pedido, platos)
  barra.hidden = unidades === 0
  $('barra-cantidad').textContent = String(unidades)
  $('barra-total').textContent = formatPesos(total)
  if (animar) {
    barra.classList.remove('rebote')
    void barra.offsetWidth
    barra.classList.add('rebote')
  }
  $('pedido-lineas').innerHTML = lineas(pedido, platos)
    .map((l) => `<li><span>${l.cantidad} × ${l.plato.nombre}</span><span>${formatPesos(l.subtotal)}</span></li>`)
    .join('')
  $('pedido-total').textContent = formatPesos(total)
  actualizarEnlace()
  if (unidades === 0 && dialogo.open) dialogo.close()
}

function actualizarEnlace() {
  const texto = mensaje(pedido, platos, $<HTMLInputElement>('mesa').value)
  $<HTMLAnchorElement>('enviar').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`
}

$('ver-pedido').addEventListener('click', () => dialogo.showModal())
$('mesa').addEventListener('input', actualizarEnlace)
dialogo.addEventListener('click', (e) => {
  if (e.target === dialogo) dialogo.close()
})

pintarSecciones()
actualizarPedido()
botonVolver('oscuro')
