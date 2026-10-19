import '@fontsource/gloock/400.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { dibujarTorta } from './dibujo'
import {
  alternarRelleno,
  BIZCOCHUELOS,
  COBERTURAS,
  DE_LA_CASA,
  descripcion,
  enlaceWhatsApp,
  faltantes,
  fechaLegible,
  grillaCalendario,
  largoMensaje,
  limpiarMensaje,
  MAX_MENSAJE,
  precio,
  proximosDias,
  RELLENOS,
  senia,
  TAMANIOS,
  textoPedido,
  tortaInicial,
  type Dia,
  type Opcion,
  type Retiro,
  type Torta,
} from './torta'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const GUARDADO = 'miga-encargo'

let torta: Torta = tortaInicial()
let retiro: Retiro = { clave: null, hora: null }
const dias: Dia[] = proximosDias(new Date())

// Recuperar el borrador, si lo hay.
try {
  const g = JSON.parse(localStorage.getItem(GUARDADO) ?? 'null')
  if (g?.torta) {
    precio(g.torta) // valida que las opciones sigan existiendo
    torta = { ...g.torta, mensaje: limpiarMensaje(g.torta.mensaje ?? '') }
    $<HTMLInputElement>('nombre').value = String(g.nombre ?? '')
  }
} catch {
  torta = tortaInicial()
}

function guardar() {
  try {
    localStorage.setItem(GUARDADO, JSON.stringify({ torta, nombre: $<HTMLInputElement>('nombre').value }))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

// ---------- Portada ----------
dibujarTorta($('torta-portada') as unknown as SVGSVGElement, { ...DE_LA_CASA.find((t) => t.id === 'blanca')!, mensaje: '' })

// ---------- Vitrina ----------
$('de-la-casa').innerHTML = DE_LA_CASA.map(
  (t) => `
  <article class="tarjeta">
    <figure class="tarjeta-arco">
      ${t.etiqueta ? `<span class="sello">${t.etiqueta}</span>` : ''}
      <svg data-torta="${t.id}" role="img" aria-label="${t.nombre}"></svg>
    </figure>
    <h3>${t.nombre}</h3>
    <p class="tarjeta-detalle">${t.detalle}</p>
    <p class="tarjeta-precio">${formatPesos(precio(t))} <small>· ${t.porciones} porciones</small></p>
    <button type="button" class="enlace-boton" data-casa="${t.id}">Pedila así <span aria-hidden="true">→</span></button>
  </article>`,
).join('')

document.querySelectorAll<SVGSVGElement>('[data-torta]').forEach((svg) => {
  dibujarTorta(svg, DE_LA_CASA.find((t) => t.id === svg.dataset.torta)!)
})

$('de-la-casa').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-casa]')
  if (!b) return
  const t = DE_LA_CASA.find((x) => x.id === b.dataset.casa)!
  torta = { porciones: t.porciones, bizcochuelo: t.bizcochuelo, rellenos: [...t.rellenos], cobertura: t.cobertura, mensaje: torta.mensaje }
  $('aviso-relleno').textContent = ''
  pintar(true)
  $('encargo').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
})

// ---------- Opciones ----------
const recargo = (o: Opcion) => (o.porPorcion ? `+ ${formatPesos(o.porPorcion * torta.porciones)}` : 'Incluido')

function opcionesRadio(lista: Opcion[], campo: 'bizcochuelo' | 'cobertura') {
  return lista
    .map(
      (o) => `
    <button type="button" class="opcion" role="radio" aria-checked="false" data-${campo}="${o.id}">
      <span class="muestra" style="--muestra:${o.color}"></span>
      <span class="opcion-texto"><span class="opcion-nombre">${o.nombre}</span>${o.detalle ? `<small>${o.detalle}</small>` : ''}</span>
      <span class="opcion-precio" data-recargo="${campo}:${o.id}"></span>
    </button>`,
    )
    .join('')
}

