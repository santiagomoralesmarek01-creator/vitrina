import '@fontsource/fraunces/300.css'
import '@fontsource/fraunces/300-italic.css'
import '@fontsource/fraunces/500.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/karla/400.css'
import '@fontsource/karla/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { BEBIDAS, FAMILIAS, METODOS, NEGOCIO, ORIGENES, SECCIONES, buscarBebida, buscarOrigen, cafesConFamilia, resumenFamilia, type Familia, type Metodo, type Origen, type Seccion } from './cafes'
import { MOLIENDAS, PESOS, ahorro, buscarMolienda, nombrePeso, precioGranos, type Molienda, type Peso } from './granos'
import { PREGUNTAS, recomendar, type Respuestas } from './recomendador'
import { agregar, cambiarCantidad, clave, descripcion, enlaceContacto, franjasRetiro, subtotal, textoPedido, total, unidades, type Item } from './pedido'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const ir = (el: Element) => el.scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth', block: 'start' })

/** Grupo de radios con flechas y tabindex itinerante (el patrón de WAI-ARIA). */
function radiosConFlechas(grupo: Element, alElegir: (b: HTMLElement) => void) {
  grupo.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent
    const radios = [...grupo.querySelectorAll<HTMLElement>('[role="radio"]')]
    const i = radios.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key]
    if (ev.key === 'Home' || ev.key === 'End' || paso) {
      ev.preventDefault()
      const j = ev.key === 'Home' ? 0 : ev.key === 'End' ? radios.length - 1 : (i + paso! + radios.length) % radios.length
      radios[j].focus()
      alElegir(radios[j])
    }
  })
}

function marcarRadios(grupo: Element, elegido: (b: HTMLElement) => boolean) {
  grupo.querySelectorAll<HTMLElement>('[role="radio"]').forEach((b) => {
    const si = elegido(b)
    b.setAttribute('aria-checked', String(si))
    b.tabIndex = si ? 0 : -1
  })
}

// ======================================================================
// Pedido (lo usan todas las secciones)
// ======================================================================
let items: Item[] = []
let ultimoAviso = 0

function sumar(item: Item) {
  items = agregar(items, item)
  pintarBolsa()
  const aviso = $('sumado')
  aviso.textContent = `Sumaste: ${descripcion(item)}`
  aviso.classList.add('aviso-sumado--visible')
  const yo = ++ultimoAviso
  setTimeout(() => yo === ultimoAviso && aviso.classList.remove('aviso-sumado--visible'), 2200)
}

function pintarBolsa() {
  const n = unidades(items)
  $('bolsa').hidden = n === 0
  document.body.classList.toggle('con-bolsa', n > 0)
  $('bolsa-cant').textContent = String(n)
  $('bolsa-total').textContent = formatPesos(total(items))
  $('bolsa-abrir').setAttribute('aria-label', `Ver pedido: ${n} ${n === 1 ? 'producto' : 'productos'}, ${formatPesos(total(items))}`)
}

// ======================================================================
// I. ¿Cómo lo tomás?
// ======================================================================
let paso = 0
let respuestas: Partial<Respuestas> = {}

