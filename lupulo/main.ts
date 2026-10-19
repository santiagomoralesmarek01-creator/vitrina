import '@fontsource/oswald/400.css'
import '@fontsource/oswald/600.css'
import '@fontsource/oswald/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  CANILLAS,
  ESTILOS,
  LIMITES,
  PRECIO_HAPPY,
  TAMANIO_VUELO,
  alternarEstilo,
  alternarVuelo,
  esOscura,
  estadoTaproom,
  filtrar,
  filtroInicial,
  ordenar,
  precioProbeta,
  precioVuelo,
  srmAHex,
  vueloCompleto,
  type Canilla,
  type Estilo,
  type Filtro,
  type Orden,
} from './canillas'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const CLAVE = 'lupulo:vuelo'
const porNumero = (n: number) => CANILLAS.find((c) => c.numero === n)!
const dos = (n: number) => String(n).padStart(2, '0')

let filtro: Filtro = filtroInicial()
let orden: Orden = 'canilla'
let vuelo: number[] = []

try {
  const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
  if (Array.isArray(guardado))
    vuelo = guardado.filter((n) => CANILLAS.some((c) => c.numero === n && !c.agotada)).slice(0, TAMANIO_VUELO)
} catch {
  /* sin almacenamiento */
}

// ---------- Estado del taproom ----------
const estado = estadoTaproom(new Date())
$('estado-ahora').textContent = { happy: 'Happy hour ahora', abierto: 'Abierto ahora', cerrado: 'Mar a dom de 17 a 1 h' }[estado]
$('estado-ahora').dataset.estado = estado
$('precio-happy').textContent = formatPesos(PRECIO_HAPPY)
if (estado === 'happy') $('happy-sello').textContent = '¡Ahora mismo!'

// ---------- Vaso de pinta ----------
function vaso(c: Canilla, clase = 'vaso') {
  const color = srmAHex(c.srm)
  const id = `v${c.numero}${clase}`
  const burbujas = esOscura(c.srm)
    ? ''
    : [14, 26, 34, 22].map((x, i) => `<circle class="burbuja" cx="${x}" cy="88" r="${1.4 + (i % 2)}" style="--d:${i * 0.7}s"/>`).join('')
  return `
  <svg class="${clase}" viewBox="0 0 48 100" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="M5 4h38l-4 88a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z"/></clipPath></defs>
    <g clip-path="url(#${id})">
      <rect x="0" y="0" width="48" height="100" class="vaso-vacio"/>
      <rect x="0" y="20" width="48" height="80" fill="${color}"/>
      ${burbujas}
      <path d="M0 12c6-4 10 2 16-1s10-5 16-1 10 3 16 0v12H0z" class="espuma"/>
      <rect x="9" y="22" width="4" height="66" rx="2" class="brillo"/>
    </g>
    <path d="M5 4h38l-4 88a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z" class="vaso-borde"/>
  </svg>`
}

// ---------- Filtros ----------
$('estilos').innerHTML = ESTILOS.map(
  (e) => `<button type="button" class="chip" data-estilo="${e}" aria-pressed="false">${e}</button>`,
).join('')

$('estilos').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-estilo]')
  if (!b) return
  filtro = { ...filtro, estilos: alternarEstilo(filtro.estilos, b.dataset.estilo as Estilo) }
  pintarPizarra()
})