$('tamanios').innerHTML = TAMANIOS.map(
  (t) => `
  <button type="button" class="opcion opcion--tamanio" role="radio" aria-checked="false" data-porciones="${t.porciones}">
    <span class="porciones">${t.porciones}</span>
    <span class="opcion-texto"><span class="opcion-nombre">porciones</span><small>${t.detalle}</small></span>
    <span class="opcion-precio">${formatPesos(t.precio)}</span>
  </button>`,
).join('')
$('bizcochuelos').innerHTML = opcionesRadio(BIZCOCHUELOS, 'bizcochuelo')
$('coberturas').innerHTML = opcionesRadio(COBERTURAS, 'cobertura')
$('rellenos').innerHTML = RELLENOS.map(
  (o) => `
  <button type="button" class="opcion" aria-pressed="false" data-relleno="${o.id}">
    <span class="muestra muestra--check" style="--muestra:${o.color}"></span>
    <span class="opcion-texto"><span class="opcion-nombre">${o.nombre}</span></span>
    <span class="opcion-precio" data-recargo="relleno:${o.id}"></span>
  </button>`,
).join('')

function al(id: string, attr: string, fn: (valor: string) => void) {
  $(id).addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(`[data-${attr}]`)
    if (b) fn(b.dataset[attr]!)
  })
}

al('tamanios', 'porciones', (v) => {
  torta = { ...torta, porciones: Number(v) }
  pintar(true)
})
al('bizcochuelos', 'bizcochuelo', (v) => {
  torta = { ...torta, bizcochuelo: v }
  pintar()
})
al('coberturas', 'cobertura', (v) => {
  torta = { ...torta, cobertura: v }
  pintar()
})
al('rellenos', 'relleno', (v) => {
  try {
    torta = alternarRelleno(torta, v)
    $('aviso-relleno').textContent = ''
  } catch (err) {
    $('aviso-relleno').textContent = (err as Error).message + '.'
  }
  pintar()
})

const inputMensaje = $<HTMLInputElement>('mensaje')
inputMensaje.value = torta.mensaje
inputMensaje.addEventListener('input', () => {
  // Recorta por caracteres (un emoji cuenta uno) sin pelearse con lo que el usuario está tipeando.
  if (largoMensaje(inputMensaje.value) > MAX_MENSAJE) inputMensaje.value = [...inputMensaje.value].slice(0, MAX_MENSAJE).join('')
  torta = { ...torta, mensaje: limpiarMensaje(inputMensaje.value) }
  pintar()
})

$<HTMLInputElement>('nombre').addEventListener('input', () => {
  guardar()
  pintarEnvio()
})

// ---------- Calendario ----------
const mesCorto = new Intl.DateTimeFormat('es-AR', { month: 'short' })
const mesLargo = new Intl.DateTimeFormat('es-AR', { month: 'long' })
const etiquetaDia = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const ESTADOS: Record<Dia['estado'], string> = {
  libre: 'disponible',
  cerrado: 'cerrado',
  anticipacion: 'sin la anticipación necesaria',
  completo: 'agenda llena',
}

{
  const meses = [...new Set(dias.map((d) => mesLargo.format(d.fecha)))]
  $('cal-mes').textContent = `${meses.join(' y ')} ${dias[dias.length - 1].fecha.getFullYear()}`
}

$('dias').innerHTML = grillaCalendario(dias)
  .map((d, i) => {
    if (!d) return '<span class="dia dia--vacio" aria-hidden="true"></span>'
    const n = d.fecha.getDate()
    const marca = n === 1 || i === 0 || d === dias[0] ? `<small>${mesCorto.format(d.fecha).replace('.', '')}</small>` : ''
    const libre = d.estado === 'libre'
    return `<button type="button" class="dia dia--${d.estado}" role="radio" aria-checked="false" data-dia="${d.clave}"
      ${libre ? '' : 'disabled'} aria-label="${etiquetaDia.format(d.fecha)}, ${ESTADOS[d.estado]}">${marca}<span>${n}</span></button>`
  })
  .join('')

al('dias', 'dia', (clave) => {
  const d = dias.find((x) => x.clave === clave)
  if (!d || d.estado !== 'libre') return
  retiro = { clave, hora: retiro.clave === clave ? retiro.hora : null }
  pintarRetiro()
})

al('turnos', 'hora', (hora) => {
  retiro = { ...retiro, hora }
  pintarRetiro()
})