function pintarTest(enfocar = false) {
  const cuerpo = $('test-cuerpo')
  $('test-barra').style.width = `${(Math.min(paso, PREGUNTAS.length) / PREGUNTAS.length) * 100}%`

  if (paso < PREGUNTAS.length) {
    const p = PREGUNTAS[paso]
    const actual = respuestas[p.clave]
    cuerpo.innerHTML = `
      <p class="test-paso mono">${String(paso + 1).padStart(2, '0')} <span>/ ${String(PREGUNTAS.length).padStart(2, '0')}</span></p>
      <h3 class="test-pregunta" tabindex="-1">${p.titulo}</h3>
      <div class="test-opciones test-opciones--${p.opciones.length}">
        ${p.opciones
          .map(
            (o) => `
          <button type="button" class="test-opcion" data-valor="${o.valor}" aria-pressed="${actual === o.valor}">
            <span class="test-opcion-nombre">${o.nombre}</span>
            <span class="test-opcion-pista">${o.pista}</span>
          </button>`,
          )
          .join('')}
      </div>
      ${paso > 0 ? '<button type="button" class="enlace mono" data-accion="atras">← Pregunta anterior</button>' : ''}`
  } else {
    const r = recomendar(respuestas as Respuestas)
    const o = r.origen
    cuerpo.innerHTML = `
      <div class="resultado">
        <p class="resultado-rotulo mono">Te recomendamos</p>
        <h3 class="resultado-bebida" tabindex="-1">${r.bebida.nombre}</h3>
        <p class="resultado-con">con <em>${o.pais}, ${o.region}</em></p>
        <dl class="resultado-datos mono">
          <div><dt>Método</dt><dd>${METODOS[r.metodo]}</dd></div>
          <div><dt>Proceso</dt><dd>${o.proceso}</dd></div>
          <div><dt>Altura</dt><dd>${o.altura.replace(' msnm', '')}</dd></div>
          <div><dt>Precio</dt><dd>${formatPesos(r.bebida.precio)}</dd></div>
        </dl>
        <ol class="resultado-porque">${r.porque.map((t) => `<li>${t}</li>`).join('')}</ol>
        <div class="resultado-acciones">
          <button type="button" class="boton" data-accion="sumar" data-bebida="${r.bebida.id}">Sumar ${r.bebida.nombre} · ${formatPesos(r.bebida.precio)}</button>
          <button type="button" class="boton boton--borde" data-accion="granos" data-origen="${o.id}" data-metodo="${r.metodo}">Llevar granos de ${o.pais}</button>
        </div>
        <div class="resultado-pie">
          <button type="button" class="enlace mono" data-accion="ficha" data-origen="${o.id}">Ver la ficha del café</button>
          <button type="button" class="enlace mono" data-accion="reiniciar">Volver a empezar</button>
        </div>
      </div>`
  }
  if (enfocar) cuerpo.querySelector<HTMLElement>('[tabindex="-1"]')?.focus({ preventScroll: true })
}

const MOLIENDA_PARA: Record<Metodo, Molienda> = { espresso: 'espresso', v60: 'v60', chemex: 'v60', aeropress: 'moka', coldbrew: 'prensa' }

$('test-cuerpo').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
  if (!b) return
  if (b.dataset.valor) {
    const p = PREGUNTAS[paso]
    respuestas = { ...respuestas, [p.clave]: b.dataset.valor }
    b.setAttribute('aria-pressed', 'true')
    paso++
    pintarTest(true)
    return
  }
  switch (b.dataset.accion) {
    case 'atras':
      paso = Math.max(0, paso - 1)
      pintarTest(true)
      break
    case 'reiniciar':
      paso = 0
      respuestas = {}
      pintarTest(true)
      break
    case 'sumar':
      sumar({ tipo: 'bebida', id: b.dataset.bebida!, cantidad: 1 })
      break
    case 'granos':
      granos = { ...granos, origen: b.dataset.origen!, molienda: MOLIENDA_PARA[b.dataset.metodo as Metodo] }
      pintarGranos()
      ir($('granos'))
      break
    case 'ficha':
      verFicha(b.dataset.origen!)
      break
  }
})

// ======================================================================
// II. Rueda de sabores + orígenes
// ======================================================================
let familia: Familia | null = null
let foco: Familia = FAMILIAS[0].id

const R = { centro: 54, adentro: 58, medio: 122, afuera: 188 }

/** Texto oscuro sobre colores claros y crema sobre los oscuros. */
function tintaSobre(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#160d07' : '#f4ece0'
}

function polar(r: number, a: number): [number, number] {
  return [r * Math.cos(a), r * Math.sin(a)]
}