function rango(clave: 'ibu' | 'abv', formato: (n: number) => string) {
  const min = $<HTMLInputElement>(`${clave}-min`)
  const max = $<HTMLInputElement>(`${clave}-max`)
  const caja = $(`rango-${clave}`)
  const [lo, hi] = LIMITES[clave]
  const actualizar = (mueve: 'min' | 'max') => {
    let a = Number(min.value)
    let b = Number(max.value)
    // Que los dos topes no se crucen.
    if (a > b) {
      if (mueve === 'min') a = b
      else b = a
      min.value = String(a)
      max.value = String(b)
    }
    filtro = { ...filtro, [clave]: [a, b] }
    pintarRango()
    pintarPizarra()
  }
  const pintarRango = () => {
    const [a, b] = filtro[clave]
    caja.style.setProperty('--a', `${((a - lo) / (hi - lo)) * 100}%`)
    caja.style.setProperty('--b', `${((b - lo) / (hi - lo)) * 100}%`)
    min.value = String(a)
    max.value = String(b)
    min.setAttribute('aria-valuetext', formato(a))
    max.setAttribute('aria-valuetext', formato(b))
    // Si los dos topes quedan pegados al máximo, el de mínimo tiene que quedar arriba para poder moverlo.
    min.style.zIndex = a >= hi - (hi - lo) * 0.05 ? '3' : '1'
    $(`${clave}-valor`).textContent = `${formato(a)} — ${formato(b)}`
  }
  min.addEventListener('input', () => actualizar('min'))
  max.addEventListener('input', () => actualizar('max'))
  return pintarRango
}
const pintarIbu = rango('ibu', (n) => `${n} IBU`)
const pintarAbv = rango('abv', (n) => `${n.toFixed(1).replace('.', ',')} %`)

$('orden').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-orden]')
  if (!b) return
  orden = b.dataset.orden as Orden
  pintarPizarra()
})
$('orden').addEventListener('keydown', (e) => {
  const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
  if (!paso) return
  e.preventDefault()
  const ordenes: Orden[] = ['canilla', 'nombre', 'abv', 'ibu']
  orden = ordenes[(ordenes.indexOf(orden) + paso + ordenes.length) % ordenes.length]
  pintarPizarra()
  document.querySelector<HTMLButtonElement>(`[data-orden="${orden}"]`)!.focus()
})

$('limpiar').addEventListener('click', () => {
  filtro = filtroInicial()
  orden = 'canilla'
  pintarIbu()
  pintarAbv()
  pintarPizarra()
})

// ---------- Pizarra de canillas ----------
const barra = (valor: number, max: number) => `<span class="barra" style="--v:${Math.min(100, (valor / max) * 100)}%"></span>`

function tarjeta(c: Canilla) {
  const enVuelo = vuelo.includes(c.numero)
  const llena = !enVuelo && !c.agotada && vueloCompleto(vuelo)
  return `
  <li class="canilla${c.agotada ? ' canilla--agotada' : ''}" style="--cerveza:${srmAHex(c.srm)}">
    <div class="canilla-arriba">
      <span class="canilla-num">Nº ${dos(c.numero)}</span>
      <span class="canilla-estilo">${c.estilo}</span>
    </div>
    <div class="canilla-cuerpo">
      ${vaso(c)}
      <div class="canilla-texto">
        <h3>${c.nombre}</h3>
        <p class="canilla-origen">${c.origen}</p>
        <p class="canilla-notas">${c.notas}</p>
      </div>
    </div>
    <dl class="datos">
      <div><dt>ABV</dt><dd>${c.abv.toFixed(1).replace('.', ',')} %</dd>${barra(c.abv - 3, 7)}</div>
      <div><dt>IBU</dt><dd>${c.ibu}</dd>${barra(c.ibu, 80)}</div>
      <div><dt>SRM</dt><dd>${c.srm}</dd><span class="muestra"></span></div>
    </dl>
    <div class="canilla-pie">
      <p class="precios">
        <span><small>Pinta</small>${formatPesos(c.pinta)}</span>
        <span><small>Media</small>${formatPesos(c.media)}</span>
      </p>
      <button type="button" class="sumar" data-vuelo="${c.numero}" aria-pressed="${enVuelo}" ${c.agotada ? 'disabled' : ''} ${llena ? 'aria-disabled="true"' : ''} aria-label="${enVuelo ? 'Sacar' : 'Sumar'} ${c.nombre} ${enVuelo ? 'del' : 'al'} vuelo">
        ${c.agotada ? 'Sin stock' : enVuelo ? '✓ En el vuelo' : llena ? 'Tabla llena' : '+ Vuelo'}
      </button>
    </div>
    ${c.agotada ? '<p class="sello-agotada" aria-label="Agotada">Agotada</p>' : ''}
  </li>`
}

