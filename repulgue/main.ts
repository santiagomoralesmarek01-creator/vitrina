import '@fontsource/fraunces/900.css'
import '@fontsource/fraunces/900-italic.css'
import '@fontsource/work-sans/400.css'
import '@fontsource/work-sans/600.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { DEFS, dibujoBolsa, dibujoEmpanada, svgEmpanada } from './dibujo'
import { GUSTOS, gustoPorId } from './gustos'
import { estadoHorno, textoHorno } from './horno'
import { nuevaPregunta, puntajeInicial, responder, titulo, type Pregunta } from './juego'
import { MAX_PERSONAS, calcular, cantidadEnPalabras, type Modo } from './juntada'
import {
  ENVIO,
  MAX_BOLSA,
  PRECIOS,
  ahorro,
  cantidadTotal,
  desglose,
  enlaceContacto,
  mejorCombinacion,
  resumen,
  sugerencia,
  sumar,
  textoPedido,
  validar,
  type Bolsa,
  type Entrega,
} from './pedido'

/** Pesos sin que el signo quede solo al final de una línea. */
const plata = (n: number) => formatPesos(n).replace(' ', '\u00a0')

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const empanadas = (n: number) => plural(n, 'empanada', 'empanadas')
const desplazar = (id: string) => $(id).scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'start' })

document.body.insertAdjacentHTML('afterbegin', DEFS)
botonVolver('claro')

// ---------- Portada ----------
$('portada-empanada').innerHTML = dibujoEmpanada('trenzado')

// ---------- Horno en vivo ----------
function pintarHorno() {
  const e = estadoHorno(new Date())
  $('horno-texto').textContent = textoHorno(e)
  $('horno').classList.toggle('apagado', !e.abierto)
  $('horno-avance').style.strokeDashoffset = String(e.abierto ? 100 - e.progreso * 100 : 100)
}
pintarHorno()
setInterval(pintarHorno, 15000)

// ---------- El código del repulgue ----------
const NOMBRE_REPULGUE: Record<string, string> = {
  trenzado: 'Trenzado',
  cuernitos: 'Con cuernitos',
  pellizco: 'De pellizco',
  tenedor: 'Al tenedor',
  arriba: 'Arriba',
  ola: 'En ola',
  punto: 'Con punto',
  tajos: 'Con tajos',
}

$('cartas').innerHTML = GUSTOS.map(
  (g, i) => `
  <li>
    <button type="button" class="carta" aria-pressed="false" data-carta="${g.id}" style="--giro: ${[-2, 1.5, -1, 2][i % 4]}deg">
      <span class="carta-cara carta-frente">
        <span class="carta-num">N.º ${String(i + 1).padStart(2, '0')}</span>
        ${svgEmpanada(g.repulgue, 'carta-svg')}
        <span class="carta-repulgue">${NOMBRE_REPULGUE[g.repulgue]}</span>
        <span class="carta-toca" aria-hidden="true">Tocá para abrir</span>
      </span>
      <span class="carta-cara carta-dorso" aria-hidden="true">
        <span class="carta-num">N.º ${String(i + 1).padStart(2, '0')}</span>
        <span class="carta-nombre">${g.nombre}</span>
        <span class="carta-pista">${g.pista}</span>
        <span class="carta-detalle">${g.detalle}</span>
        <span class="etiquetas">${g.vegetariano ? '<span class="etiqueta">Veggie</span>' : ''}${g.picante ? '<span class="etiqueta">Pica</span>' : ''}</span>
      </span>
    </button>
  </li>`,
).join('')

$('cartas').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-carta]')
  if (!b) return
  const abierta = b.getAttribute('aria-pressed') !== 'true'
  b.setAttribute('aria-pressed', String(abierta))
  b.querySelector('.carta-dorso')!.setAttribute('aria-hidden', String(!abierta))
  b.querySelector('.carta-frente')!.setAttribute('aria-hidden', String(abierta))
})

// ---------- Juego ----------
let puntaje = puntajeInicial()
let pregunta: Pregunta = nuevaPregunta()
let respondida = false

