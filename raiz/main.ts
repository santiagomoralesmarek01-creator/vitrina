import '@fontsource/bodoni-moda/400.css'
import '@fontsource/bodoni-moda/400-italic.css'
import '@fontsource/bodoni-moda/600.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { DIBUJOS, RAIZ } from './dibujos'
import {
  MAX_COMENSALES,
  MIN_COMENSALES,
  PRECIO_MENU,
  RESTRICCIONES,
  TURNOS,
  clampComensales,
  diaCorto,
  fechaLarga,
  mesCorto,
  pasosPara,
  precioMaridaje,
  proximasFechas,
  totales,
  validarReserva,
  type PasoServido,
  type Restriccion,
  type Turno,
} from './menu'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- Estado (las preferencias del menú se recuerdan) ----------
const CLAVE = 'raiz-preferencias'
let maridaje = false
let restricciones: Restriccion[] = []
try {
  const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
  if (guardado) {
    maridaje = guardado.maridaje === true
    restricciones = (Array.isArray(guardado.restricciones) ? guardado.restricciones : []).filter((r: string) => r in RESTRICCIONES)
  }
} catch {
  /* sin almacenamiento: arrancamos de cero */
}
function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ maridaje, restricciones }))
  } catch {
    /* no pasa nada */
  }
}

let pasos: PasoServido[] = pasosPara(restricciones)

// ---------- Portada ----------
$('dibujo-raiz').innerHTML = RAIZ
$('dato-precio').textContent = `${formatPesos(PRECIO_MENU)} por persona`

// ---------- Pasos ----------
const svgDe = (p: PasoServido) => `<svg viewBox="0 0 160 160" class="trazo" aria-hidden="true">${DIBUJOS[p.plato.dibujo]}</svg>`

function contenidoPaso(p: PasoServido) {
  const v = p.plato.vino
  const cambio = p.original
    ? `<p class="paso-cambio">Versión ${p.cambio.map((r) => RESTRICCIONES[r].version).join(' y ')}${
        p.original.nombre !== p.plato.nombre ? ` <span>En lugar de: ${p.original.nombre}</span>` : ''
      }</p>`
    : ''
  return `
    <div class="paso-dibujo">${svgDe(p)}</div>
    <div class="paso-texto">
      <p class="paso-numero"><span class="paso-romano">${ROMANOS[p.n - 1]}</span><span class="paso-momento">${p.momento}</span></p>
      ${cambio}
      <h3>${p.plato.nombre}</h3>
      <p class="paso-detalle">${p.plato.detalle}</p>
      <p class="paso-origen">${p.plato.origen}</p>
      <p class="paso-vino"${maridaje ? '' : ' hidden'}>
        <span class="paso-vino-rotulo">Copa</span>
        <span class="paso-vino-nombre"><em>${v.cepa}</em> · ${v.bodega}, ${v.region}</span>
        <span class="paso-vino-precio">${formatPesos(v.precio)}</span>
      </p>
    </div>`
}

$('pasos').innerHTML = pasos
  .map((p) => `<li class="paso${p.original ? ' paso--cambiado' : ''}" id="paso-${p.n}" data-n="${p.n}" data-clave="${p.plato.id}|${p.cambio.join()}">${contenidoPaso(p)}</li>`)
  .join('')

$('progreso').innerHTML = pasos
  .map((p) => `<li><a href="#paso-${p.n}" data-ir="${p.n}"><span class="progreso-num">${ROMANOS[p.n - 1]}</span><span class="progreso-nombre">${p.momento}</span></a></li>`)
  .join('')
$('progreso-barras').innerHTML = pasos.map(() => '<span></span>').join('')

function pintarPasos() {
  const nuevos = pasosPara(restricciones)
  for (const p of nuevos) {
    const li = $(`paso-${p.n}`)
    const clave = `${p.plato.id}|${p.cambio.join()}`
    if (li.dataset.clave !== clave) {
      li.dataset.clave = clave
      li.innerHTML = contenidoPaso(p)
      li.classList.toggle('paso--cambiado', !!p.original)
      if (!sinMovimiento) {
        li.classList.remove('paso--recien')
        void li.offsetWidth
        li.classList.add('paso--recien')
      }
    }
    li.querySelector<HTMLElement>('.paso-vino')!.hidden = !maridaje
  }
  pasos = nuevos
  document.querySelectorAll('#progreso a').forEach((a, i) => a.classList.toggle('progreso--cambiado', !!pasos[i].original))
}