function sector(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = polar(r2, a1)
  const [x2, y2] = polar(r2, a2)
  const [x3, y3] = polar(r1, a2)
  const [x4, y4] = polar(r1, a1)
  const grande = a2 - a1 > Math.PI ? 1 : 0
  const f = (n: number) => n.toFixed(2)
  return `M${f(x1)} ${f(y1)} A${r2} ${r2} 0 ${grande} 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${r1} ${r1} 0 ${grande} 0 ${f(x4)} ${f(y4)} Z`
}

/** Texto a lo largo del arco (tangencial) o hacia afuera (radial), siempre derecho para leer. */
function rotulo(texto: string, r: number, a: number, modo: 'tangencial' | 'radial', clase: string) {
  const [x, y] = polar(r, a)
  let giro = (a * 180) / Math.PI
  if (modo === 'tangencial') {
    giro += 90
    if (Math.sin(a) > 0.01) giro += 180
  } else if (Math.cos(a) < 0) {
    giro += 180
  }
  return `<text class="${clase}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" transform="rotate(${giro.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})" text-anchor="middle" dominant-baseline="central">${texto}</text>`
}

function dibujarRueda() {
  const n = FAMILIAS.length
  const ancho = (Math.PI * 2) / n
  const inicio = -Math.PI / 2 - ancho / 2
  const grupos = FAMILIAS.map((f, i) => {
    const a1 = inicio + i * ancho
    const a2 = a1 + ancho
    const medio = (a1 + a2) / 2
    const cafes = cafesConFamilia(f.id).map((o) => o.pais).join(', ')
    const [dx, dy] = polar(7, medio)
    const notas = f.notas
      .map((nota, k) => {
        const b1 = a1 + (k * ancho) / 2
        const b2 = b1 + ancho / 2
        return `<path class="rueda-nota" d="${sector(R.medio + 2, R.afuera, b1 + 0.004, b2 - 0.004)}" />${rotulo(nota, (R.medio + R.afuera) / 2 + 2, (b1 + b2) / 2, 'radial', 'rueda-texto-nota')}`
      })
      .join('')
    return `
      <g class="rueda-familia" role="radio" tabindex="-1" data-familia="${f.id}" aria-checked="false"
         aria-label="${f.nombre}: ${f.notas.join(' y ').toLowerCase()}. Lo tienen: ${cafes}"
         style="--color:${f.color}; --tinta:${tintaSobre(f.color)}; --dx:${dx.toFixed(1)}px; --dy:${dy.toFixed(1)}px">
        <path class="rueda-sector" d="${sector(R.adentro, R.medio, a1 + 0.006, a2 - 0.006)}" />
        ${rotulo(f.nombre, (R.adentro + R.medio) / 2, medio, 'tangencial', 'rueda-texto')}
        ${notas}
      </g>`
  }).join('')
  $('rueda').innerHTML = `
    ${grupos}
    <circle class="rueda-centro" r="${R.centro}" />
    <text class="rueda-centro-titulo" id="rueda-centro-titulo" y="-6" text-anchor="middle"></text>
    <text class="rueda-centro-sub" id="rueda-centro-sub" y="16" text-anchor="middle"></text>`
}

function elegirFamilia(f: Familia | null) {
  familia = f
  if (f) foco = f
  pintarRueda()
}

function pintarRueda() {
  const rueda = $('rueda')
  rueda.classList.toggle('rueda--eligiendo', familia !== null)
  rueda.querySelectorAll<SVGGElement>('[data-familia]').forEach((g) => {
    const id = g.dataset.familia as Familia
    g.setAttribute('aria-checked', String(id === familia))
    g.setAttribute('tabindex', id === foco ? '0' : '-1')
  })
  const fam = FAMILIAS.find((x) => x.id === familia)
  const cafes = cafesConFamilia(familia)
  rueda.querySelector('#rueda-centro-titulo')!.textContent = fam ? fam.nombre : 'Sabores'
  rueda.querySelector('#rueda-centro-sub')!.textContent = fam ? `${cafes.length} ${cafes.length === 1 ? 'café' : 'cafés'}` : 'tocá una familia'
  $('rueda-resumen').textContent = resumenFamilia(familia)
  $('rueda-limpiar').hidden = familia === null

  const ids = new Set(cafes.map((o) => o.id))
  document.querySelectorAll<HTMLElement>('.ficha').forEach((el) => {
    const si = ids.has(el.dataset.origen!)
    el.classList.toggle('ficha--marcada', familia !== null && si)
    el.classList.toggle('ficha--apagada', familia !== null && !si)
  })
  document.querySelectorAll<HTMLElement>('.ficha-familia').forEach((el) => {
    el.classList.toggle('ficha-familia--activa', el.dataset.familia === familia)
  })
}