function pintarPregunta() {
  const g = gustoPorId(pregunta.correcta)!
  respondida = false
  const svg = $('juego-dibujo')
  svg.innerHTML = dibujoEmpanada(g.repulgue)
  svg.classList.remove('entra')
  void svg.getBoundingClientRect()
  svg.classList.add('entra')
  $('juego-pista').textContent = 'Mirá bien el borde.'
  $('juego-resultado').textContent = ''
  $('juego-resultado').className = 'juego-resultado'
  $('juego-opciones').innerHTML = pregunta.opciones
    .map((id) => `<button type="button" class="opcion" data-opcion="${id}">${gustoPorId(id)!.nombre}</button>`)
    .join('')
}

function pintarMarcador() {
  $('m-aciertos').textContent = `${puntaje.aciertos}/${puntaje.jugadas}`
  $('m-racha').textContent = String(puntaje.racha)
  $('m-mejor').textContent = String(puntaje.mejorRacha)
  $('m-titulo').textContent = titulo(puntaje)
}

$('juego-opciones').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-opcion]')
  if (!b || respondida) return
  respondida = true
  const r = responder(puntaje, pregunta, b.dataset.opcion!)
  puntaje = r.puntaje
  const g = gustoPorId(pregunta.correcta)!
  $('juego-opciones')
    .querySelectorAll<HTMLButtonElement>('[data-opcion]')
    .forEach((o) => {
      o.disabled = true
      if (o.dataset.opcion === pregunta.correcta) o.classList.add('bien')
      else if (o === b) o.classList.add('mal')
    })
  const res = $('juego-resultado')
  res.textContent = r.acierto ? `¡Sí! Es ${g.nombre}.` : `No: es ${g.nombre}.`
  res.className = `juego-resultado ${r.acierto ? 'bien' : 'mal'}`
  $('juego-pista').textContent = g.pista
  pintarMarcador()
  $('juego-otra').focus({ preventScroll: true })
})

$('juego-otra').addEventListener('click', () => {
  pregunta = nuevaPregunta(Math.random, pregunta.correcta)
  pintarPregunta()
  $('juego-opciones').querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
})

pintarPregunta()
pintarMarcador()

// ---------- La bolsa ----------
const CLAVE = 'repulgue-bolsa'
let bolsa: Bolsa = leer()

function leer(): Bolsa {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Bolsa
    let b: Bolsa = {}
    for (const g of GUSTOS) if (crudo[g.id] > 0) b = sumar(b, g.id, Math.floor(crudo[g.id]))
    return b
  } catch {
    return {}
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(bolsa))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

$('gustos').innerHTML = GUSTOS.map(
  (g) => `
  <li class="gusto" data-gusto="${g.id}">
    ${svgEmpanada(g.repulgue, 'gusto-svg')}
    <div class="gusto-texto">
      <h3>${g.nombre}${g.vegetariano ? ' <span class="etiqueta">Veggie</span>' : ''}${g.picante ? ' <span class="etiqueta">Pica</span>' : ''}</h3>
      <p>${g.detalle}</p>
    </div>
    <div class="paso" role="group" aria-label="${g.nombre}">
      <button type="button" data-id="${g.id}" data-d="-1" aria-label="Sacar una de ${g.nombre}">−</button>
      <output id="n-${g.id}" aria-live="off">0</output>
      <button type="button" data-id="${g.id}" data-d="1" aria-label="Sumar una de ${g.nombre}">+</button>
    </div>
  </li>`,
).join('')

$('gustos').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-id]')
  if (!b) return
  const id = b.dataset.id!
  const d = Number(b.dataset.d)
  const antes = cantidadTotal(bolsa)
  bolsa = sumar(bolsa, id, d)
  if (d > 0 && cantidadTotal(bolsa) === antes) avisar(`La bolsa llega hasta ${MAX_BOLSA}. Para más, escribinos.`)
  if (d > 0 && cantidadTotal(bolsa) > antes) caer(id, b)
  pintarBolsa(d > 0)
})

