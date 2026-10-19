import '@fontsource/shippori-mincho/500.css'
import '@fontsource/shippori-mincho/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  ETIQUETAS,
  OMAKASE,
  PIEZAS,
  PLATOS,
  TAMANIOS,
  TAMANIOS_LISTA,
  cambiarTamanio,
  cantidad,
  combinadoVacio,
  completarAlAzar,
  completo,
  descuento,
  estado,
  filtrar,
  filtroVacio,
  linkWhatsApp,
  precioOmakase,
  restar,
  subtotal,
  sumar,
  total,
  WHATSAPP,
  type Combinado,
  type Filtro,
  type Tamanio,
} from './combinado'
import { dibujoPieza } from './dibujos'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const CLAVE = 'kaze-combinado'

// ---------- Estado guardado ----------
function cargar(): Combinado {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Combinado | null
    if (g && TAMANIOS_LISTA.includes(g.tamanio) && Array.isArray(g.piezas)) {
      // Se vuelve a armar con las reglas para descartar piezas que ya no existen.
      let c = combinadoVacio(g.tamanio)
      for (const id of g.piezas) {
        if (PIEZAS.some((p) => p.id === id) && !completo(c)) c = sumar(c, id)
      }
      return c
    }
  } catch {
    /* sin almacenamiento: arrancamos de cero */
  }
  return combinadoVacio(30)
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(combo))
  } catch {
    /* modo privado o almacenamiento lleno */
  }
}

let combo = cargar()
let dibujadas = combo.piezas.length

// ---------- Tamaños ----------
$('tamanios').innerHTML = TAMANIOS_LISTA.map(
  (t) => `
  <button type="button" role="radio" data-tamanio="${t}" aria-checked="false">
    <span class="tam-n">${t}</span>
    <span class="tam-txt">piezas</span>
    <span class="tam-desc">−${Math.round(TAMANIOS[t].descuento * 100)}%</span>
  </button>`,
).join('')

$('tamanios').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tamanio]')
  if (!b) return
  try {
    combo = cambiarTamanio(combo, Number(b.dataset.tamanio) as Tamanio)
    avisar('')
  } catch (err) {
    avisar((err as Error).message)
  }
  pintar()
})

// Flechas dentro del grupo de radios.
$('tamanios').addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  const i = TAMANIOS_LISTA.indexOf(combo.tamanio)
  const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  const t = TAMANIOS_LISTA[(i + paso + TAMANIOS_LISTA.length) % TAMANIOS_LISTA.length]
  try {
    combo = cambiarTamanio(combo, t)
    avisar('')
  } catch (err) {
    avisar((err as Error).message)
  }
  pintar()
  $('tamanios').querySelector<HTMLButtonElement>(`[data-tamanio="${combo.tamanio}"]`)?.focus()
})

// ---------- Lista de piezas ----------
$('piezas').innerHTML = PIEZAS.map(
  (p) => `
  <li class="pieza">
    ${dibujoPieza(p.dibujo, p.color, 'pieza-dibujo')}
    <div class="pieza-texto">
      <p class="pieza-nombre">${p.nombre}</p>
      <p class="pieza-detalle">${p.detalle}</p>
    </div>
    <p class="pieza-precio">${formatPesos(p.precio)}<small> c/u</small></p>
    <div class="stepper stepper--chico" role="group" aria-label="${p.nombre}">
      <button type="button" data-restar="${p.id}" aria-label="Sacar ${p.nombre}">−</button>
      <output data-cant="${p.id}">0</output>
      <button type="button" data-sumar="${p.id}" aria-label="Sumar ${p.nombre}">+</button>
    </div>
  </li>`,
).join('')

$('piezas').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-sumar], [data-restar]')
  if (!b) return
  if (b.dataset.sumar) {
    try {
      combo = sumar(combo, b.dataset.sumar)
      avisar('')
    } catch (err) {
      avisar((err as Error).message)
    }
  } else {
    combo = restar(combo, b.dataset.restar!)
    avisar('')
  }
  pintar()
})

$('azar').addEventListener('click', () => {
  combo = completarAlAzar(combo)
  avisar('')
  pintar()
})

$('vaciar').addEventListener('click', () => {
  combo = combinadoVacio(combo.tamanio)
  avisar('')
  pintar()
})

$('pedir').addEventListener('click', (e) => {
  if (!completo(combo)) {
    e.preventDefault()
    avisar(`Completá la bandeja para pedir: ${estado(combo).toLowerCase()}.`)
  }
})

function avisar(texto: string) {
  $('aviso').textContent = texto
}

// ---------- Bandeja ----------
function pintarBandeja() {
  const b = $('bandeja')
  const { columnas } = TAMANIOS[combo.tamanio]
  b.style.setProperty('--columnas', String(columnas))
  b.dataset.tamanio = String(combo.tamanio)
  const celdas: string[] = []
  for (let i = 0; i < combo.tamanio; i++) {
    const id = combo.piezas[i]
    if (!id) {
      celdas.push('<span class="celda"></span>')
      continue
    }
    const p = PIEZAS.find((x) => x.id === id)!
    const nueva = i >= dibujadas ? ' cae' : ''
    celdas.push(`<span class="celda llena${nueva}" title="${p.nombre}">${dibujoPieza(p.dibujo, p.color)}</span>`)
  }
  b.innerHTML = celdas.join('')
  dibujadas = combo.piezas.length
  const r = combo.piezas.length
  b.setAttribute('aria-label', r ? `Tu bandeja: ${r} de ${combo.tamanio} piezas` : `Bandeja vacía de ${combo.tamanio} piezas`)
}

