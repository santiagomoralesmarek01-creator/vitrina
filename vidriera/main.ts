import '@fontsource/playfair-display/400-italic.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/700-italic.css'
import '@fontsource/playfair-display/900-italic.css'
import '@fontsource/josefin-sans/600.css'
import '@fontsource/josefin-sans/700.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/caveat/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  ahorro, cajaVacia, cambiarTamanio, completa, cuantas, faltan, precioCaja, quitar, quitarLugar, sumar, surtida, TAMANIOS_CAJA,
  type Caja, type TamanioCaja,
} from './caja'
import {
  BEBIDAS, limpiarDedicatoria, MASAS, masa, MAX_DEDICATORIA, PORCIONES, precioTorta, TAMANIOS_TORTA, torta, TORTAS,
} from './catalogo'
import { DEFS_MASA, DEFS_PORCION, DEFS_TORTA, svgMasa, svgPorcion, svgTorta } from './dibujos'
import {
  cambiarBebida, cambiarPorcion, cantidad, enlaceContacto, lineas, pedidoVacio, quitarLinea, retiroGeneral, sumarCaja, sumarTorta,
  textoPedido, total, vacio, type Pedido,
} from './pedido'
import { calendario, clave, fechaLarga, MESES, retiroLargo, sePuede } from './retiro'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.body.insertAdjacentHTML('afterbegin', DEFS_PORCION + DEFS_MASA + DEFS_TORTA)
botonVolver('oscuro')

let pedido: Pedido = pedidoVacio()

// ---------- Aviso flotante ----------
let tAviso = 0
function avisar(texto: string) {
  const a = $('aviso')
  a.textContent = texto
  a.classList.add('aviso-flotante--visible')
  clearTimeout(tAviso)
  tAviso = window.setTimeout(() => a.classList.remove('aviso-flotante--visible'), 2400)
}

// ---------- 1. Vidriera giratoria ----------
const N = PORCIONES.length
const PASO = 360 / N
let posicion = 0
const seleccion = () => ((posicion % N) + N) % N

$('anillo').insertAdjacentHTML(
  'beforeend',
  PORCIONES.map(
    (p, i) => `
    <button type="button" class="pieza" style="--i:${i}" data-i="${i}" aria-label="${esc(`${p.nombre}, ${formatPesos(p.precio)} la porción`)}">
      <span class="pieza-dibujo">${svgPorcion(p, i)}</span>
      <span class="pieza-cartel" aria-hidden="true"><span>${esc(p.nombre)}</span><b>${formatPesos(p.precio)}</b></span>
    </button>`,
  ).join(''),
)
const piezas = [...document.querySelectorAll<HTMLButtonElement>('.pieza')]

function pintarVidriera(enfocar = false) {
  const sel = seleccion()
  $('anillo').style.setProperty('--giro', `${-posicion * PASO}deg`)
  piezas.forEach((b, i) => {
    const rel = (i - sel + N) % N
    b.dataset.dist = String(Math.min(rel, N - rel))
    b.tabIndex = i === sel ? 0 : -1
    b.setAttribute('aria-current', String(i === sel))
  })
  $('vitrina-cuenta').textContent = `${sel + 1} de ${N}`
  pintarDetalle()
  if (enfocar) piezas[sel].focus({ preventScroll: true })
}

function girar(delta: number, enfocar = false) {
  posicion += delta
  pintarVidriera(enfocar)
}

function irA(i: number, enfocar = false) {
  const sel = seleccion()
  let d = (i - sel + N) % N
  if (d > N / 2) d -= N
  girar(d, enfocar)
}

function pintarDetalle() {
  const p = PORCIONES[seleccion()]
  $('detalle').innerHTML = `
    <div class="detalle-dibujo">${svgPorcion(p, seleccion())}</div>
    <div class="detalle-texto">
      <p class="volanta">Porción · ${seleccion() + 1} de ${N}</p>
      <h3>${esc(p.nombre)}</h3>
      <p>${esc(p.detalle)}</p>
      <p class="detalle-precio">${formatPesos(p.precio)} <small>la porción</small></p>
    </div>
    <div class="detalle-acciones">
      <button type="button" class="boton" data-sumar-porcion="${p.id}">Sumar una porción</button>
      <span class="paso" data-paso-porcion="${p.id}"></span>
    </div>`
  pintarPasoPorcion()
}