/** Una empanada que cae desde el botón hasta la boca de la bolsa. */
function caer(id: string, desde: HTMLElement) {
  if (sinMovimiento()) return
  const g = gustoPorId(id)!
  const caja = $('bolsa-caja')
  const rc = caja.getBoundingClientRect()
  const rb = desde.getBoundingClientRect()
  const el = document.createElement('div')
  el.className = 'cae'
  el.innerHTML = svgEmpanada(g.repulgue, 'cae-svg')
  caja.append(el)
  const finX = rc.width / 2 - 30
  const finY = rc.height * 0.2
  // Si el botón está a la vista y cerca, sale desde ahí; si no, cae desde arriba.
  const cerca = rb.top > rc.top - 400 && rb.top < rc.bottom + 400 && Math.abs(rb.left - rc.left) < 900
  const iniX = cerca ? Math.max(-120, Math.min(rc.width + 40, rb.left - rc.left - 30)) : finX
  const iniY = cerca ? rb.top - rc.top - 30 : -90
  el.animate(
    [
      { transform: `translate(${iniX}px, ${iniY}px) rotate(-30deg) scale(0.8)`, opacity: 0.95 },
      { transform: `translate(${(iniX + finX) / 2}px, ${Math.min(iniY, finY) - 50}px) rotate(10deg) scale(0.9)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${finX}px, ${finY}px) rotate(20deg) scale(0.6)`, opacity: 0 },
    ],
    { duration: 620, easing: 'cubic-bezier(.3,.6,.4,1)' },
  ).onfinish = () => el.remove()
}

/** Las que asoman por la boca, alternando gustos para que se vea variado. */
function asomadas(b: Bolsa): string[] {
  const colas = GUSTOS.filter((g) => b[g.id]).map((g) => ({ r: g.repulgue as string, n: b[g.id] }))
  const r: string[] = []
  const tope = Math.min(5, cantidadTotal(b))
  while (r.length < tope) {
    for (const c of colas) {
      if (c.n > 0 && r.length < tope) {
        r.push(c.r)
        c.n--
      }
    }
  }
  return r
}

let sugerida = 0

function pintarBolsa(salta = false) {
  const n = cantidadTotal(bolsa)
  const svg = $('bolsa-svg')
  svg.innerHTML = dibujoBolsa(n, Math.min(1, n / 36), asomadas(bolsa))
  svg.setAttribute('aria-label', n ? `Tu bolsa: ${empanadas(n)}` : 'Tu bolsa, vacía')
  if (salta && !sinMovimiento()) {
    svg.classList.remove('salta')
    void svg.getBoundingClientRect()
    svg.classList.add('salta')
  }

  for (const g of GUSTOS) {
    const cant = bolsa[g.id] ?? 0
    $(`n-${g.id}`).textContent = String(cant)
    const fila = $('gustos').querySelector<HTMLElement>(`[data-gusto="${g.id}"]`)!
    fila.classList.toggle('elegido', cant > 0)
    fila.querySelector<HTMLButtonElement>('[data-d="-1"]')!.disabled = cant === 0
    fila.querySelector<HTMLButtonElement>('[data-d="1"]')!.disabled = n >= MAX_BOLSA
  }

  const c = mejorCombinacion(n)
  $('ticket-cuenta').textContent = n ? empanadas(n) : 'Vacía'
  $('ticket-desglose').textContent = n ? desglose(c) : 'Sumá empanadas de la lista.'
  $('ticket-total').textContent = plata(c.total)
  const a = ahorro(n)
  $('ticket-ahorro').textContent = a > 0 ? `Te ahorrás ${plata(a)} contra sueltas` : n ? `Media docena: ${plata(PRECIOS.media)}` : ''

  const s = sugerencia(n)
  $('ticket-sugerencia').hidden = !s
  if (s) {
    sugerida = s.sumar
    $('sugerencia-texto').textContent =
      s.total < c.total
        ? `Sumá ${s.sumar === 1 ? 'una más' : `${s.sumar} más`} y pagás menos: ${plata(s.total)}.`
        : `Con ${s.sumar === 1 ? 'una más' : `${s.sumar} más`} pagás lo mismo.`
    $('sugerencia-boton').textContent = s.sumar === 1 ? 'Sumar una' : `Sumar ${s.sumar}`
  }

  ;($('vaciar') as HTMLButtonElement).disabled = n === 0
  pintarBarra()
  pintarPedido()
  guardar()
}

