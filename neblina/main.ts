import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import '@fontsource/josefin-sans/300.css'
import '@fontsource/josefin-sans/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { BASES, TRAGOS, estadoHappy, recomendar, reloj, type Base, type Perfil, type Respuestas, type Trago } from './tragos'

const $ = (id: string) => document.getElementById(id)!

// ---------- Abanico art déco ----------
$('rayos').innerHTML = Array.from({ length: 19 }, (_, i) => {
  const a = Math.PI + (i / 18) * Math.PI
  return `<line x1="200" y1="220" x2="${200 + Math.cos(a) * 200}" y2="${220 + Math.sin(a) * 200}" />`
}).join('')

// ---------- Gráfico de sabor (radar) ----------
const EJES: { k: keyof Perfil; nombre: string }[] = [
  { k: 'dulce', nombre: 'Dulce' },
  { k: 'acido', nombre: 'Ácido' },
  { k: 'amargo', nombre: 'Amargo' },
  { k: 'fuerza', nombre: 'Fuerza' },
]

function radar(p: Perfil, tam = 120) {
  const c = tam / 2
  const r = c - 22
  const punto = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2
    return [c + Math.cos(a) * r * (v / 5), c + Math.sin(a) * r * (v / 5)]
  }
  const anillos = [1, 2, 3, 4, 5]
    .map((v) => `<polygon class="anillo" points="${EJES.map((_, i) => punto(i, v).join(',')).join(' ')}" />`)
    .join('')
  const forma = EJES.map((e, i) => punto(i, Math.max(0.3, p[e.k])).join(',')).join(' ')
  const etiquetas = EJES.map((e, i) => {
    const [x, y] = punto(i, 6.3)
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${e.nombre}</text>`
  }).join('')
  const desc = EJES.map((e) => `${e.nombre} ${p[e.k]} de 5`).join(', ')
  return `<svg class="radar" viewBox="0 0 ${tam} ${tam}" role="img" aria-label="Perfil de sabor: ${desc}">${anillos}<polygon class="forma" points="${forma}" />${etiquetas}</svg>`
}

// ---------- Happy hour ----------
function tic() {
  const { activo, ms } = estadoHappy(new Date())
  $('happy').classList.toggle('happy--activo', activo)
  $('happy-titulo').textContent = activo ? 'Happy hour 2×1 · termina en' : 'Happy hour 2×1 · empieza en'
  $('happy-reloj').textContent = reloj(ms)
  document.body.classList.toggle('es-happy', activo)
}
tic()
setInterval(tic, 1000)

// ---------- Carta ----------
let filtro: Base | 'todos' = 'todos'

$('bases').innerHTML = [['todos', 'Todos'], ...Object.entries(BASES)]
  .map(([id, nombre]) => `<button type="button" role="radio" data-base="${id}" aria-checked="${id === 'todos'}">${nombre}</button>`)
  .join('')

$('bases').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-base]')
  if (!b) return
  filtro = b.dataset.base as typeof filtro
  $('bases').querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)))
  pintarCarta()
})

function tarjeta(t: Trago, destacada = false) {
  return `
    <article class="trago${destacada ? ' trago--destacado' : ''}" id="trago-${t.id}">
      ${t.de_la_casa ? '<span class="sello">De la casa</span>' : ''}
      ${t.base !== 'sin-alcohol' ? '<span class="dos-por-uno">2×1</span>' : ''}
      <p class="trago-base">${BASES[t.base]}</p>
      <h3>${t.nombre}</h3>
      <p class="trago-ing">${t.ingredientes}</p>
      ${radar(t.perfil)}
      <p class="trago-precio">${formatPesos(t.precio)}</p>
    </article>`
}

function pintarCarta() {
  const lista = TRAGOS.filter((t) => filtro === 'todos' || t.base === filtro)
  $('tragos').innerHTML = lista.map((t) => tarjeta(t)).join('')
}

// ---------- Test ----------
const PREGUNTAS: { clave: keyof Respuestas; titulo: string; opciones: { valor: string; texto: string; icono: string }[] }[] = [
  {
    clave: 'sabor',
    titulo: '¿Qué te tienta más?',
    opciones: [
      { valor: 'dulce', texto: 'Algo dulce y frutal', icono: '🍓' },
      { valor: 'citrico', texto: 'Fresco y cítrico', icono: '🍋' },
      { valor: 'amargo', texto: 'Amargo, de los de verdad', icono: '🌿' },
    ],
  },
  {
    clave: 'fuerza',
    titulo: '¿Qué tan cargado?',
    opciones: [
      { valor: 'nada', texto: 'Sin alcohol', icono: '💧' },
      { valor: 'suave', texto: 'Suave, para durar', icono: '🌙' },
      { valor: 'fuerte', texto: 'Que se note', icono: '🔥' },
    ],
  },
  {
    clave: 'momento',
    titulo: '¿Cómo viene la noche?',
    opciones: [
      { valor: 'charlar', texto: 'Para charlar tranqui', icono: '🗨️' },
      { valor: 'bailar', texto: 'Para salir a bailar', icono: '💃' },
      { valor: 'cerrar', texto: 'Para cerrar la noche', icono: '🌌' },
    ],
  },
]

const test = $('test')
let paso = 0
let respuestas: Partial<Respuestas> = {}

function pintarTest() {
  const progreso = `<div class="progreso" aria-hidden="true">${PREGUNTAS.map((_, i) => `<span class="${i < paso ? 'hecho' : i === paso ? 'actual' : ''}"></span>`).join('')}</div>`
  if (paso < PREGUNTAS.length) {
    const q = PREGUNTAS[paso]
    test.innerHTML = `
      ${progreso}
      <fieldset class="pregunta" aria-describedby="paso-n">
        <legend><span id="paso-n" class="paso-n">Pregunta ${paso + 1} de ${PREGUNTAS.length}</span>${q.titulo}</legend>
        <div class="opciones">
          ${q.opciones.map((o) => `<button type="button" class="opcion" data-valor="${o.valor}"><span aria-hidden="true">${o.icono}</span>${o.texto}</button>`).join('')}
        </div>
      </fieldset>
      ${paso > 0 ? '<button type="button" class="volver" data-accion="atras">← Volver</button>' : ''}`
    test.querySelector<HTMLButtonElement>('.opcion')?.focus({ preventScroll: true })
    return
  }
  const t = recomendar(respuestas as Respuestas)
  test.innerHTML = `
    ${progreso}
    <div class="resultado">
      <p class="paso-n">Tu trago es</p>
      ${tarjeta(t, true)}
      <div class="resultado-acciones">
        <a class="boton" href="#trago-${t.id}" data-accion="ver">Verlo en la carta</a>
        <button type="button" class="boton boton--borde" data-accion="reiniciar">Hacer el test de nuevo</button>
      </div>
    </div>`
  test.querySelector<HTMLElement>('.resultado h3')?.setAttribute('tabindex', '-1')
  test.querySelector<HTMLElement>('.resultado h3')?.focus({ preventScroll: true })
}

test.addEventListener('click', (e) => {
  const el = e.target as HTMLElement
  const opcion = el.closest<HTMLButtonElement>('.opcion')
  const accion = el.closest<HTMLElement>('[data-accion]')?.dataset.accion
  if (opcion) {
    respuestas = { ...respuestas, [PREGUNTAS[paso].clave]: opcion.dataset.valor }
    paso++
    test.classList.remove('entra')
    void test.offsetWidth
    test.classList.add('entra')
    pintarTest()
  } else if (accion === 'atras') {
    paso--
    pintarTest()
  } else if (accion === 'reiniciar') {
    paso = 0
    respuestas = {}
    pintarTest()
  } else if (accion === 'ver') {
    // Si la carta está filtrada, se muestra todo para que el trago esté.
    filtro = 'todos'
    $('bases').querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String((x as HTMLElement).dataset.base === 'todos')))
    pintarCarta()
    const id = (el.closest('a') as HTMLAnchorElement).hash
    requestAnimationFrame(() => {
      const destino = document.querySelector<HTMLElement>(id)
      destino?.classList.add('brilla')
      setTimeout(() => destino?.classList.remove('brilla'), 2000)
    })
  }
})

pintarCarta()
pintarTest()
botonVolver('oscuro')