$('rueda').addEventListener('click', (e) => {
  const g = (e.target as Element).closest<SVGGElement>('[data-familia]')
  if (!g) return
  const id = g.dataset.familia as Familia
  elegirFamilia(familia === id ? null : id)
})

$('rueda').addEventListener('keydown', (e) => {
  const actual = (document.activeElement as Element | null)?.closest<SVGGElement>('[data-familia]')
  if (!actual) return
  const i = FAMILIAS.findIndex((f) => f.id === actual.dataset.familia)
  const mover = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (mover) {
    e.preventDefault()
    const sig = FAMILIAS[(i + mover + FAMILIAS.length) % FAMILIAS.length].id
    elegirFamilia(sig)
    $('rueda').querySelector<SVGGElement>(`[data-familia="${sig}"]`)!.focus()
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const id = actual.dataset.familia as Familia
    elegirFamilia(familia === id ? null : id)
  } else if (e.key === 'Escape' && familia) {
    elegirFamilia(null)
  }
})

$('rueda-limpiar').addEventListener('click', () => {
  elegirFamilia(null)
  $('rueda').querySelector<SVGGElement>(`[data-familia="${foco}"]`)!.focus()
})

function barras(o: Origen) {
  const filas: [keyof Origen['perfil'], string][] = [
    ['acidez', 'Acidez'],
    ['cuerpo', 'Cuerpo'],
    ['dulzor', 'Dulzor'],
  ]
  return filas
    .map(
      ([k, nombre]) => `
      <div class="perfil-fila" role="img" aria-label="${nombre}: ${o.perfil[k]} de 5">
        <span class="mono">${nombre}</span>
        <span class="perfil-barra" aria-hidden="true">${[1, 2, 3, 4, 5].map((v) => `<i class="${v <= o.perfil[k] ? 'lleno' : ''}"></i>`).join('')}</span>
        <span class="mono perfil-num" aria-hidden="true">${o.perfil[k]}</span>
      </div>`,
    )
    .join('')
}

$('origenes').innerHTML = ORIGENES.map(
  (o, i) => `
  <article class="ficha" id="ficha-${o.id}" data-origen="${o.id}" aria-labelledby="ficha-t-${o.id}">
    <header class="ficha-cabeza">
      <span class="ficha-num mono">${String(i + 1).padStart(2, '0')}</span>
      <h3 id="ficha-t-${o.id}">${o.pais}</h3>
      <span class="ficha-proceso mono">${o.proceso}</span>
    </header>
    <p class="ficha-region">${o.region} · ${o.productor}</p>
    <p class="ficha-notas">${o.notas.join(' · ')}</p>
    <div class="ficha-cuerpo">
      <dl class="ficha-datos mono">
        <div><dt>Altura</dt><dd>${o.altura}</dd></div>
        <div><dt>Proceso</dt><dd>${o.proceso}</dd></div>
        <div><dt>Variedad</dt><dd>${o.variedad}</dd></div>
      </dl>
      <div class="perfil">${barras(o)}</div>
    </div>
    <footer class="ficha-pie">
      <ul class="ficha-familias" aria-label="Familias de sabor">
        ${o.familias
          .map((f) => {
            const fam = FAMILIAS.find((x) => x.id === f)!
            return `<li class="ficha-familia" data-familia="${f}" style="--color:${fam.color}">${fam.nombre}</li>`
          })
          .join('')}
      </ul>
      <p class="ficha-precio mono">250 g · ${formatPesos(o.precio250)}</p>
      <button type="button" class="boton boton--chico boton--borde" data-llevar="${o.id}">Llevar en granos</button>
    </footer>
  </article>`,
).join('')

