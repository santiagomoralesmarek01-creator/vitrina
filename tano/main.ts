import '@fontsource/abril-fatface/400.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/600.css'
import './style.css'
import { formatPesos } from '../shared/dinero'
import { botonVolver } from '../shared/volver'
import {
  CLASICAS,
  INGREDIENTES,
  TAMANIOS,
  alternar,
  cambiarMitades,
  descripcion,
  pizzaVacia,
  precio,
  sembrado,
  type Ingrediente,
  type Mitad,
  type Pizza,
  type Tamanio,
} from './pizza'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const SVG = 'http://www.w3.org/2000/svg'

let pizza: Pizza = pizzaVacia()
let activa: Mitad = 'izq'

// ---------- Las clásicas ----------
$('clasicas').innerHTML = CLASICAS.map((c, i) => {
  const p: Pizza = { tamanio: 'grande', mitades: false, izq: c.ingredientes, der: [] }
  return `
    <article class="clasica" style="--giro: ${i % 2 ? 1.5 : -1.5}deg">
      <h3>${c.nombre}</h3>
      <p>${c.detalle}</p>
      <p class="clasica-precio">${formatPesos(precio(p))} <small>la grande</small></p>
      <button type="button" class="boton boton--chico" data-clasica="${c.id}">Personalizala ↓</button>
    </article>`
}).join('')

$('clasicas').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-clasica]')
  if (!b) return
  const c = CLASICAS.find((x) => x.id === b.dataset.clasica)!
  pizza = { ...pizzaVacia(), tamanio: pizza.tamanio, izq: [...c.ingredientes] }
  activa = 'izq'
  $<HTMLInputElement>('mitades').checked = false
  pintar(true)
  $('armador').scrollIntoView({ behavior: 'smooth' })
})

// ---------- Controles ----------
$('tamanios').innerHTML = (Object.keys(TAMANIOS) as Tamanio[])
  .map(
    (t) =>
      `<button type="button" role="radio" data-tamanio="${t}" aria-checked="${t === pizza.tamanio}">${TAMANIOS[t].nombre} <small>${TAMANIOS[t].porciones} porciones</small></button>`,
  )
  .join('')

$('tamanios').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tamanio]')
  if (!b) return
  pizza = { ...pizza, tamanio: b.dataset.tamanio as Tamanio }
  pintar()
})

$<HTMLInputElement>('mitades').addEventListener('change', (e) => {
  pizza = cambiarMitades(pizza, (e.target as HTMLInputElement).checked)
  activa = 'izq'
  pintar(true)
})

$('mitad-activa').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mitad]')
  if (b) elegirMitad(b.dataset.mitad as Mitad)
})

function elegirMitad(m: Mitad) {
  activa = m
  pintar()
}

$('ingredientes').innerHTML = INGREDIENTES.map(
  (i) => `
  <button type="button" class="ingrediente" data-ing="${i.id}" aria-pressed="false">
    <span class="punto" style="background:${i.color}"></span>
    <span>${i.nombre}</span>
    <small>+${formatPesos(i.precio)}</small>
  </button>`,
).join('')

$('ingredientes').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-ing]')
  if (!b) return
  try {
    pizza = alternar(pizza, activa, b.dataset.ing!)
    $('aviso').textContent = ''
    pintar()
  } catch (err) {
    $('aviso').textContent = (err as Error).message
  }
})

$('vaciar').addEventListener('click', () => {
  pizza = { ...pizzaVacia(), tamanio: pizza.tamanio }
  activa = 'izq'
  $<HTMLInputElement>('mitades').checked = false
  pintar(true)
})

$('copiar').addEventListener('click', async () => {
  const texto = `Hola Tano, quiero una pizza ${descripcion(pizza).toLowerCase()}. Total: ${formatPesos(precio(pizza))}.`
  try {
    await navigator.clipboard.writeText(texto)
    $('aviso').textContent = '¡Copiado! Pegalo en WhatsApp o dictalo por teléfono.'
  } catch {
    $('aviso').textContent = texto
  }
})

// ---------- La pizza en SVG ----------
const svg = $('pizza') as unknown as SVGSVGElement

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const n = document.createElementNS(SVG, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}

const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)