// ---------- Ajustes ----------
function pintarAjustes() {
  $('ajuste-maridaje').setAttribute('aria-pressed', String(maridaje))
  document.querySelectorAll<HTMLButtonElement>('[data-restriccion]').forEach((b) =>
    b.setAttribute('aria-pressed', String(restricciones.includes(b.dataset.restriccion as Restriccion))),
  )
  $('precio-maridaje').textContent = `+${formatPesos(precioMaridaje(pasos))}`
  const cambiados = pasos.filter((p) => p.original).map((p) => ROMANOS[p.n - 1])
  $('aviso-cambios').textContent = cambiados.length
    ? `Cambiamos ${cambiados.length === 1 ? 'el paso' : 'los pasos'} ${cambiados.join(', ')}.`
    : ''
}

$('ajuste-maridaje').addEventListener('click', () => {
  maridaje = !maridaje
  actualizar()
})
document.querySelectorAll<HTMLButtonElement>('[data-restriccion]').forEach((b) =>
  b.addEventListener('click', () => {
    const r = b.dataset.restriccion as Restriccion
    restricciones = restricciones.includes(r) ? restricciones.filter((x) => x !== r) : [...restricciones, r]
    // Orden fijo, para que el texto "vegetariana y sin TACC" no dependa del orden de los clics.
    restricciones = (Object.keys(RESTRICCIONES) as Restriccion[]).filter((x) => restricciones.includes(x))
    actualizar()
  }),
)

// ---------- Aparición y progreso al bajar ----------
const itemsPaso = [...document.querySelectorAll<HTMLElement>('.paso')]

function marcarActual(n: number) {
  document.querySelectorAll<HTMLAnchorElement>('#progreso a').forEach((a) => {
    if (Number(a.dataset.ir) === n) a.setAttribute('aria-current', 'step')
    else a.removeAttribute('aria-current')
    a.classList.toggle('progreso--pasado', Number(a.dataset.ir) < n)
  })
  document.querySelectorAll('#progreso-barras span').forEach((s, i) => s.classList.toggle('lleno', i < n))
  const p = pasos[n - 1]
  $('progreso-texto').innerHTML = `<span>${ROMANOS[n - 1]}</span> ${p.momento} <small>· paso ${n} de ${pasos.length}</small>`
}

if ('IntersectionObserver' in window && !sinMovimiento) {
  const aparecer = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas)
        if (e.isIntersecting) {
          e.target.classList.add('visto')
          aparecer.unobserve(e.target)
        }
    },
    { threshold: 0.2 },
  )
  itemsPaso.forEach((li) => aparecer.observe(li))
} else {
  itemsPaso.forEach((li) => li.classList.add('visto'))
}

if ('IntersectionObserver' in window) {
  const actual = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) if (e.isIntersecting) marcarActual(Number((e.target as HTMLElement).dataset.n))
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  itemsPaso.forEach((li) => actual.observe(li))
}
marcarActual(1)

// ---------- Productores ----------
const PRODUCTORES = [
  { nombre: 'Huerta Las Tunas', lugar: 'Villa Elisa, Buenos Aires', que: 'Espárragos, hinojo y hojas', dibujo: 'esparrago' as const, quien: 'La familia Benítez, tercera generación en la huerta.' },
  { nombre: 'Tambo La Paciencia', lugar: 'Tandil, Buenos Aires', que: 'Quesos de leche cruda y manteca', dibujo: 'queso' as const, quien: 'Cuarenta vacas, un solo ordeñe y quesos de hasta dos años.' },
  { nombre: 'Truchas del Limay', lugar: 'Alto Valle, Río Negro', que: 'Trucha arco iris de agua fría', dibujo: 'trucha' as const, quien: 'Viaja de noche y llega a San Telmo a las diez de la mañana.' },
  { nombre: 'Molino Ruta 5', lugar: 'Pehuajó, Buenos Aires', que: 'Trigo agroecológico molido a piedra', dibujo: 'trigo' as const, quien: 'Muelen a pedido: la harina nunca tiene más de una semana.' },
]
$('productores-lista').innerHTML = PRODUCTORES.map(
  (p) => `
  <li class="productor">
    <svg viewBox="0 0 160 160" class="trazo trazo--chico" aria-hidden="true">${DIBUJOS[p.dibujo]}</svg>
    <h3>${p.nombre}</h3>
    <p class="productor-lugar">${p.lugar}</p>
    <p class="productor-que">${p.que}</p>
    <p class="productor-quien">${p.quien}</p>
  </li>`,
).join('')

// ---------- Reserva ----------
const fechas = proximasFechas(new Date())
let fechaIso: string = fechas.find((f) => f.turnos.length)!.iso
let turno: Turno = '20:00'
let comensales = 2

