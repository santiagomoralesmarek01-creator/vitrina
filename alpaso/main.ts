import '@fontsource/unbounded/700.css'
import '@fontsource/unbounded/900.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/rubik/700.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { estadoDe, interpolar, svgVaso, type EstadoVaso } from './dibujo'
import {
  ACOMPANIAMIENTOS,
  agregarAcomp,
  agregarBebida,
  alternarExtra,
  base,
  BASES,
  bebidaInicial,
  cambiarBase,
  cambiarCantidad,
  cambiarShots,
  cantidadTotal,
  capas,
  DE_LA_CASA,
  deLaCasa,
  describir,
  enlaceContacto,
  EXTRAS,
  franjasRetiro,
  JARABES,
  LECHES,
  MAX_CANTIDAD,
  nombreBebida,
  nombreItem,
  detalleItem,
  nombreValido,
  normalizar,
  precio,
  PRECIO_SHOT,
  subtotal,
  TAMANIOS,
  textoPedido,
  totalPedido,
  type BaseId,
  type Bebida,
  type ExtraId,
  type Franja,
  type Item,
  type JarabeId,
  type LecheId,
  type TamanioId,
} from './vaso'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const GUARDADO = 'alpaso-pedido'

let bebida: Bebida = bebidaInicial()
let items: Item[] = []
let nombre = ''

try {
  const g = JSON.parse(localStorage.getItem(GUARDADO) ?? 'null') as { items?: Item[]; nombre?: string } | null
  if (g && Array.isArray(g.items)) {
    items = g.items.filter((it) => {
      try {
        if (it.tipo === 'bebida') it.bebida = normalizar(it.bebida)
        return subtotal(it) > 0 && it.cantidad >= 1 && it.cantidad <= MAX_CANTIDAD
      } catch {
        return false
      }
    })
    nombre = typeof g.nombre === 'string' ? g.nombre.slice(0, 30) : ''
  }
} catch {
  items = []
}

function guardar() {
  try {
    localStorage.setItem(GUARDADO, JSON.stringify({ items, nombre }))
  } catch {
    /* sin almacenamiento */
  }
}

// ---------- Vaso animado ----------
let estado: EstadoVaso = estadoDe(bebida)
let animacion = 0

function dibujar(e: EstadoVaso) {
  $('vaso').innerHTML = svgVaso(e, 'v')
}

function animarVaso(destino: EstadoVaso) {
  cancelAnimationFrame(animacion)
  if (sinMovimiento()) {
    estado = destino
    return dibujar(estado)
  }
  const desde = estado
  const t0 = performance.now()
  const dur = 560
  const paso = (t: number) => {
    const k = Math.min(1, (t - t0) / dur)
    const suave = 1 - Math.pow(1 - k, 3)
    estado = interpolar(desde, destino, suave)
    dibujar(estado)
    if (k < 1) animacion = requestAnimationFrame(paso)
  }
  animacion = requestAnimationFrame(paso)
}

$('vaso-portada').innerHTML = svgVaso(estadoDe(DE_LA_CASA[1].bebida), 'p')

// ---------- Las de la casa ----------
$('de-la-casa').innerHTML = DE_LA_CASA.map(
  (d, i) => `
  <article class="tarjeta-casa" style="--tono:var(--t${i % 6})">
    <svg class="vaso vaso--mini" viewBox="0 -30 200 330" aria-hidden="true">${svgVaso(estadoDe(d.bebida), `c${i}`)}</svg>
    <div class="tarjeta-casa-texto">
      <h3>${d.nombre}</h3>
      <p>${d.detalle}</p>
      <div class="tarjeta-casa-pie">
        <strong>${formatPesos(precio(d.bebida))}</strong>
        <button type="button" class="boton boton--chico" data-casa="${d.id}" aria-label="Cargar ${d.nombre} en el armador">Cargala</button>
      </div>
    </div>
  </article>`,
).join('')

$('de-la-casa').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-casa]')
  if (!b) return
  const d = DE_LA_CASA.find((x) => x.id === b.dataset.casa)!
  $('armador').scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth' })
  avisar(`Cargamos ${d.nombre}. Cambiale lo que quieras.`)
  setTimeout(() => cambiar(normalizar(d.bebida)), sinMovimiento() ? 0 : 420)
})