function pieza(ing: Ingrediente, x: number, y: number, giro: number, i: number) {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${giro})`, class: 'pieza', style: `--i:${i}` })
  const fill = ing.color
  switch (ing.forma) {
    case 'circulo':
      g.append(el('circle', { r: 9, fill, stroke: 'rgb(0 0 0 / .25)', 'stroke-width': 1 }))
      break
    case 'anillo':
      g.append(el('circle', { r: 7, fill: 'none', stroke: fill, 'stroke-width': 4 }))
      break
    case 'tira':
      g.append(el('rect', { x: -12, y: -3, width: 24, height: 6, rx: 3, fill }))
      break
    case 'hoja':
      g.append(el('ellipse', { rx: 10, ry: 5, fill }), el('path', { d: 'M-9 0h18', stroke: 'rgb(0 0 0 / .3)', 'stroke-width': 1 }))
      break
    case 'cuadrado':
      g.append(el('rect', { x: -8, y: -8, width: 16, height: 16, rx: 3, fill }))
      break
  }
  return g
}

function dibujar(animar: string[]) {
  svg.replaceChildren()
  svg.append(
    el('circle', { cx: 150, cy: 150, r: 142, class: 'borde' }),
    el('circle', { cx: 150, cy: 150, r: 122, class: 'salsa' }),
  )
  // Queso derretido: manchas irregulares, siempre iguales.
  const r = sembrado(7)
  for (let k = 0; k < 26; k++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 96
    svg.append(el('circle', { cx: 150 + Math.cos(a) * d, cy: 150 + Math.sin(a) * d, r: 16 + r() * 14, class: 'queso' }))
  }

  const mitades: [Mitad, string[], number, number][] = pizza.mitades
    ? [
        ['izq', pizza.izq, Math.PI / 2, Math.PI * 1.5],
        ['der', pizza.der, -Math.PI / 2, Math.PI / 2],
      ]
    : [['izq', pizza.izq, 0, Math.PI * 2]]

  let n = 0
  for (const [mitad, ids, desde, hasta] of mitades) {
    const capa = el('g', { class: `capa capa--${mitad}` })
    for (const id of ids) {
      const ing = INGREDIENTES.find((x) => x.id === id)!
      const rand = sembrado(hash(id + mitad))
      const cantidad = (pizza.tamanio === 'grande' ? 9 : 6) * (pizza.mitades ? 0.6 : 1)
      for (let k = 0; k < Math.round(cantidad); k++) {
        const a = desde + rand() * (hasta - desde)
        const d = 18 + Math.sqrt(rand()) * 92
        const p = pieza(ing, 150 + Math.cos(a) * d, 150 + Math.sin(a) * d, rand() * 360, n++)
        if (animar.includes(id + mitad)) p.classList.add('cae')
        capa.append(p)
      }
    }
    svg.append(capa)
  }

  if (pizza.mitades) {
    svg.append(el('path', { d: 'M150 8 V292', class: 'corte' }))
    // Zonas clickeables para elegir qué mitad se arma.
    for (const m of ['izq', 'der'] as Mitad[]) {
      const zona = el('path', {
        d: m === 'izq' ? 'M150 8 A142 142 0 0 0 150 292 Z' : 'M150 8 A142 142 0 0 1 150 292 Z',
        class: `zona${m === activa ? ' zona--activa' : ''}`,
        'data-zona': m,
      })
      svg.append(zona)
    }
  }
}

svg.addEventListener('click', (e) => {
  const zona = (e.target as Element).closest('[data-zona]')
  if (zona) elegirMitad(zona.getAttribute('data-zona') as Mitad)
})

// ---------- Pintar todo ----------
let anterior: Set<string> = new Set()

function pintar(todoNuevo = false) {
  const lado = pizza.mitades ? activa : 'izq'
  const actuales = new Set([...pizza.izq.map((i) => i + 'izq'), ...pizza.der.map((i) => i + 'der')])
  const nuevos = [...actuales].filter((x) => todoNuevo || !anterior.has(x))
  anterior = actuales
  dibujar(nuevos)

  document.querySelectorAll<HTMLButtonElement>('[data-tamanio]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.tamanio === pizza.tamanio)))
  $('fila-mitad').hidden = !pizza.mitades
  document.querySelectorAll<HTMLButtonElement>('[data-mitad]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mitad === activa)))
  document.querySelectorAll<HTMLButtonElement>('[data-ing]').forEach((b) => b.setAttribute('aria-pressed', String(pizza[lado].includes(b.dataset.ing!))))
  $('mesa-ayuda').textContent = pizza.mitades ? 'Tocá una mitad de la pizza para elegirla.' : ''
  $('descripcion').textContent = descripcion(pizza)
  $('precio').textContent = formatPesos(precio(pizza))
}

pintar()
botonVolver('claro')
