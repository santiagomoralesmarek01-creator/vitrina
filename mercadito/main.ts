import '@fontsource/work-sans/400.css'
import '@fontsource/work-sans/500.css'
import '@fontsource/work-sans/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { CATEGORIAS, escala, generarDias, periodos, porCategoria, resumir, topProductos, variacion, type Dia } from './datos'

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!
const SVG = 'http://www.w3.org/2000/svg'
const hoy = new Date()
const DIAS = generarDias(hoy)
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches

let rango = 30
let vista: 'grafico' | 'tabla' = 'grafico'
let orden: { campo: 'nombre' | 'unidades' | 'ingresos' | 'variacion'; asc: boolean } = { campo: 'ingresos', asc: false }

// ---------- Formatos ----------
const fechaCorta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const fechaTexto = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' })
const entero = new Intl.NumberFormat('es-AR')

const corta = (d: Date) => fechaCorta.format(d).replace('.', '')
const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** 1234567 → "$ 1,2 M"; 45300 → "$ 45 mil". Para ejes y etiquetas chicas. */
function pesosCorto(n: number) {
  if (n >= 1_000_000) return `$ ${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  if (n >= 1000) return `$ ${Math.round(n / 1000)} mil`
  return `$ ${n}`
}

function delta(v: number | null, texto = '') {
  if (v === null) return `<span class="delta delta--igual">Sin datos${texto}</span>`
  const sube = v > 0
  const igual = v === 0
  const icono = igual ? '●' : sube ? '▲' : '▼'
  const clase = igual ? 'igual' : sube ? 'sube' : 'baja'
  const etiqueta = igual ? 'Sin cambios' : sube ? 'Subió' : 'Bajó'
  const num = `${sube ? '+' : ''}${v.toLocaleString('es-AR', { minimumFractionDigits: 1 })} %`
  return `<span class="delta delta--${clase}"><span class="delta-icono" aria-hidden="true">${icono}</span><span class="sr">${etiqueta} </span>${num}${texto}</span>`
}

// ---------- Tema ----------
const raiz = document.documentElement
function temaActual(): 'claro' | 'oscuro' {
  const t = raiz.dataset.theme
  if (t === 'dark') return 'oscuro'
  if (t === 'light') return 'claro'
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}
function pintarBotonTema() {
  const oscuro = temaActual() === 'oscuro'
  const b = $('#tema')
  b.textContent = oscuro ? '☀' : '☾'
  b.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro')
  b.title = b.getAttribute('aria-label')!
}
try {
  const guardado = localStorage.getItem('mercadito-tema')
  if (guardado === 'light' || guardado === 'dark') raiz.dataset.theme = guardado
} catch {
  /* sin almacenamiento: se sigue la preferencia del sistema */
}
$('#tema').addEventListener('click', () => {
  const nuevo = temaActual() === 'oscuro' ? 'light' : 'dark'
  raiz.dataset.theme = nuevo
  try {
    localStorage.setItem('mercadito-tema', nuevo)
  } catch {
    /* no pasa nada */
  }
  pintarBotonTema()
})
pintarBotonTema()

// ---------- Encabezado y KPIs ----------
function pintarCabeza(actual: Dia[]) {
  const desde = actual[0].fecha
  const hasta = actual[actual.length - 1].fecha
  $('#subtitulo').textContent = `Del ${fechaTexto.format(desde)} al ${fechaTexto.format(hasta)}, comparado con los ${rango} días anteriores.`
  document.querySelectorAll<HTMLButtonElement>('.rango button').forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.dias) === rango)))
}

function pintarKpis(actual: Dia[], anterior: Dia[]) {
  const a = resumir(actual)
  const b = resumir(anterior)
  const tiles = [
    { titulo: 'Ingresos', valor: formatPesos(a.ingresos), v: variacion(a.ingresos, b.ingresos), antes: formatPesos(b.ingresos) },
    { titulo: 'Pedidos', valor: entero.format(a.pedidos), v: variacion(a.pedidos, b.pedidos), antes: entero.format(b.pedidos) },
    { titulo: 'Ticket promedio', valor: formatPesos(a.ticket), v: variacion(a.ticket, b.ticket), antes: formatPesos(b.ticket) },
    { titulo: 'Clientes nuevos', valor: entero.format(a.clientesNuevos), v: variacion(a.clientesNuevos, b.clientesNuevos), antes: entero.format(b.clientesNuevos) },
  ]
  $('#kpis').innerHTML = tiles
    .map(
      (t, i) => `
      <article class="kpi" style="--i:${i}">
        <h3>${t.titulo}</h3>
        <p class="kpi-valor">${t.valor}</p>
        <p class="kpi-pie">${delta(t.v)} <span class="kpi-antes">vs. ${t.antes}</span></p>
      </article>`,
    )
    .join('')
}

// ---------- Gráfico de líneas ----------
let lineaActual: Dia[] = []
let lineaAnterior: Dia[] = []
let indiceFoco = -1
let anchoPrevio = 0

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, padre?: Element) {
  const el = document.createElementNS(SVG, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  padre?.append(el)
  return el
}

function pintarLinea(animar = true) {
  const caja = $('#grafico-linea')
  anchoPrevio = caja.clientWidth
  const tip = $('#tip-linea')
  caja.querySelector('svg')?.remove()
  const actual = lineaActual
  const anterior = lineaAnterior
  const n = actual.length
  const ancho = Math.max(caja.clientWidth, 280)
  const angosto = ancho < 560
  const alto = angosto ? 220 : 280
  const m = { arriba: 12, derecha: angosto ? 12 : 104, abajo: 30, izquierda: 64 }
  const w = ancho - m.izquierda - m.derecha
  const h = alto - m.arriba - m.abajo
  const maximo = Math.max(...actual.map((d) => d.ingresos), ...anterior.map((d) => d.ingresos))
  const marcas = escala(maximo)
  const tope = marcas[marcas.length - 1]
  const x = (i: number) => m.izquierda + (n === 1 ? w / 2 : (i / (n - 1)) * w)
  const y = (v: number) => m.arriba + h - (v / tope) * h

  const s = svg('svg', { viewBox: `0 0 ${ancho} ${alto}`, width: ancho, height: alto, role: 'img', 'aria-label': `Ingresos diarios de los últimos ${n} días comparados con el período anterior` })
  caja.prepend(s)

  // Grilla y eje Y
  const grilla = svg('g', { class: 'grilla' }, s)
  for (const v of marcas) {
    svg('line', { x1: m.izquierda, x2: m.izquierda + w, y1: y(v), y2: y(v), class: v === 0 ? 'base' : '' }, grilla)
    const t = svg('text', { x: m.izquierda - 10, y: y(v), class: 'eje', 'text-anchor': 'end', 'dominant-baseline': 'middle' }, grilla)
    t.textContent = pesosCorto(v)
  }
  // Eje X: pocas fechas, sin amontonar
  const cuantas = angosto ? 3 : n <= 7 ? 7 : 5
  for (let k = 0; k < cuantas; k++) {
    const i = Math.round((k / (cuantas - 1)) * (n - 1))
    const t = svg('text', { x: x(i), y: alto - 8, class: 'eje', 'text-anchor': k === 0 ? 'start' : k === cuantas - 1 ? 'end' : 'middle' }, grilla)
    t.textContent = corta(actual[i].fecha)
  }

  const camino = (dias: Dia[]) => dias.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.ingresos).toFixed(1)}`).join('')
  svg('path', { d: camino(anterior), class: 'serie-anterior' }, s)
  const linea = svg('path', { d: camino(actual), class: 'serie-actual', pathLength: 1 }, s)
  if (animar && !quieto) linea.classList.add('dibuja')

  // Con pocos días, puntos en cada valor.
  if (n <= 14) {
    for (const [i, d] of actual.entries()) svg('circle', { cx: x(i), cy: y(d.ingresos), r: 4, class: 'punto' }, s)
  }

  // Etiquetas directas al final de cada línea (la leyenda queda igual).
  if (!angosto) {
    const ya = y(actual[n - 1].ingresos)
    let yb = y(anterior[n - 1].ingresos)
    if (Math.abs(ya - yb) < 16) yb = ya + (yb >= ya ? 16 : -16)
    const ta = svg('text', { x: x(n - 1) + 10, y: ya, class: 'etiqueta-serie', 'dominant-baseline': 'middle' }, s)
    ta.textContent = 'Este período'
    const tb = svg('text', { x: x(n - 1) + 10, y: yb, class: 'etiqueta-serie etiqueta-serie--suave', 'dominant-baseline': 'middle' }, s)
    tb.textContent = 'Anterior'
  }

  // Capa de interacción: cruz + tooltip
  const cruz = svg('g', { class: 'cruz', visibility: 'hidden' }, s)
  const guia = svg('line', { y1: m.arriba, y2: m.arriba + h }, cruz)
  const pAnt = svg('circle', { r: 5, class: 'cruz-anterior' }, cruz)
  const pAct = svg('circle', { r: 5, class: 'cruz-actual' }, cruz)
  const zona = svg('rect', { x: m.izquierda - 8, y: 0, width: w + 16, height: alto, class: 'zona', tabindex: 0, 'aria-label': 'Recorré los días con las flechas' }, s)

  const mostrar = (i: number) => {
    indiceFoco = i
    const a = actual[i]
    const b = anterior[i]
    cruz.setAttribute('visibility', 'visible')
    guia.setAttribute('x1', String(x(i)))
    guia.setAttribute('x2', String(x(i)))
    pAct.setAttribute('cx', String(x(i)))
    pAct.setAttribute('cy', String(y(a.ingresos)))
    pAnt.setAttribute('cx', String(x(i)))
    pAnt.setAttribute('cy', String(y(b.ingresos)))
    tip.innerHTML = `
      <p class="tip-titulo">${mayus(fechaLarga.format(a.fecha))}</p>
      <p class="tip-fila"><span class="muestra muestra--actual" aria-hidden="true"></span>Este período <strong>${formatPesos(a.ingresos)}</strong></p>
      <p class="tip-fila"><span class="muestra muestra--anterior" aria-hidden="true"></span>${corta(b.fecha)} <strong>${formatPesos(b.ingresos)}</strong></p>
      <p class="tip-fila tip-fila--pie">${a.pedidos} pedidos ${delta(variacion(a.ingresos, b.ingresos))}</p>`
    tip.hidden = false
    const tw = tip.offsetWidth
    let left = x(i) + 14
    if (left + tw > ancho - 4) left = x(i) - tw - 14
    tip.style.left = `${Math.max(4, left)}px`
    tip.style.top = `${Math.max(4, Math.min(y(a.ingresos), y(b.ingresos)) - 20)}px`
  }
  const ocultar = () => {
    cruz.setAttribute('visibility', 'hidden')
    tip.hidden = true
  }
  const indiceDesde = (ev: PointerEvent) => {
    const r = s.getBoundingClientRect()
    const px = ((ev.clientX - r.left) / r.width) * ancho
    return Math.min(n - 1, Math.max(0, Math.round(((px - m.izquierda) / w) * (n - 1))))
  }
  zona.addEventListener('pointermove', (ev) => mostrar(indiceDesde(ev)))
  zona.addEventListener('pointerdown', (ev) => mostrar(indiceDesde(ev)))
  zona.addEventListener('pointerleave', (ev) => {
    if (ev.pointerType === 'mouse') ocultar()
  })
  zona.addEventListener('focus', () => mostrar(indiceFoco >= 0 && indiceFoco < n ? indiceFoco : n - 1))
  zona.addEventListener('blur', ocultar)
  zona.addEventListener('keydown', (ev) => {
    const paso = { ArrowRight: 1, ArrowLeft: -1, Home: -n, End: n }[ev.key]
    if (paso === undefined) return
    ev.preventDefault()
    mostrar(Math.min(n - 1, Math.max(0, indiceFoco + paso)))
  })
}