// ---------- Controles ----------
const mas = (n: number) => (n ? `+${formatPesos(n)}` : 'Incluido')

function radios<T extends string>(nombreGrupo: string, lista: { id: T; nombre: string; precio: number }[], extra?: (o: { id: T }) => string) {
  return lista
    .map(
      (o) => `
    <label class="chip">
      <input type="radio" name="${nombreGrupo}" value="${o.id}" />
      <span class="chip-cara">${extra ? extra(o) : ''}<span class="chip-nombre">${o.nombre}</span><small>${mas(o.precio)}</small></span>
    </label>`,
    )
    .join('')
}

const punto = (color: string) => (color ? `<span class="punto" style="background:${color}"></span>` : '<span class="punto punto--vacio"></span>')

$('op-base').innerHTML = BASES.map(
  (b) => `
  <label class="chip chip--base">
    <input type="radio" name="base" value="${b.id}" />
    <span class="chip-cara">${punto(b.color)}<span class="chip-nombre">${b.nombre}</span><span class="chip-detalle">${b.detalle}</span><small>${mas(b.precio)}</small></span>
  </label>`,
).join('')
$('op-tamanio').innerHTML = TAMANIOS.map(
  (t) => `
  <label class="chip chip--tamanio">
    <input type="radio" name="tamanio" value="${t.id}" />
    <span class="chip-cara"><span class="mini-vaso" style="--e:${t.escala}"></span><span class="chip-nombre">${t.nombre}</span><span class="chip-detalle">${t.ml} ml</span><small>${formatPesos(t.precio)}</small></span>
  </label>`,
).join('')
$('op-leche').innerHTML = radios('leche', LECHES, (o) => punto(LECHES.find((l) => l.id === o.id)!.color))
$('op-jarabe').innerHTML = radios('jarabe', JARABES, (o) => punto(JARABES.find((l) => l.id === o.id)!.color))
$('op-extras').innerHTML = EXTRAS.map(
  (x) => `
  <label class="chip">
    <input type="checkbox" name="extra" value="${x.id}" />
    <span class="chip-cara"><span class="chip-nombre">${x.nombre}</span><small>${mas(x.precio)}</small></span>
  </label>`,
).join('')

$('controles').addEventListener('change', (ev) => {
  const t = ev.target as HTMLInputElement
  if (t.name === 'base') cambiar(cambiarBase(bebida, t.value as BaseId))
  else if (t.name === 'tamanio') cambiar({ ...bebida, tamanio: t.value as TamanioId })
  else if (t.name === 'leche') cambiar({ ...bebida, leche: t.value as LecheId })
  else if (t.name === 'jarabe') cambiar({ ...bebida, jarabe: t.value as JarabeId })
  else if (t.name === 'extra') cambiar(alternarExtra(bebida, t.value as ExtraId))
})

$('shots-menos').addEventListener('click', () => cambiar(cambiarShots(bebida, -1)))
$('shots-mas').addEventListener('click', () => cambiar(cambiarShots(bebida, 1)))
$('reiniciar').addEventListener('click', () => cambiar(bebidaInicial()))

function sumarBebida() {
  items = agregarBebida(items, bebida)
  const casa = deLaCasa(bebida)
  avisar(`Sumaste ${casa ? casa.nombre : `un ${nombreBebida(bebida).toLowerCase()} ${bebida.tamanio}`}. Llevás ${cantidadTotal(items)} en el pedido.`)
  pintarPedido(true)
}

$('controles').addEventListener('submit', (ev) => {
  ev.preventDefault()
  sumarBebida()
})
$('barra-sumar').addEventListener('click', sumarBebida)

function cambiar(nueva: Bebida) {
  bebida = normalizar(nueva)
  pintarBebida()
}