$('origenes').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-llevar]')
  if (!b) return
  granos = { ...granos, origen: b.dataset.llevar! }
  pintarGranos()
  ir($('granos'))
})

function verFicha(id: string) {
  const ficha = $(`ficha-${id}`)
  ir(ficha)
  ficha.classList.remove('ficha--destello')
  void ficha.offsetWidth
  ficha.classList.add('ficha--destello')
}

// ======================================================================
// III. Granos
// ======================================================================
let granos: { origen: string; peso: Peso; molienda: Molienda } = { origen: 'colombia', peso: 250, molienda: 'v60' }

$('g-cafes').innerHTML = ORIGENES.map(
  (o) => `
  <button type="button" role="radio" class="opcion-cafe" data-origen="${o.id}" aria-checked="false">
    <span class="opcion-cafe-pais">${o.pais}</span>
    <span class="opcion-cafe-notas">${o.notas.slice(0, 2).join(', ')}</span>
  </button>`,
).join('')

$('g-pesos').innerHTML = PESOS.map((p) => `<button type="button" role="radio" data-peso="${p.peso}" aria-checked="false">${p.nombre}</button>`).join('')

$('g-moliendas').innerHTML = MOLIENDAS.map(
  (m) => `
  <button type="button" role="radio" class="opcion-molienda" data-molienda="${m.id}" aria-checked="false">
    <span class="opcion-molienda-punto" style="--nivel:${m.nivel}" aria-hidden="true"></span>
    <span>${m.nombre}</span>
    <span class="mono">${m.micrones ? `~${m.micrones} µm` : 'sin moler'}</span>
  </button>`,
).join('')

const elegirCafe = (b: HTMLElement) => {
  granos = { ...granos, origen: b.dataset.origen! }
  pintarGranos()
}
const elegirPeso = (b: HTMLElement) => {
  granos = { ...granos, peso: Number(b.dataset.peso) as Peso }
  pintarGranos()
}
const elegirMolienda = (b: HTMLElement) => {
  granos = { ...granos, molienda: b.dataset.molienda as Molienda }
  pintarGranos()
}

for (const [id, fn] of [
  ['g-cafes', elegirCafe],
  ['g-pesos', elegirPeso],
  ['g-moliendas', elegirMolienda],
] as const) {
  $(id).addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[role="radio"]')
    if (b) fn(b)
  })
  radiosConFlechas($(id), fn)
}

/** Generador pseudoaleatorio con semilla: el montoncito de café sale siempre igual. */
function sembrado(semilla: number) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dibujarMolienda(nivel: number) {
  const rand = sembrado(11 + nivel)
  const partes: string[] = ['<ellipse class="molino-plato" cx="120" cy="132" rx="108" ry="12" />']
  if (nivel === 0) {
    const granosPos = [
      [72, 112, -20], [104, 116, 15], [138, 113, -35], [170, 116, 25], [88, 92, 40], [122, 94, -10], [155, 92, 30], [106, 72, -40], [138, 72, 12], [122, 52, 0],
    ]
    granosPos.forEach(([x, y, g], i) =>
      partes.push(`
        <g class="grano" transform="translate(${x} ${y}) rotate(${g})" style="--i:${i}">
          <ellipse rx="15" ry="10.5" />
          <path d="M-12 1 C-5 -4 4 5 12 -1" />
        </g>`),
    )
  } else {
    const radio = [0, 1.3, 2.3, 3.6, 5.4][nivel]
    const cantidad = [0, 1100, 480, 230, 120][nivel]
    for (let k = 0; k < cantidad; k++) {
      // Montoncito: más ancho abajo, en forma de loma.
      const u = rand() * 2 - 1
      const alto = 92 * (1 - u * u) * Math.pow(rand(), 0.8)
      const x = 120 + u * 100
      const y = 130 - alto + rand() * 4
      const r = radio * (0.7 + rand() * 0.6)
      const tono = 22 + Math.floor(rand() * 18)
      if (nivel >= 3) {
        const pts = Array.from({ length: 5 }, (_, j) => {
          const a = (j / 5) * Math.PI * 2 + rand()
          const d = r * (0.7 + rand() * 0.5)
          return `${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`
        }).join(' ')
        partes.push(`<polygon points="${pts}" style="fill:hsl(24 38% ${tono}%)" />`)
      } else {
        partes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" style="fill:hsl(24 38% ${tono}%)" />`)
      }
    }
  }
  $('g-dibujo').innerHTML = partes.join('')
}