function pintarPizarra() {
  const lista = ordenar(filtrar(CANILLAS, filtro), orden)
  $('pizarra').innerHTML = lista.map(tarjeta).join('')
  $('vacio').hidden = lista.length > 0
  const disponibles = lista.filter((c) => !c.agotada).length
  $('conteo').innerHTML = `<strong>${lista.length}</strong> de ${CANILLAS.length} canillas · ${disponibles} con cerveza`
  document.querySelectorAll<HTMLButtonElement>('[data-estilo]').forEach((b) =>
    b.setAttribute('aria-pressed', String(filtro.estilos.includes(b.dataset.estilo as Estilo))),
  )
  document.querySelectorAll<HTMLButtonElement>('[data-orden]').forEach((b) => {
    const activo = b.dataset.orden === orden
    b.setAttribute('aria-checked', String(activo))
    b.tabIndex = activo ? 0 : -1
  })
  const tocado = filtro.estilos.length > 0 || orden !== 'canilla' || filtro.ibu.join() !== LIMITES.ibu.join() || filtro.abv.join() !== LIMITES.abv.join()
  $<HTMLButtonElement>('limpiar').hidden = !tocado
}

function tocarVuelo(n: number, enfocar?: string) {
  try {
    vuelo = alternarVuelo(vuelo, porNumero(n))
    $('aviso').textContent = ''
  } catch (err) {
    $('aviso').textContent = (err as Error).message
  }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(vuelo))
  } catch {
    /* no importa */
  }
  pintarPizarra()
  pintarVuelo()
  if (enfocar) document.querySelector<HTMLButtonElement>(enfocar)?.focus()
}

$('pizarra').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-vuelo]')
  if (b) tocarVuelo(Number(b.dataset.vuelo), `#pizarra [data-vuelo="${b.dataset.vuelo}"]`)
})

// ---------- Vuelo ----------
const paleta = $('paleta')

/** Las cuatro probetas sobre la tabla de madera. */
function dibujarPaleta() {
  const huecos = [0, 1, 2, 3].map((i) => {
    const x = 80 + i * 112
    const c = vuelo[i] ? porNumero(vuelo[i]) : null
    const color = c ? srmAHex(c.srm) : ''
    const probeta = c
      ? `<g class="probeta probeta--llena" style="--i:${i}">
          <clipPath id="p${i}"><path d="M-22 -96h44l-6 78a8 8 0 0 1-8 7h-16a8 8 0 0 1-8-7z"/></clipPath>
          <g clip-path="url(#p${i})">
            <rect x="-30" y="-100" width="60" height="100" class="probeta-vidrio"/>
            <rect x="-30" y="-76" width="60" height="80" fill="${color}" class="probeta-cerveza"/>
            <path d="M-30 -80c8-5 14 2 22-1s14-5 22-1 10 3 16 0v8h-60z" class="espuma"/>
            <rect x="-15" y="-70" width="4" height="50" rx="2" class="brillo"/>
          </g>
          <path d="M-22 -96h44l-6 78a8 8 0 0 1-8 7h-16a8 8 0 0 1-8-7z" class="probeta-borde"/>
          <text y="-36" class="probeta-num${esOscura(c.srm) ? ' probeta-num--claro' : ''}">${dos(c.numero)}</text>
        </g>`
      : `<g class="probeta probeta--vacia">
          <path d="M-22 -96h44l-6 78a8 8 0 0 1-8 7h-16a8 8 0 0 1-8-7z"/>
          <text y="-44">${i + 1}</text>
        </g>`
    return `<g transform="translate(${x} 128)"><ellipse cy="-6" rx="34" ry="9" class="hueco"/>${probeta}</g>`
  })
  paleta.innerHTML = `
    <defs>
      <linearGradient id="madera" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b9773f"/><stop offset="1" stop-color="#8a4f25"/>
      </linearGradient>
    </defs>
    <path d="M14 112h470a14 14 0 0 1 14 14v6h40a12 12 0 0 1 0 24h-40v6a14 14 0 0 1-14 14H14A14 14 0 0 1 0 162v-36a14 14 0 0 1 14-14z" class="tabla"/>
    <path d="M20 128c80 6 160-4 240 2s160 4 220-2M20 150c100-6 180 4 260-2s140 2 200 4M520 144h46" class="veta"/>
    <circle cx="560" cy="144" r="5" class="agujero"/>
    <text x="250" y="168" class="tabla-marca">LÚPULO · VUELO DE DEGUSTACIÓN</text>
    ${huecos.join('')}`
  paleta.setAttribute(
    'aria-label',
    vuelo.length ? `Tu vuelo: ${vuelo.map((n) => porNumero(n).nombre).join(', ')}` : 'Tabla de degustación vacía',
  )
}

