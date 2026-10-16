import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/800.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  BARBEROS,
  SERVICIOS,
  abierto,
  claveDia,
  codigo,
  horarios,
  ics,
  minutosAHora,
  proximosDias,
  type Turno,
} from './turnos'

const $ = (id: string) => document.getElementById(id)!
const CLAVE = 'filo-turnos'
const formatoDia = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
/** "viernes, 16 de octubre" → "Viernes, 16 de octubre" (solo la primera letra). */
const diaLargo = { format: (d: Date) => formatoDia.format(d).replace(/^./, (c) => c.toUpperCase()) }
const diaCorto = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
const mesCorto = new Intl.DateTimeFormat('es-AR', { month: 'short' })

interface Eleccion {
  servicio?: string
  barbero?: string | 'cualquiera'
  dia?: Date
  inicio?: number
  asignado?: string
}

let paso = 0
let eleccion: Eleccion = {}
let confirmado: Turno | null = null

// ---------- Mis turnos (en este navegador) ----------
function leerTurnos(): Turno[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as Turno[]
  } catch {
    return []
  }
}
let misTurnos: Turno[] = leerTurnos()
function guardarTurnos() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(misTurnos))
  } catch {
    // Sin almacenamiento: los turnos valen mientras la página esté abierta.
  }
  $('cuenta-turnos').textContent = String(misTurnos.length)
}

// ---------- Pasos ----------
const PASOS = ['Servicio', 'Barbero', 'Día', 'Horario', 'Tus datos']
const servicio = () => SERVICIOS.find((s) => s.id === eleccion.servicio)
const nombreBarbero = (id?: string) => (id === 'cualquiera' ? 'El primero libre' : BARBEROS.find((b) => b.id === id)?.nombre)

function completo(i: number) {
  return [eleccion.servicio, eleccion.barbero, eleccion.dia, eleccion.inicio !== undefined][i]
}

function pintarPasos() {
  $('pasos').innerHTML = PASOS.map((nombre, i) => {
    const estado = i === paso ? 'actual' : completo(i) ? 'hecho' : ''
    const puede = i <= paso || PASOS.slice(0, i).every((_, j) => completo(j))
    return `<li class="${estado}">
      <button type="button" data-paso="${i}" ${puede && !confirmado ? '' : 'disabled'} ${i === paso ? 'aria-current="step"' : ''}>
        <span class="paso-num">${estado === 'hecho' && i !== paso ? '✓' : i + 1}</span><span class="paso-nombre">${nombre}</span>
      </button>
    </li>`
  }).join('')
}

$('pasos').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-paso]')
  if (b) irA(Number(b.dataset.paso))
})

function irA(i: number) {
  paso = i
  pintar()
  $('panel').querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  if (matchMedia('(max-width: 860px)').matches) $('flujo').scrollIntoView({ behavior: 'smooth' })
}

// ---------- Contenido de cada paso ----------
function panelServicio() {
  return `
    <h2 tabindex="-1">¿Qué te hacemos?</h2>
    <div class="opciones">
      ${SERVICIOS.map(
        (s) => `
        <button type="button" class="opcion${eleccion.servicio === s.id ? ' elegida' : ''}" data-servicio="${s.id}" aria-pressed="${eleccion.servicio === s.id}">
          <strong>${s.nombre}</strong>
          <span>${s.detalle}</span>
          <span class="opcion-pie"><span>${s.minutos} min</span><b>${formatPesos(s.precio)}</b></span>
        </button>`,
      ).join('')}
    </div>`
}

function panelBarbero() {
  const opciones = [{ id: 'cualquiera', nombre: 'Me da igual', especialidad: 'El primero que esté libre', dias: [] as number[] }, ...BARBEROS]
  return `
    <h2 tabindex="-1">¿Con quién?</h2>
    <div class="opciones opciones--barberos">
      ${opciones
        .map(
          (b) => `
        <button type="button" class="opcion opcion--barbero${eleccion.barbero === b.id ? ' elegida' : ''}" data-barbero="${b.id}" aria-pressed="${eleccion.barbero === b.id}">
          <span class="avatar" aria-hidden="true">${b.id === 'cualquiera' ? '✦' : b.nombre[0]}</span>
          <strong>${b.nombre}</strong>
          <span>${b.especialidad}</span>
        </button>`,
        )
        .join('')}
    </div>`
}

function libresDelDia(d: Date) {
  return horarios(servicio()!, eleccion.barbero!, d, new Date(), misTurnos).filter((h) => h.barbero).length
}

