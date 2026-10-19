import '@fontsource/alfa-slab-one/400.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  MAX_EMPANADAS,
  PRECIOS,
  SABORES,
  ZONAS,
  buscarZona,
  cantidadTotal,
  costoEnvio,
  entrega,
  linkWhatsApp,
  mensajeWhatsApp,
  pedidoListo,
  precio,
  sugerencia,
  sumar,
  type Coccion,
  type Pedido,
  type Sabor,
} from './pedido'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- Estado (el pedido se recuerda entre visitas) ----------
const CLAVE = 'nortena-pedido'
let pedido: Pedido = {}
let coccion: Coccion = 'horno'
let modo: 'envio' | 'retiro' = 'envio'
let barrio = ''
let direccion = ''

try {
  const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
  if (g) {
    for (const s of SABORES) if (Number.isInteger(g.pedido?.[s.id]) && g.pedido[s.id] > 0) pedido = sumar(pedido, s.id, g.pedido[s.id])
    if (g.coccion === 'fritas') coccion = 'fritas'
    if (g.modo === 'retiro') modo = 'retiro'
    if (typeof g.barrio === 'string') barrio = g.barrio
    if (typeof g.direccion === 'string') direccion = g.direccion
  }
} catch {
  /* sin almacenamiento */
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ pedido, coccion, modo, barrio, direccion }))
  } catch {
    /* no pasa nada */
  }
}

// ---------- Dibujo de una empanada ----------
function empanada(s: Sabor, clase = '') {
  const cuerpo =
    s.forma === 'triangulo'
      ? `<path d="M30 3 L57 37 L3 37 Z" class="emp-masa"/><path d="M30 13 L48 33 L12 33 Z" class="emp-relleno"/>`
      : `<path d="M3 34 Q3 5 30 5 Q57 5 57 34 Q30 39 3 34 Z" class="emp-relleno"/><path d="M7 32 Q7 10 30 10 Q53 10 53 32" class="emp-repulgue"/>`
  return `<svg viewBox="0 0 60 40" class="emp ${clase}" style="--c: var(--sabor-${s.id})" aria-hidden="true">${cuerpo}</svg>`
}

// ---------- Tarifas ----------
$('tarifas').innerHTML = [
  ['Unidad', PRECIOS.unidad],
  ['Media docena', PRECIOS.media],
  ['Docena', PRECIOS.docena],
]
  .map(([n, p]) => `<li><span>${n}</span><strong>${formatPesos(p as number)}</strong></li>`)
  .join('')

// ---------- Sabores ----------
$('sabores').innerHTML = SABORES.map(
  (s) => `
  <li class="sabor" data-sabor="${s.id}" style="--c: var(--sabor-${s.id})">
    <div class="sabor-dibujo">${empanada(s)}</div>
    <div class="sabor-texto">
      <h3>${s.nombre}${s.picante ? ' <span class="marca marca--picante">pica</span>' : ''}${s.dulce ? ' <span class="marca marca--dulce">dulce</span>' : ''}</h3>
      <p class="sabor-origen">${s.origen}</p>
      <p class="sabor-detalle">${s.detalle}</p>
    </div>
    <div class="contador" role="group" aria-label="${s.nombre}">
      <button type="button" data-restar="${s.id}" aria-label="Sacar una de ${s.nombre.toLowerCase()}">−</button>
      <output id="cant-${s.id}" aria-label="Cantidad de ${s.nombre.toLowerCase()}">0</output>
      <button type="button" data-sumar="${s.id}" aria-label="Sumar una de ${s.nombre.toLowerCase()}">+</button>
    </div>
  </li>`,
).join('')

$('sabores').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-sumar], [data-restar]')
  if (!b) return
  if (b.dataset.sumar) {
    if (cantidadTotal(pedido) >= MAX_EMPANADAS) {
      $('motivo').textContent = `Por la web tomamos hasta ${MAX_EMPANADAS}. Para más, llamanos y lo armamos juntos.`
      return
    }
    pedido = sumar(pedido, b.dataset.sumar, 1)
  } else {
    pedido = sumar(pedido, b.dataset.restar!, -1)
  }
  pintar()
})