$('sugerencia-boton').addEventListener('click', () => {
  // Suma las que faltan repartidas en los gustos que ya están en la bolsa (o carne, si está vacía).
  const ids = GUSTOS.filter((g) => bolsa[g.id]).map((g) => g.id)
  for (let i = 0; i < sugerida; i++) bolsa = sumar(bolsa, ids[i % ids.length] ?? 'carne', 1)
  pintarBolsa(true)
  avisar(`Listo: ${empanadas(cantidadTotal(bolsa))} en la bolsa.`)
})

$('vaciar').addEventListener('click', () => {
  bolsa = {}
  pintarBolsa()
  avisar('Vaciaste la bolsa.')
})

// ---------- Juntada ----------
const personasIn = $<HTMLInputElement>('personas')
const veggiesIn = $<HTMLInputElement>('veggies')
let ultima = calcular(8, 'principal', 2)

const leerNumero = (el: HTMLInputElement, min: number, max: number) => {
  const v = Math.round(Number(el.value))
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min
}

function pintarJuntada(normalizar = false) {
  const personas = leerNumero(personasIn, 1, MAX_PERSONAS)
  const veg = leerNumero(veggiesIn, 0, personas)
  if (normalizar) {
    personasIn.value = String(personas)
    veggiesIn.value = String(veg)
  }
  veggiesIn.max = String(personas)
  const modo = (document.querySelector<HTMLInputElement>('input[name="modo"]:checked')?.value ?? 'principal') as Modo
  ultima = calcular(personas, modo, veg)
  $('j-personas').textContent = plural(personas, 'persona', 'personas')
  const cuanto = cantidadEnPalabras(ultima)
  $('j-cuanto').textContent = cuanto
  $('j-cuanto').dataset.texto = cuanto
  $('j-detalle').textContent = `${empanadas(ultima.total)} · ${plata(mejorCombinacion(ultima.total).total)}${
    ultima.vegetarianos ? ` · al menos ${ultima.minimoVeggie} sin carne` : ''
  }`
  $('j-reparto').innerHTML = GUSTOS.filter((g) => ultima.reparto[g.id])
    .map(
      (g) =>
        `<li class="${g.vegetariano ? 'veg' : ''}">${svgEmpanada(g.repulgue, 'reparto-svg')}<span><strong>${ultima.reparto[g.id]}</strong> ${g.nombre}</span></li>`,
    )
    .join('')
  document.querySelectorAll<HTMLButtonElement>('[data-paso]').forEach((b) => {
    const el = b.dataset.paso === 'personas' ? personasIn : veggiesIn
    const v = Number(el.value)
    b.disabled = b.dataset.d === '-1' ? v <= Number(el.min) : v >= Number(el.max)
  })
}

$('calculadora').addEventListener('input', () => pintarJuntada())
$('calculadora').addEventListener('change', () => pintarJuntada(true))
$('calculadora').addEventListener('submit', (ev) => ev.preventDefault())
$('calculadora').addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-paso]')
  if (!b) return
  const el = b.dataset.paso === 'personas' ? personasIn : veggiesIn
  el.value = String(Number(el.value) + Number(b.dataset.d))
  pintarJuntada(true)
})

$('j-cargar').addEventListener('click', () => {
  if (!ultima.total) return
  bolsa = { ...ultima.reparto }
  pintarBolsa(true)
  desplazar('bolsa')
  avisar(`Cargamos ${empanadas(ultima.total)} en la bolsa.`)
})

pintarJuntada(true)

// ---------- Pedido ----------
const nombreIn = $<HTMLInputElement>('nombre')
const direccionIn = $<HTMLInputElement>('direccion')

function entrega(): Entrega {
  const tipo = document.querySelector<HTMLInputElement>('input[name="entrega"]:checked')?.value
  return tipo === 'envio' ? { tipo: 'envio', direccion: direccionIn.value } : { tipo: 'retiro' }
}

