import '@fontsource/anton/400.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  acomodar,
  agregar,
  alternar,
  altura,
  armarDeLaCasa,
  BEBIDAS,
  burgerInicial,
  calorias,
  CAPAS,
  cantidadValida,
  comboInicial,
  cuantas,
  DE_LA_CASA,
  describirBurger,
  enlaceWhatsApp,
  EXTRAS,
  MAX_CANTIDAD,
  PANES,
  PAPAS,
  PRECIO_COMBO,
  precioBurger,
  sacar,
  sacarEn,
  textoPedido,
  total,
  veredicto,
  type Burger,
  type CapaId,
  type Opcion,
  type PanId,
  type Pedido,
} from './burger'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const GUARDADO = 'bunker-pedido'
const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches

let pedido: Pedido = { burger: burgerInicial(), combo: comboInicial(), cantidad: 1 }

try {
  const g = JSON.parse(localStorage.getItem(GUARDADO) ?? 'null') as Pedido | null
  if (g?.burger?.capas && PANES.some((p) => p.id === g.burger.pan) && g.burger.capas.every((c) => c in CAPAS)) {
    total(g) // valida el combo
    pedido = { ...g, cantidad: cantidadValida(g.cantidad) }
  }
} catch {
  pedido = { burger: burgerInicial(), combo: comboInicial(), cantidad: 1 }
}

function guardar() {
  try {
    localStorage.setItem(GUARDADO, JSON.stringify(pedido))
  } catch {
    /* sin almacenamiento */
  }
}

// ---------- Dibujo de la burger (capas de HTML + CSS) ----------
interface OpcionesDibujo {
  interactivo?: boolean
  /** Índices de capas que caen con animación. */
  caen?: number[]
  rebota?: boolean
}

function dibujarBurger(cont: HTMLElement, b: Burger, op: OpcionesDibujo = {}) {
  const caen = new Set(op.caen ?? [])
  const total = b.capas.length
  const capa = (id: CapaId, i: number) => {
    const tag = op.interactivo ? 'button' : 'div'
    const extra = op.interactivo ? ` type="button" data-i="${i}" aria-label="Sacar ${CAPAS[id].nombre.toLowerCase()}"` : ''
    const clases = `capa capa--${id}${caen.has(i) ? ' cae' : ''}`
    const estilo = `--z:${i + 2};--mm:${CAPAS[id].mm};--d:${caen.has(i) ? [...caen].indexOf(i) * 70 : 0}ms`
    return `<${tag} class="${clases}" style="${estilo}"${extra}><i></i></${tag}>`
  }
  cont.dataset.pan = b.pan
  cont.innerHTML = [
    `<div class="pan pan--tapa${op.rebota ? ' rebota' : ''}" style="--z:${total + 3};--d:${caen.size * 70}ms"><i></i></div>`,
    ...b.capas.map((id, i) => capa(id, i)).reverse(),
    '<div class="pan pan--base" style="--z:1"></div>',
  ].join('')
}

dibujarBurger($('burger-portada'), armarDeLaCasa(DE_LA_CASA[0]))

// ---------- Las de la casa ----------
$('de-la-casa').innerHTML = DE_LA_CASA.map((d, i) => {
  const b = armarDeLaCasa(d)
  return `
  <article class="plato" style="--giro:${[-1.2, 0.8, -0.6, 1.1, -0.9, 0.6][i % 6]}deg">
    ${d.sticker ? `<span class="plato-sticker">${d.sticker}</span>` : ''}
    <div class="plato-burger"><div class="burger burger--mini" data-casa-dibujo="${d.id}" aria-hidden="true"></div></div>
    <h3>${d.nombre}</h3>
    <p class="plato-detalle">${d.detalle}</p>
    <div class="plato-pie">
      <p class="plato-precio">${formatPesos(precioBurger(b))}</p>
      <button type="button" class="boton boton--chico" data-casa="${d.id}">Armala así</button>
    </div>
  </article>`
}).join('')

document.querySelectorAll<HTMLElement>('[data-casa-dibujo]').forEach((c) => {
  dibujarBurger(c, armarDeLaCasa(DE_LA_CASA.find((d) => d.id === c.dataset.casaDibujo)!))
})