function pintarGranos() {
  const o = buscarOrigen(granos.origen)!
  const m = buscarMolienda(granos.molienda)
  marcarRadios($('g-cafes'), (b) => b.dataset.origen === granos.origen)
  marcarRadios($('g-pesos'), (b) => Number(b.dataset.peso) === granos.peso)
  marcarRadios($('g-moliendas'), (b) => b.dataset.molienda === granos.molienda)
  dibujarMolienda(m.nivel)
  const marca = $('g-marca')
  marca.classList.toggle('escala-marca--nada', m.nivel === 0)
  marca.style.left = m.nivel === 0 ? '0%' : `${((m.nivel - 1) / 3) * 100}%`
  $('g-mol-nombre').textContent = m.nombre
  $('g-mol-parecido').textContent = m.parecido
  $('g-desc').textContent = `${o.pais} · ${nombrePeso(granos.peso)} · ${m.enPedido}`
  $('g-precio').textContent = formatPesos(precioGranos(o, granos.peso))
  const ah = ahorro(o, granos.peso)
  $('g-ahorro').textContent = ah > 0 ? `Ahorrás ${formatPesos(ah)} frente a bolsas de 250 g` : 'Tostado hace menos de una semana'
}

$('g-sumar').addEventListener('click', () => sumar({ tipo: 'granos', ...granos, cantidad: 1 }))

// ======================================================================
// IV. La barra
// ======================================================================
$('carta').innerHTML = (Object.keys(SECCIONES) as Seccion[])
  .map(
    (s) => `
  <div class="carta-bloque">
    <h3 class="carta-titulo">${SECCIONES[s]}</h3>
    <ul class="carta-lista">
      ${BEBIDAS.filter((b) => b.seccion === s)
        .map(
          (b) => `
        <li class="bebida">
          <div class="bebida-linea">
            <span class="bebida-nombre">${b.nombre}</span>
            <span class="bebida-puntos" aria-hidden="true"></span>
            <span class="bebida-precio mono">${formatPesos(b.precio)}</span>
          </div>
          <p class="bebida-detalle">${b.detalle}</p>
          <button type="button" class="mas" data-bebida="${b.id}" aria-label="Sumar ${b.nombre} al pedido">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </li>`,
        )
        .join('')}
    </ul>
  </div>`,
  )
  .join('')

$('carta').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-bebida]')
  if (b) sumar({ tipo: 'bebida', id: b.dataset.bebida!, cantidad: 1 })
})

// ======================================================================
// Hoja del pedido y demo
// ======================================================================
const hoja = $<HTMLDialogElement>('hoja')
const selectRetiro = $<HTMLSelectElement>('retiro')
let franjas = franjasRetiro(new Date())