$('vaciar').addEventListener('click', () => {
  pedido = {}
  pintar()
})

// ---------- Opciones ----------
$('coccion').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-coccion]')
  if (!b) return
  coccion = b.dataset.coccion as Coccion
  pintar()
})
$('modo').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-modo]')
  if (!b) return
  modo = b.dataset.modo as 'envio' | 'retiro'
  pintar()
})

// ---------- Zonas ----------
$('lista-barrios').innerHTML = ZONAS.map((z) => `<option value="${z.nombre}"></option>`).join('')
$('zonas').innerHTML = ZONAS.map(
  (z) => `
  <li>
    <button type="button" class="zona${z.costo === null ? ' zona--retiro' : ''}" data-zona="${z.nombre}" aria-pressed="false">
      <span class="zona-nombre">${z.nombre}</span>
      <span class="zona-costo">${z.costo === null ? 'Sólo retiro' : z.costo === 0 ? 'Gratis' : formatPesos(z.costo)}</span>
      <span class="zona-minimo">${z.costo === null ? 'No llegamos todavía' : `Mínimo ${formatPesos(z.minimo)}`}</span>
    </button>
  </li>`,
).join('')

const inputBarrio = $<HTMLInputElement>('barrio')
const inputDireccion = $<HTMLInputElement>('direccion')
inputBarrio.value = barrio
inputDireccion.value = direccion

inputBarrio.addEventListener('input', () => {
  barrio = inputBarrio.value
  pintar()
})
inputDireccion.addEventListener('input', () => {
  direccion = inputDireccion.value
  pintar()
})
$('zonas').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-zona]')
  if (!b) return
  barrio = inputBarrio.value = b.dataset.zona!
  modo = 'envio'
  pintar()
})

// ---------- Bandeja ----------
let anteriores: string[] = []

function pintarBandejas(ids: string[]) {
  const bandejas = Math.max(1, Math.ceil(ids.length / 12))
  let html = ''
  for (let b = 0; b < bandejas; b++) {
    html += `<div class="bandeja">${bandejas > 1 ? `<span class="bandeja-num">Bandeja ${b + 1}</span>` : ''}<div class="bandeja-huecos">`
    for (let i = b * 12; i < b * 12 + 12; i++) {
      const id = ids[i]
      const s = id ? SABORES.find((x) => x.id === id)! : null
      const nueva = s && anteriores[i] !== id && !sinMovimiento ? 'nueva' : ''
      html += `<span class="hueco${s ? ' hueco--lleno' : ''}">${s ? empanada(s, nueva) : ''}</span>`
    }
    html += '</div></div>'
  }
  $('bandejas').innerHTML = html
  anteriores = ids
}

// La barra del celu se esconde mientras la bandeja está a la vista (no tapa el botón de WhatsApp).
let bandejaVisible = false
new IntersectionObserver(([e]) => {
  bandejaVisible = e.isIntersecting
  $('barra-movil').hidden = bandejaVisible || cantidadTotal(pedido) === 0
}).observe($('bandeja'))