function pintarLeyenda() {
  $('#leyenda').innerHTML = `
    <li><span class="muestra muestra--actual" aria-hidden="true"></span>Últimos ${rango} días</li>
    <li><span class="muestra muestra--anterior" aria-hidden="true"></span>${rango} días anteriores</li>`
  const total = resumir(lineaActual).ingresos
  $('#sub-ingresos').textContent = `${formatPesos(total)} en el período · promedio ${formatPesos(Math.round(total / lineaActual.length))} por día`
}

function pintarTablaLinea() {
  const filas = lineaActual
    .map((a, i) => {
      const b = lineaAnterior[i]
      return `<tr><th scope="row">${mayus(fechaLarga.format(a.fecha))}</th><td class="num">${formatPesos(a.ingresos)}</td><td class="num">${formatPesos(b.ingresos)}</td><td class="num">${delta(variacion(a.ingresos, b.ingresos))}</td></tr>`
    })
    .reverse()
    .join('')
  $('#tabla-linea').innerHTML = `<table class="tabla"><thead><tr><th scope="col">Día</th><th scope="col" class="num">Este período</th><th scope="col" class="num">Período anterior</th><th scope="col" class="num">Variación</th></tr></thead><tbody>${filas}</tbody></table>`
}

// ---------- Barras por categoría ----------
function pintarCategorias(actual: Dia[], anterior: Dia[]) {
  const cats = porCategoria(actual)
  const antes = Object.fromEntries(porCategoria(anterior).map((c) => [c.id, c.total]))
  const total = cats.reduce((s, c) => s + c.total, 0)
  const tope = escala(cats[0].total).at(-1)!
  $('#sub-categorias').textContent = `${formatPesos(total)} en ${CATEGORIAS.length} categorías`
  const caja = $('#barras')
  caja.querySelector('ol')?.remove()
  const lista = document.createElement('ol')
  lista.className = 'barras-lista'
  lista.innerHTML = cats
    .map(
      (c, i) => `
      <li class="barra" tabindex="0" data-id="${c.id}" style="--i:${i}">
        <span class="barra-nombre">${c.nombre}</span>
        <span class="barra-pista"><span class="barra-relleno" style="--ancho:${((c.total / tope) * 100).toFixed(2)}%"></span></span>
        <span class="barra-valor">${pesosCorto(c.total)}</span>
      </li>`,
    )
    .join('')
  caja.prepend(lista)

  const tip = $('#tip-barras')
  const mostrar = (li: HTMLElement) => {
    const c = cats.find((k) => k.id === li.dataset.id)!
    tip.innerHTML = `
      <p class="tip-titulo">${c.nombre}</p>
      <p class="tip-fila">Ventas <strong>${formatPesos(c.total)}</strong></p>
      <p class="tip-fila">Del total <strong>${((c.total / total) * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %</strong></p>
      <p class="tip-fila tip-fila--pie">vs. período anterior ${delta(variacion(c.total, antes[c.id]))}</p>`
    tip.hidden = false
    const r = li.getBoundingClientRect()
    const rc = caja.getBoundingClientRect()
    tip.style.left = `${Math.min(rc.width - tip.offsetWidth - 4, Math.max(4, r.left - rc.left + r.width * 0.35))}px`
    tip.style.top = `${r.bottom - rc.top + 6}px`
    lista.querySelectorAll('.barra').forEach((b) => b.classList.toggle('apagada', b !== li))
  }
  const ocultar = () => {
    tip.hidden = true
    lista.querySelectorAll('.barra').forEach((b) => b.classList.remove('apagada'))
  }
  lista.querySelectorAll<HTMLElement>('.barra').forEach((li) => {
    li.addEventListener('pointerenter', () => mostrar(li))
    li.addEventListener('focus', () => mostrar(li))
    li.addEventListener('blur', ocultar)
  })
  lista.addEventListener('pointerleave', ocultar)
}