function pintarHoja() {
  const lista = $('items')
  if (items.length === 0) {
    lista.innerHTML = '<li class="items-vacio">Todavía no sumaste nada.</li>'
  } else {
    lista.innerHTML = items
      .map((i) => {
        const k = clave(i)
        const nombre = descripcion(i)
        const extra = i.tipo === 'bebida' ? buscarBebida(i.id)!.detalle : ''
        return `
        <li class="item">
          <div class="item-texto">
            <span class="item-nombre">${nombre}</span>
            ${extra ? `<span class="item-extra">${extra}</span>` : ''}
          </div>
          <div class="cantidad" role="group" aria-label="Cantidad de ${nombre}">
            <button type="button" data-k="${k}" data-delta="-1" aria-label="${i.cantidad === 1 ? 'Quitar' : 'Uno menos de'} ${nombre}">−</button>
            <span class="mono" aria-live="polite">${i.cantidad}</span>
            <button type="button" data-k="${k}" data-delta="1" aria-label="Uno más de ${nombre}">+</button>
          </div>
          <span class="item-precio mono">${formatPesos(subtotal(i))}</span>
        </li>`
      })
      .join('')
  }
  $('hoja-total').textContent = formatPesos(total(items))
}

function abrirHoja() {
  franjas = franjasRetiro(new Date())
  const previa = selectRetiro.value
  selectRetiro.innerHTML = franjas.map((f) => `<option value="${f.valor}">${f.etiqueta}</option>`).join('')
  if (franjas.some((f) => f.valor === previa)) selectRetiro.value = previa
  $('hoja-pedido').hidden = false
  $('hoja-demo').hidden = true
  $('form-error').textContent = ''
  pintarHoja()
  hoja.showModal()
}

$('bolsa-abrir').addEventListener('click', abrirHoja)
$('hoja-cerrar').addEventListener('click', () => hoja.close())
hoja.addEventListener('click', (e) => {
  if (e.target === hoja) hoja.close()
})
hoja.addEventListener('close', () => $('bolsa-abrir').focus())

$('items').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-k]')
  if (!b) return
  items = cambiarCantidad(items, b.dataset.k!, Number(b.dataset.delta))
  pintarHoja()
  pintarBolsa()
  if (items.length === 0) hoja.close()
  else ($('items').querySelector<HTMLElement>(`[data-k="${CSS.escape(b.dataset.k!)}"][data-delta="${b.dataset.delta}"]`) ?? $('hoja-cerrar')).focus()
})

$<HTMLFormElement>('form').addEventListener('submit', (e) => {
  e.preventDefault()
  const nombre = $<HTMLInputElement>('nombre')
  const error = $('form-error')
  if (items.length === 0) {
    error.textContent = 'Sumá algo al pedido primero.'
    return
  }
  if (!nombre.value.trim()) {
    error.textContent = 'Poné tu nombre así te llamamos en la barra.'
    nombre.setAttribute('aria-invalid', 'true')
    nombre.focus()
    return
  }
  nombre.removeAttribute('aria-invalid')
  error.textContent = ''
  const retiro = franjas.find((f) => f.valor === selectRetiro.value) ?? franjas[0]
  $('wa-texto').textContent = textoPedido(items, { nombre: nombre.value, retiro, negocio: NEGOCIO }, formatPesos)
  $('hoja-pedido').hidden = true
  $('hoja-demo').hidden = false
  $('hoja-titulo').textContent = 'Pedido enviado (demo)'
  hoja.querySelector('.hoja-cuerpo:not([hidden])')?.scrollTo(0, 0)
  $('contacto').focus()
})

$('demo-volver').addEventListener('click', () => {
  $('hoja-demo').hidden = true
  $('hoja-pedido').hidden = false
  $('hoja-titulo').textContent = 'Tu pedido'
  $('nombre').focus()
})
hoja.addEventListener('close', () => ($('hoja-titulo').textContent = 'Tu pedido'))

$<HTMLAnchorElement>('contacto').href = enlaceContacto(NEGOCIO)

// ======================================================================
// Arranque
// ======================================================================
pintarTest()
dibujarRueda()
pintarRueda()
pintarGranos()
pintarBolsa()
botonVolver('oscuro')