function pintarPasoPorcion() {
  const p = PORCIONES[seleccion()]
  const n = pedido.porciones[p.id] ?? 0
  const caja = document.querySelector<HTMLElement>(`[data-paso-porcion="${p.id}"]`)
  if (!caja) return
  caja.innerHTML = n
    ? `<button type="button" class="paso-boton" data-restar-porcion="${p.id}" aria-label="Sacar una porción de ${esc(p.nombre.toLowerCase())}">−</button>
       <span class="paso-num">${n} en el pedido</span>`
    : ''
}

$('girar-izq').addEventListener('click', () => girar(-1))
$('girar-der').addEventListener('click', () => girar(1))
$('giratoria').addEventListener('keydown', (e) => {
  const teclas: Record<string, () => void> = {
    ArrowLeft: () => girar(-1, true),
    ArrowRight: () => girar(1, true),
    Home: () => irA(0, true),
    End: () => irA(N - 1, true),
  }
  if (teclas[e.key]) {
    e.preventDefault()
    teclas[e.key]()
  }
})

let arrastre: { x: number; y: number } | null = null
let recienArrastrado = false
$('giratoria').addEventListener('pointerdown', (e) => {
  arrastre = { x: e.clientX, y: e.clientY }
})
window.addEventListener('pointerup', (e) => {
  if (!arrastre) return
  const dx = e.clientX - arrastre.x
  const dy = e.clientY - arrastre.y
  arrastre = null
  if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) {
    recienArrastrado = true
    setTimeout(() => (recienArrastrado = false), 50)
    girar(dx < 0 ? 1 : -1)
  }
})
$('anillo').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.pieza')
  if (!b || recienArrastrado) return
  const i = Number(b.dataset.i)
  if (i !== seleccion()) irA(i)
  else if (window.innerWidth < 900) $('detalle').scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'nearest' })
})

$('detalle').addEventListener('click', (e) => {
  const t = e.target as HTMLElement
  const s = t.closest<HTMLElement>('[data-sumar-porcion]')
  const r = t.closest<HTMLElement>('[data-restar-porcion]')
  if (s) {
    pedido = cambiarPorcion(pedido, s.dataset.sumarPorcion!, 1)
    avisar(`Sumaste una porción de ${PORCIONES[seleccion()].nombre.toLowerCase()}`)
  } else if (r) {
    pedido = cambiarPorcion(pedido, r.dataset.restarPorcion!, -1)
  } else return
  pintarPedido()
})

// ---------- 2. Caja de masas finas ----------
let caja: Caja = cajaVacia(6)
let cerrada = false
let recien = -1
let tCierre = 0

$('caja-tamanios').innerHTML = ([6, 12] as TamanioCaja[])
  .map(
    (t) => `<button type="button" role="radio" data-tamanio="${t}" aria-checked="${t === caja.tamanio}">
      ${TAMANIOS_CAJA[t].nombre}<small>${t === 12 ? '10 % menos' : 'masas finas'}</small></button>`,
  )
  .join('')

$('masas').innerHTML = MASAS.map(
  (m) => `
  <li class="masa" data-masa="${m.id}">
    <span class="masa-dibujo">${svgMasa(m.dibujo)}</span>
    <span class="masa-texto"><strong>${esc(m.nombre)}</strong><small>${esc(m.detalle)}</small><span class="masa-precio">${formatPesos(m.precio)}</span></span>
    <span class="paso">
      <button type="button" class="paso-boton" data-restar-masa="${m.id}" aria-label="Sacar ${esc(m.nombre.toLowerCase())} de la caja">−</button>
      <span class="paso-num" data-cuenta-masa="${m.id}" aria-live="polite">0</span>
      <button type="button" class="paso-boton paso-boton--mas" data-sumar-masa="${m.id}" aria-label="Sumar ${esc(m.nombre.toLowerCase())} a la caja">+</button>
    </span>
  </li>`,
).join('')