$('elegir').innerHTML = CANILLAS.map(
  (c) => `
  <button type="button" class="opcion" data-elegir="${c.numero}" aria-pressed="false" ${c.agotada ? 'disabled' : ''}>
    <span class="opcion-color" style="background:${srmAHex(c.srm)}"></span>
    <span class="opcion-num">${dos(c.numero)}</span>
    <span class="opcion-nombre">${c.nombre}<small>${c.agotada ? 'Agotada' : `${c.estilo} · ${formatPesos(precioProbeta(c))}`}</small></span>
  </button>`,
).join('')

$('elegir').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-elegir]')
  if (b && !b.disabled) tocarVuelo(Number(b.dataset.elegir))
})

function pintarVuelo() {
  dibujarPaleta()
  $('vuelo-nombres').innerHTML = [0, 1, 2, 3]
    .map((i) => {
      const c = vuelo[i] ? porNumero(vuelo[i]) : null
      return c
        ? `<li><strong>${c.nombre}</strong><span>${c.estilo}<i class="vn-sep"> · </i><i>${c.abv.toFixed(1).replace('.', ',')}&nbsp;%</i></span></li>`
        : `<li class="libre"><strong>Probeta ${i + 1}</strong><span>sin elegir</span></li>`
    })
    .join('')
  document.querySelectorAll<HTMLButtonElement>('[data-elegir]').forEach((b) => {
    const n = Number(b.dataset.elegir)
    const dentro = vuelo.includes(n)
    b.setAttribute('aria-pressed', String(dentro))
    // Con la tabla llena solo se pueden sacar.
    b.classList.toggle('opcion--bloqueada', !dentro && vueloCompleto(vuelo))
  })
  const faltan = TAMANIO_VUELO - vuelo.length
  $('vuelo-estado').innerHTML = vueloCompleto(vuelo)
    ? '<span class="punto punto--ok"></span>Tabla completa'
    : `<span class="punto"></span>${vuelo.length} de ${TAMANIO_VUELO} · ${faltan === 1 ? 'falta 1' : `faltan ${faltan}`}`
  $('vuelo-precio').textContent = formatPesos(precioVuelo(vuelo))
  const suma = vuelo.reduce((s, n) => s + precioProbeta(porNumero(n)), 0)
  $('vuelo-detalle').innerHTML = vueloCompleto(vuelo)
    ? `<s>${formatPesos(suma)}</s> · 10 % off por vuelo completo`
    : vuelo.length
      ? 'Completá las 4 para el 10 % de descuento'
      : 'Probetas desde ' + formatPesos(Math.min(...CANILLAS.map(precioProbeta)))
  $<HTMLButtonElement>('pedir').disabled = !vueloCompleto(vuelo)
  $<HTMLButtonElement>('vaciar').disabled = vuelo.length === 0
}

$('vaciar').addEventListener('click', () => {
  vuelo = []
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* no importa */
  }
  $('aviso').textContent = ''
  pintarPizarra()
  pintarVuelo()
})

$('pedir').addEventListener('click', async () => {
  const texto = `Vuelo Lúpulo: ${vuelo.map((n) => `#${dos(n)} ${porNumero(n).nombre}`).join(', ')}. Total ${formatPesos(precioVuelo(vuelo))}.`
  try {
    await navigator.clipboard.writeText(texto)
    $('aviso').textContent = '¡Pedido copiado! Mostralo en la barra o mandalo por WhatsApp.'
  } catch {
    $('aviso').textContent = texto
  }
})

pintarIbu()
pintarAbv()
pintarPizarra()
pintarVuelo()
botonVolver('claro')