function pintarRetiro() {
  document.querySelectorAll<HTMLButtonElement>('[data-dia]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.dia === retiro.clave)))
  const d = dias.find((x) => x.clave === retiro.clave)
  if (!d) {
    $('turnos-titulo').textContent = 'Elegí un día para ver los horarios.'
    $('turnos').innerHTML = ''
  } else {
    $('turnos-titulo').textContent = `Horarios para el ${fechaLegible(d.clave)}`
    $('turnos').innerHTML = d.turnos
      .map((h) => `<button type="button" class="turno" role="radio" aria-checked="${h === retiro.hora}" data-hora="${h}">${h} h</button>`)
      .join('')
  }
  $('retiro').textContent =
    retiro.clave && retiro.hora
      ? `Retirás el ${fechaLegible(retiro.clave)} a las ${retiro.hora} h`
      : retiro.clave
        ? `Retiro el ${fechaLegible(retiro.clave)} · falta el horario`
        : 'Todavía no elegiste el día de retiro'
  $('retiro').classList.toggle('resumen-retiro--listo', Boolean(retiro.clave && retiro.hora))
  pintarEnvio()
}

// ---------- Envío ----------
function pintarEnvio() {
  $<HTMLAnchorElement>('enviar').href = enlaceWhatsApp(textoPedido(torta, retiro, $<HTMLInputElement>('nombre').value))
  $('enviar').setAttribute('aria-disabled', String(faltantes(retiro).length > 0))
  if (!faltantes(retiro).length) $('aviso-envio').textContent = ''
}

$('enviar').addEventListener('click', (e) => {
  const f = faltantes(retiro)
  if (!f.length) return
  e.preventDefault()
  $('aviso-envio').textContent = `Antes de enviar, elegí ${f.join(' y ')}.`
  const destino = retiro.clave ? document.querySelector<HTMLButtonElement>('[data-hora]') : document.querySelector<HTMLButtonElement>('.dia--libre')
  destino?.focus()
})

// ---------- Pintar ----------
const svg = $('torta') as unknown as SVGSVGElement

function pintar(rearmar = false) {
  const marcar = (sel: string, attr: string, activo: (v: string) => boolean) =>
    document.querySelectorAll<HTMLElement>(sel).forEach((b) => b.setAttribute(attr, String(activo(Object.values(b.dataset)[0]!))))
  marcar('[data-porciones]', 'aria-checked', (v) => Number(v) === torta.porciones)
  marcar('[data-bizcochuelo]', 'aria-checked', (v) => v === torta.bizcochuelo)
  marcar('[data-cobertura]', 'aria-checked', (v) => v === torta.cobertura)
  marcar('[data-relleno]', 'aria-pressed', (v) => torta.rellenos.includes(v))
  document.querySelectorAll<HTMLButtonElement>('[data-relleno]').forEach((b) =>
    b.classList.toggle('opcion--tope', torta.rellenos.length >= 2 && !torta.rellenos.includes(b.dataset.relleno!)),
  )

  const listas = { bizcochuelo: BIZCOCHUELOS, cobertura: COBERTURAS, relleno: RELLENOS }
  document.querySelectorAll<HTMLElement>('[data-recargo]').forEach((s) => {
    const [lista, id] = s.dataset.recargo!.split(':') as [keyof typeof listas, string]
    s.textContent = recargo(listas[lista].find((o) => o.id === id)!)
  })

  $('mensaje-cuenta').textContent = `${largoMensaje(torta.mensaje)}/${MAX_MENSAJE}`

  dibujarTorta(svg, torta)
  if (rearmar) {
    svg.classList.remove('asienta')
    void svg.getBoundingClientRect()
    svg.classList.add('asienta')
  }
  svg.setAttribute('aria-label', descripcion(torta) + (torta.mensaje.trim() ? `, con el mensaje “${torta.mensaje.trim()}”` : ''))

  const total = precio(torta)
  $('descripcion').textContent = descripcion(torta) + (torta.mensaje.trim() ? `, con el mensaje “${torta.mensaje.trim()}”.` : '.')
  $('total').textContent = formatPesos(total)
  $('senia').textContent = formatPesos(senia(total))
  pintarEnvio()
  guardar()
}

pintar()
pintarRetiro()
botonVolver('claro')