// ---------- Pedidos por día de la semana ----------
const SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const SEMANA_LARGA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos']

function pintarSemana(actual: Dia[]) {
  const suma = Array(7).fill(0)
  const cuenta = Array(7).fill(0)
  for (const d of actual) {
    const i = (d.fecha.getDay() + 6) % 7
    suma[i] += d.pedidos
    cuenta[i]++
  }
  const prom = suma.map((s, i) => (cuenta[i] ? Math.round(s / cuenta[i]) : 0))
  const marcas = escala(Math.max(...prom))
  const tope = marcas.at(-1)!
  const mejor = prom.indexOf(Math.max(...prom))
  const caja = $('#semana')
  caja.querySelector('.columnas')?.remove()
  const cols = document.createElement('div')
  cols.className = 'columnas'
  cols.innerHTML =
    `<div class="columnas-grilla" aria-hidden="true">${marcas
      .slice()
      .reverse()
      .map((v) => `<span><em>${v}</em></span>`)
      .join('')}</div>` +
    prom
      .map(
        (v, i) => `
      <div class="columna${i === mejor ? ' columna--mejor' : ''}" tabindex="0" data-i="${i}" aria-label="${SEMANA_LARGA[i]}: ${v} pedidos en promedio">
        <span class="columna-pista">${i === mejor ? `<span class="columna-dato">${v}</span>` : ''}<span class="columna-relleno" style="--alto:${((v / tope) * 100).toFixed(2)}%"></span></span>
        <span class="columna-dia">${SEMANA[i]}</span>
      </div>`,
      )
      .join('')
  caja.prepend(cols)

  const tip = $('#tip-semana')
  const mostrar = (el: HTMLElement) => {
    const i = Number(el.dataset.i)
    tip.innerHTML = `<p class="tip-titulo">${mayus(SEMANA_LARGA[i])}</p><p class="tip-fila">Promedio <strong>${prom[i]} pedidos</strong></p><p class="tip-fila">Días contados <strong>${cuenta[i]}</strong></p>`
    tip.hidden = false
    const r = el.getBoundingClientRect()
    const rc = caja.getBoundingClientRect()
    tip.style.left = `${Math.min(rc.width - tip.offsetWidth - 4, Math.max(4, r.left - rc.left + r.width / 2 - tip.offsetWidth / 2))}px`
    tip.style.top = `4px`
    cols.querySelectorAll('.columna').forEach((c) => c.classList.toggle('apagada', c !== el))
  }
  const ocultar = () => {
    tip.hidden = true
    cols.querySelectorAll('.columna').forEach((c) => c.classList.remove('apagada'))
  }
  cols.querySelectorAll<HTMLElement>('.columna').forEach((el) => {
    el.addEventListener('pointerenter', () => mostrar(el))
    el.addEventListener('focus', () => mostrar(el))
    el.addEventListener('blur', ocultar)
  })
  cols.addEventListener('pointerleave', ocultar)
}