// ---------- Pintar ----------
function pintar() {
  const ids = SABORES.flatMap((s) => Array<string>(pedido[s.id] ?? 0).fill(s.id))
  const pr = precio(pedido, coccion)
  const zona = buscarZona(barrio)
  const ent = entrega(modo, zona, pr.total)
  const envio = costoEnvio(ent)

  for (const s of SABORES) {
    const n = pedido[s.id] ?? 0
    $(`cant-${s.id}`).textContent = String(n)
    const li = document.querySelector<HTMLElement>(`[data-sabor="${s.id}"]`)!
    li.classList.toggle('sabor--elegido', n > 0)
    li.querySelector<HTMLButtonElement>('[data-restar]')!.disabled = n === 0
    li.querySelector<HTMLButtonElement>('[data-sumar]')!.disabled = pr.cantidad >= MAX_EMPANADAS
  }

  pintarBandejas(ids)
  const resumen = SABORES.filter((s) => pedido[s.id])
    .map((s) => `${pedido[s.id]} de ${s.nombre.toLowerCase()}`)
    .join(', ')
  $('bandejas').setAttribute('aria-label', pr.cantidad ? `Bandeja con ${resumen}` : 'Bandeja vacía')
  $('bandeja-cuenta').innerHTML = pr.cantidad
    ? pr.cantidad % 12 === 0
      ? `<strong>${pr.cantidad}</strong> empanadas · ¡${pr.cantidad === 12 ? 'docena completa' : `${pr.cantidad / 12} docenas justas`}!`
      : `<strong>${pr.cantidad}</strong> de ${Math.ceil(pr.cantidad / 12) * 12} · ${12 - (pr.cantidad % 12) === 1 ? 'te falta 1' : `te faltan ${12 - (pr.cantidad % 12)}`} para la docena`
    : 'Tocá <strong>+</strong> en los gustos para llenar la bandeja.'

  document.querySelectorAll<HTMLButtonElement>('[data-coccion]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.coccion === coccion)))
  document.querySelectorAll<HTMLButtonElement>('[data-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.modo === modo)))

  // Desglose de la cuenta.
  const fr = (n: number) => formatPesos(coccion === 'fritas' ? Math.round((n * 1.1) / 50) * 50 : n)
  const lineas: string[] = []
  if (pr.docenas) lineas.push(`<div><dt>${pr.docenas} × docena</dt><dd>${formatPesos(pr.docenas * PRECIOS.docena)}</dd></div>`)
  if (pr.medias) lineas.push(`<div><dt>${pr.medias} × media docena</dt><dd>${formatPesos(pr.medias * PRECIOS.media)}</dd></div>`)
  if (pr.sueltas) lineas.push(`<div><dt>${pr.sueltas} × suelta${pr.sueltas > 1 ? 's' : ''}</dt><dd>${formatPesos(pr.sueltas * PRECIOS.unidad)}</dd></div>`)
  if (coccion === 'fritas' && pr.cantidad) lineas.push(`<div><dt>Fritas en grasa (+10 %)</dt><dd>${formatPesos(pr.total - pr.base)}</dd></div>`)
  if (pr.cantidad && ent.tipo === 'envio') lineas.push(`<div><dt>Envío a ${ent.zona.nombre}</dt><dd>${envio ? formatPesos(envio) : 'Gratis'}</dd></div>`)
  $('cuenta-lineas').innerHTML = lineas.join('')
  $('cuenta-total').textContent = formatPesos(pr.total + envio)

  $('ahorro').innerHTML = pr.ahorro > 0 ? `Ahorrás <strong>${formatPesos(pr.ahorro)}</strong> contra comprarlas sueltas` : ''
  const sug = sugerencia(pr.cantidad)
  $('sugerencia').innerHTML = sug
    ? `Sumá <strong>${sug.sumar}</strong> más y pagás ${sug.base === pr.base ? 'lo mismo' : `${fr(sug.base)} en vez de ${fr(pr.base)}`}.`
    : ''

  const textoEntrega: Record<typeof ent.tipo, string> = {
    retiro: 'Retirás en Bulnes 812. Te avisamos cuando estén listas.',
    'sin-barrio': 'Para el envío, <a href="#envio">contanos tu barrio</a>.',
    'no-llegamos': `A ${zona?.nombre} todavía no llegamos: elegí retiro.`,
    'falta-minimo': ent.tipo === 'falta-minimo' ? `El mínimo para ${ent.zona.nombre} es ${formatPesos(ent.zona.minimo)}: te faltan ${formatPesos(ent.falta)}.` : '',
    envio: ent.tipo === 'envio' ? `Envío a ${ent.zona.nombre} · ${direccion.trim() || '<a href="#envio">sumá la dirección</a>'}` : '',
  }
  $('cuenta-entrega').innerHTML = textoEntrega[ent.tipo]
  $('cuenta-entrega').dataset.tipo = ent.tipo

  // Veredicto del buscador de barrio.
  const v = $('veredicto')
  if (!barrio.trim()) {
    v.innerHTML = ''
    v.className = 'veredicto'
  } else if (!zona) {
    v.className = 'veredicto veredicto--no'
    v.innerHTML = `<strong>No encontramos "${barrio.replace(/[<>&"]/g, '')}".</strong> Si no está en la lista, todavía no llegamos: podés retirar por Bulnes 812.`
  } else if (zona.costo === null) {
    v.className = 'veredicto veredicto--no'
    v.innerHTML = `<strong>${zona.nombre}: sólo retiro.</strong> Todavía no llegamos, pero te esperamos en el local.`
  } else {
    v.className = 'veredicto veredicto--si'
    v.innerHTML = `<strong>¡Llegamos a ${zona.nombre}!</strong> Envío ${zona.costo ? formatPesos(zona.costo) : 'gratis'} · pedido mínimo ${formatPesos(zona.minimo)}.`
  }
  document.querySelectorAll<HTMLButtonElement>('[data-zona]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.zona === zona?.nombre)))

  // WhatsApp.
  const listo = pedidoListo(pr.cantidad, ent)
  const wa = $<HTMLAnchorElement>('whatsapp')
  const texto = mensajeWhatsApp(pedido, coccion, ent, formatPesos, direccion)
  wa.href = listo ? linkWhatsApp(texto) : '#'
  wa.setAttribute('aria-disabled', String(!listo))
  $('mensaje').textContent = pr.cantidad ? texto : 'Todavía no sumaste empanadas.'
  if (listo) $('motivo').textContent = ''

  // Barra flotante en el celu.
  $('barra-movil').hidden = pr.cantidad === 0 || bandejaVisible
  $('barra-movil-texto').innerHTML = `<strong>${pr.cantidad}</strong> empanada${pr.cantidad === 1 ? '' : 's'} · ${formatPesos(pr.total + envio)}`

  guardar()
}

$('whatsapp').addEventListener('click', (e) => {
  if ($('whatsapp').getAttribute('aria-disabled') !== 'true') return
  e.preventDefault()
  const pr = precio(pedido, coccion)
  const ent = entrega(modo, buscarZona(barrio), pr.total)
  $('motivo').textContent = !pr.cantidad
    ? 'Primero sumá algunas empanadas.'
    : ent.tipo === 'sin-barrio'
      ? 'Contanos tu barrio para calcular el envío, o elegí retiro.'
      : ent.tipo === 'falta-minimo'
        ? `Para envío a ${ent.zona.nombre} faltan ${formatPesos(ent.falta)}. Sumá unas más o elegí retiro.`
        : 'A ese barrio todavía no llegamos: elegí retiro.'
})

// ---------- El cerro de los catorce colores ----------
function cerro() {
  const colores = ['terracota', 'mostaza', 'fucsia', 'azul', 'verde', 'masa', 'terracota', 'fucsia', 'mostaza', 'azul', 'verde', 'terracota', 'mostaza', 'fucsia']
  const silueta = 'M0 260 L0 170 L40 140 L70 150 L120 70 L150 90 L200 30 L240 80 L270 60 L330 120 L360 110 L400 150 L400 260 Z'
  let vetas = ''
  colores.forEach((c, i) => {
    const y = 40 + i * 16
    vetas += `<path d="M-20 ${y + 60} L60 ${y} L140 ${y + 60} L220 ${y} L300 ${y + 60} L380 ${y} L460 ${y + 60}" class="veta veta--${c}"/>`
  })
  $('cerro').innerHTML = `
    <defs><clipPath id="clip-cerro"><path d="${silueta}"/></clipPath></defs>
    <circle cx="320" cy="50" r="26" class="f-mostaza"/>
    <g clip-path="url(#clip-cerro)"><rect width="400" height="260" class="f-terracota"/>${vetas}</g>
    <path d="${silueta}" class="contorno"/>
    <path d="M0 236 L400 236" class="contorno"/>
    ${[30, 74, 340, 372].map((x) => `<path d="M${x} 236 v-30 m0 10 h-8 v-12 m8 6 h8 v-14" class="cardon"/>`).join('')}`
}
cerro()

pintar()
botonVolver('claro')