function pintarCaja() {
  const dibujo = $('caja-dibujo')
  dibujo.dataset.tamanio = String(caja.tamanio)
  dibujo.classList.toggle('caja--cerrada', cerrada)
  dibujo.classList.toggle('caja--completa', completa(caja))
  dibujo.setAttribute('aria-hidden', 'false')
  document.querySelectorAll<HTMLElement>('#caja-tamanios [data-tamanio]').forEach((b) => {
    b.setAttribute('aria-checked', String(Number(b.dataset.tamanio) === caja.tamanio))
  })

  $('caja-lugares').innerHTML = Array.from({ length: caja.tamanio }, (_, i) => {
    const id = caja.piezas[i]
    if (!id) return `<li class="lugar lugar--vacio"><span class="sr">Lugar ${i + 1}: vacío</span></li>`
    const m = masa(id)
    return `<li class="lugar${i === recien ? ' lugar--recien' : ''}">
      <button type="button" data-lugar="${i}" ${cerrada ? 'tabindex="-1"' : ''} aria-label="Lugar ${i + 1}: ${esc(m.nombre)}. Tocá para sacarla.">${svgMasa(m.dibujo)}</button></li>`
  }).join('')
  $('caja-lugares').toggleAttribute('inert', cerrada)
  recien = -1

  const n = caja.piezas.length
  $('caja-contador').innerHTML = cerrada
    ? `<strong>Caja cerrada</strong> · ${caja.tamanio} masas`
    : `<strong>${n} de ${caja.tamanio}</strong> · ${faltan(caja) ? `faltan ${faltan(caja)}` : 'completa'}`
  const desc = ahorro(caja)
  $('caja-precio').innerHTML = n
    ? `${formatPesos(precioCaja(caja))}${desc ? ` <small>ahorrás ${formatPesos(desc)}</small>` : ''}`
    : `<small>Desde ${formatPesos(1100)} la masa</small>`

  $('caja-acciones').innerHTML = cerrada
    ? `<button type="button" class="boton" data-caja="sumar">Sumar caja al pedido</button>
       <button type="button" class="boton boton--borde" data-caja="abrir">Abrir y cambiar</button>`
    : `<button type="button" class="boton boton--borde" data-caja="surtido" ${n === caja.tamanio ? 'disabled' : ''}>${n ? 'Completar con surtido' : 'Surtido de la casa'}</button>
       ${n ? '<button type="button" class="boton boton--texto" data-caja="vaciar">Vaciar</button>' : ''}`

  document.querySelectorAll<HTMLElement>('[data-cuenta-masa]').forEach((el) => {
    el.textContent = String(cuantas(caja, el.dataset.cuentaMasa!))
  })
  document.querySelectorAll<HTMLButtonElement>('[data-sumar-masa]').forEach((b) => (b.disabled = completa(caja) || cerrada))
  document.querySelectorAll<HTMLButtonElement>('[data-restar-masa]').forEach(
    (b) => (b.disabled = cerrada || !cuantas(caja, b.dataset.restarMasa!)),
  )
  document.querySelectorAll<HTMLElement>('.masa').forEach((li) => li.classList.toggle('masa--en-caja', cuantas(caja, li.dataset.masa!) > 0))
}

function alCambiarCaja(nueva: Caja) {
  caja = nueva
  clearTimeout(tCierre)
  cerrada = false
  pintarCaja()
  if (completa(caja)) {
    tCierre = window.setTimeout(() => {
      cerrada = true
      pintarCaja()
      avisar('Caja completa: la cerramos con moño')
    }, sinMovimiento() ? 0 : 450)
  }
}