// ---------- Tabla de productos ----------
let productos: ReturnType<typeof topProductos> = []

function pintarProductos() {
  const q = $<HTMLInputElement>('#buscar').value.trim().toLowerCase()
  const nombres = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nombre]))
  const filas = productos
    .filter((p) => !q || p.nombre.toLowerCase().includes(q) || nombres[p.categoria].toLowerCase().includes(q))
    .sort((a, b) => {
      const va = a[orden.campo] ?? -Infinity
      const vb = b[orden.campo] ?? -Infinity
      const r = typeof va === 'string' ? va.localeCompare(vb as string, 'es') : (va as number) - (vb as number)
      return orden.asc ? r : -r
    })
  const maxIngresos = Math.max(...productos.map((p) => p.ingresos))
  $('#tabla-productos tbody').innerHTML = filas.length
    ? filas
        .map(
          (p) => `
      <tr>
        <th scope="row"><span class="prod">${p.nombre}</span><small>${nombres[p.categoria]}</small></th>
        <td class="num">${entero.format(p.unidades)}</td>
        <td class="num"><span class="celda-barra"><span style="--ancho:${((p.ingresos / maxIngresos) * 100).toFixed(1)}%"></span></span>${formatPesos(p.ingresos)}</td>
        <td class="num">${delta(p.variacion)}</td>
      </tr>`,
        )
        .join('')
    : `<tr><td colspan="4" class="vacio">No hay productos que coincidan con “${q.replace(/[<>&]/g, '')}”.</td></tr>`
  document.querySelectorAll<HTMLButtonElement>('#tabla-productos th button').forEach((b) => {
    const activo = b.dataset.orden === orden.campo
    const th = b.parentElement!
    if (activo) th.setAttribute('aria-sort', orden.asc ? 'ascending' : 'descending')
    else th.removeAttribute('aria-sort')
  })
}

