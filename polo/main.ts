import '@fontsource/fredoka/400.css'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import { bocha, dibujarHelado, iconoEnvase } from './dibujo'
import {
  CATEGORIAS,
  ENVASES,
  ENVIO,
  ENVIO_GRATIS,
  SABORES,
  SABOR_SEMANA,
  alternarSabor,
  aptoCeliacos,
  cambiarEnvase,
  costoEnvio,
  describir,
  filtrarSabores,
  filtroVacio,
  heladoVacio,
  linkWhatsApp,
  lleno,
  maxSabores,
  pedidoVacio,
  precioHelado,
  quitarDelPedido,
  quitarSabor,
  sabor,
  subtotal,
  sumarAlPedido,
  total,
  vegano,
  type Categoria,
  type EnvaseId,
  type Filtro,
  type Helado,
  type Pedido,
} from './helado'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const CLAVE = 'polo-sur-pedido'

let helado: Helado = heladoVacio('cuarto')
let filtro: Filtro = filtroVacio()
let pedido: Pedido = cargarPedido()
let dibujados = new Set<string>()

function cargarPedido(): Pedido {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Pedido | null
    if (g && Array.isArray(g.helados)) {
      let p: Pedido = { ...pedidoVacio(), entrega: g.entrega === 'envio' ? 'envio' : 'retiro' }
      for (const h of g.helados) {
        try {
          let limpio = heladoVacio(h.envase)
          for (const id of h.sabores) limpio = alternarSabor(limpio, id)
          p = sumarAlPedido(p, limpio)
        } catch {
          /* helado guardado inválido: se descarta */
        }
      }
      return p
    }
  } catch {
    /* sin almacenamiento */
  }
  return pedidoVacio()
}

function guardarPedido() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(pedido))
  } catch {
    /* modo privado */
  }
}

/** Radios accesibles: flechas para moverse dentro del grupo. */
function flechas(grupo: HTMLElement, elegir: (b: HTMLButtonElement) => void) {
  grupo.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const radios = [...grupo.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
    const i = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true')
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    const sig = radios[(i + paso + radios.length) % radios.length]
    elegir(sig)
    sig.focus()
  })
}

function marcarRadios(grupo: HTMLElement, attr: string, valor: string) {
  grupo.querySelectorAll<HTMLButtonElement>('[role="radio"]').forEach((b) => {
    const sel = b.getAttribute(attr) === valor
    b.setAttribute('aria-checked', String(sel))
    b.tabIndex = sel ? 0 : -1
  })
}

// ---------- Envases ----------
$('envases').innerHTML = ENVASES.map(
  (e) => `
  <button type="button" role="radio" class="envase" data-envase="${e.id}" aria-checked="false">
    ${iconoEnvase(e.id)}
    <span class="envase-nombre">${e.nombre}</span>
    <span class="envase-max">hasta ${e.maxSabores} sabores</span>
    <span class="envase-precio">${formatPesos(e.precio)}</span>
  </button>`,
).join('')

function elegirEnvase(b: HTMLButtonElement) {
  const { helado: h, quitados } = cambiarEnvase(helado, b.dataset.envase as EnvaseId)
  helado = h
  avisar(
    quitados.length
      ? `Saqué ${quitados.map((id) => sabor(id).nombre.toLowerCase()).join(' y ')} porque no entra${quitados.length > 1 ? 'n' : ''} en este envase.`
      : '',
  )
  dibujados = new Set()
  pintarHelado(true)
}

$('envases').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-envase]')
  if (b) elegirEnvase(b)
})
flechas($('envases'), elegirEnvase)

// ---------- Filtros ----------
const cats: [Categoria | 'todas', string][] = [['todas', 'Todos'], ...(Object.entries(CATEGORIAS) as [Categoria, string][])]
$('categorias').innerHTML = cats
  .map(([id, n]) => `<button type="button" role="radio" class="chip" data-categoria="${id}" aria-checked="false">${n}</button>`)
  .join('')

function elegirCategoria(b: HTMLButtonElement) {
  filtro = { ...filtro, categoria: b.dataset.categoria as Filtro['categoria'] }
  pintarSabores()
}
$('categorias').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-categoria]')
  if (b) elegirCategoria(b)
})
flechas($('categorias'), elegirCategoria)