// Al cambiar de tamaño se conserva lo que ya estaba en la caja.
$('caja-tamanios').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tamanio]')
  if (!b) return
  const t = Number(b.dataset.tamanio) as TamanioCaja
  if (t !== caja.tamanio) alCambiarCaja(cambiarTamanio(caja, t))
})
$('caja-tamanios').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  const t: TamanioCaja = caja.tamanio === 6 ? 12 : 6
  alCambiarCaja(cambiarTamanio(caja, t))
  document.querySelector<HTMLElement>(`#caja-tamanios [data-tamanio="${t}"]`)?.focus()
})

$('masas').addEventListener('click', (e) => {
  const t = e.target as HTMLElement
  const s = t.closest<HTMLElement>('[data-sumar-masa]')
  const r = t.closest<HTMLElement>('[data-restar-masa]')
  if (s && !completa(caja)) {
    recien = caja.piezas.length
    alCambiarCaja(sumar(caja, s.dataset.sumarMasa!))
  } else if (r) alCambiarCaja(quitar(caja, r.dataset.restarMasa!))
})

$('caja-lugares').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-lugar]')
  if (!b || cerrada) return
  alCambiarCaja(quitarLugar(caja, Number(b.dataset.lugar)))
})

$('caja-acciones').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-caja]')
  if (!b) return
  const accion = b.dataset.caja
  if (accion === 'surtido') {
    recien = caja.piezas.length
    alCambiarCaja(surtida(caja, ['tartaleta', 'canoncito', 'macaron', 'bombon', 'minilemon', 'profiterol', 'palmerita', 'alfajorcito']))
  } else if (accion === 'vaciar') alCambiarCaja(cajaVacia(caja.tamanio))
  else if (accion === 'abrir') {
    clearTimeout(tCierre)
    cerrada = false
    pintarCaja()
    document.querySelector<HTMLElement>('#caja-lugares [data-lugar]')?.focus()
  } else if (accion === 'sumar') {
    pedido = sumarCaja(pedido, caja)
    avisar(`${TAMANIOS_CAJA[caja.tamanio].nombre} sumada al pedido`)
    caja = cajaVacia(caja.tamanio)
    cerrada = false
    pintarCaja()
    pintarPedido()
    $('caja-tamanios').querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
  }
})

// ---------- 3. Torta entera ----------
const ahora = new Date()
const encargo = { torta: 'lemon', porciones: 12, dedicatoria: '', fecha: '', hora: '' }

$('tortas-lista').innerHTML = TORTAS.map(
  (t) => `<button type="button" role="radio" data-torta="${t.id}" aria-checked="false">
    <span class="chip-color" style="--c1:${t.tope};--c2:${t.costado}" aria-hidden="true"></span>
    <span class="chip-texto"><strong>${esc(t.nombre)}</strong><small>${esc(t.detalle)}</small></span></button>`,
).join('')

function pintarTamanios() {
  $('tamanios-torta').innerHTML = TAMANIOS_TORTA.map(
    (t) => `<button type="button" role="radio" data-porciones="${t.porciones}" aria-checked="${t.porciones === encargo.porciones}">
      <strong>${t.porciones} porciones</strong><small>${t.detalle}</small><small class="opcion-precio">${formatPesos(precioTorta(encargo.torta, t.porciones))}</small></button>`,
  ).join('')
}

function pintarTortaDibujo() {
  $('torta-dibujo').innerHTML = svgTorta(torta(encargo.torta), encargo.porciones, encargo.dedicatoria)
  $('torta-precio').innerHTML = `${esc(torta(encargo.torta).nombre)} · ${encargo.porciones} porciones <strong>${formatPesos(precioTorta(encargo.torta, encargo.porciones))}</strong>`
}