$('fechas').innerHTML = fechas
  .map((f) => {
    const nota = f.turnos.length === 0 ? 'cerrado' : f.turnos.length === 1 ? `sólo ${f.turnos[0].slice(0, 2)} h` : ''
    return `<button type="button" role="radio" class="fecha" data-iso="${f.iso}" aria-checked="false"${f.turnos.length ? '' : ' disabled'}
      aria-label="${fechaLarga(f.fecha)}${nota ? `, ${nota}` : ''}">
      <span class="fecha-dia">${diaCorto(f.fecha)}</span>
      <span class="fecha-num">${f.fecha.getDate()}</span>
      <span class="fecha-mes">${mesCorto(f.fecha)}</span>
      <small>${nota || '&nbsp;'}</small>
    </button>`
  })
  .join('')

$('turnos').innerHTML = TURNOS.map(
  (t) => `<button type="button" role="radio" class="turno" data-turno="${t}" aria-checked="false">${t} <small>${t === '20:00' ? 'primer turno' : 'segundo turno'}</small></button>`,
).join('')

$('fechas').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-iso]')
  if (!b || b.disabled) return
  fechaIso = b.dataset.iso!
  actualizar()
})
$('turnos').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-turno]')
  if (!b || b.disabled) return
  turno = b.dataset.turno as Turno
  actualizar()
})
$('menos').addEventListener('click', () => {
  comensales = clampComensales(comensales - 1)
  actualizar()
})
$('mas').addEventListener('click', () => {
  comensales = clampComensales(comensales + 1)
  actualizar()
})

function pintarReserva() {
  const f = fechas.find((x) => x.iso === fechaIso)!
  if (!f.turnos.includes(turno)) turno = f.turnos[0]
  document.querySelectorAll<HTMLButtonElement>('[data-iso]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.iso === fechaIso)))
  document.querySelectorAll<HTMLButtonElement>('[data-turno]').forEach((b) => {
    const t = b.dataset.turno as Turno
    b.disabled = !f.turnos.includes(t)
    b.setAttribute('aria-checked', String(t === turno))
  })
  $('comensales').textContent = String(comensales)
  $<HTMLButtonElement>('menos').disabled = comensales <= MIN_COMENSALES
  $<HTMLButtonElement>('mas').disabled = comensales >= MAX_COMENSALES

  const t = totales(pasos, maridaje, comensales)
  const extras = restricciones.map((r) => RESTRICCIONES[r].version)
  $('resumen-cuando').innerHTML = `<em>${fechaLarga(f.fecha)}</em>, ${turno} h · ${comensales} personas`
  $('resumen-lineas').innerHTML = `
    <div><dt>Menú de siete pasos${extras.length ? ` <small>(${extras.join(' y ')})</small>` : ''}</dt><dd>${formatPesos(t.menu)} × ${comensales}</dd></div>
    ${maridaje ? `<div><dt>Maridaje, siete copas</dt><dd>${formatPesos(t.maridaje)} × ${comensales}</dd></div>` : ''}`
  $('resumen-total').textContent = formatPesos(t.total)
  $('resumen-senia').textContent = formatPesos(t.senia)
  $('resumen-saldo').textContent = `El resto, ${formatPesos(t.saldo)}, se paga en el restaurante. Servicio no incluido.`

  $('cuenta-persona').textContent = formatPesos(t.porPersona)
  $('cuenta-detalle').textContent = maridaje
    ? `Menú ${formatPesos(t.menu)} + maridaje ${formatPesos(t.maridaje)}`
    : `Sumá el maridaje por ${formatPesos(precioMaridaje(pasos))} más`
}

$('form-reserva').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = fechas.find((x) => x.iso === fechaIso)
  const nombre = $<HTMLInputElement>('nombre').value
  const error = validarReserva(f, turno, nombre)
  const aviso = $('resumen-aviso')
  aviso.classList.toggle('resumen-aviso--error', !!error)
  if (error) {
    aviso.textContent = error
    if (error.includes('nombre')) $('nombre').focus()
    return
  }
  const t = totales(pasos, maridaje, comensales)
  aviso.textContent = `Listo, ${nombre.trim().split(' ')[0]}. Guardamos la mesa para el ${fechaLarga(f!.fecha)} a las ${turno} y te mandamos el link para la seña de ${formatPesos(t.senia).replace(' ', '\u00a0')}. (Es un ejemplo: no se cobra nada.)`
})

// ---------- Todo junto ----------
function actualizar() {
  pintarPasos()
  pintarAjustes()
  pintarReserva()
  guardar()
}

actualizar()
botonVolver('claro')
