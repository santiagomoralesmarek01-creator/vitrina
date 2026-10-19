// Dibujo de la torta en SVG, en vista lateral con un leve 3D. Usa los colores de los datos.
import { bizcochuelo, cobertura, relleno, tamanio, type Torta } from './torta'

const NS = 'http://www.w3.org/2000/svg'
let contador = 0

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...hijos: Node[]) {
  const n = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  n.append(...hijos)
  return n
}

/** Pseudoaleatorio con semilla para que los chorreados no salten en cada cambio. */
function sembrado(semilla: number) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), s | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Piso {
  cx: number
  w: number
  h: number
  /** y de la cara superior (centro de la elipse). */
  y: number
}

const PISOS: Record<number, { w: number; h: number }[]> = {
  10: [{ w: 150, h: 78 }],
  15: [{ w: 188, h: 98 }],
  20: [
    { w: 196, h: 80 },
    { w: 132, h: 70 },
  ],
  30: [
    { w: 214, h: 70 },
    { w: 160, h: 62 },
    { w: 108, h: 56 },
  ],
}

const ry = (w: number) => w * 0.11

/** Banda curva entre dos alturas, siguiendo el borde frontal de la elipse. */
function banda(p: Piso, ya: number, yb: number) {
  const rx = p.w / 2
  const r = ry(p.w)
  const x0 = p.cx - rx
  const x1 = p.cx + rx
  return `M${x0} ${ya} A${rx} ${r} 0 0 0 ${x1} ${ya} L${x1} ${yb} A${rx} ${r} 0 0 1 ${x0} ${yb} Z`
}

/** Punto del borde frontal de la elipse superior a la altura x. */
function bordeY(p: Piso, x: number) {
  const rx = p.w / 2
  const t = Math.max(-1, Math.min(1, (x - p.cx) / rx))
  return p.y + ry(p.w) * Math.sqrt(1 - t * t)
}

function capas(p: Piso, t: Torta) {
  const g = el('g')
  const bizco = bizcochuelo(t.bizcochuelo).color
  const rell = t.rellenos.map((id) => relleno(id).color)
  // 3 capas de bizcochuelo y 2 de relleno
  const u = p.h / (3 * 3 + 2 * 1.3)
  let y = p.y
  for (let i = 0; i < 5; i++) {
    const alto = i % 2 === 0 ? 3 * u : 1.3 * u
    const color = i % 2 === 0 ? bizco : rell[((i - 1) / 2) % rell.length]
    g.append(el('path', { d: banda(p, y, y + alto), fill: color }))
    if (i % 2 === 1 && t.rellenos.includes('frutillas') && rell[((i - 1) / 2) % rell.length] === relleno('frutillas').color) {
      // Frutillas cortadas asomando en la crema
      for (let k = 0; k < 5; k++) {
        const x = p.cx - p.w / 2 + (p.w / 5) * (k + 0.5)
        g.append(el('ellipse', { cx: x, cy: bordeY({ ...p, y: y + alto / 2 }, x), rx: 5, ry: alto / 2.4, fill: '#d8343f' }))
      }
    }
    y += alto
  }
  return g
}