function pintarCalendario() {
  const dias = calendario(ahora)
  let mesAnterior = -1
  $('calendario-dias').innerHTML = dias
    .map((d) => {
      const mes = d.fecha.getMonth()
      const mostrarMes = d.estado !== 'pasado' && mes !== mesAnterior
      if (d.estado !== 'pasado') mesAnterior = mes
      const etiquetaMes = mostrarMes ? `<span class="dia-mes">${MESES[mes].slice(0, 3)}</span>` : ''
      if (d.estado === 'pasado') return `<span class="dia dia--pasado" aria-hidden="true">${d.fecha.getDate()}</span>`
      const elegido = d.clave === encargo.fecha
      const hoy = d.clave === clave(ahora)
      const etiqueta = `${fechaLarga(d.clave)}${hoy ? ' (hoy)' : ''}${d.motivo ? `: ${d.motivo}` : ''}`
      return `<button type="button" class="dia dia--${d.estado}${elegido ? ' dia--elegido' : ''}${hoy ? ' dia--hoy' : ''}"
        data-dia="${d.clave}" aria-pressed="${elegido}" ${d.estado === 'libre' ? '' : 'aria-disabled="true"'}
        aria-label="${esc(etiqueta)}" title="${esc(d.motivo || 'Elegir este día')}">${etiquetaMes}${d.fecha.getDate()}</button>`
    })
    .join('')
}

function pintarHorarios() {
  const campo = $('campo-horario')
  if (!encargo.fecha) {
    campo.hidden = true
    return
  }
  campo.hidden = false
  const dia = calendario(ahora).find((d) => d.clave === encargo.fecha)
  const horarios = dia?.horarios ?? []
  $('rotulo-horario').textContent = `Horario del ${fechaLarga(encargo.fecha)}`
  $('horarios').innerHTML = horarios
    .map((h) => `<button type="button" role="radio" data-hora="${h}" aria-checked="${h === encargo.hora}" tabindex="${h === encargo.hora ? 0 : -1}">${h} h</button>`)
    .join('')
}

function pintarEncargo() {
  document.querySelectorAll<HTMLElement>('#tortas-lista [data-torta]').forEach((b) => {
    const on = b.dataset.torta === encargo.torta
    b.setAttribute('aria-checked', String(on))
    b.tabIndex = on ? 0 : -1
  })
  pintarTamanios()
  document.querySelectorAll<HTMLElement>('#tamanios-torta [data-porciones]').forEach((b) => {
    b.tabIndex = Number(b.dataset.porciones) === encargo.porciones ? 0 : -1
  })
  pintarTortaDibujo()
  pintarCalendario()
  pintarHorarios()
  const n = [...encargo.dedicatoria].length
  $('dedicatoria-cuenta').textContent = `${n}/${MAX_DEDICATORIA}`
  $('encargo-resumen').innerHTML = encargo.fecha && encargo.hora
    ? `Retirás el <strong>${esc(retiroLargo(encargo.fecha, encargo.hora))}</strong>`
    : 'Elegí el día de retiro en el calendario.'
}

/** Flechas entre opciones de un grupo de radios hechos con botones. */
function flechas(grupo: HTMLElement, alElegir: (b: HTMLElement) => void) {
  grupo.addEventListener('keydown', (e) => {
    const sig = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!sig) return
    const bs = [...grupo.querySelectorAll<HTMLElement>('[role="radio"]')]
    const i = bs.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    e.preventDefault()
    const b = bs[(i + sig + bs.length) % bs.length]
    alElegir(b)
    grupo.querySelector<HTMLElement>(`[data-${Object.keys(b.dataset)[0]}="${Object.values(b.dataset)[0]}"]`)?.focus()
  })
}

const elegirTorta = (b: HTMLElement) => { encargo.torta = b.dataset.torta!; pintarEncargo() }
const elegirTamanio = (b: HTMLElement) => { encargo.porciones = Number(b.dataset.porciones); pintarEncargo() }
const elegirHora = (b: HTMLElement) => { encargo.hora = b.dataset.hora!; pintarEncargo() }

$('tortas-lista').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-torta]')
  if (b) elegirTorta(b)
})
$('tamanios-torta').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-porciones]')
  if (b) elegirTamanio(b)
})
$('horarios').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-hora]')
  if (b) elegirHora(b)
})
flechas($('tortas-lista'), elegirTorta)
flechas($('tamanios-torta'), elegirTamanio)
flechas($('horarios'), elegirHora)