function panelDia() {
  const dias = proximosDias(new Date())
  return `
    <h2 tabindex="-1">¿Qué día?</h2>
    <div class="dias">
      ${dias
        .map((d) => {
          const libres = abierto(d) ? libresDelDia(d) : 0
          const elegido = eleccion.dia && claveDia(eleccion.dia) === claveDia(d)
          const estado = !abierto(d) ? 'Cerrado' : libres === 0 ? 'Completo' : `${libres} libres`
          return `
            <button type="button" class="dia${elegido ? ' elegida' : ''}" data-dia="${claveDia(d)}" ${libres === 0 ? 'disabled' : ''} aria-pressed="${!!elegido}"
              aria-label="${diaLargo.format(d)}: ${estado}">
              <span class="dia-semana">${diaCorto.format(d).replace('.', '')}</span>
              <span class="dia-num">${d.getDate()}</span>
              <span class="dia-mes">${mesCorto.format(d).replace('.', '')}</span>
              <span class="dia-estado${libres > 0 && libres <= 4 ? ' dia-estado--pocos' : ''}">${estado}</span>
            </button>`
        })
        .join('')}
    </div>`
}

function panelHorario() {
  const lista = horarios(servicio()!, eleccion.barbero!, eleccion.dia!, new Date(), misTurnos)
  const franjas: [string, number, number][] = [
    ['Mañana', 0, 13 * 60],
    ['Tarde', 13 * 60, 17 * 60],
    ['Última hora', 17 * 60, 24 * 60],
  ]
  return `
    <h2 tabindex="-1">¿A qué hora?</h2>
    <p class="ayuda">${diaLargo.format(eleccion.dia!)} · ${servicio()!.minutos} minutos</p>
    ${franjas
      .map(([nombre, desde, hasta]) => {
        const deLaFranja = lista.filter((h) => h.inicio >= desde && h.inicio < hasta)
        if (!deLaFranja.length) return ''
        return `
          <h3 class="franja">${nombre}</h3>
          <div class="horas">
            ${deLaFranja
              .map(
                (h) => `
              <button type="button" class="hora${eleccion.inicio === h.inicio ? ' elegida' : ''}" data-inicio="${h.inicio}" data-asignado="${h.barbero ?? ''}" ${h.barbero ? '' : 'disabled'}
                aria-pressed="${eleccion.inicio === h.inicio}" aria-label="${minutosAHora(h.inicio)}${h.barbero ? '' : ', ocupado'}">
                ${minutosAHora(h.inicio)}
                ${eleccion.barbero === 'cualquiera' && h.barbero ? `<small>${nombreBarbero(h.barbero)}</small>` : ''}
              </button>`,
              )
              .join('')}
          </div>`
      })
      .join('')}`
}

function panelDatos() {
  return `
    <h2 tabindex="-1">Último paso</h2>
    <form class="datos" id="form-datos">
      <label>Nombre <input name="nombre" required autocomplete="name" placeholder="Cómo te llamamos" /></label>
      <label>Celular <input name="tel" type="tel" required autocomplete="tel" inputmode="tel" placeholder="11 2345 6789" pattern="[0-9 +()-]{8,}" /></label>
      <p class="ayuda">Te mandamos un recordatorio el día anterior. Podés cancelar hasta 2 horas antes.</p>
      <button class="boton" type="submit">Confirmar turno</button>
    </form>`
}

function panelConfirmado(t: Turno) {
  const s = SERVICIOS.find((x) => x.id === t.servicio)!
  const [a, m, d] = t.dia.split('-').map(Number)
  return `
    <div class="listo">
      <svg class="tilde" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
      <h2 tabindex="-1">¡Listo, ${t.nombre}!</h2>
      <p>${s.nombre} con <strong>${nombreBarbero(t.barbero)}</strong><br />${formatoDia.format(new Date(a, m - 1, d))} a las <strong>${minutosAHora(t.inicio)} h</strong></p>
      <p class="codigo">Código <span>${t.codigo}</span></p>
      <div class="listo-acciones">
        <button type="button" class="boton" data-accion="calendario">Agregar al calendario</button>
        <button type="button" class="boton boton--borde" data-accion="otro">Sacar otro turno</button>
      </div>
    </div>`
}

const PANELES = [panelServicio, panelBarbero, panelDia, panelHorario, panelDatos]