function dibujarPiso(svg: SVGSVGElement, defs: SVGDefsElement, p: Piso, t: Torta, esBase: boolean, semilla: number) {
  const cob = cobertura(t.cobertura)
  const g = el('g', { class: 'piso' })
  const rx = p.w / 2
  const r = ry(p.w)
  const cara = banda(p, p.y, p.y + p.h)
  const tapa = el('ellipse', { cx: p.cx, cy: p.y, rx, ry: r, fill: cob.color })
  const sombraLado = el('path', { d: cara, fill: 'url(#' + svg.dataset.prefijo + '-luz)' })

  if (t.cobertura === 'buttercream' || t.cobertura === 'fondant') {
    g.append(el('path', { d: cara, fill: cob.color }))
    if (esBase) {
      // Una porción cortada deja ver el interior.
      const id = `${svg.dataset.prefijo}-corte-${semilla}`
      const xa = p.cx + rx * 0.18
      const xb = p.cx + rx * 0.62
      defs.append(el('clipPath', { id }, el('rect', { x: xa, y: p.y - 20, width: xb - xa, height: p.h + 60 })))
      const interior = capas(p, t)
      interior.setAttribute('clip-path', `url(#${id})`)
      g.append(interior)
      g.append(el('rect', { x: xa, y: bordeY(p, xa), width: 3, height: p.h, fill: 'rgb(0 0 0 / .18)' }))
    }
    g.append(sombraLado, tapa)
    if (esBase) {
      // La tapa también muestra la cuña que falta
      const xa = p.cx + rx * 0.18
      const xb = p.cx + rx * 0.62
      g.append(
        el('path', {
          d: `M${p.cx} ${p.y} L${xa} ${bordeY(p, xa)} L${xb} ${bordeY(p, xb)} Z`,
          fill: bizcochuelo(t.bizcochuelo).color,
          opacity: 0.85,
        }),
      )
    }
    if (t.cobertura === 'buttercream') {
      // Borde de picos de manga arriba y abajo
      const n = Math.round(p.w / 11)
      for (let k = 0; k <= n; k++) {
        const x = p.cx - rx + (p.w / n) * k
        const yb = bordeY({ ...p, y: p.y + p.h }, x)
        g.append(el('circle', { cx: x, cy: yb - 2, r: 5.2, fill: cob.color, stroke: 'rgb(120 50 50 / .18)', 'stroke-width': 1 }))
        g.append(el('circle', { cx: x, cy: bordeY(p, x), r: 4.2, fill: cob.color, stroke: 'rgb(120 50 50 / .18)', 'stroke-width': 1 }))
      }
    } else {
      // Fondant: perlas al pie
      const n = Math.round(p.w / 8)
      for (let k = 0; k <= n; k++) {
        const x = p.cx - rx + (p.w / n) * k
        g.append(el('circle', { cx: x, cy: bordeY({ ...p, y: p.y + p.h }, x) - 3, r: 3.4, fill: '#fffdf8', stroke: '#d9c9b6', 'stroke-width': 0.8 }))
      }
      g.append(el('path', { d: banda(p, p.y + p.h * 0.62, p.y + p.h * 0.7), fill: 'var(--rosa, #d9a3a0)', opacity: 0.85 }))
    }
  } else {
    // Semidesnuda: se ven las capas con una veladura de cobertura
    g.append(capas(p, t))
    if (t.cobertura === 'merengue') g.append(el('path', { d: cara, fill: cob.color, opacity: 0.38 }))
    g.append(sombraLado, tapa)
    if (t.cobertura === 'merengue') {
      // Copos de merengue flameados: una fila atrás y otra adelante
      const copo = (x: number, y: number, e: number) =>
        el('path', {
          d: `M${x - 10 * e} ${y} C${x - 12 * e} ${y - 9 * e} ${x - 3 * e} ${y - 10 * e} ${x + 1 * e} ${y - 21 * e} C${x + 2 * e} ${y - 12 * e} ${x + 12 * e} ${y - 9 * e} ${x + 10 * e} ${y} Z`,
          fill: `url(#${svg.dataset.prefijo}-tostado)`,
        })
      const n = Math.max(5, Math.round(p.w / 19))
      for (const fila of ['atras', 'adelante']) {
        for (let k = 0; k <= n; k++) {
          const x = p.cx - rx + 10 + ((p.w - 20) / n) * k
          const tt = (x - p.cx) / rx
          const y = fila === 'atras' ? p.y - r * Math.sqrt(Math.max(0, 1 - tt * tt)) + 4 : bordeY(p, x) + 3
          if (fila === 'atras' && (k === 0 || k === n)) continue
          g.append(copo(x, y, fila === 'atras' ? 0.75 : 1))
        }
      }
    } else {
      // Ganache: chorreado
      const rand = sembrado(semilla * 7919 + 13)
      const n = Math.round(p.w / 14)
      g.append(el('path', { d: banda(p, p.y, p.y + 6), fill: cob.color }))
      for (let k = 0; k < n; k++) {
        const x = p.cx - rx + 5 + ((p.w - 10) / (n - 1)) * k
        const largo = 8 + rand() * p.h * 0.45
        const ancho = 6 + rand() * 4
        const y = bordeY(p, x)
        g.append(el('rect', { x: x - ancho / 2, y: y - 2, width: ancho, height: largo, rx: ancho / 2, fill: cob.color }))
      }
      g.append(el('ellipse', { cx: p.cx - rx * 0.35, cy: p.y - r * 0.25, rx: rx * 0.3, ry: r * 0.22, fill: '#fff', opacity: 0.12 }))
    }
  }
  svg.append(g)
}