$('de-la-casa').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-casa]')
  if (!b) return
  const d = DE_LA_CASA.find((x) => x.id === b.dataset.casa)!
  pedido = { ...pedido, burger: armarDeLaCasa(d) }
  avisar(`Cargamos la ${d.nombre}. Cambiale lo que quieras.`)
  $('armador').scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth' })
  // Que caiga cuando ya se ve el armador.
  setTimeout(() => pintar({ todas: true }), sinMovimiento() ? 0 : 350)
})

// ---------- Controles ----------
$('panes').innerHTML = PANES.map(
  (p) =>
    `<button type="button" role="radio" aria-checked="false" data-pan="${p.id}">${p.nombre}<small>${p.precio ? '+' + formatPesos(p.precio) : 'Incluido'}</small></button>`,
).join('')

$('extras').innerHTML = EXTRAS.map(
  (id) => `
  <button type="button" class="extra" aria-pressed="false" data-extra="${id}">
    <span class="extra-icono extra-icono--${id}" aria-hidden="true"></span>
    <span class="extra-nombre">${CAPAS[id].nombre}</span>
    <span class="extra-precio">+${formatPesos(CAPAS[id].precio)}</span>
  </button>`,
).join('')

const radios = (lista: Opcion[], campo: string) =>
  lista
    .map(
      (o) =>
        `<button type="button" role="radio" aria-checked="false" data-${campo}="${o.id}">${o.nombre}<small>${o.precio ? '+' + formatPesos(o.precio) : 'Incluido'}</small></button>`,
    )
    .join('')
$('papas').innerHTML = radios(PAPAS, 'papas')
$('bebidas').innerHTML = radios(BEBIDAS, 'bebida')

function avisar(texto: string) {
  $('aviso').textContent = texto
}

function cambiar(fn: () => Burger, animar: 'ultima' | 'ninguna' = 'ninguna') {
  try {
    pedido = { ...pedido, burger: fn() }
    avisar('')
    pintar({ ultima: animar === 'ultima' })
  } catch (err) {
    avisar((err as Error).message)
    const burger = $('burger')
    burger.classList.remove('niega')
    void burger.offsetWidth
    burger.classList.add('niega')
  }
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement
  const pan = t.closest<HTMLElement>('[data-pan]')
  if (pan) {
    pedido = { ...pedido, burger: { ...pedido.burger, pan: pan.dataset.pan as PanId } }
    pintar({ rebota: true })
    return
  }
  const mas = t.closest<HTMLElement>('[data-mas]')
  if (mas) return cambiar(() => agregar(pedido.burger, mas.dataset.mas as CapaId), 'ultima')
  const menos = t.closest<HTMLElement>('[data-menos]')
  if (menos) return cambiar(() => sacar(pedido.burger, menos.dataset.menos as CapaId))
  const extra = t.closest<HTMLElement>('[data-extra]')
  if (extra) {
    const id = extra.dataset.extra as CapaId
    return cambiar(() => alternar(pedido.burger, id), cuantas(pedido.burger, id) ? 'ninguna' : 'ultima')
  }
  const capa = t.closest<HTMLElement>('#burger [data-i]')
  if (capa) return cambiar(() => sacarEn(pedido.burger, Number(capa.dataset.i)))
  const papas = t.closest<HTMLElement>('[data-papas]')
  if (papas) {
    pedido = { ...pedido, combo: { ...pedido.combo, papas: papas.dataset.papas! } }
    return pintar()
  }
  const bebida = t.closest<HTMLElement>('[data-bebida]')
  if (bebida) {
    pedido = { ...pedido, combo: { ...pedido.combo, bebida: bebida.dataset.bebida! } }
    return pintar()
  }
})

$('acomodar').addEventListener('click', () => {
  pedido = { ...pedido, burger: acomodar(pedido.burger) }
  avisar('Listo: salsa abajo, cada medallón con su cheddar y lo crocante arriba.')
  pintar({ todas: true })
})

