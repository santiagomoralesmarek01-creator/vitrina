import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/800.css'
import '@fontsource/fraunces/600-italic.css'
import '@fontsource/fraunces/800-italic.css'
import '@fontsource/karla/400.css'
import '@fontsource/karla/600.css'
import '@fontsource/karla/800.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  BEBIDAS,
  COMBOS,
  HORARIOS,
  HORARIO_SEMANA,
  MAX_PERSONAS,
  MESAS,
  ZONAS,
  ahorro,
  codigoReserva,
  estadoMesa,
  horariosLibres,
  mesasDisponibles,
  nombreDia,
  platosDe,
  porPersona,
  proximosDias,
  type Mesa,
  type Tipo,
} from './reservas'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const SVG = 'http://www.w3.org/2000/svg'
const CLAVE = 'domingo:personas'

// ---------- Carta ----------
let tipo: Tipo = 'dulce'

function pintarCarta() {
  $('t-tipo').textContent = tipo
  $('tipos').dataset.tipo = tipo
  document.querySelectorAll<HTMLButtonElement>('[data-tipo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.tipo === tipo)))
  $('platos').innerHTML = platosDe(tipo)
    .map(
      (p, i) => `
      <li class="plato" style="--i:${i}">
        <div class="plato-texto">
          <h3>${p.nombre}${p.etiqueta ? ` <span class="etiqueta">${p.etiqueta}</span>` : ''}</h3>
          <p>${p.detalle}</p>
        </div>
        <span class="plato-precio">${formatPesos(p.precio)}</span>
      </li>`,
    )
    .join('')
}

$('tipos').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tipo]')
  if (!b || b.dataset.tipo === tipo) return
  tipo = b.dataset.tipo as Tipo
  pintarCarta()
})
// Flechas para moverse dentro del grupo de radios.
$('tipos').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  e.preventDefault()
  tipo = tipo === 'dulce' ? 'salado' : 'dulce'
  pintarCarta()
  document.querySelector<HTMLButtonElement>(`[data-tipo="${tipo}"]`)!.focus()
})

$('bebidas').innerHTML = BEBIDAS.map((b) => `<li><span>${b.nombre}</span><span>${formatPesos(b.precio)}</span></li>`).join('')

// ---------- Combos ----------
$('lista-combos').innerHTML = COMBOS.map(
  (c, i) => `
  <article class="combo${i === 0 ? ' combo--estrella' : ''}">
    ${i === 0 ? '<span class="combo-sello">El clásico de la casa</span>' : ''}
    <h3>${c.nombre}</h3>
    <ul>${c.incluye.map((x) => `<li>${x}</li>`).join('')}</ul>
    <p class="combo-precio">${formatPesos(c.precio)}</p>
    <p class="combo-detalle">${c.personas > 1 ? `${formatPesos(porPersona(c))} por persona · ` : ''}ahorrás ${formatPesos(ahorro(c))}</p>
  </article>`,
).join('')

// ---------- Reservas ----------
const dias = proximosDias(new Date())
let dia = ''
let hora = ''
let personas = 2
let mesaId: string | null = null

try {
  const guardado = Number(localStorage.getItem(CLAVE))
  if (guardado >= 1 && guardado <= MAX_PERSONAS) personas = guardado
} catch {
  /* sin almacenamiento: seguimos con 2 */
}

function libresDe(iso: string) {
  return horariosLibres(iso, new Date())
}

// Arrancamos en el primer día con horarios disponibles.
dia = (dias.find((d) => libresDe(d.iso).length) ?? dias[0]).iso
hora = libresDe(dia)[0] ?? HORARIOS[0]

function elegirDia(iso: string) {
  dia = iso
  const libres = libresDe(iso)
  if (!libres.includes(hora)) hora = libres[0] ?? HORARIOS[0]
  pintarReservas()
}

$('dias').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-dia]')
  if (b && !b.disabled) elegirDia(b.dataset.dia!)
})

$('horas').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-hora]')
  if (!b || b.disabled) return
  hora = b.dataset.hora!
  pintarReservas()
})