document.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((b) =>
  b.addEventListener('click', () => {
    const k = b.dataset.filtro as 'sinTacc' | 'vegano'
    filtro = { ...filtro, [k]: !filtro[k] }
    pintarSabores()
  }),
)

// ---------- Sabores ----------
const miniBocha = (id: string) => `<svg viewBox="0 0 80 72" aria-hidden="true">${bocha(sabor(id), 40, 42, 30)}</svg>`

$('sabores').innerHTML = SABORES.map(
  (s) => `
  <button type="button" class="sabor" data-sabor="${s.id}" aria-pressed="false" style="--color:${s.color}">
    ${miniBocha(s.id)}
    <span class="sabor-nombre">${s.nombre}</span>
    <span class="sabor-cat">${CATEGORIAS[s.categoria]}</span>
    <span class="sabor-marcas">${s.sinTacc ? '<span class="marca">Sin TACC</span>' : ''}${s.vegano ? '<span class="marca marca--vegano">Vegano</span>' : ''}${s.id === SABOR_SEMANA.id ? '<span class="marca marca--semana">★ Semana</span>' : ''}</span>
    <span class="sabor-check" aria-hidden="true"></span>
  </button>`,
).join('')

function tocarSabor(id: string) {
  try {
    helado = alternarSabor(helado, id)
    avisar('')
  } catch (err) {
    avisar((err as Error).message, true)
  }
  pintarHelado()
}

$('sabores').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-sabor]')
  if (b) tocarSabor(b.dataset.sabor!)
})

function pintarSabores() {
  const visibles = new Set(filtrarSabores(SABORES, filtro).map((s) => s.id))
  document.querySelectorAll<HTMLButtonElement>('[data-sabor]').forEach((b) => {
    b.hidden = !visibles.has(b.dataset.sabor!)
  })
  $('sin-resultados').hidden = visibles.size > 0
  marcarRadios($('categorias'), 'data-categoria', filtro.categoria)
  document.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((b) =>
    b.setAttribute('aria-pressed', String(filtro[b.dataset.filtro as 'sinTacc' | 'vegano'])),
  )
}

// ---------- Vista del helado ----------
function avisar(texto: string, sacudir = false) {
  const a = $('aviso')
  a.textContent = texto
  if (sacudir) {
    a.classList.remove('sacude')
    void a.offsetWidth
    a.classList.add('sacude')
  }
}

$('elegidos').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-quitar]')
  if (!b) return
  helado = quitarSabor(helado, b.dataset.quitar!)
  avisar('')
  dibujados = new Set(helado.sabores) // que no vuelvan a caer las que quedan
  pintarHelado()
})

function pintarHelado(todoNuevo = false) {
  const max = maxSabores(helado)
  const nuevos = new Set(helado.sabores.filter((id) => todoNuevo || !dibujados.has(id)))
  dibujados = new Set(helado.sabores)
  $('helado').innerHTML = dibujarHelado(helado.envase, max, helado.sabores.map(sabor), nuevos)
  $('helado').setAttribute('aria-label', helado.sabores.length ? describir(helado) : 'Envase vacío')

  marcarRadios($('envases'), 'data-envase', helado.envase)
  const tope = lleno(helado)
  document.querySelectorAll<HTMLButtonElement>('[data-sabor]').forEach((b) => {
    const sel = helado.sabores.includes(b.dataset.sabor!)
    b.setAttribute('aria-pressed', String(sel))
    b.classList.toggle('sabor--tope', tope && !sel)
  })

  const n = helado.sabores.length
  $('vista-cuenta').textContent = n === 0 ? `Elegí hasta ${max} sabores` : `${n} de ${max} sabores${tope ? ' · ¡completo!' : ''}`
  $('elegidos').innerHTML = helado.sabores
    .map((id) => {
      const s = sabor(id)
      return `<li style="--color:${s.color}"><span>${s.nombre}</span><button type="button" data-quitar="${id}" aria-label="Sacar ${s.nombre}">×</button></li>`
    })
    .join('')
  const sellos: string[] = []
  if (n && aptoCeliacos(helado)) sellos.push('<li>Apto celíacos</li>')
  if (n && helado.envase === 'cucurucho' && filtro.sinTacc) sellos.push('<li class="sello--ojo">El cucurucho tiene TACC: pedilo en pote</li>')
  if (vegano(helado)) sellos.push('<li class="sello--vegano">100 % vegano</li>')
  $('sellos').innerHTML = sellos.join('')
  $('vista-precio').innerHTML = `${formatPesos(precioHelado(helado))} <small>${ENVASES.find((e) => e.id === helado.envase)!.nombre}</small>`
  $<HTMLButtonElement>('sumar').setAttribute('aria-disabled', String(n === 0))
}