// ---------- Resumen ----------
function pintarResumen() {
  const s = servicio()
  const fila = (rotulo: string, valor?: string) =>
    `<div class="fila${valor ? '' : ' fila--vacia'}"><dt>${rotulo}</dt><dd>${valor ?? '—'}</dd></div>`
  $('resumen').innerHTML = `
    <h2>Tu turno</h2>
    <dl>
      ${fila('Servicio', s ? `${s.nombre} · ${s.minutos} min` : undefined)}
      ${fila('Barbero', eleccion.barbero ? (eleccion.asignado && eleccion.barbero === 'cualquiera' ? nombreBarbero(eleccion.asignado) : nombreBarbero(eleccion.barbero)) : undefined)}
      ${fila('Día', eleccion.dia ? diaLargo.format(eleccion.dia) : undefined)}
      ${fila('Hora', eleccion.inicio !== undefined ? `${minutosAHora(eleccion.inicio)} a ${minutosAHora(eleccion.inicio + (s?.minutos ?? 0))}` : undefined)}
    </dl>
    <p class="total"><span>Total</span><strong>${s ? formatPesos(s.precio) : '$ 0'}</strong></p>
    <p class="nota">Pagás en el local. Efectivo, débito o transferencia.</p>`
}

// ---------- Interacción ----------
$('panel').addEventListener('click', (e) => {
  const el = e.target as HTMLElement
  const b = el.closest<HTMLButtonElement>('button')
  if (!b || b.disabled) return
  if (b.dataset.servicio) {
    // Cambiar de servicio puede invalidar el horario elegido.
    eleccion = { servicio: b.dataset.servicio, barbero: eleccion.barbero, dia: eleccion.dia }
    irA(1)
  } else if (b.dataset.barbero) {
    eleccion = { ...eleccion, barbero: b.dataset.barbero, inicio: undefined, asignado: undefined }
    irA(2)
  } else if (b.dataset.dia) {
    const [a, m, d] = b.dataset.dia.split('-').map(Number)
    eleccion = { ...eleccion, dia: new Date(a, m - 1, d), inicio: undefined, asignado: undefined }
    irA(3)
  } else if (b.dataset.inicio) {
    eleccion = { ...eleccion, inicio: Number(b.dataset.inicio), asignado: b.dataset.asignado }
    irA(4)
  } else if (b.dataset.accion === 'calendario' && confirmado) {
    const url = URL.createObjectURL(new Blob([ics(confirmado)], { type: 'text/calendar' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `turno-filo-${confirmado.codigo}.ics` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } else if (b.dataset.accion === 'otro') {
    confirmado = null
    eleccion = {}
    irA(0)
  }
})

$('panel').addEventListener('submit', (e) => {
  e.preventDefault()
  const datos = new FormData(e.target as HTMLFormElement)
  const s = servicio()!
  confirmado = {
    codigo: codigo(),
    servicio: s.id,
    barbero: eleccion.asignado || (eleccion.barbero as string),
    dia: claveDia(eleccion.dia!),
    inicio: eleccion.inicio!,
    minutos: s.minutos,
    nombre: String(datos.get('nombre')).trim().split(' ')[0],
  }
  misTurnos = [...misTurnos, confirmado].sort((x, y) => (x.dia + x.inicio).localeCompare(y.dia + y.inicio))
  guardarTurnos()
  pintar()
  $('panel').querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
})

function pintar() {
  pintarPasos()
  $('panel').innerHTML = confirmado ? panelConfirmado(confirmado) : PANELES[paso]()
  $('panel').classList.remove('entra')
  void $('panel').offsetWidth
  $('panel').classList.add('entra')
  pintarResumen()
}

// ---------- Cajón "Mis turnos" ----------
const cajon = $('mis-turnos') as HTMLDialogElement
function pintarMisTurnos() {
  $('lista-turnos').innerHTML = misTurnos.length
    ? misTurnos
        .map((t) => {
          const [a, m, d] = t.dia.split('-').map(Number)
          const s = SERVICIOS.find((x) => x.id === t.servicio)!
          return `<li>
            <div><strong>${s.nombre} con ${nombreBarbero(t.barbero)}</strong>
            <span>${diaLargo.format(new Date(a, m - 1, d))} · ${minutosAHora(t.inicio)} h · ${t.codigo}</span></div>
            <button type="button" class="cancelar" data-cancelar="${t.codigo}">Cancelar</button>
          </li>`
        })
        .join('')
    : '<li class="vacio">Todavía no sacaste turnos.</li>'
}
$('abrir-mis-turnos').addEventListener('click', () => {
  pintarMisTurnos()
  cajon.showModal()
})
$('cerrar-mis-turnos').addEventListener('click', () => cajon.close())
cajon.addEventListener('click', (e) => {
  if (e.target === cajon) return cajon.close()
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cancelar]')
  if (!b) return
  if (!confirm('¿Cancelar este turno?')) return
  misTurnos = misTurnos.filter((t) => t.codigo !== b.dataset.cancelar)
  guardarTurnos()
  pintarMisTurnos()
  if (!confirmado) pintar() // libera el horario si estás en el paso de horarios
})

guardarTurnos()
pintar()
botonVolver('claro')