$<HTMLInputElement>('dedicatoria').addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement
  const limpia = limpiarDedicatoria(input.value)
  if (input.value.replace(/\s+$/, '') !== limpia.replace(/\s+$/, '') || [...input.value].length > MAX_DEDICATORIA) input.value = limpia
  encargo.dedicatoria = limpia
  pintarTortaDibujo()
  $('dedicatoria-cuenta').textContent = `${[...limpia].length}/${MAX_DEDICATORIA}`
})

$('calendario-dias').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-dia]')
  if (!b) return
  if (b.getAttribute('aria-disabled') === 'true') {
    avisar(b.title)
    return
  }
  const c = b.dataset.dia!
  encargo.fecha = c
  const dia = calendario(ahora).find((d) => d.clave === c)
  if (!encargo.hora || !sePuede(c, encargo.hora, ahora)) encargo.hora = dia?.horarios[0] ?? ''
  pintarEncargo()
  document.querySelector<HTMLElement>(`#calendario-dias [data-dia="${c}"]`)?.focus()
})

$('encargo').addEventListener('submit', (e) => {
  e.preventDefault()
  if (!encargo.fecha || !encargo.hora) {
    avisar('Elegí el día de retiro')
    document.querySelector<HTMLElement>('#calendario-dias .dia--libre')?.focus()
    return
  }
  pedido = sumarTorta(pedido, { ...encargo })
  avisar(`${torta(encargo.torta).nombre} sumada al pedido`)
  encargo.dedicatoria = ''
  $<HTMLInputElement>('dedicatoria').value = ''
  pintarEncargo()
  pintarPedido()
})

// ---------- 4. Café ----------
const COLOR_TAZA: Record<string, string> = {
  cafe: '#3a2019', cortado: '#7a4a2c', lagrima: '#e6cfa8', capuccino: '#b98a5c', submarino: '#5a3324', te: '#c47a2c', jugo: '#f0a020',
}
$('bebidas').innerHTML = BEBIDAS.map(
  (b) => `
  <li class="bebida">
    <svg class="bebida-taza" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 14h22l-2.6 26a3 3 0 0 1-3 2.7H17.6a3 3 0 0 1-3-2.7z" class="taza-vaso"/>
      <path d="M13.2 20h19.6l-2 20.2a2 2 0 0 1-2 1.8H17.2a2 2 0 0 1-2-1.8z" fill="${COLOR_TAZA[b.id]}"/>
      <rect x="10" y="10" width="26" height="5" rx="2" class="taza-tapa"/>
      <path d="M14 26h18" stroke="#fff" stroke-opacity=".25" stroke-width="1.4"/>
    </svg>
    <span class="bebida-texto"><strong>${esc(b.nombre)}</strong><small>${esc(b.detalle)}</small><span class="masa-precio">${formatPesos(b.precio)}</span></span>
    <span class="paso">
      <button type="button" class="paso-boton" data-restar-bebida="${b.id}" aria-label="Sacar un ${esc(b.nombre.toLowerCase())}">−</button>
      <span class="paso-num" data-cuenta-bebida="${b.id}" aria-live="polite">0</span>
      <button type="button" class="paso-boton paso-boton--mas" data-sumar-bebida="${b.id}" aria-label="Sumar un ${esc(b.nombre.toLowerCase())}">+</button>
    </span>
  </li>`,
).join('')

$('bebidas').addEventListener('click', (e) => {
  const t = e.target as HTMLElement
  const s = t.closest<HTMLElement>('[data-sumar-bebida]')
  const r = t.closest<HTMLElement>('[data-restar-bebida]')
  if (s) pedido = cambiarBebida(pedido, s.dataset.sumarBebida!, 1)
  else if (r) pedido = cambiarBebida(pedido, r.dataset.restarBebida!, -1)
  else return
  pintarPedido()
})