document.querySelectorAll<HTMLButtonElement>('#tabla-productos th button').forEach((b) =>
  b.addEventListener('click', () => {
    const campo = b.dataset.orden as typeof orden.campo
    orden = orden.campo === campo ? { campo, asc: !orden.asc } : { campo, asc: campo === 'nombre' }
    pintarProductos()
  }),
)
$('#buscar').addEventListener('input', pintarProductos)

// ---------- Todo junto ----------
function pintar() {
  const { actual, anterior } = periodos(DIAS, rango)
  lineaActual = actual
  lineaAnterior = anterior
  indiceFoco = -1
  pintarCabeza(actual)
  pintarKpis(actual, anterior)
  pintarLeyenda()
  pintarLinea()
  pintarTablaLinea()
  pintarCategorias(actual, anterior)
  pintarSemana(actual)
  productos = topProductos(actual, anterior)
  pintarProductos()
}

document.querySelectorAll<HTMLButtonElement>('.rango button').forEach((b) =>
  b.addEventListener('click', () => {
    rango = Number(b.dataset.dias)
    pintar()
  }),
)

document.querySelectorAll<HTMLButtonElement>('.vista-switch button').forEach((b) =>
  b.addEventListener('click', () => {
    vista = b.dataset.vista as typeof vista
    document.querySelectorAll('.vista-switch button').forEach((o) => o.setAttribute('aria-checked', String(o === b)))
    $('#grafico-linea').hidden = vista !== 'grafico'
    $('#leyenda').hidden = vista !== 'grafico'
    $('#tabla-linea').hidden = vista !== 'tabla'
    if (vista === 'grafico') pintarLinea()
  }),
)

// Redibuja el gráfico de líneas si cambia el ancho.
new ResizeObserver(([e]) => {
  const ancho = Math.round(e.contentRect.width)
  if (ancho && Math.abs(ancho - anchoPrevio) > 1 && vista === 'grafico') {
    pintarLinea(false)
  }
}).observe($('#grafico-linea'))

pintar()
botonVolver(temaActual() === 'oscuro' ? 'oscuro' : 'claro')