/** Navegación con flechas en los grupos de radios (días y horarios). */
function flechas(grupo: HTMLElement, atributo: string, elegir: (v: string) => void) {
  grupo.addEventListener('keydown', (e) => {
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!paso) return
    e.preventDefault()
    const botones = [...grupo.querySelectorAll<HTMLButtonElement>(`[${atributo}]`)].filter((b) => !b.disabled)
    const actual = botones.findIndex((b) => b === document.activeElement)
    const siguiente = botones[(actual + paso + botones.length) % botones.length]
    elegir(siguiente.getAttribute(atributo)!)
    grupo.querySelector<HTMLButtonElement>(`[${atributo}="${siguiente.getAttribute(atributo)}"]`)!.focus()
  })
}
flechas($('dias'), 'data-dia', elegirDia)
flechas($('horas'), 'data-hora', (h) => {
  hora = h
  pintarReservas()
})

const inputPersonas = $<HTMLInputElement>('personas')
function cambiarPersonas(n: number) {
  personas = Math.min(MAX_PERSONAS, Math.max(1, Math.round(n) || 1))
  try {
    localStorage.setItem(CLAVE, String(personas))
  } catch {
    /* no importa */
  }
  pintarReservas()
}
$('menos').addEventListener('click', () => cambiarPersonas(personas - 1))
$('mas').addEventListener('click', () => cambiarPersonas(personas + 1))
inputPersonas.addEventListener('change', () => cambiarPersonas(Number(inputPersonas.value)))