function pintarBebida() {
  const b = bebida
  const bs = base(b)
  const marcar = (grupo: string, valor: string) =>
    document.querySelectorAll<HTMLInputElement>(`input[name="${grupo}"]`).forEach((i) => (i.checked = i.value === valor))
  marcar('base', b.base)
  marcar('tamanio', b.tamanio)
  marcar('leche', b.leche)
  marcar('jarabe', b.jarabe)
  document.querySelectorAll<HTMLInputElement>('input[name="extra"]').forEach((i) => {
    i.checked = b.extras.includes(i.value as ExtraId)
    i.disabled = i.value === 'hielo' && bs.siempreFrio
  })
  $('extras-nota').textContent = bs.siempreFrio ? 'El cold brew va siempre con hielo.' : ''

  $('shots').textContent = String(b.shots)
  $<HTMLButtonElement>('shots-menos').disabled = b.shots <= bs.shotsMin
  $<HTMLButtonElement>('shots-mas').disabled = b.shots >= bs.shotsMax
  $('shots-nota').textContent =
    bs.shotsIncluidos > 0
      ? `Trae ${bs.shotsIncluidos} incluidos. Cada shot de más: +${formatPesos(PRECIO_SHOT)}.`
      : `Opcional, +${formatPesos(PRECIO_SHOT)} cada uno.${b.base === 'chai' ? ' Con uno es un dirty chai.' : ''}`

  const casa = deLaCasa(b)
  $('nombre-casa').textContent = casa ? casa.nombre : 'A tu manera'
  $('nombre-bebida').textContent = nombreBebida(b)
  $('desc-bebida').textContent = describir(b)
  const p = formatPesos(precio(b))
  $('precio-bebida').textContent = p
  $('barra-precio').textContent = p
  $('sumar').textContent = `Sumar al pedido · ${p}`
  const cs = capas(b)
  $('capas-lista').innerHTML = [...cs]
    .reverse()
    .map((c) => `<li><span class="punto" style="background:${c.color}"></span>${c.nombre}</li>`)
    .join('')
  $('vaso').setAttribute('aria-label', `${nombreBebida(b)} ${describir(b)}. Capas de abajo hacia arriba: ${cs.map((c) => c.nombre.toLowerCase()).join(', ')}.`)

  animarVaso(estadoDe(b, estado))
}

// ---------- Para acompañar ----------
$('acomps').innerHTML = ACOMPANIAMIENTOS.map(
  (a, i) => `
  <article class="acomp" style="--tono:var(--t${(i + 2) % 6})">
    <span class="acomp-forma acomp-forma--${a.id}" aria-hidden="true"></span>
    <div class="acomp-texto">
      <h3>${a.nombre}</h3>
      <p>${a.detalle}</p>
    </div>
    <div class="acomp-pie">
      <strong>${formatPesos(a.precio)}</strong>
      <button type="button" class="boton boton--chico" data-acomp="${a.id}" aria-label="Sumar ${a.nombre}">Sumar <span class="acomp-n" data-acomp-n="${a.id}"></span></button>
    </div>
  </article>`,
).join('')

$('acomps').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-acomp]')
  if (!b) return
  items = agregarAcomp(items, b.dataset.acomp!)
  avisar(`Sumaste ${ACOMPANIAMIENTOS.find((a) => a.id === b.dataset.acomp)!.nombre.toLowerCase()}.`)
  pintarPedido(true)
})

// ---------- Pedido ----------
let franjas: Franja[] = franjasRetiro(new Date())
let franjaElegida = franjas[0].id

function pintarFranjas() {
  franjas = franjasRetiro(new Date())
  if (!franjas.some((f) => f.id === franjaElegida)) franjaElegida = franjas[0].id
  $('franjas').innerHTML = franjas
    .map(
      (f) => `
    <label class="chip chip--franja">
      <input type="radio" name="franja" value="${f.id}" ${f.id === franjaElegida ? 'checked' : ''} />
      <span class="chip-cara"><span class="chip-nombre">${f.etiqueta}</span><small>${f.detalle}</small></span>
    </label>`,
    )
    .join('')
}

$('franjas').addEventListener('change', (ev) => {
  franjaElegida = (ev.target as HTMLInputElement).value
})

const nombreInput = $<HTMLInputElement>('nombre')
nombreInput.value = nombre
nombreInput.addEventListener('input', () => {
  nombre = nombreInput.value
  if (nombreValido(nombre)) {
    $('nombre-error').textContent = ''
    nombreInput.removeAttribute('aria-invalid')
  }
  guardar()
})