// ---------- Pedido ----------
function pintarPedido() {
  const n = cantidad(pedido)
  $('barra-num').textContent = String(n)
  $('barra').classList.toggle('barra--vacia', !n)
  $('barra-titulo').textContent = n ? `Tu pedido · ${n} ${n === 1 ? 'cosa' : 'cosas'}` : 'Tu pedido'
  $('barra-total').textContent = n ? formatPesos(total(pedido)) : 'Todavía está vacío'
  const num = $('barra-num')
  num.classList.remove('barra-num--salto')
  void num.offsetWidth
  if (n) num.classList.add('barra-num--salto')

  document.querySelectorAll<HTMLElement>('[data-cuenta-bebida]').forEach((el) => {
    el.textContent = String(pedido.bebidas[el.dataset.cuentaBebida!] ?? 0)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-restar-bebida]').forEach((b) => (b.disabled = !pedido.bebidas[b.dataset.restarBebida!]))
  pintarPasoPorcion()
  if ($<HTMLDialogElement>('dlg-pedido').open) pintarResumen()
}

function pintarResumen() {
  const ls = lineas(pedido)
  $('resumen').innerHTML = ls.length
    ? ls
        .map(
          (l) => `<li class="linea">
        <div class="linea-texto"><strong>${l.cantidad > 1 ? `${l.cantidad} × ` : ''}${esc(l.titulo)}</strong>${l.detalle ? `<small>${esc(l.detalle)}</small>` : ''}</div>
        <span class="linea-precio">${formatPesos(l.subtotal)}</span>
        <button type="button" class="boton--texto linea-quitar" data-quitar="${l.clave}" aria-label="Quitar ${esc(l.titulo.toLowerCase())}">Quitar</button>
      </li>`,
        )
        .join('')
    : '<li class="resumen-vacio">Todavía no elegiste nada. Mirá la vidriera, armá una caja o encargá una torta.</li>'
  $('resumen-total').textContent = formatPesos(total(pedido))
  $('resumen-retiro').textContent = ls.length && !ls.every((l) => l.clave.startsWith('torta:')) ? `Retiro: ${retiroGeneral(pedido)}.` : ''
  $<HTMLButtonElement>('enviar').disabled = vacio(pedido)
}

const dlgPedido = $<HTMLDialogElement>('dlg-pedido')
const dlgDemo = $<HTMLDialogElement>('dlg-demo')

$('abrir-pedido').addEventListener('click', () => {
  pintarResumen()
  $('nombre-error').hidden = true
  dlgPedido.showModal()
})

$('resumen').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-quitar]')
  if (!b) return
  pedido = quitarLinea(pedido, b.dataset.quitar!)
  pintarPedido()
  pintarResumen()
  ;($('resumen').querySelector<HTMLElement>('[data-quitar]') ?? $('nombre')).focus()
})

for (const d of [dlgPedido, dlgDemo]) {
  d.addEventListener('click', (e) => {
    if (e.target === d || (e.target as HTMLElement).closest('[data-cerrar]')) d.close()
  })
}

$('form-pedido').addEventListener('submit', (e) => {
  e.preventDefault()
  if (vacio(pedido)) return
  const nombre = $<HTMLInputElement>('nombre')
  if (!nombre.value.trim()) {
    $('nombre-error').hidden = false
    nombre.setAttribute('aria-invalid', 'true')
    nombre.focus()
    return
  }
  nombre.removeAttribute('aria-invalid')
  $('nombre-error').hidden = true
  const texto = textoPedido(pedido, { nombre: nombre.value, nota: $<HTMLTextAreaElement>('nota').value })
  $('wa-texto').innerHTML = esc(texto).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
  const h = new Date()
  $('wa-hora').innerHTML = `${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}
    <svg viewBox="0 0 18 12" aria-hidden="true"><path d="M1 6.5l3 3 6-7M7 9.5l1 1 7-8.5" /></svg>`
  $<HTMLAnchorElement>('contacto').href = enlaceContacto()
  dlgPedido.close()
  dlgDemo.showModal()
  dlgDemo.querySelector('.wa-chat')!.scrollTop = 0
})

// ---------- Arranque ----------
pintarVidriera()
pintarCaja()
pintarEncargo()
pintarPedido()
