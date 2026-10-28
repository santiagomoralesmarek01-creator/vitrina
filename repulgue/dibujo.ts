import type { Repulgue } from './gustos'

/*
 * Dibujos a dos tintas, como en una risografía: la capa coral (relleno con trama) y la capa azul
 * (línea) se imprimen por separado y quedan apenas corridas. Los colores salen del CSS
 * (.tinta-azul, .tinta-coral), así cambian solos en modo oscuro.
 */

type P = [number, number]
const r1 = (n: number) => Math.round(n * 10) / 10

// Borde curvo de la media luna: una Bézier cúbica.
const B0: P = [16, 94]
const B1: P = [20, 26]
const B2: P = [140, 26]
const B3: P = [144, 94]

function punto(t: number): P {
  const u = 1 - t
  return [
    u * u * u * B0[0] + 3 * u * u * t * B1[0] + 3 * u * t * t * B2[0] + t * t * t * B3[0],
    u * u * u * B0[1] + 3 * u * u * t * B1[1] + 3 * u * t * t * B2[1] + t * t * t * B3[1],
  ]
}

function tangente(t: number): P {
  const u = 1 - t
  const x = 3 * u * u * (B1[0] - B0[0]) + 6 * u * t * (B2[0] - B1[0]) + 3 * t * t * (B3[0] - B2[0])
  const y = 3 * u * u * (B1[1] - B0[1]) + 6 * u * t * (B2[1] - B1[1]) + 3 * t * t * (B3[1] - B2[1])
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

/** Normal hacia afuera (hacia arriba del borde). */
const normal = (t: number): P => {
  const [x, y] = tangente(t)
  return [y, -x]
}

const CUERPO = `M${B0} C${B1} ${B2} ${B3} Q80 108 ${B0}Z`
const SOMBRA = 'M22 90 Q80 104 138 90 Q132 100 80 104 Q28 100 22 90Z'

const muestras = (n: number, desde = 0.03, hasta = 0.97) =>
  Array.from({ length: n }, (_, i) => desde + ((hasta - desde) * i) / (n - 1))

const grados = (p: P) => (Math.atan2(p[1], p[0]) * 180) / Math.PI

function cordon(n: number): string {
  return muestras(n)
    .map((t) => {
      const [x, y] = punto(t)
      const [nx, ny] = normal(t)
      const a = grados(tangente(t)) + 38
      return `<ellipse cx="${r1(x + nx * 1.5)}" cy="${r1(y + ny * 1.5)}" rx="6.4" ry="3.4" transform="rotate(${r1(a)} ${r1(x + nx * 1.5)} ${r1(y + ny * 1.5)})" class="papel-lleno"/>`
    })
    .join('')
}

function dientes(n: number): string {
  return muestras(n, 0.06, 0.94)
    .map((t) => {
      const [x, y] = punto(t)
      const [tx, ty] = tangente(t)
      const [nx, ny] = normal(t)
      const a: P = [x - tx * 5, y - ty * 5]
      const b: P = [x + tx * 5, y + ty * 5]
      const c: P = [x + nx * 10, y + ny * 10]
      return `<path d="M${r1(a[0])} ${r1(a[1])} Q${r1(x + nx * 4 - tx * 3)} ${r1(y + ny * 4 - ty * 3)} ${r1(c[0])} ${r1(c[1])} Q${r1(x + nx * 4 + tx * 3)} ${r1(y + ny * 4 + ty * 3)} ${r1(b[0])} ${r1(b[1])}" class="papel-lleno"/>`
    })
    .join('')
}

function tenedor(n: number): string {
  return muestras(n, 0.05, 0.95)
    .map((t) => {
      const [x, y] = punto(t)
      const [nx, ny] = normal(t)
      return `<path d="M${r1(x - nx * 2)} ${r1(y - ny * 2)} L${r1(x - nx * 10)} ${r1(y - ny * 10)}"/>`
    })
    .join('')
}

function ola(n: number): string {
  const ts = muestras(n, 0, 1)
  let d = `M${punto(0)}`
  for (let i = 1; i < ts.length; i++) {
    const m = (ts[i - 1] + ts[i]) / 2
    const [x, y] = punto(m)
    const [nx, ny] = normal(m)
    const [ex, ey] = punto(ts[i])
    d += ` Q${r1(x + nx * 9)} ${r1(y + ny * 9)} ${r1(ex)} ${r1(ey)}`
  }
  return `<path d="${d} Q80 108 ${B0}Z" class="sin-relleno"/>`
}

const CUERNOS =
  '<path d="M22 90 C6 94 -4 80 2 60 C6 70 12 74 24 76Z" class="papel-lleno"/><path d="M138 90 C154 94 164 80 158 60 C154 70 148 74 136 76Z" class="papel-lleno"/>'

/** La empanada media luna: relleno con trama coral, línea azul y el repulgue de cada gusto. */
function mediaLuna(r: Repulgue): string {
  const borde = r === 'ola' ? ola(11) : ''
  let detalle = ''
  if (r === 'trenzado') detalle = cordon(15)
  if (r === 'cuernitos') detalle = CUERNOS + cordon(15)
  if (r === 'pellizco') detalle = dientes(9)
  if (r === 'tenedor' || r === 'punto') detalle = `<g class="rayas">${tenedor(22)}</g>`
  if (r === 'tajos') detalle = '<g class="rayas gruesas"><path d="M56 66 l10 -12"/><path d="M74 66 l10 -12"/><path d="M92 66 l10 -12"/></g>'

  const coral = `
    <g class="capa-coral">
      <path d="${CUERPO}" fill="url(#rp-trama)"/>
      <path d="${SOMBRA}" class="tinta-coral"/>
      ${r === 'punto' ? '<circle cx="80" cy="62" r="8.5" class="tinta-coral"/>' : ''}
      ${r === 'tajos' ? '<path d="M50 72 l12 -12 M68 72 l12 -12 M86 72 l12 -12" class="trazo-coral"/>' : ''}
    </g>`
  const azul = `
    <g class="capa-azul">
      ${borde || `<path d="${CUERPO}" class="sin-relleno"/>`}
      ${detalle}
      ${r === 'punto' ? '<circle cx="80" cy="62" r="8.5" class="sin-relleno"/>' : ''}
    </g>`
  return coral + azul
}

/** Humita: parada, con el repulgue arriba de punta a punta. */
function parada(): string {
  const cresta = muestras(14, 0.04, 0.96)
    .map((t) => {
      const x = 22 + 116 * t
      const y = 60 - Math.sin(Math.PI * t) * 16
      const a = 64 - 30 * Math.cos(Math.PI * t)
      return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="3.6" ry="7" transform="rotate(${r1(a - 64)} ${r1(x)} ${r1(y)})" class="papel-lleno"/>`
    })
    .join('')
  const cuerpo = 'M14 72 C14 50 46 40 80 40 C114 40 146 50 146 72 C146 94 116 104 80 104 C44 104 14 94 14 72Z'
  return `
    <g class="capa-coral">
      <path d="${cuerpo}" fill="url(#rp-trama)"/>
      <path d="M24 86 C40 100 120 100 136 86 C130 98 112 104 80 104 C48 104 30 98 24 86Z" class="tinta-coral"/>
    </g>
    <g class="capa-azul">
      <path d="${cuerpo}" class="sin-relleno"/>
      <path d="M20 66 C40 58 60 46 80 44 C100 46 120 58 140 66" class="sin-relleno"/>
      ${cresta}
    </g>`
}

/** SVG de una empanada (sin el contenedor), para usar adentro de <svg viewBox="0 0 160 120">. */
export function dibujoEmpanada(r: Repulgue): string {
  return r === 'arriba' ? parada() : mediaLuna(r)
}

export function svgEmpanada(r: Repulgue, clase = 'empanada', etiqueta?: string): string {
  const a11y = etiqueta ? `role="img" aria-label="${etiqueta}"` : 'aria-hidden="true" focusable="false"'
  return `<svg class="${clase}" viewBox="0 0 160 120" ${a11y}>${dibujoEmpanada(r)}</svg>`
}

/** Definiciones compartidas (la trama de puntos): va una sola vez en la página. */
export const DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="rp-trama" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
        <circle cx="2.5" cy="2.5" r="1.55" class="tinta-coral"/>
      </pattern>
      <pattern id="rp-trama-fina" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
        <circle cx="2" cy="2" r="0.9" class="tinta-azul"/>
      </pattern>
    </defs>
  </svg>`

// ---------- La bolsa de papel ----------

/** Versión simple para las que asoman de la bolsa: a ese tamaño el detalle se empasta. */
function silueta(r: Repulgue): string {
  if (r === 'arriba') {
    const cuerpo = 'M14 72 C14 50 46 40 80 40 C114 40 146 50 146 72 C146 94 116 104 80 104 C44 104 14 94 14 72Z'
    return `<g class="capa-coral"><path d="${cuerpo}" class="tinta-coral-suave"/></g>
      <g class="capa-azul gruesa"><path d="${cuerpo}" class="sin-relleno"/><path d="M24 64 C50 44 110 44 136 64" class="borde-punteado"/></g>`
  }
  return `<g class="capa-coral"><path d="${CUERPO}" class="tinta-coral-suave"/></g>
    <g class="capa-azul gruesa"><path d="${CUERPO}" class="sin-relleno"/><path d="M${B0} C${B1} ${B2} ${B3}" class="borde-punteado"/></g>`
}

/**
 * Bolsa de papel madera que se infla con la cantidad. `lleno` va de 0 a 1.
 * `asomadas` es cuántas empanadas se ven por la boca.
 */
export function dibujoBolsa(cantidad: number, lleno: number, asomadas: string[]): string {
  const b = 2 + lleno * 24 // panza de los costados
  const boca = 96 - lleno * 26
  const sierra = (y: number, x0: number, x1: number) => {
    let d = ''
    const pasos = 20
    for (let i = 0; i <= pasos; i++) {
      const x = x0 + ((x1 - x0) * i) / pasos
      d += `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(y + (i % 2 ? 3 : 0))} `
    }
    return d
  }
  const xi = 36
  const xd = 204
  const frente = `${sierra(boca, xi, xd)} C${r1(xd + b)} ${r1(boca + 70)} ${r1(xd + b + 2)} 230 ${xd + 6} 292 L${xi - 6} 292 C${r1(xi - b - 2)} 230 ${r1(xi - b)} ${r1(boca + 70)} ${xi} ${boca}Z`
  const fondo = `${sierra(boca - 18, xi + 6, xd - 6)} L${xd} ${boca} L${xi} ${boca}Z`

  // Empanadas que asoman por la boca: primero las de atrás, después las de adelante.
  const pos: [number, number, number][] = [
    [24, boca - 60, -16],
    [108, boca - 64, 14],
    [64, boca - 78, -2],
    [14, boca - 44, -26],
    [120, boca - 46, 22],
  ]
  const asoman = asomadas
    .slice(0, pos.length)
    .map((r, i) => {
      const [x, y, a] = pos[i]
      return `<g transform="translate(${x} ${r1(y)}) rotate(${a} 50 37) scale(0.66)" class="asoma">${silueta(r as Repulgue)}</g>`
    })
    .join('')

  // Manchitas de aceite: una cada docena (no más de cuatro).
  const manchas = [
    [80, 210, 13],
    [160, 170, 9],
    [70, 140, 7],
    [168, 252, 11],
  ]
    .slice(0, Math.min(4, Math.floor(cantidad / 12)))
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" class="mancha"/><circle cx="${x + r * 0.9}" cy="${y + r * 0.6}" r="${r * 0.45}" class="mancha"/>`)
    .join('')

  return `
    <path d="${fondo}" class="kraft-hondo"/>
    ${asoman}
    <path d="${frente}" class="kraft"/>
    <path d="${frente}" fill="url(#rp-trama-fina)" class="kraft-grano"/>
    ${manchas}
    <path d="M${xi + 10} ${boca + 18} L${xd - 10} ${boca + 18}" class="pliegue"/>
    <path d="M${xi - 4} 280 L${xd + 4} 280" class="pliegue"/>
    <g class="sello">
      <text x="120" y="${r1(boca + 66)}" text-anchor="middle" class="sello-marca">PELLIZCO</text>
      <text x="120" y="${r1(boca + 84)}" text-anchor="middle" class="sello-sub">empanadas al horno</text>
      <text x="120" y="${r1(boca + 150)}" text-anchor="middle" class="sello-numero">${cantidad}</text>
      <text x="120" y="${r1(boca + 172)}" text-anchor="middle" class="sello-sub">${cantidad === 1 ? 'empanada' : 'empanadas'}</text>
    </g>`
}