function pintarPedido(rebote = false) {
  const vacio = items.length === 0
  $('pedido-vacio').hidden = !vacio
  $('pedido-lista').innerHTML = items
    .map(
      (it, i) => `
    <li class="linea">
      <div class="linea-texto">
        <p class="linea-nombre">${nombreItem(it)}</p>
        <p class="linea-detalle">${detalleItem(it)}</p>
      </div>
      <div class="linea-cant" role="group" aria-label="Cantidad de ${nombreItem(it)}">
        <button type="button" data-i="${i}" data-d="-1" aria-label="${it.cantidad === 1 ? 'Sacar' : 'Uno menos de'} ${nombreItem(it)}">−</button>
        <span>${it.cantidad}</span>
        <button type="button" data-i="${i}" data-d="1" aria-label="Uno más de ${nombreItem(it)}" ${it.cantidad >= MAX_CANTIDAD ? 'disabled' : ''}>+</button>
      </div>
      <strong class="linea-precio">${formatPesos(subtotal(it))}</strong>
    </li>`,
    )
    .join('')
  const total = formatPesos(totalPedido(items))
  $('pedido-total').textContent = total
  $('barra-total').textContent = total
  $('barra-cuenta').textContent = String(cantidadTotal(items))
  document.querySelectorAll<HTMLElement>('[data-acomp-n]').forEach((el) => {
    const it = items.find((x) => x.tipo === 'acomp' && x.id === el.dataset.acompN)
    el.textContent = it ? `(${it.cantidad})` : ''
  })
  if (!vacio) $('pedido-error').textContent = ''
  if (rebote && !sinMovimiento()) {
    const c = $('barra-cuenta')
    c.classList.remove('salta')
    void c.offsetWidth
    c.classList.add('salta')
  }
  guardar()
}

$('pedido-lista').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-i]')
  if (!b) return
  items = cambiarCantidad(items, Number(b.dataset.i), Number(b.dataset.d))
  pintarPedido()
})

// ---------- Envío (demo) ----------
const demo = $<HTMLDialogElement>('demo')
$<HTMLAnchorElement>('demo-contacto').href = enlaceContacto()

$('pedido-form').addEventListener('submit', (ev) => {
  ev.preventDefault()
  if (items.length === 0) {
    $('pedido-error').textContent = 'Sumá al menos una cosa al pedido.'
    $('armador').scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth' })
    return
  }
  if (!nombreValido(nombre)) {
    $('nombre-error').textContent = 'Poné tu nombre así te llamamos cuando esté listo.'
    nombreInput.setAttribute('aria-invalid', 'true')
    nombreInput.focus()
    return
  }
  pintarFranjas()
  const franja = franjas.find((f) => f.id === franjaElegida) ?? franjas[0]
  $('demo-texto').textContent = textoPedido(items, nombre, franja)
  const ahora = new Date()
  $('demo-hora').textContent = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
  demo.showModal()
})

$('demo-cerrar').addEventListener('click', () => demo.close())
$('demo-nuevo').addEventListener('click', () => {
  items = []
  pintarPedido()
  demo.close()
  cambiar(bebidaInicial())
  window.scrollTo({ top: 0, behavior: sinMovimiento() ? 'auto' : 'smooth' })
})
demo.addEventListener('click', (ev) => {
  if (ev.target === demo) demo.close()
})

// ---------- Aviso ----------
let avisoTimer = 0
function avisar(texto: string) {
  const a = $('aviso')
  a.textContent = texto
  a.classList.add('visible')
  clearTimeout(avisoTimer)
  avisoTimer = window.setTimeout(() => a.classList.remove('visible'), 2600)
}

// La barra de abajo se esconde cuando ya estás mirando el pedido.
const barra = document.querySelector<HTMLElement>('.barra')!
// Y arriba de todo, mientras se ve la portada.
const visibles = new Set<Element>()
const observador = new IntersectionObserver(
  (entradas) => {
    for (const e of entradas) e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)
    barra.classList.toggle('escondida', visibles.size > 0)
  },
  { threshold: 0.25 },
)
observador.observe($('pedido'))
observador.observe(document.querySelector('.portada-acciones')!)

pintarFranjas()
setInterval(pintarFranjas, 60_000)
dibujar(estado)
pintarBebida()
pintarPedido()
botonVolver('claro')