$('sumar').addEventListener('click', () => {
  try {
    pedido = sumarAlPedido(pedido, helado)
    helado = heladoVacio(helado.envase)
    dibujados = new Set()
    avisar('¡Listo! Lo sumamos a tu pedido. ¿Armamos otro?')
    pintarHelado()
    pintarPedido(true)
  } catch (err) {
    avisar((err as Error).message, true)
  }
})

// ---------- Sabor de la semana ----------
const semana = sabor(SABOR_SEMANA.id)
$('semana-historia').textContent = SABOR_SEMANA.historia
$('semana-svg').innerHTML = `<path d="M62 120 L100 214 L138 120 Z" fill="#f4c27a" stroke="#c98a3e" stroke-width="3" stroke-linejoin="round"/>${bocha(sabor('americana'), 100, 112, 46)}${bocha(semana, 100, 64, 44, { cara: true })}`
$('semana-sumar').addEventListener('click', () => {
  if (!helado.sabores.includes(semana.id)) {
    try {
      helado = alternarSabor(helado, semana.id)
      $('semana-aviso').textContent = '¡Adentro! Ya está en tu helado.'
      avisar('')
    } catch (err) {
      $('semana-aviso').textContent = (err as Error).message
      return
    }
  } else {
    $('semana-aviso').textContent = 'Ya lo tenés en tu helado.'
  }
  pintarHelado()
  $('armar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
})

// ---------- Pedido ----------
const entrega = $('entrega')
function elegirEntrega(b: HTMLButtonElement) {
  pedido = { ...pedido, entrega: b.dataset.entrega as Pedido['entrega'] }
  pintarPedido()
}
entrega.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-entrega]')
  if (b) elegirEntrega(b)
})
flechas(entrega, elegirEntrega)

$('items').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-item]')
  if (!b) return
  pedido = quitarDelPedido(pedido, Number(b.dataset.item))
  pintarPedido()
})

$('whatsapp').addEventListener('click', (e) => {
  if (!pedido.helados.length) {
    e.preventDefault()
    $('aviso-pedido').textContent = 'Sumá al menos un helado para pedir.'
  }
})

function pintarPedido(recienSumado = false) {
  const vacio = pedido.helados.length === 0
  $('pedido-vacio').hidden = !vacio
  $('items').innerHTML = pedido.helados
    .map(
      (h, i) => `
    <li class="item${recienSumado && i === pedido.helados.length - 1 ? ' item--nuevo' : ''}">
      <span class="item-bochas" aria-hidden="true">${h.sabores.map((id) => `<i style="background:${sabor(id).color}"></i>`).join('')}</span>
      <span class="item-desc">${describir(h)}</span>
      <span class="item-precio">${formatPesos(precioHelado(h))}</span>
      <button type="button" class="item-quitar" data-item="${i}" aria-label="Quitar ${describir(h)}">×</button>
    </li>`,
    )
    .join('')
  marcarRadios(entrega, 'data-entrega', pedido.entrega)
  $('t-subtotal').textContent = formatPesos(subtotal(pedido))
  const envio = costoEnvio(pedido)
  $('t-envio').textContent =
    pedido.entrega === 'retiro'
      ? 'Retirás vos'
      : vacio
        ? formatPesos(ENVIO)
        : envio
          ? `${formatPesos(envio)} · gratis desde ${formatPesos(ENVIO_GRATIS)}`
          : '¡Gratis!'
  $('t-total').textContent = formatPesos(total(pedido))
  $('nav-cuenta').textContent = String(pedido.helados.length)
  const w = $<HTMLAnchorElement>('whatsapp')
  if (vacio) {
    w.removeAttribute('href')
    w.setAttribute('aria-disabled', 'true')
    w.setAttribute('role', 'link')
    w.tabIndex = 0
  } else {
    w.href = linkWhatsApp(pedido, formatPesos)
    w.removeAttribute('aria-disabled')
    $('aviso-pedido').textContent = ''
  }
  guardarPedido()
}

pintarSabores()
pintarHelado()
pintarPedido()
botonVolver('claro')
