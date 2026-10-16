import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { CLASES, DIAS, PLANES, TIPOS, filtrarClases, precioPlan, reservar, type Clase, type Filtros, type Tipo } from './horarios'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- Respiración guiada 4-4-6 ----------
const FASES = [
  { texto: 'Inhalá', ms: 4000, clase: 'inhala' },
  { texto: 'Sostené', ms: 4000, clase: 'sostiene' },
  { texto: 'Exhalá', ms: 6000, clase: 'exhala' },
]
const CICLOS = 4 // 4 × 14 s ≈ un minuto
const burbuja = $('respirar')
const textoBurbuja = $('respirar-texto')
let temporizador: ReturnType<typeof setTimeout> | undefined

function frenarRespiracion(texto = 'Tocá para respirar') {
  clearTimeout(temporizador)
  temporizador = undefined
  burbuja.className = 'burbuja'
  textoBurbuja.textContent = texto
}

function fase(ciclo: number, i: number) {
  if (ciclo === CICLOS) return frenarRespiracion('¿Mejor? 🌿')
  const f = FASES[i]
  burbuja.style.setProperty('--duracion', `${f.ms}ms`)
  burbuja.className = `burbuja activa ${f.clase}`
  textoBurbuja.textContent = f.texto
  temporizador = setTimeout(() => (i === FASES.length - 1 ? fase(ciclo + 1, 0) : fase(ciclo, i + 1)), f.ms)
}

burbuja.addEventListener('click', () => (temporizador ? frenarRespiracion() : fase(0, 0)))

// ---------- Horarios ----------
let clases: Clase[] = CLASES
const filtros: Filtros = { tipos: [], nivel: 'cualquiera' }
const NIVEL: Record<Clase['nivel'], string> = { inicial: 'Inicial', intermedio: 'Intermedio', todos: 'Todo nivel' }

$('tipos').innerHTML = (Object.keys(TIPOS) as Tipo[])
  .map((t) => `<button type="button" class="chip chip--${t}" data-tipo="${t}" aria-pressed="false">${TIPOS[t]}</button>`)
  .join('')

$('tipos').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tipo]')
  if (!b) return
  const t = b.dataset.tipo as Tipo
  filtros.tipos = filtros.tipos.includes(t) ? filtros.tipos.filter((x) => x !== t) : [...filtros.tipos, t]
  b.setAttribute('aria-pressed', String(filtros.tipos.includes(t)))
  pintarSemana()
})

$<HTMLSelectElement>('nivel').addEventListener('change', (e) => {
  filtros.nivel = (e.target as HTMLSelectElement).value as Filtros['nivel']
  pintarSemana()
})

function pintarSemana() {
  const visibles = filtrarClases(clases, filtros)
  $('semana').innerHTML = DIAS.map((d) => {
    const delDia = visibles.filter((c) => c.dia === d.id)
    return `
      <div class="dia">
        <h3>${d.nombre}</h3>
        ${
          delDia.length === 0
            ? '<p class="dia-vacio">—</p>'
            : delDia
                .map(
                  (c) => `
          <button type="button" class="turno turno--${c.tipo}" data-clase="${c.id}" ${c.cupos === 0 ? 'disabled' : ''}
            aria-label="${d.nombre} ${c.hora}, ${c.nombre} con ${c.profe}. ${c.cupos === 0 ? 'Completa' : `Quedan ${c.cupos} lugares`}">
            <span class="turno-hora">${c.hora}</span>
            <span class="turno-nombre">${c.nombre}</span>
            <span class="turno-meta">${c.profe} · ${NIVEL[c.nivel]}</span>
            <span class="turno-cupos${c.cupos > 0 && c.cupos <= 2 ? ' turno-cupos--pocos' : ''}">${c.cupos === 0 ? 'Completa' : c.cupos === 1 ? 'Último lugar' : `${c.cupos} lugares`}</span>
          </button>`,
                )
                .join('')
        }
      </div>`
  }).join('')
}

// ---------- Reserva ----------
const dialogo = $<HTMLDialogElement>('reserva')
const form = $<HTMLFormElement>('reserva-form')
let elegida: Clase | null = null

$('semana').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-clase]')
  if (!b) return
  elegida = clases.find((c) => c.id === b.dataset.clase)!
  const dia = DIAS.find((d) => d.id === elegida!.dia)!.nombre
  $('reserva-dia').textContent = `${dia} · ${elegida.hora} h`
  $('reserva-titulo').textContent = elegida.nombre
  $('reserva-detalle').textContent = `Con ${elegida.profe}. ${elegida.cupos === 1 ? 'Es el último lugar.' : `Quedan ${elegida.cupos} lugares.`}`
  form.reset()
  dialogo.showModal()
})