function decorar(svg: SVGSVGElement, p: Piso, t: Torta) {
  const g = el('g', { class: 'decoracion' })
  const prim = t.rellenos[0]
  const colores: Record<string, string[]> = {
    ddl: ['#5a3122', '#7a4630'],
    frutillas: ['#d8343f', '#e04752'],
    ganache: ['#2b1711', '#4a281e'],
    lemoncurd: ['#f2d34f', '#e9b92a'],
    frutosrojos: ['#8e1f3f', '#3c2a63'],
    pistacho: ['#8ea24a', '#b4c46d'],
  }
  const [a, b] = colores[prim] ?? colores.ddl
  const puntos = [-0.42, -0.18, 0.1, 0.36]
  puntos.forEach((f, i) => {
    const x = p.cx + (p.w / 2) * f
    const y = p.y - 3 + (i % 2) * 3
    if (prim === 'lemoncurd') {
      g.append(el('circle', { cx: x, cy: y - 5, r: 7, fill: a, stroke: '#fff7d0', 'stroke-width': 1.6 }))
      g.append(el('path', { d: `M${x - 7} ${y - 5}h14M${x} ${y - 12}v14`, stroke: '#fff7d0', 'stroke-width': 0.8 }))
    } else {
      g.append(el('circle', { cx: x, cy: y - 5, r: 6, fill: i % 2 ? b : a }))
      g.append(el('circle', { cx: x - 2, cy: y - 7, r: 1.6, fill: '#fff', opacity: 0.5 }))
    }
  })
  svg.append(g)
}

/** Cartelito de mensaje sostenido por dos palitos sobre el piso de arriba. */
function cartel(svg: SVGSVGElement, p: Piso, mensaje: string) {
  const texto = mensaje.trim()
  if (!texto) return
  const largo = [...texto].length
  // Gloock a 15px ocupa ~8,6px por letra; si no entra, se achica la letra.
  const natural = largo * 8.6
  const tam = natural + 36 > 290 ? (15 * 254) / natural : 15
  const w = Math.min(290, Math.max(84, (natural * tam) / 15 + 36))
  const h = 30
  const yBase = p.y - 6
  const y = yBase - 52
  const x0 = 160 - w / 2
  const x1 = 160 + w / 2
  const g = el('g', { class: 'cartel-torta' })
  g.append(
    el('line', { x1: 160 - w * 0.22, y1: y + h, x2: 160 - w * 0.22, y2: yBase, class: 'palito' }),
    el('line', { x1: 160 + w * 0.22, y1: y + h, x2: 160 + w * 0.22, y2: yBase, class: 'palito' }),
    el('path', {
      d: `M${x0 - 10} ${y} L${x1 + 10} ${y} L${x1} ${y + h / 2} L${x1 + 10} ${y + h} L${x0 - 10} ${y + h} L${x0} ${y + h / 2} Z`,
      class: 'banderin',
    }),
  )
  const tx = el('text', { x: 160, y: y + h / 2 + 5, 'text-anchor': 'middle', class: 'banderin-texto' })
  tx.textContent = texto
  tx.setAttribute('font-size', tam.toFixed(1))
  g.append(tx)
  svg.append(g)
}

export function dibujarTorta(svg: SVGSVGElement, t: Torta) {
  if (!svg.dataset.prefijo) svg.dataset.prefijo = `torta${++contador}`
  const pref = svg.dataset.prefijo
  svg.setAttribute('viewBox', '0 0 320 320')
  svg.replaceChildren()
  const defs = el(
    'defs',
    {},
    el(
      'linearGradient',
      { id: `${pref}-luz`, x1: 0, x2: 1, y1: 0, y2: 0 },
      el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.16 }),
      el('stop', { offset: 0.3, 'stop-color': '#fff', 'stop-opacity': 0.1 }),
      el('stop', { offset: 0.55, 'stop-color': '#fff', 'stop-opacity': 0 }),
      el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.22 }),
    ),
    el(
      'linearGradient',
      { id: `${pref}-tostado`, x1: 0, x2: 0, y1: 0, y2: 1 },
      el('stop', { offset: 0, 'stop-color': '#a8642e' }),
      el('stop', { offset: 0.35, 'stop-color': '#e5b47c' }),
      el('stop', { offset: 0.7, 'stop-color': '#fbf4ea' }),
    ),
  )
  svg.append(defs)

  // Fuente de torta
  svg.append(
    el('ellipse', { cx: 160, cy: 300, rx: 48, ry: 7, class: 'fuente-pie' }),
    el('path', { d: 'M146 300 L152 274 H168 L174 300 Z', class: 'fuente-pie' }),
    el('ellipse', { cx: 160, cy: 272, rx: 136, ry: 14, class: 'fuente' }),
    el('ellipse', { cx: 160, cy: 268, rx: 136, ry: 13, class: 'fuente-borde' }),
  )

  const medidas = PISOS[tamanio(t.porciones).porciones]
  let base = 262
  const pisos: Piso[] = []
  for (const m of medidas) {
    const y = base - m.h
    pisos.push({ cx: 160, w: m.w, h: m.h, y })
    base = y + ry(m.w) * 0.35
  }
  pisos.forEach((p, i) => dibujarPiso(svg, defs, p, t, i === 0, i + 1))
  const arriba = pisos[pisos.length - 1]
  decorar(svg, arriba, t)
  cartel(svg, arriba, t.mensaje)
}