// ---------- Pintar ----------
function pintar() {
  pintarBandeja()
  document.querySelectorAll<HTMLButtonElement>('[data-tamanio]').forEach((b) => {
    const sel = Number(b.dataset.tamanio) === combo.tamanio
    b.setAttribute('aria-checked', String(sel))
    b.tabIndex = sel ? 0 : -1
  })
  const lleno = completo(combo)
  for (const p of PIEZAS) {
    const n = cantidad(combo, p.id)
    const out = document.querySelector<HTMLOutputElement>(`[data-cant="${p.id}"]`)!
    out.textContent = String(n)
    out.closest('.pieza')!.classList.toggle('pieza--elegida', n > 0)
    document.querySelector<HTMLButtonElement>(`[data-restar="${p.id}"]`)!.disabled = n === 0
    document.querySelector<HTMLButtonElement>(`[data-sumar="${p.id}"]`)!.setAttribute('aria-disabled', String(lleno))
  }
  $('contador-n').textContent = String(combo.piezas.length)
  $('contador-t').textContent = String(combo.tamanio)
  $('estado').textContent = estado(combo)
  $('estado').classList.toggle('estado--listo', lleno)
  $('subtotal').textContent = formatPesos(subtotal(combo))
  $('desc-rotulo').textContent = `Descuento combo −${Math.round(TAMANIOS[combo.tamanio].descuento * 100)}%`
  $('descuento').textContent = lleno ? `− ${formatPesos(descuento(combo))}` : 'al completar'
  $('total').textContent = formatPesos(total(combo))
  $('azar').hidden = lleno
  const pedir = $<HTMLAnchorElement>('pedir')
  if (lleno) {
    pedir.href = linkWhatsApp(combo, formatPesos)
    pedir.removeAttribute('aria-disabled')
  } else {
    pedir.removeAttribute('href')
    pedir.setAttribute('aria-disabled', 'true')
    pedir.setAttribute('role', 'link')
    pedir.tabIndex = 0
  }
  guardar()
}

// ---------- Carta ----------
let filtro: Filtro = filtroVacio()

function pintarCarta() {
  const lista = filtrar(PLATOS, filtro)
  $('platos').innerHTML = lista.length
    ? lista
        .map(
          (p) => `
    <article class="plato">
      <span class="plato-kanji" aria-hidden="true">${p.japones}</span>
      <div class="plato-cuerpo">
        <h3><span>${p.nombre}</span><span class="plato-precio">${formatPesos(p.precio)}</span></h3>
        <p>${p.detalle}</p>
        <ul class="etiquetas">${p.etiquetas.map((e) => `<li class="etiqueta etiqueta--${e}">${ETIQUETAS[e]}</li>`).join('')}</ul>
      </div>
    </article>`,
        )
        .join('')
    : '<p class="vacio">No hay platos con esa combinación. Probá sacando un filtro.</p>'
  $('cuenta').textContent = `${lista.length} ${lista.length === 1 ? 'plato' : 'platos'}`
  document.querySelectorAll<HTMLButtonElement>('[data-coccion]').forEach((b) => {
    const sel = b.dataset.coccion === filtro.coccion
    b.setAttribute('aria-checked', String(sel))
    b.tabIndex = sel ? 0 : -1
  })
  document.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((b) => {
    b.setAttribute('aria-pressed', String(filtro[b.dataset.filtro as 'veggie' | 'sintacc']))
  })
}

$('coccion').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-coccion]')
  if (!b) return
  filtro = { ...filtro, coccion: b.dataset.coccion as Filtro['coccion'] }
  pintarCarta()
})

$('coccion').addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  const ops: Filtro['coccion'][] = ['todo', 'crudo', 'cocido']
  const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  filtro = { ...filtro, coccion: ops[(ops.indexOf(filtro.coccion) + paso + 3) % 3] }
  pintarCarta()
  $('coccion').querySelector<HTMLButtonElement>(`[data-coccion="${filtro.coccion}"]`)?.focus()
})

document.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((b) =>
  b.addEventListener('click', () => {
    const k = b.dataset.filtro as 'veggie' | 'sintacc'
    filtro = { ...filtro, [k]: !filtro[k] }
    pintarCarta()
  }),
)

// ---------- Omakase ----------
const KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const LIBRES = 3
let comensales = 2

$('pasos').innerHTML = OMAKASE.pasos.map((p, i) => `<li><span class="paso-num" aria-hidden="true">${KANJI[i]}</span>${p}</li>`).join('')
$('omakase-precio').textContent = formatPesos(OMAKASE.precio)
$('lugares-puntos').innerHTML = Array.from({ length: OMAKASE.lugares }, (_, i) => `<i class="${i < OMAKASE.lugares - LIBRES ? 'ocupado' : ''}"></i>`).join('')
$('lugares-texto').textContent = `Quedan ${LIBRES} de ${OMAKASE.lugares} lugares esta noche`

function pintarOmakase(cambio = 0) {
  try {
    const t = precioOmakase(comensales + cambio, LIBRES)
    comensales += cambio
    $('omakase-total').textContent = formatPesos(t)
    $('aviso-omakase').textContent = ''
  } catch (err) {
    $('aviso-omakase').textContent = (err as Error).message
  }
  $('comensales').textContent = String(comensales)
  $<HTMLButtonElement>('menos-comensal').disabled = comensales <= 1
  const texto = `Hola Kaze, quiero reservar el omakase de esta noche para ${comensales} ${comensales === 1 ? 'persona' : 'personas'}.`
  $<HTMLAnchorElement>('reservar').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`
}

$('menos-comensal').addEventListener('click', () => pintarOmakase(-1))
$('mas-comensal').addEventListener('click', () => pintarOmakase(1))

pintar()
pintarCarta()
pintarOmakase()
botonVolver('claro')