// ---------- Plano ----------
const plano = $('plano') as unknown as SVGSVGElement

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, texto?: string) {
  const n = document.createElementNS(SVG, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  if (texto) n.textContent = texto
  return n
}

/** Lo que no cambia: paredes, zonas, barra, cocina, plantas. */
function dibujarSalon() {
  const fondo = el('g', { class: 'salon', 'aria-hidden': 'true' })
  fondo.append(
    el('rect', { x: 10, y: 10, width: 620, height: 400, rx: 20, class: 'piso' }),
    el('rect', { x: 450, y: 10, width: 180, height: 400, class: 'zona-patio' }),
    el('path', { d: 'M450 10 V410', class: 'divisoria' }),
    el('rect', { x: 10, y: 10, width: 440, height: 120, class: 'zona-ventana' }),
    // Ventanal: paños sobre la pared de arriba.
    ...[0, 1, 2, 3, 4].map((i) => el('rect', { x: 30 + i * 82, y: 6, width: 70, height: 9, rx: 2, class: 'vidrio' })),
    el('rect', { x: 10, y: 290, width: 100, height: 120, class: 'cocina' }),
    el('rect', { x: 140, y: 372, width: 200, height: 26, rx: 8, class: 'barra' }),
    el('rect', { x: 10, y: 10, width: 620, height: 400, rx: 20, class: 'paredes' }),
    // Entrada: hueco en la pared de abajo.
    el('path', { d: 'M370 410 h64', class: 'puerta' }),
    el('path', { d: 'M370 410 a64 64 0 0 1 64 -64', class: 'puerta-giro' }),
  )
  const plantas: [number, number, number][] = [
    [470, 30, 14], [612, 30, 12], [612, 140, 10], [470, 270, 12], [612, 270, 14], [470, 392, 12], [612, 392, 10],
  ]
  for (const [x, y, r] of plantas) {
    const g = el('g', { class: 'planta', transform: `translate(${x} ${y})` })
    g.append(el('circle', { r }), el('circle', { r: r * 0.55, cx: r * 0.3, cy: -r * 0.25, class: 'planta-brillo' }))
    fondo.append(g)
  }
  fondo.append(
    el('text', { x: 24, y: 40, class: 'rotulo-zona' }, 'VENTANA'),
    el('text', { x: 24, y: 160, class: 'rotulo-zona' }, 'SALÓN'),
    el('text', { x: 540, y: 400, class: 'rotulo-zona', 'text-anchor': 'middle' }, 'PATIO'),
    el('text', { x: 240, y: 390, class: 'rotulo-barra', 'text-anchor': 'middle' }, 'BARRA'),
    el('text', { x: 60, y: 356, class: 'rotulo-cocina', 'text-anchor': 'middle' }, 'COCINA'),
    el('text', { x: 410, y: 400, class: 'rotulo-entrada', 'text-anchor': 'middle' }, 'ENTRADA'),
  )
  return fondo
}

function sillas(m: Mesa): [number, number][] {
  if (m.forma === 'redonda') {
    const r = m.capacidad === 2 ? 36 : 42
    const angulos = m.capacidad === 2 ? [0, Math.PI] : [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
    return angulos.map((a) => [Math.cos(a) * r, Math.sin(a) * r])
  }
  if (m.forma === 'cuadrada') return [[0, -38], [38, 0], [0, 38], [-38, 0]]
  return [-32, 0, 32].flatMap((x) => [[x, -36], [x, 36]] as [number, number][])
}

function dibujarMesa(m: Mesa) {
  const estado = estadoMesa(m, dia, hora, personas)
  const elegida = mesaId === m.id
  const g = el('g', {
    class: `mesa mesa--${elegida ? 'elegida' : estado}`,
    transform: `translate(${m.x} ${m.y})`,
    'data-mesa': m.id,
  })
  const etiqueta = `Mesa ${m.numero}, ${ZONAS[m.zona].toLowerCase()}, para ${m.capacidad}`
  if (estado === 'libre') {
    g.setAttribute('role', 'button')
    g.setAttribute('tabindex', '0')
    g.setAttribute('aria-pressed', String(elegida))
    g.setAttribute('aria-label', `${etiqueta}: libre${elegida ? ', elegida' : ''}`)
  } else {
    g.setAttribute('aria-hidden', 'true')
  }
  // Zona de toque generosa: cubre la mesa y las sillas.
  const ancho = m.forma === 'larga' ? 132 : 92
  g.append(el('rect', { x: -ancho / 2, y: -46, width: ancho, height: 92, rx: 20, class: 'golpe' }))
  for (const [x, y] of sillas(m)) g.append(el('circle', { cx: x, cy: y, r: 9, class: 'silla' }))
  if (m.forma === 'redonda') g.append(el('circle', { r: m.capacidad === 2 ? 22 : 28, class: 'tabla' }))
  else if (m.forma === 'cuadrada') g.append(el('rect', { x: -25, y: -25, width: 50, height: 50, rx: 8, class: 'tabla' }))
  else g.append(el('rect', { x: -52, y: -23, width: 104, height: 46, rx: 10, class: 'tabla' }))
  g.append(el('text', { y: 6, class: 'numero', 'text-anchor': 'middle' }, String(m.numero)))
  return g
}

function pintarPlano() {
  const enfocada = (document.activeElement as Element | null)?.getAttribute?.('data-mesa')
  plano.replaceChildren(dibujarSalon(), ...MESAS.map(dibujarMesa))
  if (enfocada) plano.querySelector<SVGGElement>(`[data-mesa="${enfocada}"][tabindex]`)?.focus()
}

function elegirMesa(id: string) {
  const m = MESAS.find((x) => x.id === id)!
  if (estadoMesa(m, dia, hora, personas) !== 'libre') return
  mesaId = id
  pintarReservas()
  const suave = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  $('ticket').scrollIntoView({ behavior: suave, block: 'nearest' })
}

plano.addEventListener('click', (e) => {
  const g = (e.target as Element).closest('[data-mesa]')
  if (g) elegirMesa(g.getAttribute('data-mesa')!)
})
plano.addEventListener('keydown', (e) => {
  const g = (e.target as Element).closest('[data-mesa]')
  if (g && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    elegirMesa(g.getAttribute('data-mesa')!)
  }
})

function infoMesa(e: Event) {
  const g = (e.target as Element).closest('[data-mesa]')
  if (!g) return
  const m = MESAS.find((x) => x.id === g.getAttribute('data-mesa'))!
  const estado = estadoMesa(m, dia, hora, personas)
  const texto = { libre: 'libre, tocala para reservar', ocupada: 'ocupada a esa hora', 'no-entra': `no es para ${personas === 1 ? '1 persona' : `${personas} personas`}` }[estado]
  $('plano-info').textContent = `Mesa ${m.numero} · ${ZONAS[m.zona]} · para ${m.capacidad}: ${mesaId === m.id ? 'es la tuya' : texto}`
}
plano.addEventListener('pointerover', infoMesa)
plano.addEventListener('focusin', infoMesa)

// ---------- Ticket ----------
function pintarTicket() {
  const caja = $('ticket')
  const m = MESAS.find((x) => x.id === mesaId)
  if (!m) {
    caja.innerHTML = `
      <div class="ticket ticket--vacio">
        <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="22" class="t-mesa"/><circle cx="40" cy="8" r="7"/><circle cx="40" cy="72" r="7"/><circle cx="8" cy="40" r="7"/><circle cx="72" cy="40" r="7"/></svg>
        <p>Tocá una mesa resaltada en el plano para reservarla.</p>
      </div>`
    return
  }
  const codigo = codigoReserva(dia, hora, m.id, personas)
  caja.innerHTML = `
    <div class="ticket">
      <p class="ticket-ok">¡Mesa reservada!</p>
      <dl>
        <div><dt>Día</dt><dd>${nombreDia(dia)}</dd></div>
        <div><dt>Hora</dt><dd>${hora} h</dd></div>
        <div><dt>Personas</dt><dd>${personas}</dd></div>
        <div><dt>Mesa</dt><dd>${m.numero} · ${ZONAS[m.zona]}</dd></div>
      </dl>
      <div class="ticket-corte" aria-hidden="true"></div>
      <p class="ticket-rotulo">Código de reserva</p>
      <p class="ticket-codigo">${codigo}</p>
      <p class="ticket-nota">Te guardamos la mesa 15 minutos. Si se te complica, avisanos por WhatsApp con este código.</p>
      <div class="ticket-acciones">
        <button type="button" class="boton boton--salvia" id="copiar">Copiar reserva</button>
        <button type="button" class="boton boton--texto" id="otra">Elegir otra mesa</button>
      </div>
      <p class="ticket-aviso" id="aviso"></p>
    </div>`
  $('copiar').addEventListener('click', async () => {
    const texto = `Reserva en Domingo: ${nombreDia(dia)} a las ${hora} h, ${personas} ${personas === 1 ? 'persona' : 'personas'}, mesa ${m.numero} (${ZONAS[m.zona].toLowerCase()}). Código ${codigo}.`
    try {
      await navigator.clipboard.writeText(texto)
      $('aviso').textContent = '¡Copiada! Mandala al grupo.'
    } catch {
      $('aviso').textContent = texto
    }
  })
  $('otra').addEventListener('click', () => {
    mesaId = null
    pintarReservas()
    plano.querySelector<SVGGElement>('[tabindex="0"]')?.focus()
  })
}

function pintarReservas() {
  const libresHoy = libresDe(dia)
  $('dias').innerHTML = dias
    .map((d) => {
      const sinLugar = d.cerrado || !libresDe(d.iso).length
      return `<button type="button" role="radio" class="dia" data-dia="${d.iso}" aria-checked="${d.iso === dia}" tabindex="${d.iso === dia ? 0 : -1}" ${sinLugar ? 'disabled' : ''} aria-label="${d.nombre} ${d.numero} de ${d.mes}${d.cerrado ? ', cerrado' : ''}">
        <span class="dia-nombre">${d.nombre === 'hoy' || d.nombre === 'mañana' ? d.nombre : d.corto}</span>
        <span class="dia-numero">${d.numero}</span>
        <span class="dia-mes">${d.cerrado ? 'cerrado' : d.mes}</span>
      </button>`
    })
    .join('')
  $('horas').innerHTML = HORARIOS.map((h) => {
    const libre = libresHoy.includes(h)
    return `<button type="button" role="radio" class="hora" data-hora="${h}" aria-checked="${h === hora}" tabindex="${h === hora ? 0 : -1}" ${libre ? '' : 'disabled'}>${h}</button>`
  }).join('')

  inputPersonas.value = String(personas)
  $<HTMLButtonElement>('menos').disabled = personas <= 1
  $<HTMLButtonElement>('mas').disabled = personas >= MAX_PERSONAS

  if (mesaId && estadoMesa(MESAS.find((m) => m.id === mesaId)!, dia, hora, personas) !== 'libre') mesaId = null

  const n = mesasDisponibles(dia, hora, personas).length
  const quien = personas === 1 ? '1 persona' : `${personas} personas`
  $('resumen').innerHTML = n
    ? `<strong>${n} ${n === 1 ? 'mesa libre' : 'mesas libres'}</strong> para ${quien} el ${nombreDia(dia)} a las ${hora} h`
    : `<strong>Sin mesas</strong> para ${quien} a las ${hora} h. Probá otro horario.`
  pintarPlano()
  pintarTicket()
}

// ---------- Horarios ----------
const hoyNumero = new Date().getDay()
$('horario').innerHTML = HORARIO_SEMANA.map(
  (h) => `<tr${h.numeros.includes(hoyNumero) ? ' class="hoy"' : ''}><th scope="row">${h.dias}${h.numeros.includes(hoyNumero) ? ' <span class="hoy-marca">hoy</span>' : ''}</th><td>${h.horas}</td></tr>`,
).join('')

pintarCarta()
pintarReservas()
botonVolver('oscuro')