function pintarPedido() {
  const e = entrega()
  const r = resumen(bolsa, e)
  $('campo-direccion').hidden = e.tipo !== 'envio'
  $('resumen').innerHTML = GUSTOS.filter((g) => bolsa[g.id])
    .map((g) => `<li>${svgEmpanada(g.repulgue, 'resumen-svg')}<span class="resumen-n">${bolsa[g.id]} ×</span><span>${g.nombre}</span></li>`)
    .join('')
  $('resumen-vacio').hidden = r.cantidad > 0
  $('c-desglose').textContent = r.cantidad ? `${empanadas(r.cantidad)} (${desglose(r.combinacion)})` : 'Empanadas'
  $('c-subtotal').textContent = plata(r.subtotal)
  $('c-envio').textContent = e.tipo === 'retiro' ? 'Retirás' : r.cantidad === 0 ? '—' : r.envio ? plata(r.envio) : 'Gratis'
  $('c-total').textContent = plata(r.total)
  if (r.cantidad) $('pedido-error').textContent = ''
}

document.querySelectorAll('input[name="entrega"]').forEach((el) => el.addEventListener('change', pintarPedido))
direccionIn.addEventListener('input', () => {
  $('direccion-error').textContent = ''
  direccionIn.removeAttribute('aria-invalid')
  pintarPedido()
})
nombreIn.addEventListener('input', () => {
  $('nombre-error').textContent = ''
  nombreIn.removeAttribute('aria-invalid')
})

const demo = $<HTMLDialogElement>('demo')
$<HTMLAnchorElement>('demo-contacto').href = enlaceContacto()

$('pedido-form').addEventListener('submit', (ev) => {
  ev.preventDefault()
  const e = entrega()
  const error = validar(bolsa, nombreIn.value, e)
  if (error === 'vacia') {
    $('pedido-error').textContent = 'La bolsa está vacía: sumá al menos una empanada.'
    desplazar('bolsa')
    return
  }
  if (error === 'nombre') {
    $('nombre-error').textContent = 'Poné tu nombre así sabemos de quién es la bolsa.'
    nombreIn.setAttribute('aria-invalid', 'true')
    nombreIn.focus()
    return
  }
  if (error === 'direccion') {
    $('direccion-error').textContent = 'Necesitamos la dirección para el envío.'
    direccionIn.setAttribute('aria-invalid', 'true')
    direccionIn.focus()
    return
  }
  $('demo-texto').textContent = textoPedido(bolsa, nombreIn.value, e, plata)
  const ahora = new Date()
  $('demo-hora').textContent = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
  demo.showModal()
})

$('demo-cerrar').addEventListener('click', () => demo.close())
$('demo-nuevo').addEventListener('click', () => {
  bolsa = {}
  pintarBolsa()
  demo.close()
  desplazar('bolsa')
})
demo.addEventListener('click', (ev) => {
  if (ev.target === demo) demo.close()
})

// ---------- Barra de abajo ----------
let pedidoALaVista = false
function pintarBarra() {
  const n = cantidadTotal(bolsa)
  const visible = n > 0 && !pedidoALaVista
  const barra = $('barra')
  barra.classList.toggle('visible', visible)
  barra.setAttribute('aria-hidden', String(!visible))
  $('barra-ir').tabIndex = visible ? 0 : -1
  $('barra-cuenta').textContent = empanadas(n)
  $('barra-total').textContent = plata(mejorCombinacion(n).total)
}

new IntersectionObserver(
  ([e]) => {
    pedidoALaVista = e.isIntersecting
    pintarBarra()
  },
  { rootMargin: '0px 0px -30% 0px' },
).observe($('pedido-form'))

// ---------- Aviso ----------
let avisoTimer = 0
function avisar(texto: string) {
  const a = $('aviso')
  a.textContent = texto
  a.classList.add('visible')
  clearTimeout(avisoTimer)
  avisoTimer = window.setTimeout(() => a.classList.remove('visible'), 2600)
}

pintarBolsa()

// Para que los precios de la portada salgan siempre de la misma fuente.
document.querySelectorAll('.datos strong').forEach((el, i) => {
  const v = [PRECIOS.unidad, PRECIOS.media, PRECIOS.docena][i]
  if (v) el.textContent = plata(v)
})
$('envio-nota').textContent = `(envío ${plata(ENVIO.costo)}, gratis desde ${plata(ENVIO.gratisDesde)})`