$('reserva-cancelar').addEventListener('click', () => dialogo.close())
dialogo.addEventListener('click', (e) => e.target === dialogo && dialogo.close())

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!elegida) return
  const nombre = String(new FormData(form).get('nombre')).trim().split(' ')[0]
  try {
    clases = reservar(clases, elegida.id)
    const dia = DIAS.find((d) => d.id === elegida!.dia)!.nombre.toLowerCase()
    avisar(`¡Listo, ${nombre}! Te esperamos el ${dia} a las ${elegida.hora}.`)
  } catch (err) {
    avisar((err as Error).message)
  }
  dialogo.close()
  pintarSemana()
})

let avisoTimer: ReturnType<typeof setTimeout>
function avisar(texto: string) {
  const aviso = $('aviso')
  aviso.textContent = texto
  aviso.classList.add('visible')
  clearTimeout(avisoTimer)
  avisoTimer = setTimeout(() => aviso.classList.remove('visible'), 4000)
}

// ---------- Carrusel de testimonios ----------
const pista = $('pista')
const tarjetas = [...pista.querySelectorAll('blockquote')]
const puntos = $('puntos')
puntos.innerHTML = tarjetas.map((_, i) => `<button type="button" aria-label="Ir al testimonio ${i + 1}" data-i="${i}"></button>`).join('')

const irA = (i: number) => {
  const destino = tarjetas[Math.max(0, Math.min(tarjetas.length - 1, i))]
  pista.scrollTo({ left: destino.offsetLeft - pista.offsetLeft, behavior: reducirMovimiento ? 'auto' : 'smooth' })
}
const actual = () => {
  const centro = pista.scrollLeft + pista.clientWidth / 2
  return tarjetas.reduce((mejor, t, i) => {
    const d = Math.abs(t.offsetLeft - pista.offsetLeft + t.offsetWidth / 2 - centro)
    return d < mejor.d ? { i, d } : mejor
  }, { i: 0, d: Infinity }).i
}
const marcarPunto = () => {
  const i = actual()
  puntos.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', String(i === j)))
}
$('anterior').addEventListener('click', () => irA(actual() - 1))
$('siguiente').addEventListener('click', () => irA(actual() + 1))
puntos.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-i]')
  if (b) irA(Number(b.dataset.i))
})
pista.addEventListener('scroll', () => requestAnimationFrame(marcarPunto), { passive: true })
marcarPunto()

// ---------- Planes ----------
let periodo: 'mensual' | 'trimestral' = 'mensual'
function pintarPlanes() {
  $('planes-lista').innerHTML = PLANES.map((p) => {
    const precio = precioPlan(p.mensual, periodo, p.id)
    const ahorro = periodo === 'trimestral' && p.id !== 'suelta'
    return `
      <article class="plan${p.destacado ? ' plan--destacado' : ''}">
        ${p.destacado ? '<span class="plan-cinta">El más elegido</span>' : ''}
        <h3>${p.nombre}</h3>
        <p class="plan-precio"><strong>${formatPesos(precio)}</strong><span>${p.id === 'suelta' ? 'por clase' : 'por mes'}</span></p>
        <p class="plan-detalle">${p.clases}</p>
        <p class="plan-ahorro${ahorro ? ' visible' : ''}">Ahorrás ${formatPesos((p.mensual - precio) * 3)} en 3 meses</p>
        <a class="boton${p.destacado ? '' : ' boton--borde'}" href="#horarios">Empezar</a>
      </article>`
  }).join('')
}
document.querySelector('.periodo')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-periodo]')
  if (!b) return
  periodo = b.dataset.periodo as typeof periodo
  document.querySelectorAll('[data-periodo]').forEach((x) => x.setAttribute('aria-checked', String(x === b)))
  pintarPlanes()
})

// ---------- Aparición al hacer scroll ----------
const revelador = new IntersectionObserver(
  (entradas) =>
    entradas.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visto')
        revelador.unobserve(e.target)
      }
    }),
  { threshold: 0.15 },
)
document.querySelectorAll('.revelar').forEach((el, i) => {
  ;(el as HTMLElement).style.setProperty('--retraso', `${(i % 3) * 90}ms`)
  revelador.observe(el)
})

pintarSemana()
pintarPlanes()
botonVolver('claro')