$('reiniciar').addEventListener('click', () => {
  pedido = { ...pedido, burger: burgerInicial() }
  avisar('')
  pintar({ todas: true })
})

$('combo').addEventListener('click', () => {
  pedido = { ...pedido, combo: { ...pedido.combo, activo: !pedido.combo.activo } }
  pintar()
})

$('menos-cant').addEventListener('click', () => {
  pedido = { ...pedido, cantidad: cantidadValida(pedido.cantidad - 1) }
  pintar()
})
$('mas-cant').addEventListener('click', () => {
  pedido = { ...pedido, cantidad: cantidadValida(pedido.cantidad + 1) }
  pintar()
})

// ---------- Pintar ----------
const cm = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
let capasAntes = pedido.burger.capas.length

function pintar(op: { ultima?: boolean; todas?: boolean; rebota?: boolean } = {}) {
  const b = pedido.burger
  const n = b.capas.length
  const caen = sinMovimiento() ? [] : op.todas ? b.capas.map((_, i) => i) : op.ultima && n > capasAntes ? [n - 1] : []
  capasAntes = n
  dibujarBurger($('burger'), b, { interactivo: true, caen, rebota: !sinMovimiento() && (caen.length > 0 || op.rebota) })

  const marcar = (sel: string, attr: string, fn: (el: HTMLElement) => boolean) =>
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => el.setAttribute(attr, String(fn(el))))
  marcar('[data-pan]', 'aria-checked', (el) => el.dataset.pan === b.pan)
  marcar('[data-extra]', 'aria-pressed', (el) => cuantas(b, el.dataset.extra as CapaId) > 0)
  marcar('[data-papas]', 'aria-checked', (el) => el.dataset.papas === pedido.combo.papas)
  marcar('[data-bebida]', 'aria-checked', (el) => el.dataset.bebida === pedido.combo.bebida)

  for (const id of ['medallon', 'cheddar'] as CapaId[]) {
    $(`n-${id}`).textContent = String(cuantas(b, id))
    document.querySelector<HTMLButtonElement>(`[data-mas="${id}"]`)!.disabled = cuantas(b, id) >= CAPAS[id].maximo
    document.querySelector<HTMLButtonElement>(`[data-menos="${id}"]`)!.disabled = cuantas(b, id) <= (id === 'medallon' ? 1 : 0)
  }

  const mm = altura(b)
  $('altura').textContent = `${cm.format(mm / 10)} cm`
  $('regla-cm').textContent = `${cm.format(mm / 10)} cm`
  $('regla-marca').style.setProperty('--alto', String(mm))
  $('calorias').textContent = `${calorias(b).toLocaleString('es-AR')} kcal`
  $('veredicto').textContent = veredicto(mm)

  $('combo').setAttribute('aria-pressed', String(pedido.combo.activo))
  $('combo-texto').textContent = pedido.combo.activo ? 'Combo sí' : `Hacelo combo +${formatPesos(PRECIO_COMBO)}`
  $<HTMLFieldSetElement>('combo-opciones').disabled = !pedido.combo.activo

  $('cantidad').textContent = String(pedido.cantidad)
  $<HTMLButtonElement>('menos-cant').disabled = pedido.cantidad <= 1
  $<HTMLButtonElement>('mas-cant').disabled = pedido.cantidad >= MAX_CANTIDAD

  const casa = DE_LA_CASA.find((d) => JSON.stringify(armarDeLaCasa(d)) === JSON.stringify(b))
  const combo = pedido.combo.activo ? ` + combo con ${PAPAS.find((p) => p.id === pedido.combo.papas)!.nombre.toLowerCase()} y ${BEBIDAS.find((p) => p.id === pedido.combo.bebida)!.nombre.toLowerCase()}` : ''
  $('descripcion').textContent = `${casa ? casa.nombre + ' · ' : ''}${describirBurger(b)}${combo}.`
  $('total').textContent = formatPesos(total(pedido))
  $<HTMLAnchorElement>('pedir').href = enlaceWhatsApp(textoPedido(pedido, casa?.nombre))
  guardar()
}

pintar()
botonVolver('claro')
